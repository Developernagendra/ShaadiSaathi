import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { createBooking } from '../../store/slices/bookingSlice'
import { fetchVendorById } from '../../store/slices/vendorSlice'
import { formatPrice } from '../../utils/helpers'
import api from '../../utils/api'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { FiCheck, FiArrowRight } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getMe, resendVerification } from '../../store/slices/authSlice'
import { motion, AnimatePresence } from 'framer-motion'

export default function CheckoutPage() {
  const { vendorId, id } = useParams()
  const targetId = id || vendorId
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentVendor: vendor } = useSelector(s => s.vendor)
  const { user } = useSelector(s => s.auth)
  const { loading } = useSelector(s => s.booking)
  const [selectedPkg, setSelectedPkg] = useState(0)
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [resending, setResending] = useState(false)
  const [service, setService] = useState(null)

  useEffect(() => {
    if (targetId) {
      if (window.location.pathname.includes('book-service')) {
        api.get(`/services/${targetId}`)
          .then(res => {
            const svc = res.data.service
            setService(svc)
            if (svc?.vendor?._id) {
              dispatch(fetchVendorById(svc.vendor._id))
            } else if (svc?.vendor) {
              dispatch(fetchVendorById(svc.vendor))
            }
          })
          .catch(() => {
            // It could be a vendor ID passed to book-service route (e.g. from featured vendor card)
            dispatch(fetchVendorById(targetId))
              .unwrap()
              .catch(() => {
                toast.error('Failed to load service or vendor details')
              })
          })
      } else {
        dispatch(fetchVendorById(targetId))
      }
    }
  }, [dispatch, targetId])

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

  const pkg = vendor?.packages?.[selectedPkg]
  const amount = pkg?.price || vendor?.basePrice || 0
  const advanceAmount = Math.ceil(amount * 0.5)

  const handleSubmit = async (values) => {
    if (user && !user.isVerified) {
      toast.error('Please verify your email to book services', { id: 'verify-booking-toast' })
      setShowVerifyModal(true)
      return
    }

    const payload = {
      vendorId: vendor?._id || service?.vendor?._id || service?.vendor || targetId,
      packageSelected: pkg ? { name: pkg.name, price: pkg.price, features: pkg.features } : null,
      amount,
      bookingType: 'service',
      serviceName: service ? service.title : (vendor?.businessName || 'Bespoke Wedding Service'),
      serviceCategory: service?.category?.name || vendor?.category?.name || 'Wedding Service',
      ...values,
      contactName: user?.name || values.contactName,
      contactPhone: user?.phone || values.contactPhone,
      contactEmail: user?.email || values.contactEmail,
    }

    if (service) {
      payload.serviceId = service._id
    }

    const result = await dispatch(createBooking(payload))

    if (!result.error) {
      setOrderConfirmed(true)
      toast.success('Booking Request Submitted Successfully!')
      setTimeout(() => navigate('/dashboard/my-bookings'), 3000)
    }
  }

  if (orderConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-3xl p-12 shadow-xl text-center max-w-md border border-green-100">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-200">
            <FiCheck size={48} className="text-white" />
          </div>
          <h2 className="font-display text-4xl font-black text-gray-900 mb-4">Booking Submitted!</h2>
          <p className="text-gray-500 font-medium mb-4">Your wedding booking request has been submitted successfully to the vendor.</p>
          <p className="text-gray-400 text-sm">Redirecting to your bookings...</p>
        </div>
      </div>
    )
  }

  if (!vendor) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin shadow-xl" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-12 px-4 relative">
      <div className="absolute inset-0 floral-pattern opacity-[0.03] pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">
        <h1 className="font-display text-4xl md:text-5xl font-black text-gray-900 mb-12 tracking-tight">Checkout <span className="text-primary-600">& Confirm</span></h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <Formik
              initialValues={{ eventDate: '', eventTime: '', eventVenue: '', eventCity: vendor?.location?.city || '', guestCount: '', specialRequirements: '', contactName: user?.name || '', contactPhone: user?.phone || '', contactEmail: user?.email || '' }}
              validationSchema={Yup.object({
                eventDate: Yup.date().required('Event date required').min(new Date(), 'Date must be in future'),
                contactName: Yup.string().required('Required'),
                contactPhone: Yup.string().matches(/^[6-9]\d{9}$/, 'Valid phone required').required('Required'),
              })}
              onSubmit={handleSubmit}
            >
              {() => (
                <Form className="space-y-8">
                  {vendor.packages?.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 shadow-premium border border-pink-50">
                      <h2 className="font-display font-black text-2xl text-gray-900 mb-6 flex items-center gap-4">
                        <span className="w-1.5 h-8 bg-primary-600 rounded-full" />
                        Select Package
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {vendor.packages.map((p, i) => (
                          <button key={i} type="button" onClick={() => setSelectedPkg(i)} className={`p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${selectedPkg === i ? 'border-primary-600 bg-pink-50/30' : 'border-gray-100 bg-white hover:border-pink-200'}`}>
                            {selectedPkg === i && <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white"><FiCheck size={14} /></div>}
                            <p className="font-black text-gray-900 text-sm mb-2">{p.name}</p>
                            <p className="text-primary-600 font-black text-lg">{formatPrice(p.price)}</p>
                            {p.isPopular && <span className="text-[10px] font-black uppercase tracking-widest bg-gold-500 text-white px-2 py-1 rounded-md mt-3 inline-block">Recommended</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-3xl p-8 shadow-premium border border-pink-50">
                    <h2 className="font-display font-black text-2xl text-gray-900 mb-6 flex items-center gap-4">
                      <span className="w-1.5 h-8 bg-primary-600 rounded-full" />
                      Event Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="form-control"><label className="label-luxe">Event Date *</label><Field type="date" name="eventDate" className="input-field" /><ErrorMessage name="eventDate" component="p" className="error-text" /></div>
                      <div className="form-control"><label className="label-luxe">Event Time</label><Field type="time" name="eventTime" className="input-field" /></div>
                      <div className="form-control"><label className="label-luxe">Venue Name</label><Field name="eventVenue" placeholder="e.g. Wedding Venue" className="input-field" /></div>
                      <div className="form-control"><label className="label-luxe">City</label><Field name="eventCity" className="input-field" /></div>
                      <div className="form-control"><label className="label-luxe">Guest Count</label><Field type="number" name="guestCount" placeholder="e.g. 500" className="input-field" /></div>
                    </div>
                    <div className="mt-6"><label className="label-luxe">Special Requirements</label><Field as="textarea" name="specialRequirements" rows={4} className="input-field resize-none" placeholder="Any specific requests for the vendor..." /></div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 shadow-premium border border-pink-50">
                    <h2 className="font-display font-black text-2xl text-gray-900 mb-6 flex items-center gap-4">
                      <span className="w-1.5 h-8 bg-primary-600 rounded-full" />
                      Contact Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="form-control"><label className="label-luxe">Name *</label><Field name="contactName" className="input-field" /><ErrorMessage name="contactName" component="p" className="error-text" /></div>
                      <div className="form-control"><label className="label-luxe">Phone *</label><Field name="contactPhone" className="input-field" /><ErrorMessage name="contactPhone" component="p" className="error-text" /></div>
                      <div className="sm:col-span-2"><label className="label-luxe">Email</label><Field name="contactEmail" type="email" className="input-field" /></div>
                    </div>
                  </div>

                  <button
                    type={user?.isVerified ? "submit" : "button"}
                    onClick={() => {
                      if (user && !user.isVerified) {
                        toast.error('Please verify your email to book services', { id: 'verify-booking-toast' })
                        setShowVerifyModal(true)
                      }
                    }}
                    disabled={loading || (user && !user.isVerified)}
                    className={`btn-primary w-full py-6 text-xl shadow-2xl group transition-all duration-300 ${user && !user.isVerified ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed shadow-none' : 'shadow-pink-200'}`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-3">
                        {user && !user.isVerified ? 'Verify Email to Book' : 'Confirm Booking'} <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
                      </span>
                    )}
                  </button>
                  <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest">Submit Booking Request • Free & Instant</p>
                </Form>
              )}
            </Formik>
          </div>

          <div>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-pink-50 sticky top-28 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFF8F0] rounded-bl-full opacity-50" />
              <h3 className="font-display font-black text-xl text-gray-900 mb-8 relative z-10 uppercase tracking-tight">Order Summary</h3>

              <div className="flex items-center gap-5 mb-8 pb-8 border-b border-pink-50 relative z-10">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-lg border border-white">
                  {vendor.images?.[0]?.url ? <img src={vendor.images[0].url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🏛️</div>}
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest italic mb-1">{vendor.category?.name}</p>
                  <p className="font-display text-xl font-black text-gray-900 leading-none">{vendor.businessName}</p>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                {pkg && (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Selected Package</p>
                      <p className="font-bold text-gray-900">{pkg.name}</p>
                    </div>
                    <p className="font-black text-gray-900">{formatPrice(pkg.price)}</p>
                  </div>
                )}

                <div className="pt-6 border-t border-pink-50 space-y-4">
                  <div className="flex justify-between font-black text-gray-900 pt-4 border-t-2 border-pink-100">
                    <span className="text-sm uppercase tracking-[0.2em]">Total Price</span>
                    <span className="text-3xl tracking-tighter">{formatPrice(amount)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 bg-[#FFF8F0] p-6 rounded-2xl border border-pink-100">
                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] italic mb-2">Booking Policy</p>
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">Your booking request will be sent to the vendor for confirmation. No payment is required at this stage.</p>
              </div>
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
