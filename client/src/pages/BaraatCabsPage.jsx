import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMapPin, FiCalendar, FiClock, FiUsers, FiArrowRight, FiCheck, FiShield, FiStar, FiTrendingUp, FiImage, FiChevronLeft, FiChevronRight, FiX, FiEye } from 'react-icons/fi'
import { FaWhatsapp, FaTruck } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../utils/api'
import { formatPrice } from '../utils/helpers'
import { toast } from 'react-hot-toast'

export default function BaraatCabsPage() {
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)

  const [cabs, setCabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [selectedCab, setSelectedCab] = useState(null)
  const [galleryModal, setGalleryModal] = useState({ open: false, index: 0 })
  const [bookingForm, setBookingForm] = useState({
    pickup: '',
    drop: '',
    date: '',
    time: '',
    guests: '',
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
    wantsWhatsapp: true
  })

  const formRef = useRef(null)

  useEffect(() => {
    loadCabs()
    window.scrollTo(0, 0)
  }, [])

  const loadCabs = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/cab-booking')
      setCabs(data.cabs || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const displayVehicles = cabs.length > 0 ? cabs : [
    { _id: '1', name: 'Premium Sedan', type: 'sedan', seatingCapacity: 4, pricing: { baseFare: 1500, pricePerKm: 15 }, features: ['A/C', 'Decorated', 'Water Bottles'], images: [{ url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800' }], rating: 4.8 },
    { _id: '2', name: 'Luxury SUV', type: 'suv', seatingCapacity: 7, pricing: { baseFare: 2500, pricePerKm: 20 }, features: ['A/C', 'Spacious', 'Music', 'Decorated'], images: [{ url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800' }], rating: 4.9 },
    { _id: '3', name: 'Vintage Wedding Car', type: 'luxury_car', seatingCapacity: 4, pricing: { baseFare: 12000, pricePerKm: 0 }, features: ['Classic Vintage', 'Floral Decor', 'Chauffeur'], images: [{ url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800' }], rating: 5.0 },
    { _id: '4', name: 'Tempo Traveller', type: 'tempo_traveller', seatingCapacity: 15, pricing: { baseFare: 4500, pricePerKm: 25 }, features: ['A/C', 'Pushback Seats', 'Group Travel'], images: [{ url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800' }], rating: 4.7 }
  ]

  const galleryImages = [
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
    'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
    'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
    'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800'
  ]

  const reviews = [
    { name: 'Rahul & Priya', text: 'The vintage car was absolutely stunning! The driver was professional and arrived exactly on time. Made our Baraat entry unforgettable.', rating: 5, date: '2 weeks ago' },
    { name: 'Ankit Sharma', text: 'Booked 3 Tempo Travellers for guest transport. Very clean, great AC, and smooth driving. Highly recommend their fleet service.', rating: 5, date: '1 month ago' },
    { name: 'Neha Singh', text: 'The luxury SUV was beautifully decorated exactly as we discussed. It added such a premium touch to our wedding photos!', rating: 4.5, date: '3 months ago' }
  ]

  const getImageUrl = (cab) => {
    if (cab.images?.length > 0) return cab.images[0].url || cab.images[0]
    if (cab.vehicleImages?.length > 0) return cab.vehicleImages[0]
    return 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800'
  }

  // Live Pricing Calculation
  const baseFare = selectedCab?.pricing?.baseFare || 0;
  const estimatedKm = (bookingForm.pickup && bookingForm.drop) ? 25 : 0;
  const perKmCharge = selectedCab?.pricing?.pricePerKm || 0;
  const kmCharges = estimatedKm * perKmCharge;
  const driverCharge = selectedCab ? 500 : 0;
  const decorCharge = selectedCab ? 1500 : 0;
  const subtotal = baseFare + kmCharges + driverCharge + decorCharge;
  const gst = subtotal * 0.05;
  const totalAmount = subtotal + gst;

  const handleBookNow = async (e) => {
    e.preventDefault();
    if (!selectedCab) return toast.error('Please select a vehicle to proceed.');
    if (!bookingForm.pickup || !bookingForm.drop || !bookingForm.date) {
      return toast.error('Please complete the pickup, drop, and date details.');
    }
    if (!bookingForm.contactName || !bookingForm.contactPhone) {
      return toast.error('Please provide your contact details.');
    }
    if (!user) {
      toast.error('Please login to confirm your booking.');
      return navigate('/login?redirect=/baraat-cabs');
    }

    setSubmitting(true);
    try {
      const payload = {
        cabId: selectedCab._id,
        city: bookingForm.pickup.split(',')[0] || 'Direct Booking',
        pickupLocation: bookingForm.pickup,
        dropLocation: bookingForm.drop,
        eventDate: bookingForm.date,
        time: bookingForm.time,
        contactName: bookingForm.contactName,
        contactPhone: bookingForm.contactPhone,
        guestCount: bookingForm.guests || selectedCab.seatingCapacity || 4,
        vendorId: selectedCab.vendor?._id || selectedCab.vendor,
        subtotal,
        gst,
        totalAmount,
        specialRequests: bookingForm.wantsWhatsapp ? 'Please contact me via WhatsApp for updates.' : ''
      };

      await api.post('/cab-booking', payload);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit booking');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 selection:bg-[#D4AF37] selection:text-white">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111] backdrop-blur-3xl rounded-[3rem] p-12 max-w-xl w-full text-center shadow-[0_0_80px_rgba(212,175,55,0.15)] border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="w-24 h-24 bg-gradient-to-br from-[#D4AF37] to-[#B38D22] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(212,175,55,0.4)] relative z-10">
            <FiCheck className="text-black text-5xl" />
          </div>
          <h2 className="font-display text-4xl font-black text-white mb-4 relative z-10">Booking Confirmed!</h2>
          <p className="text-gray-400 mb-10 leading-relaxed text-lg relative z-10 font-serif italic">
            Your Luxury Baraat Cab from <span className="font-bold text-[#D4AF37] not-italic">{bookingForm.pickup}</span> to <span className="font-bold text-[#D4AF37] not-italic">{bookingForm.drop}</span> is successfully booked.
          </p>
          <div className="flex gap-4 justify-center relative z-10">
            <button onClick={() => navigate('/dashboard/my-bookings')} className="px-10 py-5 bg-[#D4AF37] hover:bg-[#C5A017] text-black rounded-full font-black uppercase tracking-widest text-xs shadow-xl transition-all">
              View My Bookings
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-[#D4AF37]/30 selection:text-black">

      {/* 🚖 1. ULTRA PREMIUM HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-black pt-20 pb-20">
        <div className="absolute inset-0 floral-pattern opacity-10 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/30 z-10" />
        
        {/* Animated Orbs */}
        <div className="absolute top-1/4 -right-1/4 w-96 h-96 md:w-[800px] md:h-[800px] bg-[#D4AF37]/20 rounded-full blur-[150px] animate-pulse z-0" />
        <div className="absolute bottom-1/4 -left-1/4 w-80 h-80 md:w-[600px] md:h-[600px] bg-[#C2185B]/20 rounded-full blur-[150px] animate-[pulse_6s_ease-in-out_infinite] z-0" />
        
        {/* Background Video/Image */}
        <img 
          src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1600" 
          alt="Luxury Wedding Car" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 z-0 scale-105"
        />
        
        <div className="max-w-7xl mx-auto px-4 relative z-20 text-center flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.4em] px-6 py-2.5 rounded-full mb-8 border border-white/10 shadow-2xl">
            <span className="text-[#D4AF37]">✨</span> Imperial Fleet Experience
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-5xl md:text-7xl lg:text-[7rem] font-black text-white mb-6 tracking-tighter leading-[1.1] drop-shadow-2xl">
            Book Premium <br />
            <span className="text-[#D4AF37] italic font-serif">Baraat Cabs</span>
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-300 text-lg md:text-2xl font-medium font-serif italic mb-12 leading-relaxed max-w-3xl drop-shadow-md">
            Make your grand entrance unforgettable. Experience luxury, comfort, and reliability with our premium wedding fleet.
          </motion.p>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-6">
            <button
              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#D4AF37] hover:bg-[#C5A017] text-black px-12 py-5 rounded-full font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_15px_40px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-3"
            >
              Book Now <FiArrowRight size={18} />
            </button>
            <button
              onClick={() => document.getElementById('vehicle-showcase').scrollIntoView({ behavior: 'smooth' })}
              className="bg-white/5 backdrop-blur-xl text-white border border-white/20 px-12 py-5 rounded-full font-black uppercase tracking-[0.2em] text-[11px] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
            >
              Explore Fleet
            </button>
          </motion.div>
        </div>
      </section>

      {/* 💎 FEATURES BANNER */}
      <section className="bg-[#111] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: '🛡️', text: 'Secure Booking' },
              { icon: '🎀', text: 'Floral Decor Included' },
              { icon: '👔', text: 'Chauffeur Driven' },
              { icon: '⭐', text: 'Top Rated Service' }
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-2xl">{f.icon}</span>
                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 mt-16 md:mt-24 space-y-24 md:space-y-32">
        
        {/* 📍 MAIN BOOKING FLOW */}
        <div ref={formRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16" id="vehicle-showcase">
          
          {/* LEFT PANEL: Vehicles & Trip Details */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* TRIP DETAILS */}
            <section>
              <div className="inline-flex items-center gap-2 text-[#C2185B] text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                <div className="w-8 h-px bg-[#C2185B]" /> Step 1
              </div>
              <h2 className="font-display text-4xl font-black text-gray-900 tracking-tight mb-8">Trip Details</h2>
              
              <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-premium border border-gray-100 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Locations */}
                  <div className="space-y-6 relative">
                    <div className="hidden md:block absolute left-[1.15rem] top-[3.5rem] bottom-[3.5rem] w-0.5 bg-dashed-line border-l-2 border-dashed border-gray-200" />
                    
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pl-2">Pickup Location</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-black shadow-lg z-10" />
                        <input type="text" placeholder="Enter pickup address" value={bookingForm.pickup} onChange={e => setBookingForm({ ...bookingForm, pickup: e.target.value })} className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-12 pr-5 text-sm font-bold text-gray-900 outline-none focus:border-black focus:bg-white transition-all" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pl-2">Drop Location</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.6)] z-10" />
                        <input type="text" placeholder="Enter destination" value={bookingForm.drop} onChange={e => setBookingForm({ ...bookingForm, drop: e.target.value })} className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-12 pr-5 text-sm font-bold text-gray-900 outline-none focus:border-[#D4AF37] focus:bg-white transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Date/Time/Guests */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pl-2">Date</label>
                        <div className="relative">
                          <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="date" value={bookingForm.date} onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })} className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 outline-none focus:border-black focus:bg-white transition-all appearance-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pl-2">Time</label>
                        <div className="relative">
                          <FiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="time" value={bookingForm.time} onChange={e => setBookingForm({ ...bookingForm, time: e.target.value })} className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 outline-none focus:border-black focus:bg-white transition-all" />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pl-2">Guest Count</label>
                      <div className="relative">
                        <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="number" placeholder="Number of passengers" value={bookingForm.guests} onChange={e => setBookingForm({ ...bookingForm, guests: e.target.value })} className="w-full bg-gray-50 border border-transparent rounded-2xl py-4 pl-12 pr-5 text-sm font-bold text-gray-900 outline-none focus:border-black focus:bg-white transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* VEHICLE SHOWCASE */}
            <section>
              <div className="inline-flex items-center gap-2 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                <div className="w-8 h-px bg-[#D4AF37]" /> Step 2
              </div>
              <h2 className="font-display text-4xl font-black text-gray-900 tracking-tight mb-8">Select Your Fleet</h2>

              <div className="grid sm:grid-cols-2 gap-6">
                {loading ? (
                  [1, 2, 3, 4].map(n => <div key={n} className="bg-gray-100 h-80 rounded-[2.5rem] animate-pulse" />)
                ) : (
                  displayVehicles.map((cab) => (
                    <div
                      key={cab._id}
                      onClick={() => setSelectedCab(cab)}
                      className={`relative bg-white rounded-[2.5rem] overflow-hidden cursor-pointer transition-all duration-300 group flex flex-col h-full border-2 ${selectedCab?._id === cab._id ? 'border-black shadow-2xl scale-[1.02]' : 'border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-300'}`}
                    >
                      {/* Image Area */}
                      <div className="h-56 overflow-hidden bg-gray-100 relative">
                        <img src={getImageUrl(cab)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={cab.name} />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm flex items-center gap-2">
                          <FiUsers className="text-[#D4AF37] text-sm" /> {cab.seatingCapacity} Seats
                        </div>
                        {selectedCab?._id === cab._id && (
                          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center shadow-xl">
                              <FiCheck strokeWidth={3} size={20} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between bg-white relative">
                        <div>
                          <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2">{cab.type?.replace('_', ' ')}</p>
                          <h4 className="font-display font-black text-2xl text-gray-900 mb-4">{cab.name}</h4>
                          <div className="flex flex-wrap gap-2 mb-6">
                            {Array.isArray(cab.features) && cab.features.length > 0 ? cab.features.map(f => (
                              <span key={f} className="bg-gray-50 text-gray-500 border border-gray-100 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider">{f}</span>
                            )) : typeof cab.features === 'string' ? cab.features.split(',').map(f => (
                              <span key={f.trim()} className="bg-gray-50 text-gray-500 border border-gray-100 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider">{f.trim()}</span>
                            )) : <span className="bg-gray-50 text-gray-500 border border-gray-100 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider">A/C Premium</span>}
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-100 pt-6 flex justify-between items-end">
                          <div className="flex items-center gap-1">
                            <FiStar className="text-[#D4AF37] fill-[#D4AF37]" size={14} />
                            <span className="text-sm font-black text-gray-900">{typeof cab.rating === 'object' ? cab.rating?.average?.toFixed(1) || 'New' : typeof cab.rating === 'number' ? cab.rating.toFixed(1) : 'New'}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-1">Starting At</p>
                            <p className="text-3xl font-black text-gray-900 font-display">{formatPrice(cab.pricing?.baseFare)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* RIGHT PANEL: Sticky Booking Summary */}
          <div className="lg:col-span-4 relative hidden lg:block">
            <div className="sticky top-28 space-y-8">
              
              {/* LIVE FARE SUMMARY */}
              <div className="bg-black rounded-[3rem] p-8 md:p-10 shadow-premium relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                
                <h3 className="font-display text-2xl font-black text-white mb-8 flex items-center gap-3 relative z-10">
                  <FiTrendingUp className="text-[#D4AF37]" /> Fare Estimate
                </h3>

                {selectedCab ? (
                  <div className="space-y-5 relative z-10">
                    <div className="flex justify-between items-center pb-5 border-b border-white/10">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Selected Fleet</span>
                      <span className="text-sm font-black text-[#D4AF37]">{selectedCab.name}</span>
                    </div>
                    
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Base Fare</span>
                      <span className="text-sm font-black text-white">{formatPrice(baseFare)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Driver & Fuel</span>
                      <span className="text-sm font-black text-white">{formatPrice(driverCharge)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Floral Decor</span>
                      <span className="text-sm font-black text-white">{formatPrice(decorCharge)}</span>
                    </div>

                    <div className={`flex justify-between items-center px-1 transition-all ${estimatedKm > 0 ? 'opacity-100' : 'opacity-40'}`}>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Est. Distance (~{estimatedKm} KM)</span>
                      <span className="text-sm font-black text-white">{formatPrice(kmCharges)}</span>
                    </div>

                    <div className="pt-8 mt-6 border-t border-white/10 flex flex-col items-center text-center">
                      <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Payable Amount</span>
                      <span className="text-5xl font-black text-white tracking-tighter mb-4">{formatPrice(totalAmount)}</span>
                      <span className="inline-flex items-center gap-2 bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border border-[#D4AF37]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" /> Includes 5% GST
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-[2rem] bg-white/5 relative z-10">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <FaTruck className="text-2xl text-gray-400" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed px-4">Select a vehicle from the fleet to calculate live pricing</p>
                  </div>
                )}
              </div>

              {/* CONTACT DETAILS & CTA */}
              <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-premium border border-gray-100">
                <h3 className="font-display text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <FiUsers className="text-[#C2185B]" /> Primary Contact
                </h3>

                <div className="space-y-5 mb-8">
                  <input type="text" placeholder="Full Name" value={bookingForm.contactName} onChange={e => setBookingForm({ ...bookingForm, contactName: e.target.value })} className="w-full bg-gray-50 border border-transparent rounded-xl py-4 px-5 text-sm font-bold text-gray-900 outline-none focus:border-black focus:bg-white transition-all" />
                  <input type="tel" placeholder="Mobile Number" value={bookingForm.contactPhone} onChange={e => setBookingForm({ ...bookingForm, contactPhone: e.target.value })} className="w-full bg-gray-50 border border-transparent rounded-xl py-4 px-5 text-sm font-bold text-gray-900 outline-none focus:border-black focus:bg-white transition-all" />

                  <label className="flex items-center gap-3 p-4 bg-[#25D366]/5 rounded-xl border border-[#25D366]/20 cursor-pointer hover:bg-[#25D366]/10 transition-colors">
                    <input type="checkbox" checked={bookingForm.wantsWhatsapp} onChange={e => setBookingForm({ ...bookingForm, wantsWhatsapp: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-[#25D366] focus:ring-[#25D366]" />
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-2"><FaWhatsapp className="text-[#25D366] text-lg" /> Get WhatsApp Updates</span>
                  </label>
                </div>

                <button
                  onClick={handleBookNow}
                  disabled={submitting}
                  className="w-full bg-black hover:bg-gray-900 text-white rounded-full py-5 font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:shadow-2xl transition-all flex justify-center items-center gap-3 disabled:opacity-50 group"
                >
                  {submitting ? 'Processing...' : (
                    <>Confirm Reservation <FiArrowRight className="group-hover:translate-x-2 transition-transform" size={16} /></>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* 📸 GALLERY SECTION */}
        <section>
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-black text-gray-900 tracking-tight mb-4">Imperial Gallery</h2>
            <p className="text-gray-500 font-medium italic">Glimpses of our premium fleet in action.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryImages.map((img, i) => (
              <div key={i} onClick={() => setGalleryModal({ open: true, index: i })} className="aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer group relative shadow-sm">
                <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                  <FiEye className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-50 group-hover:scale-100" size={32} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ❤️ REVIEWS SECTION */}
        <section className="bg-[#111] rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#C2185B]/20 rounded-full blur-[100px]" />
          
          <div className="relative z-10 text-center mb-16">
            <h2 className="font-display text-4xl font-black mb-4">Couples Love Us</h2>
            <div className="flex items-center justify-center gap-2 text-[#D4AF37] mb-2">
              <FiStar className="fill-current" size={24} />
              <FiStar className="fill-current" size={24} />
              <FiStar className="fill-current" size={24} />
              <FiStar className="fill-current" size={24} />
              <FiStar className="fill-current" size={24} />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">4.9/5 Average Rating</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {reviews.map((rev, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 mb-6">
                  {[...Array(Math.floor(rev.rating))].map((_, idx) => <FiStar key={idx} className="text-[#D4AF37] fill-[#D4AF37]" size={14} />)}
                </div>
                <p className="text-gray-300 italic font-medium leading-relaxed mb-8">"{rev.text}"</p>
                <div className="border-t border-white/10 pt-6">
                  <p className="font-bold text-white mb-1">{rev.name}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{rev.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* 📱 MOBILE STICKY BOTTOM CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-50 lg:hidden flex gap-3">
        <div className="flex-1">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Fare</p>
          <p className="text-xl font-black text-gray-900">{selectedCab ? formatPrice(totalAmount) : '₹0'}</p>
        </div>
        <button 
          onClick={handleBookNow} 
          disabled={!selectedCab || submitting}
          className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl disabled:opacity-50"
        >
          {submitting ? 'Wait...' : 'Book Now'}
        </button>
      </div>

      {/* 📸 GALLERY LIGHTBOX MODAL */}
      <AnimatePresence>
        {galleryModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center">
            <button onClick={() => setGalleryModal({ open: false, index: 0 })} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors bg-white/10 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md z-50">
              <FiX size={24} />
            </button>

            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setGalleryModal(p => ({ ...p, index: (p.index - 1 + galleryImages.length) % galleryImages.length })) }}
                  className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 z-50"
                ><FiChevronLeft size={30} /></button>
                <button
                  onClick={(e) => { e.stopPropagation(); setGalleryModal(p => ({ ...p, index: (p.index + 1) % galleryImages.length })) }}
                  className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 z-50"
                ><FiChevronRight size={30} /></button>
              </>
            )}

            <motion.img
              key={galleryModal.index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              src={galleryImages[galleryModal.index]}
              className="max-w-[95vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full text-white font-medium tracking-widest text-sm border border-white/20">
              {galleryModal.index + 1} / {galleryImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
