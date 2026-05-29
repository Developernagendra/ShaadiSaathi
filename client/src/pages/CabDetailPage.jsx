import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiMapPin, FiStar, FiUsers, FiClock, FiCheck, 
  FiInfo, FiDollarSign, FiCalendar, FiShield, FiHeart,
  FiZap, FiArrowLeft, FiMessageCircle, FiCheckCircle
} from 'react-icons/fi'
import api from '../utils/api'
import { formatPrice, optimizeImage, getInitials, formatDate } from '../utils/helpers'
import LoadingScreen from '../components/common/LoadingScreen'
import StarRating from '../components/common/StarRating'
import ReviewModal from '../components/common/ReviewModal'
import { toast } from 'react-hot-toast'

export default function CabDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector(state => state.auth)
  
  const [cab, setCab] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [selectedPackage, setSelectedPackage] = useState(null)
  
  const [reviews, setReviews] = useState([])
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [editReviewData, setEditReviewData] = useState(null)

  const loadReviews = () => {
    api.get(`/reviews/cab/${id}`).then(r => setReviews(r.data.reviews)).catch(() => { })
  }

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data } = await api.get(`/cab-booking/details/${id}`)
        setCab(data.cab)
        if (data.cab.packages && data.cab.packages.length > 0) {
          setSelectedPackage(data.cab.packages[0])
        }
        loadReviews()
      } catch (err) {
        toast.error('Cab not found')
        navigate('/baraat-cabs')
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
    window.scrollTo(0, 0)
  }, [id])

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return
    try {
      await api.delete(`/reviews/${reviewId}`)
      toast.success('Review deleted successfully')
      loadReviews()
    } catch (err) {
      toast.error('Failed to delete review')
    }
  }

  if (loading) return <LoadingScreen />
  
  if (!cab) return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-20 bg-[#FFF8F0]/30">
      <div className="text-6xl mb-6">🚗</div>
      <h2 className="font-display text-4xl font-black text-gray-900 mb-4">Cab Not Found</h2>
      <p className="text-gray-500 mb-8 font-medium">This vehicle might have been removed or is unavailable.</p>
      <button onClick={() => navigate('/baraat-cabs')} className="btn-primary flex items-center gap-2">
        <FiArrowLeft /> Browse Baraat Fleet
      </button>
    </div>
  )

  const handleBookNow = () => {
    if (!cab?._id) return;
    const pkgQuery = selectedPackage ? `?packageId=${selectedPackage._id}` : '';
    navigate(`/book-cab/${cab._id}${pkgQuery}`)
  }

  const featuresList = [
    { label: 'Driver Included', value: cab.features?.driverIncluded, icon: '👨‍✈️' },
    { label: 'Decoration Avail.', value: cab.features?.decorationAvailable, icon: '🌸' },
    { label: 'Music System', value: cab.features?.musicSystem, icon: '🎵' },
    { label: 'Air Conditioning', value: cab.features?.ac, icon: '❄️' },
    { label: 'Fuel Included', value: cab.features?.fuelIncluded, icon: '⛽' }
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 selection:bg-[#C2185B]/20 selection:text-[#C2185B]">
      
      {/* ── ✨ Hero Image Section ── */}
      <div className="relative h-[65vh] min-h-[500px] w-full mt-4 md:mt-8 mx-auto max-w-[96%] rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="absolute inset-0">
          <AnimatePresence mode='wait'>
            <motion.img 
              key={activeImg}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              src={optimizeImage(cab.images?.[activeImg]?.url || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=1600&q=80', 1600)} 
              className="w-full h-full object-cover" 
              alt={cab.name}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/40 to-transparent opacity-90" />
        </div>
        
        {/* Navigation & Titles overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-10 flex flex-col justify-end h-full">
          <div className="max-w-7xl mx-auto w-full">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:-translate-x-1 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <FiArrowLeft /> Back to Listings
            </button>
            
            <div className="flex flex-wrap items-end justify-between gap-8">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                    {cab?.type?.replace('_', ' ') || 'Premium Vehicle'}
                  </span>
                  <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {cab.brand} {cab.model}
                  </span>
                </div>
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter mb-4 drop-shadow-2xl">
                  {cab.name}
                </h1>
                <div className="flex items-center gap-6 text-white/80 text-sm font-bold">
                  <div className="flex items-center gap-2">
                    <FiMapPin className="text-[#C2185B]" /> {cab.location?.city || 'Available Nationwide'}
                  </div>
                  <div className="flex items-center gap-2 text-yellow-400">
                    <FiStar className="fill-current" /> {cab.rating?.average || '5.0'} ({cab.rating?.count || 0} reviews)
                  </div>
                </div>
              </motion.div>

              {/* Desktop Mini Image Gallery */}
              {cab.images?.length > 1 && (
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="hidden md:flex gap-3 bg-gray-900/40 backdrop-blur-xl p-3 rounded-[2rem] border border-white/10">
                  {cab.images.slice(0, 4).map((img, i) => (
                    <button 
                      key={i} 
                      onClick={() => setActiveImg(i)}
                      className={`w-20 h-20 rounded-[1rem] overflow-hidden transition-all duration-300 relative ${activeImg === i ? 'ring-2 ring-[#D4AF37] scale-105 shadow-xl' : 'opacity-60 hover:opacity-100 border border-transparent'}`}
                    >
                      <img src={img.url} className="w-full h-full object-cover" alt="" />
                      {activeImg === i && <div className="absolute inset-0 bg-[#D4AF37]/20" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Image Gallery (Scrollable) */}
      {cab.images?.length > 1 && (
        <div className="md:hidden flex gap-3 p-4 overflow-x-auto snap-x hide-scrollbar -mt-4 relative z-20">
          {cab.images.map((img, i) => (
            <button 
              key={i} 
              onClick={() => setActiveImg(i)}
              className={`w-24 h-24 rounded-2xl overflow-hidden snap-center flex-shrink-0 transition-all duration-300 ${activeImg === i ? 'ring-2 ring-[#C2185B] scale-105 shadow-xl' : 'opacity-70 hover:opacity-100 border border-gray-200 shadow-sm'}`}
            >
              <img src={img.url} className="w-full h-full object-cover" alt="" />
            </button>
          ))}
        </div>
      )}

      {/* ── 📝 Details & Booking Section ── */}
      <div className="max-w-7xl mx-auto px-4 mt-8 md:mt-12 relative z-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT: Info & Details */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Quick Specs */}
            <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-pink-50 grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x divide-gray-100 text-center">
              <div>
                <FiUsers className="text-[#C2185B] text-3xl mx-auto mb-3" />
                <p className="font-black text-gray-900 text-lg mb-1">{cab.seatingCapacity}</p>
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Seats</p>
              </div>
              <div>
                <span className="text-[#D4AF37] text-3xl mx-auto mb-3 block">⚙️</span>
                <p className="font-black text-gray-900 text-lg mb-1 capitalize">{cab.transmission || 'Auto'}</p>
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Gear</p>
              </div>
              <div>
                <span className="text-blue-500 text-3xl mx-auto mb-3 block">⛽</span>
                <p className="font-black text-gray-900 text-lg mb-1 capitalize">{cab.fuelType || 'Diesel'}</p>
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Fuel Type</p>
              </div>
              <div>
                <FiMapPin className="text-green-500 text-3xl mx-auto mb-3" />
                <p className="font-black text-gray-900 text-lg mb-1 line-clamp-1">{cab.location?.city || 'Local'}</p>
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Base City</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-premium border border-pink-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold-50 rounded-full blur-[80px] pointer-events-none" />
              <div className="inline-flex items-center gap-2 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                <div className="w-8 h-px bg-[#D4AF37]" /> Vehicle Overview
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-black text-gray-900 mb-6 tracking-tight">
                About this {cab.brand}
              </h2>
              <p className="text-gray-600 font-medium leading-[1.8] text-lg relative z-10">
                {cab.description}
              </p>
            </div>

            {/* Features & Amenities */}
            <div className="bg-gradient-to-br from-[#FFF8F0] to-white rounded-[3rem] p-8 md:p-12 shadow-premium border border-gold-100">
              <h3 className="font-display text-2xl md:text-3xl font-black text-gray-900 mb-8 tracking-tight">Premium Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {featuresList.map((f, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center shadow-sm ${f.value ? 'bg-white border-gold-100 hover:border-[#D4AF37] hover:shadow-lg hover:-translate-y-1' : 'bg-gray-50/50 border-transparent opacity-50 grayscale'}`}
                  >
                    <span className="text-4xl mb-4 block drop-shadow-sm">{f.icon}</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-900 leading-tight">{f.label}</p>
                    {f.value && <FiCheckCircle className="mt-3 text-[#D4AF37]" size={18} />}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Verified Reviews */}
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-premium border border-pink-50">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
                <div>
                  <h3 className="font-display text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Guest Reviews</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Real experiences from our couples</p>
                </div>
                {isAuthenticated && (
                  <button onClick={() => setReviewModalOpen(true)} className="bg-gray-900 hover:bg-black text-white py-3 px-8 rounded-full font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95">
                    Write a Review
                  </button>
                )}
              </div>
              
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium">No reviews yet. Be the first to book and share your experience!</p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev._id} className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative">
                      {user?._id === rev.user?._id && (
                        <div className="absolute top-8 right-8 flex gap-3 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                          <button onClick={() => { setEditReviewData(rev); setReviewModalOpen(true); }} className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:text-blue-700">Edit</button>
                          <div className="w-px bg-gray-200" />
                          <button onClick={() => handleDeleteReview(rev._id)} className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:text-red-700">Delete</button>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-50 to-gold-50 flex items-center justify-center font-black text-[#C2185B] text-lg shadow-inner border border-pink-100">{getInitials(rev.user?.name)}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900">{rev.user?.name}</p>
                              {rev.status !== 'approved' && user?._id === rev.user?._id && (
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                  rev.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {rev.status}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 font-medium">{formatDate(rev.createdAt)}</p>
                          </div>
                        </div>
                        <div className="mr-4 sm:mr-16">
                          <StarRating rating={rev.rating} size="sm" showCount={false} />
                        </div>
                      </div>
                      <p className="text-gray-600 font-medium leading-relaxed mt-4 italic">"{rev.comment}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Pricing & Booking Sidebar ── */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-8">
              
              {/* Main Booking Card */}
              <div className="bg-gray-900 rounded-[3rem] p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#C2185B]/20 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8 border-b border-gray-800 pb-6">
                    <div>
                      <h3 className="font-display text-3xl font-black mb-1">Book Cab</h3>
                      <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em]">Select Package</p>
                    </div>
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                      <FiZap className="text-[#C2185B]" />
                    </div>
                  </div>

                  {cab.packages && cab.packages.length > 0 ? (
                    <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                      {cab.packages.map((pkg) => (
                        <div 
                          key={pkg._id}
                          onClick={() => setSelectedPackage(pkg)}
                          className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 ${selectedPackage?._id === pkg._id ? 'bg-[#C2185B]/10 border-[#C2185B] shadow-[0_10px_30px_rgba(194,24,91,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-black text-sm text-white">{pkg.name}</h4>
                                {pkg.isPopular && <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm">Hot</span>}
                              </div>
                              <p className="text-[10px] text-gray-400 font-medium">{pkg.hours} hrs • {pkg.kmLimit} km limit</p>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-xl text-[#D4AF37] block">{formatPrice(pkg.price)}</span>
                              {pkg.originalPrice && (
                                <span className="block text-[10px] font-bold text-gray-500 line-through mt-0.5">{formatPrice(pkg.originalPrice)}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                            {pkg.decorationIncluded && <span className="text-[9px] font-black uppercase tracking-widest text-pink-300 bg-pink-500/10 px-3 py-1.5 rounded-full border border-pink-500/20">🌸 Decor</span>}
                            {pkg.driverIncluded && <span className="text-[9px] font-black uppercase tracking-widest text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">👨‍✈️ Driver</span>}
                            {pkg.fuelIncluded && <span className="text-[9px] font-black uppercase tracking-widest text-green-300 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">⛽ Fuel</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-10 text-center py-6 bg-white/5 rounded-[2rem] border border-white/5">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Starting Price</span>
                      <span className="font-display font-black text-5xl text-[#C2185B]">{formatPrice(cab.price)}</span>
                    </div>
                  )}

                  {(!isAuthenticated || user?.role === 'user') && (
                    <button 
                      onClick={handleBookNow}
                      disabled={!cab.price && !selectedPackage}
                      className="w-full bg-gradient-to-r from-[#C2185B] to-[#8E244D] text-white py-5 rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(194,24,91,0.3)] hover:shadow-[0_15px_40px_rgba(194,24,91,0.5)] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                    >
                      {(cab.packages?.length > 0 && selectedPackage) ? `Book ${selectedPackage.name}` : (cab.price ? 'Proceed to Book' : 'Unavailable')}
                      <FiArrowRight size={16} />
                    </button>
                  )}

                  <button className="w-full bg-transparent border-2 border-green-500 text-green-400 hover:bg-green-500/10 rounded-full py-4 font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95">
                    <FiMessageCircle size={16} /> Inquiry via WhatsApp
                  </button>

                  <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-widest text-gray-400">
                    <FiShield className="text-green-500 text-sm" /> Safe & Secure Offline Booking
                  </div>
                </div>
              </div>

              {/* Vendor Profile Mini Card */}
              {cab.vendor && (
                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-premium border border-pink-50 hover:border-[#D4AF37] transition-colors group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <span className="text-6xl">🏢</span>
                  </div>
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-5 italic relative z-10">Managed by</h4>
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-gray-50 border-2 border-[#D4AF37] p-1 shadow-sm flex-shrink-0">
                      <img 
                        src={cab.vendor.images?.[0]?.url || `https://ui-avatars.com/api/?name=${cab.vendor.businessName}&background=random`} 
                        className="w-full h-full rounded-full object-cover" 
                        alt={cab.vendor.businessName}
                      />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-lg leading-tight mb-1 group-hover:text-[#C2185B] transition-colors">{cab.vendor.businessName}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-black text-yellow-500">
                        <div className="flex"><FiStar className="fill-current" /></div>
                        <span>({cab.vendor.rating?.average || '5.0'}) Rating</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <ReviewModal 
        isOpen={reviewModalOpen}
        onClose={() => { setReviewModalOpen(false); setEditReviewData(null); }}
        targetId={id}
        targetType="cab"
        existingReview={editReviewData}
        onSuccess={() => {
          loadReviews();
          api.get(`/cab-booking/details/${id}`).then(r => setCab(r.data.cab)).catch(() => {})
        }}
      />
    </div>
  )
}
