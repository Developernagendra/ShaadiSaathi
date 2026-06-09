import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiMapPin, FiStar, FiUsers, FiClock, FiCheck, 
  FiInfo, FiDollarSign, FiCalendar, FiShield, FiHeart,
  FiZap, FiArrowLeft, FiMessageCircle, FiCheckCircle, FiArrowRight,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi'
import api from '../utils/api'
import { formatPrice, optimizeImage, getInitials, formatDate } from '../utils/helpers'
import LoadingScreen from '../components/common/LoadingScreen'
import StarRating from '../components/common/StarRating'
import ReviewModal from '../components/common/ReviewModal'
import VendorProfileModal from '../components/common/VendorProfileModal'
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
  const [vendorModalOpen, setVendorModalOpen] = useState(false)

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
  }, [id, navigate])

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

  const nextImage = () => {
    if (!cab?.images) return
    setActiveImg((prev) => (prev === cab.images.length - 1 ? 0 : prev + 1))
  }

  const prevImage = () => {
    if (!cab?.images) return
    setActiveImg((prev) => (prev === 0 ? cab.images.length - 1 : prev - 1))
  }

  if (loading) return <LoadingScreen />
  
  if (!cab) return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-20 bg-[#FAFAFA]">
      <div className="text-6xl mb-6">🚗</div>
      <h2 className="font-display text-4xl font-black text-gray-900 mb-4">Vehicle Not Found</h2>
      <p className="text-gray-500 mb-8 font-medium">This luxury vehicle might have been removed or is unavailable.</p>
      <button onClick={() => navigate('/baraat-cabs')} className="px-8 py-4 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2">
        <FiArrowLeft /> Browse Premium Fleet
      </button>
    </div>
  )

  const handleBookNow = () => {
    if (!cab?._id) return;
    const pkgQuery = selectedPackage ? `&packageId=${selectedPackage._id}` : '';
    navigate(`/baraat-cabs/book?cabId=${cab._id}${pkgQuery}`)
  }

  const featuresList = [
    { label: 'Chauffeur', value: cab.features?.driverIncluded, icon: '👨‍✈️' },
    { label: 'Floral Decor', value: cab.features?.decorationAvailable, icon: '🌸' },
    { label: 'Sound System', value: cab.features?.musicSystem, icon: '🎵' },
    { label: 'Climate Control', value: cab.features?.ac, icon: '❄️' },
    { label: 'Fuel Included', value: cab.features?.fuelIncluded, icon: '⛽' }
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 selection:bg-[#C2185B]/20 selection:text-[#C2185B] font-sans">
      
      {/* ── ✨ Hero Image Carousel Section ── */}
      <div className="relative h-[70vh] min-h-[550px] w-full mt-4 md:mt-8 mx-auto max-w-[96%] rounded-[3rem] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.15)] group">
        
        {/* Main Image Slider */}
        <div className="absolute inset-0 bg-gray-900">
          <AnimatePresence mode='wait'>
            <motion.img 
              key={activeImg}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              src={optimizeImage(cab.images?.[activeImg]?.url || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=1600&q=80', 1600)} 
              className="w-full h-full object-cover" 
              alt={cab.name}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/40 to-transparent opacity-90" />
        </div>

        {/* Carousel Controls */}
        {cab.images?.length > 1 && (
          <>
            <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/20 shadow-xl z-20">
              <FiChevronLeft size={24} />
            </button>
            <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/20 shadow-xl z-20">
              <FiChevronRight size={24} />
            </button>
            
            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {cab.images.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImg(i)}
                  className={`h-2 rounded-full transition-all ${activeImg === i ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/50 hover:bg-white'}`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Navigation & Titles overlay */}
        <div className="absolute top-8 left-8 z-20">
          <button onClick={() => navigate('/baraat-cabs')} className="inline-flex items-center gap-2 text-white/90 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:-translate-x-1 bg-white/10 hover:bg-white/20 backdrop-blur-md px-5 py-3 rounded-full border border-white/10 shadow-lg">
            <FiArrowLeft /> Back to Listings
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-10 flex flex-col justify-end h-full pointer-events-none">
          <div className="max-w-7xl mx-auto w-full flex flex-wrap items-end justify-between gap-8 pointer-events-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="flex items-center gap-3 mb-5">
                <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                  {cab?.type?.replace('_', ' ') || 'Premium Vehicle'}
                </span>
                <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {cab.brand} {cab.model}
                </span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                {cab.name}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-white/90 text-sm font-bold">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  <FiMapPin className="text-[#C2185B]" /> {cab.location?.city || 'Available Nationwide'}
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-yellow-400">
                  <FiStar className="fill-current" /> {cab.rating?.average || '5.0'} ({cab.rating?.count || 0} reviews)
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── 📝 Details & Booking Section ── */}
      <div className="max-w-7xl mx-auto px-4 mt-8 md:mt-12 relative z-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT: Info & Details */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Quick Specs - Premium Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-pink-50 text-[#C2185B] rounded-full flex items-center justify-center text-xl mb-3"><FiUsers /></div>
                <p className="font-black text-gray-900 text-lg mb-0.5">{cab.seatingCapacity}</p>
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Passenger Limit</p>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-gold-50 text-[#D4AF37] rounded-full flex items-center justify-center text-xl mb-3">⚙️</div>
                <p className="font-black text-gray-900 text-lg mb-0.5 capitalize">{cab.transmission || 'Auto'}</p>
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Transmission</p>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-xl mb-3">⛽</div>
                <p className="font-black text-gray-900 text-lg mb-0.5 capitalize">{cab.fuelType || 'Diesel'}</p>
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Fuel Type</p>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-xl mb-3"><FiMapPin /></div>
                <p className="font-black text-gray-900 text-lg mb-0.5 line-clamp-1">{cab.location?.city || 'Local'}</p>
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Base City</p>
              </div>
            </div>

            {/* Description Area */}
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold-50 rounded-full blur-[80px] pointer-events-none" />
              <div className="inline-flex items-center gap-2 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                <div className="w-8 h-px bg-[#D4AF37]" /> The Vehicle
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-black text-gray-900 mb-6 tracking-tight">
                About this {cab.brand}
              </h2>
              <p className="text-gray-600 font-medium leading-[1.9] text-lg relative z-10 whitespace-pre-wrap">
                {cab.description || "Experience the pinnacle of luxury with this impeccably maintained vehicle. Designed to offer maximum comfort and a commanding presence, it is the perfect choice for the groom's arrival or the bridal party's grand entrance. Equipped with premium leather interiors, advanced climate control, and a state-of-the-art sound system, every journey becomes a celebration."}
              </p>
            </div>

            {/* Features List */}
            <div className="bg-gray-900 rounded-[3rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.2)] text-white relative overflow-hidden">
              <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#C2185B]/20 rounded-full blur-[100px]" />
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[100px]" />
              
              <h3 className="font-display text-2xl md:text-3xl font-black mb-10 tracking-tight relative z-10">Premium Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
                {featuresList.map((f, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center text-center ${f.value ? 'bg-white/10 border-white/20 backdrop-blur-md shadow-lg hover:bg-white/20' : 'bg-black/20 border-white/5 opacity-50 grayscale'}`}
                  >
                    <span className="text-4xl mb-4 block drop-shadow-sm">{f.icon}</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white leading-tight">{f.label}</p>
                    {f.value && <div className="mt-3 w-6 h-6 bg-[#D4AF37] rounded-full flex items-center justify-center"><FiCheck className="text-black text-xs" /></div>}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Verified Reviews */}
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100">
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
                  <div className="text-center py-16 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                    <div className="text-4xl mb-4">🌟</div>
                    <p className="text-gray-500 font-medium">No reviews yet. Be the first to book and share your grand experience!</p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev._id} className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 shadow-sm hover:shadow-md transition-all relative">
                      {user?._id === rev.user?._id && (
                        <div className="absolute top-8 right-8 flex gap-3 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                          <button onClick={() => { setEditReviewData(rev); setReviewModalOpen(true); }} className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:text-blue-700">Edit</button>
                          <div className="w-px bg-gray-200" />
                          <button onClick={() => handleDeleteReview(rev._id)} className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:text-red-700">Delete</button>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-black text-gray-900 text-lg shadow-sm border border-gray-200">{getInitials(rev.user?.name)}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900">{rev.user?.name}</p>
                              {rev.status !== 'approved' && user?._id === rev.user?._id && (
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
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

          {/* ── RIGHT: Sticky Booking Sidebar ── */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              
              {/* Main Booking Card */}
              <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden">
                {/* Header Area */}
                <div className="bg-gray-900 p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/20 rounded-full blur-[40px]" />
                  <h3 className="font-display text-2xl font-black mb-1 tracking-tight relative z-10">Reserve Vehicle</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest relative z-10">Select your preferred package</p>
                </div>

                <div className="p-8">
                  {cab.packages && cab.packages.length > 0 ? (
                    <div className="space-y-4 mb-8 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                      {cab.packages.map((pkg) => (
                         <div 
                         key={pkg._id}
                         onClick={() => setSelectedPackage(pkg)}
                         className={`p-6 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 ${selectedPackage?._id === pkg._id ? 'bg-pink-50 border-[#C2185B] shadow-md' : 'bg-gray-50 border-gray-100 hover:border-gray-300'}`}
                       >
                         <div className="flex justify-between items-start mb-3">
                           <div>
                             <div className="flex items-center gap-2 mb-1">
                               <h4 className="font-black text-sm text-gray-900">{pkg.name}</h4>
                               {pkg.isPopular && <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm">Hot</span>}
                             </div>
                             <p className="text-[10px] text-gray-500 font-bold">{pkg.hours} hrs • {pkg.kmLimit} km limit</p>
                           </div>
                           <div className="text-right">
                             <span className="font-black text-xl text-[#C2185B] block">{formatPrice(pkg.price)}</span>
                             {pkg.originalPrice && (
                               <span className="block text-[10px] font-bold text-gray-400 line-through mt-0.5">{formatPrice(pkg.originalPrice)}</span>
                             )}
                           </div>
                         </div>
                         
                         <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                           {pkg.decorationIncluded && <span className="text-[9px] font-black uppercase tracking-widest text-pink-600 bg-pink-100 px-3 py-1.5 rounded-full">🌸 Decor</span>}
                           {pkg.driverIncluded && <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full">👨‍✈️ Driver</span>}
                           {pkg.fuelIncluded && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full">⛽ Fuel</span>}
                         </div>
                       </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-8 p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Base Rental</span>
                        <span className="font-display font-black text-3xl text-gray-900">{formatPrice(cab.price || cab.pricing?.baseFare)}</span>
                      </div>
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400">
                        <FiDollarSign />
                      </div>
                    </div>
                  )}

                  {(!isAuthenticated || user?.role === 'user') && (
                    <button 
                      onClick={handleBookNow}
                      disabled={!cab.price && !cab.pricing?.baseFare && !selectedPackage}
                      className="w-full bg-gradient-to-r from-[#C2185B] to-[#8E244D] text-white py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(194,24,91,0.2)] hover:shadow-[0_15px_30px_rgba(194,24,91,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                    >
                      {(cab.packages?.length > 0 && selectedPackage) ? `Book ${selectedPackage.name}` : (cab.price || cab.pricing?.baseFare ? 'Proceed to Request' : 'Pricing Unavailable')}
                      <FiArrowRight size={16} />
                    </button>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 py-3 rounded-xl">
                    <FiShield className="text-sm" /> 100% Safe & Secure Booking
                  </div>
                </div>
              </div>

              {/* Vendor Profile Mini Card - Now Clickable */}
              {cab.vendor && (
                <div 
                  onClick={() => setVendorModalOpen(true)}
                  className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:border-[#D4AF37] hover:shadow-lg transition-all group relative overflow-hidden cursor-pointer flex items-center justify-between"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    <span className="text-6xl">🏢</span>
                  </div>
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-gray-50 border-2 border-[#D4AF37] p-1 shadow-sm flex-shrink-0">
                      <img 
                        src={cab.vendor.images?.[0]?.url || `https://ui-avatars.com/api/?name=${cab.vendor.businessName}&background=random`} 
                        className="w-full h-full rounded-full object-cover" 
                        alt={cab.vendor.businessName}
                      />
                    </div>
                    <div>
                      <h4 className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Fleet Partner</h4>
                      <h4 className="font-black text-gray-900 text-lg leading-tight mb-1 group-hover:text-[#C2185B] transition-colors">{cab.vendor.businessName}</h4>
                      <div className="flex items-center gap-1 text-[10px] font-black text-yellow-500">
                        <FiStar className="fill-current" /> {cab.vendor.rating?.average || '5.0'} Rating
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-10 h-10 bg-gray-50 group-hover:bg-[#C2185B] group-hover:text-white rounded-full flex items-center justify-center text-gray-400 transition-colors shrink-0 z-10">
                    <FiArrowRight />
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

      <VendorProfileModal 
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        vendor={cab?.vendor}
      />
    </div>
  )
}
