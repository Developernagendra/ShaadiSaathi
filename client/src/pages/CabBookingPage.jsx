import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { FiCheck, FiMapPin, FiCalendar, FiClock, FiUsers, FiArrowRight, FiZap } from 'react-icons/fi'
import { FaTruck } from 'react-icons/fa'

import { formatPrice } from '../utils/helpers'
import api from '../utils/api'
import { toast } from 'react-hot-toast'
import LoadingScreen from '../components/common/LoadingScreen'
import { getMe, resendVerification } from '../store/slices/authSlice'
import { motion, AnimatePresence } from 'framer-motion'

export default function CabBookingPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const cabId = id || searchParams.get('cabId')
  const packageId = searchParams.get('packageId')
  const bundleId = searchParams.get('bundleId')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { user } = useSelector(s => s.auth)

  const [cab, setCab] = useState(null)
  const [bundle, setBundle] = useState(null)
  const [parentCabId, setParentCabId] = useState(null)
  const [vendor, setVendor] = useState(null)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [createdBookingId, setCreatedBookingId] = useState(null)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [resending, setResending] = useState(false)

  // Polling to automatically detect verification
  useEffect(() => {
    let interval;
    if (user && !user.isVerified) {
      interval = setInterval(() => {
        dispatch(getMe())
      }, 3000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [dispatch, user?.isVerified])

  useEffect(() => {
    if (user?.isVerified) {
      setShowVerifyModal(false)
    }
  }, [user?.isVerified])

  const handleResendEmail = async () => {
    setResending(true)
    try {
      await dispatch(resendVerification({ email: user.email })).unwrap()
      toast.success('Verification email sent.', { id: 'verify-success' })
    } catch (err) {
      toast.error(err || 'Failed to send verification email.')
    } finally {
      setResending(false)
    }
  }

  const [form, setForm] = useState({
    city: searchParams.get('city') || '',
    pickupLocation: searchParams.get('pickup') || '',
    dropLocation: searchParams.get('drop') || '',
    guestCount: searchParams.get('guests') || '',
    eventDate: searchParams.get('date') || '',
    eventTime: searchParams.get('time') || '',
    contactName: searchParams.get('name') || user?.name || '',
    contactPhone: searchParams.get('phone') || user?.phone || '',
    message: ''
  })

  useEffect(() => {
    if (user && user.role !== 'user') {
      toast.error('Only users can book cabs')
      navigate('/baraat-cabs')
      return
    }

    if (!cabId && !bundleId) {
      navigate('/baraat-cabs')
      return
    }

    const fetchData = async () => {
      try {
        if (bundleId) {
          const { data } = await api.get(`/cab-booking/bundle/${bundleId}`)
          setBundle(data.bundle)
          setParentCabId(data.parentCabId)
          setVendor(data.vendor)
          const totalGuests = data.bundle?.vehicles?.reduce((acc, v) => {
            const cap = v.vehicleId?.seatingCapacity || 4;
            return acc + (cap * v.quantity);
          }, 0) || 10;
          setForm(f => ({
            ...f,
            city: f.city || data.vendor?.location?.city || '',
            guestCount: f.guestCount || String(totalGuests)
          }))
        } else if (cabId) {
          const { data } = await api.get(`/cab-booking/details/${cabId}`)
          setCab(data.cab)
          setForm(f => ({
            ...f,
            city: f.city || data.cab.location?.city || '',
            guestCount: f.guestCount || String(data.cab.seatingCapacity || '')
          }))
          if (packageId && data.cab.packages) {
            const pkg = data.cab.packages.find(p => p._id === packageId)
            if (pkg) setSelectedPackage(pkg)
          }
        }
      } catch (err) {
        toast.error('Failed to load details')
        navigate('/baraat-cabs')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [cabId, bundleId, packageId, navigate])

  // --- Auto Calculation Logic ---
  const baseFare = selectedPackage ? selectedPackage.price : (cab?.pricing?.baseFare || bundle?.discountedPrice || bundle?.totalPrice || 0);
  const estimatedKm = (form.pickupLocation && form.dropLocation) ? 45 : 0; // Visual mock for UX
  const perKmCharge = cab?.pricing?.pricePerKm || 15;
  const kmCharges = estimatedKm * perKmCharge;
  const subtotal = baseFare + kmCharges;
  const gst = subtotal * 0.05;
  const totalAmount = subtotal + gst;

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please login to book a cab')
      const redirectId = bundleId ? `bundleId=${bundleId}` : `cabId=${cabId}`
      navigate(`/login?redirect=/baraat-cabs/book?${redirectId}`)
      return
    }

    if (!user.isVerified) {
      toast.error('Please verify your email to book services', { id: 'verify-booking-toast' })
      setShowVerifyModal(true)
      return
    }

    // High fidelity form validation
    if (!form.city?.trim()) {
      toast.error('Please enter the city or region for the booking')
      return
    }
    if (!form.pickupLocation?.trim()) {
      toast.error('Please enter the pickup location address')
      return
    }
    if (!form.dropLocation?.trim()) {
      toast.error('Please enter the drop location or destination venue address')
      return
    }
    if (!form.guestCount || Number(form.guestCount) <= 0) {
      toast.error('Please enter a valid guest count estimate')
      return
    }
    if (!form.eventDate) {
      toast.error('Please select the event date')
      return
    }
    if (!form.contactName?.trim()) {
      toast.error('Please enter your contact name')
      return
    }
    if (!form.contactPhone?.trim()) {
      toast.error('Please enter a valid contact phone number')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        guestCount: Number(form.guestCount) || 1,
        vendorId: vendor?._id || bundle?.vendorId || null,
        specialRequests: form.message,
        subtotal,
        gst,
        totalAmount
      }

      let endpoint = '/cab-booking'

      if (bundleId) {
        payload.bundleId = bundleId
        payload.cabId = parentCabId || cabId || bundle?.parentCabId
        payload.selectedVehicles = bundle?.vehicles || []
        payload.packageType = 'bundle'
        payload.totalAmount = bundle?.discountedPrice || bundle?.totalPrice || 0
        endpoint = '/baraat-cabs/book-bundle'
      } else {
        payload.cabId = cabId
        payload.packageId = selectedPackage?._id || null
        payload.packageType = selectedPackage ? 'package' : 'custom'
        payload.totalAmount = selectedPackage ? selectedPackage.price : (cab?.pricing?.baseFare || 0)
      }

      const { data } = await api.post(endpoint, payload)

      setSuccess(true)
      setCreatedBookingId(data.booking?._id || data.bookingId)
      toast.success('Booking request sent successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingScreen />

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 pt-32 pb-20">
        <div className="bg-white rounded-[3rem] p-12 max-w-xl w-full text-center shadow-2xl border border-gray-100">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <FiCheck className="text-green-500 text-5xl" />
          </div>
          <h2 className="font-display text-4xl font-black text-gray-900 mb-4">Booking Received!</h2>
          <p className="text-gray-500 mb-10 leading-relaxed text-lg">
            Your Baraat Cab booking request has been successfully sent. The vendor will contact you shortly to confirm details.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard/my-bookings')}
              className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-black transition-colors shadow-lg"
            >
              View My Bookings
            </button>

            <button
              onClick={() => navigate('/baraat-cabs')}
              className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors"
            >
              Back to Cabs
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-20 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tighter">
            Confirm your <span className="text-primary-600">Booking</span>
          </h1>
          <p className="text-gray-500 text-lg">Provide your event details to secure this vehicle.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* Booking Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                    <input required type="text" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary-400 focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                    <input required type="tel" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary-400 focus:bg-white transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Event Date</label>
                    <div className="relative">
                      <FiCalendar className="absolute left-5 top-1/2 -translate-y-1/2 text-primary-500" />
                      <input required type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:border-primary-400 focus:bg-white transition-all text-gray-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</label>
                    <div className="relative">
                      <FiClock className="absolute left-5 top-1/2 -translate-y-1/2 text-primary-500" />
                      <input required type="time" value={form.eventTime} onChange={e => setForm({ ...form, eventTime: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:border-primary-400 focus:bg-white transition-all text-gray-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">City</label>
                    <div className="relative">
                      <FiMapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-primary-500" />
                      <input required type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:border-primary-400 focus:bg-white transition-all" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pickup Location / Address</label>
                  <input required type="text" placeholder="Full address" value={form.pickupLocation} onChange={e => setForm({ ...form, pickupLocation: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary-400 focus:bg-white transition-all" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Drop Location / Destination Address</label>
                    <div className="relative">
                      <FiMapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-primary-500" />
                      <input required type="text" placeholder="Drop location/venue name" value={form.dropLocation} onChange={e => setForm({ ...form, dropLocation: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:border-primary-400 focus:bg-white transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estimated Guest Count</label>
                    <div className="relative">
                      <FiUsers className="absolute left-5 top-1/2 -translate-y-1/2 text-primary-500" />
                      <input required type="number" min="1" placeholder="Number of guests" value={form.guestCount} onChange={e => setForm({ ...form, guestCount: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:border-primary-400 focus:bg-white transition-all text-gray-700" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Additional Message (Optional)</label>
                  <textarea rows="3" placeholder="Any special requests like decoration?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary-400 focus:bg-white transition-all resize-none" />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    type={user?.isVerified ? "submit" : "button"}
                    onClick={() => {
                      if (user && !user.isVerified) {
                        toast.error('Please verify your email to book services', { id: 'verify-booking-toast' })
                        setShowVerifyModal(true)
                      }
                    }}
                    disabled={submitting || (user && !user.isVerified)}
                    className={`w-full text-white rounded-2xl py-5 font-black text-sm uppercase tracking-widest transition-all shadow-[0_8px_20px_rgba(0,0,0,0.15)] flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${user && !user.isVerified ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed shadow-none' : 'bg-gray-900 hover:bg-primary-600'}`}
                  >
                    {submitting ? 'Processing...' : (user && !user.isVerified ? 'Verify Email to Book' : 'Submit Booking Request')}
                    {!submitting && <FiArrowRight />}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Vehicle Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 sticky top-32">
              <h3 className="font-display font-black text-2xl text-gray-900 mb-6 border-b border-gray-100 pb-4">Vehicle Summary</h3>

              {bundleId && bundle ? (
                <div className="space-y-6">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                    <img src={'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800'} alt={bundle.bundleName} className="w-full h-full object-cover" />
                  </div>

                  <div>
                    <h4 className="font-display font-black text-xl text-gray-900">{bundle.bundleName}</h4>
                    <p className="text-sm font-bold text-gray-400 capitalize mb-4">Fleet Bundle</p>

                    <div className="flex gap-4 py-4 border-y border-gray-100">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Vehicles</span>
                        <span className="text-sm font-bold text-gray-700 flex items-center gap-1"><FaTruck className="text-primary-400" /> {bundle.vehicles?.reduce((acc, v) => acc + v.quantity, 0) || 0} Cars</span>
                      </div>
                      <div className="w-px bg-gray-100" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Bundle Price</span>
                        <span className="text-sm font-bold text-primary-600">{formatPrice(bundle.discountedPrice || bundle.totalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                      <span>Base Fare</span>
                      <span>{formatPrice(baseFare)}</span>
                    </div>
                    {estimatedKm > 0 && (
                      <div className="flex justify-between text-sm font-medium text-gray-600">
                        <span>Est. Distance Charge (~{estimatedKm} KM)</span>
                        <span>{formatPrice(kmCharges)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                      <span>Taxes & Fees (5% GST)</span>
                      <span>{formatPrice(gst)}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200 flex justify-between font-black text-lg text-gray-900">
                      <span>Total Estimated Fare</span>
                      <span className="text-[#D4AF37]">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex gap-3">
                    <FiClock className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800 font-medium leading-relaxed">
                      This is an estimated bundle booking request. The final price may vary based on extra durations or distance beyond the included limits.
                    </p>
                  </div>
                </div>
              ) : cab && (
                <div className="space-y-6">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                    <img src={cab.images?.[0]?.url || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800'} alt={cab.name} className="w-full h-full object-cover" />
                  </div>

                  <div>
                    <h4 className="font-display font-black text-xl text-gray-900">{cab.name}</h4>
                    <p className="text-sm font-bold text-gray-400 capitalize mb-4">{cab.type?.replace('_', ' ')}</p>

                    <div className="flex gap-4 py-4 border-y border-gray-100">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Seats</span>
                        <span className="text-sm font-bold text-gray-700 flex items-center gap-1"><FiUsers className="text-primary-400" /> {cab.seatingCapacity}</span>
                      </div>
                      <div className="w-px bg-gray-100" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{selectedPackage ? 'Package Selected' : 'Starting Price'}</span>
                        <span className="text-sm font-bold text-primary-600">{selectedPackage ? formatPrice(selectedPackage.price) : formatPrice(cab.pricing?.baseFare)}</span>
                      </div>
                    </div>
                    {selectedPackage && (
                      <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100">
                        <p className="text-xs font-black text-primary-900 mb-1">{selectedPackage.name}</p>
                        <p className="text-[10px] font-medium text-primary-700">{selectedPackage.hours} Hours • {selectedPackage.kmLimit} KM Limit</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                      <span>Base Fare</span>
                      <span>{formatPrice(baseFare)}</span>
                    </div>
                    {estimatedKm > 0 && (
                      <div className="flex justify-between text-sm font-medium text-gray-600">
                        <span>Est. Distance Charge (~{estimatedKm} KM)</span>
                        <span>{formatPrice(kmCharges)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                      <span>Taxes & Fees (5% GST)</span>
                      <span>{formatPrice(gst)}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200 flex justify-between font-black text-lg text-gray-900">
                      <span>Total Estimated Fare</span>
                      <span className="text-[#D4AF37]">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex gap-3">
                    <FiClock className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800 font-medium leading-relaxed">
                      This is an estimated booking request. The final price may vary based on exact duration, distance, and decoration requirements.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Premium Email Verification Modal ── */}
      <AnimatePresence>
        {showVerifyModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVerifyModal(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md relative z-10 shadow-2xl overflow-hidden border border-pink-50 p-10 text-center"
            >
              {/* Premium Icon */}
              <div className="w-20 h-20 bg-[#FFF8F0] text-[#C2185B] rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border border-pink-50/50 animate-pulse">
                📧
              </div>

              <h3 className="font-display font-black text-3xl text-gray-900 mb-4 tracking-tight leading-none">
                Verify Your Email
              </h3>

              <p className="text-gray-500 font-medium leading-relaxed text-sm mb-8">
                Please verify your email before confirming booking. We've sent a verification link to <span className="font-bold text-gray-800">{user?.email}</span>.
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => navigate('/resend-verification')}
                  className="w-full bg-[#C2185B] hover:bg-[#8E244D] text-white py-4.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-pink-100 transition-all flex items-center justify-center gap-2 italic"
                >
                  Verify Now
                </button>

                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendEmail}
                  className="w-full bg-[#FFF8F0] border-2 border-pink-50 hover:border-pink-100 text-[#C2185B] py-4.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 italic disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="w-full bg-white border border-gray-200 text-gray-400 hover:text-gray-700 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all italic"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
