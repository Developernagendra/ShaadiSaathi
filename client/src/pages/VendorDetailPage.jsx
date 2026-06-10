import { useEffect, useState, useMemo, memo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchVendorById, clearCurrentVendor } from '../store/slices/vendorSlice'
import { toggleWishlist } from '../store/slices/authSlice'
import { startChat } from '../store/slices/chatSlice'
import StarRating from '../components/common/StarRating'
import Badge from '../components/common/Badge'
import BookingModal from '../components/vendor/BookingModal'
import { formatPrice, formatDate, getInitials, getWhatsAppLink } from '../utils/helpers'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  FiMapPin, FiPhone, FiMail, FiHeart, FiMessageCircle, FiLock,
  FiCalendar, FiCheck, FiShare2, FiImage, FiEye, FiChevronLeft, FiChevronRight, FiX, FiClock, FiUsers, FiGlobe, FiAward, FiStar, FiShield, FiCheckCircle
} from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import ReviewModal from '../components/common/ReviewModal'

const getOptimizedUrl = (url, width = 800) => {
  if (!url || !url.includes('cloudinary')) return url
  return url.replace('/upload/', `/upload/c_scale,w_${width},f_auto,q_auto/`)
}

export default function VendorDetailPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { currentVendor: vendor, fetchLoading: loading, error } = useSelector(s => s.vendor)
  const { user, isAuthenticated } = useSelector(s => s.auth)

  const [reviews, setReviews] = useState([])
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [galleryModal, setGalleryModal] = useState({ open: false, index: 0 })
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [editReviewData, setEditReviewData] = useState(null)

  const isWishlisted = useMemo(() => user?.wishlist?.includes(id), [user?.wishlist, id])

  const loadReviews = () => {
    api.get(`/reviews/vendor/${id}`).then(r => setReviews(r.data.reviews)).catch(() => { })
  }

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

  useEffect(() => {
    if (!vendor || vendor._id !== id) {
      dispatch(fetchVendorById(id))
      loadReviews()
    }
    window.scrollTo(0, 0)

    return () => {
      if (vendor && vendor._id !== id) dispatch(clearCurrentVendor())
    }
  }, [dispatch, id, vendor?._id])

  const images = useMemo(() => vendor?.images || [], [vendor?.images])
  const coverUrl = useMemo(() => {
    let url = vendor?.coverImage?.url || images.find(i => i.isPrimary)?.url || images[0]?.url;
    if (!url) {
      const cat = vendor?.category?.slug || vendor?.category?.name?.toLowerCase() || '';
      if (cat.includes('photo')) url = 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80'; // Photography
      else if (cat.includes('purohit') || cat.includes('pandit')) url = 'https://images.unsplash.com/photo-1587271636175-90d58cdad458?auto=format&fit=crop&w=1600&q=80'; // Purohit
      else if (cat.includes('mehndi') || cat.includes('mehendi')) url = 'https://images.unsplash.com/photo-1564858548398-fb02d4151703?auto=format&fit=crop&w=1600&q=80'; // Mehndi
      else if (cat.includes('cater') || cat.includes('food')) url = 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1600&q=80'; // Catering
      else if (cat.includes('decor')) url = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80'; // Decoration
      else if (cat.includes('cab') || cat.includes('car') || cat.includes('transport') || cat.includes('travel')) url = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1600&q=80'; // Cab Service
      else if (cat.includes('makeup') || cat.includes('beauty') || cat.includes('artist')) url = 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1600&q=80'; // Makeup Artist
      else if (cat.includes('hall') || cat.includes('venue') || cat.includes('banquet')) url = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=80'; // Marriage Hall
      else if (cat.includes('band') || cat.includes('music') || cat.includes('dj')) url = 'https://images.unsplash.com/photo-1533174000255-598dc4b16bf0?auto=format&fit=crop&w=1600&q=80'; // Band Baja
      else url = 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=80'; // Default Premium Wedding
    }
    return getOptimizedUrl(url, 1600);
  }, [vendor, images])

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: vendor?.businessName, text: vendor?.tagline, url }).catch(() => { })
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!', { style: { borderRadius: '1rem', background: '#333', color: '#fff' } })
    }
  }

  if (loading && !vendor) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-[#FAFAFA]">
        <div className="w-16 h-16 border-4 border-gray-100 border-t-[#D4AF37] rounded-full animate-spin mb-6 shadow-xl" />
        <p className="text-[#D4AF37] font-bold animate-pulse tracking-wide uppercase text-sm">Curating Premium Experience...</p>
      </div>
    )
  }

  if (error || (!loading && !vendor)) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-[#FAFAFA] px-4">
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-6xl shadow-2xl mb-8 border border-gray-100">✨</div>
        <h2 className="text-4xl font-display font-black text-gray-900 mb-4 text-center">Vendor Unavailable</h2>
        <p className="text-gray-500 text-center mb-10 max-w-md font-medium text-lg">This premium vendor is currently not available or has been removed.</p>
        <Link to="/services" className="bg-gradient-to-r from-[#D4AF37] to-[#B38D22] text-white font-bold px-10 py-4 rounded-full transition-all hover:scale-105 shadow-xl hover:shadow-[0_10px_30px_rgba(212,175,55,0.4)]">Explore Premium Vendors</Link>
      </div>
    )
  }

  if (!vendor) return null

  const truncate = (str, n) => {
    if (!str) return '';
    return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32 relative selection:bg-[#D4AF37]/20 selection:text-[#D4AF37]">
      {/* ── ✨ PREMIUM HERO SECTION ── */}
      <div className="relative h-[60vh] md:h-[70vh] w-full bg-gray-900 overflow-hidden shadow-2xl">
        {coverUrl && (
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={coverUrl}
            alt={vendor.businessName}
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

        {/* Top actions within banner (Share/Wishlist) */}
        <div className="absolute top-6 right-6 md:top-10 md:right-10 flex gap-4 z-20">
          <button onClick={() => isAuthenticated ? dispatch(toggleWishlist(id)) : navigate('/login')} className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all shadow-xl hover:scale-105 active:scale-95 group/btn ${isWishlisted ? 'bg-white text-[#C2185B] border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>
            <FiHeart fill={isWishlisted ? '#C2185B' : 'none'} size={20} className="group-hover/btn:scale-110 transition-transform" />
          </button>
          <button onClick={handleShare} className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all shadow-xl hover:scale-105 active:scale-95 group/btn">
            <FiShare2 size={20} className="group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>

        {/* Floating Glassmorphism Profile Card */}
        <div className="absolute bottom-0 left-0 w-full z-10">
          <div className="max-w-7xl mx-auto px-4 md:px-8 pb-8 md:pb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-10 border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 max-w-5xl"
            >
              {/* Profile Image */}
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2rem] border-[6px] border-white shadow-2xl overflow-hidden bg-white flex items-center justify-center shrink-0 relative group">
                {vendor.logo?.url ? (
                  <img src={vendor.logo.url} alt={vendor.businessName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : vendor.user?.avatar?.url ? (
                  <img src={vendor.user.avatar.url} alt={vendor.businessName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <span className="text-5xl md:text-7xl font-display font-black text-[#D4AF37]">{getInitials(vendor.businessName || vendor.user?.name)}</span>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left text-white">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                  <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/30 shadow-sm animate-fade-in">
                    {vendor.category?.name || 'Wedding Service'}
                  </span>
                  {vendor.subscription?.plan === 'elite' && vendor.subscription?.status === 'active' && (
                    <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFF8F0] to-[#D4AF37] text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-lg border border-[#D4AF37]/50 flex items-center gap-1.5 shine-effect select-none animate-fade-in">
                      <FiCheckCircle className="text-black" size={14} strokeWidth={3} />
                      👑 Elite Partner
                    </span>
                  )}
                  {vendor.subscription?.plan === 'premium' && vendor.subscription?.status === 'active' && (
                    <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFF8F0] to-[#D4AF37] text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-lg border border-[#D4AF37]/50 flex items-center gap-1.5 shine-effect select-none animate-fade-in">
                      <FiCheckCircle className="text-black" size={14} strokeWidth={3} />
                      ⭐ Featured Partner
                    </span>
                  )}
                  {(vendor.approvalStatus === 'approved' && vendor.user?.isVerified) && !['premium', 'elite'].includes(vendor.subscription?.plan) && (
                    <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-1.5 animate-fade-in">
                      <FiShield size={14} /> Premium Verified
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-6xl font-display font-black mb-3 drop-shadow-xl tracking-tight">
                  {vendor.businessName || vendor.user?.name}
                </h1>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 md:gap-8 text-sm font-medium text-gray-200">
                  <div className="flex items-center gap-2">
                    <FiMapPin className="text-[#D4AF37]" size={18} />
                    <span className="text-white/90">{vendor.location?.city || 'India'}{vendor.location?.state ? `, ${vendor.location.state}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiStar className="text-[#D4AF37] fill-[#D4AF37]" size={18} />
                    <span className="text-white font-bold text-base">{vendor.dynamicRating?.average?.toFixed(1) || vendor.rating?.average?.toFixed(1) || 'New'}</span>
                    <span className="text-white/70">({vendor.dynamicRating?.count || vendor.rating?.count || 0} Reviews)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 relative z-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-12">

            {/* Quick Stats Grid */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
            >
              {[
                { icon: <FiStar />, label: 'Rating', value: `${vendor.dynamicRating?.average?.toFixed(1) || vendor.rating?.average?.toFixed(1) || 'New'}`, sub: `${vendor.dynamicRating?.count || vendor.rating?.count || 0} Reviews` },
                { icon: <FiCheck />, label: 'Bookings', value: vendor.completedBookings > 0 ? `${vendor.completedBookings}+` : 'New', sub: 'Completed' },
                { icon: <FiClock />, label: 'Experience', value: `${vendor.calculatedExperience || 1}+ Yrs`, sub: 'In Industry' },
                { icon: <FiUsers />, label: 'Customers', value: vendor.customersServed || '10+', sub: 'Served' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] text-center border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group">
                  <div className="w-12 h-12 mx-auto bg-[#D4AF37]/10 text-[#D4AF37] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-[#D4AF37] group-hover:text-white">
                    {stat.icon}
                  </div>
                  <p className="text-gray-900 font-display font-black text-2xl md:text-3xl tracking-tight">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.section>

            {/* About Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-px bg-[#D4AF37]" />
                <span className="text-[#D4AF37] text-[11px] font-black uppercase tracking-[0.3em]">The Story</span>
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-black text-gray-900 mb-6 tracking-tight">
                About {vendor.businessName}
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line font-medium">
                {vendor.description || 'Welcome to our premium wedding service. We are dedicated to making your special day extraordinary with our unmatched expertise and attention to detail. Let us turn your vision into reality.'}
              </p>
            </motion.section>

            {/* Visual Portfolio Gallery */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-px bg-[#C2185B]" />
                <span className="text-[#C2185B] text-[11px] font-black uppercase tracking-[0.3em]">Masterpieces</span>
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-black text-gray-900 mb-8 tracking-tight">
                Visual Portfolio
              </h3>

              {images.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                  <FiImage className="mx-auto text-5xl text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium italic">Portfolio is currently being updated with stunning captures.</p>
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setGalleryModal({ open: true, index: i })}
                      className="break-inside-avoid rounded-3xl overflow-hidden cursor-pointer group relative shadow-md border border-gray-100"
                    >
                      <img
                        src={getOptimizedUrl(img.url, 600)}
                        alt="Gallery"
                        className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-500 flex items-center justify-center">
                        <FiEye className="text-white opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-50 group-hover:scale-100 drop-shadow-xl" size={40} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>

            {/* Premium Packages Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-px bg-[#D4AF37]" />
                <span className="text-[#D4AF37] text-[11px] font-black uppercase tracking-[0.3em]">Investments</span>
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-black text-gray-900 mb-8 tracking-tight">
                Premium Packages
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {vendor.packages?.length > 0 ? vendor.packages.map((pkg, i) => (
                  <div key={i} className={`relative p-8 md:p-10 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-2 flex flex-col h-full group ${pkg.isPopular ? 'border-[#D4AF37] bg-[#FFFBF0] shadow-[0_20px_50px_rgba(212,175,55,0.15)]' : 'border-gray-200 bg-white hover:border-[#D4AF37]/50 hover:shadow-xl'}`}>
                    {pkg.isPopular && <div className="absolute -top-4 right-8 bg-[#D4AF37] text-white text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full shadow-lg">Most Popular</div>}

                    <h4 className="text-2xl font-black text-gray-900 mb-2 font-display group-hover:text-[#D4AF37] transition-colors">{pkg.name}</h4>
                    <div className="mb-8 flex items-baseline gap-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Starting At</span>
                      <span className="text-4xl font-display font-black text-[#C2185B]">{formatPrice(pkg.price)}</span>
                    </div>

                    <ul className="space-y-4 mb-10 flex-grow">
                      {pkg.features?.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-3 text-sm font-bold text-gray-700 leading-relaxed">
                          <div className="bg-[#D4AF37]/10 p-1 rounded-full text-[#D4AF37] mt-0.5 shrink-0">
                            <FiCheck size={14} strokeWidth={3} />
                          </div>
                          {feat}
                        </li>
                      ))}
                    </ul>

                    {(!isAuthenticated || user?.role === 'user') && (
                      <button
                        onClick={() => setBookingModalOpen(true)}
                        disabled={!pkg.price}
                        className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${pkg.isPopular ? 'bg-gray-900 text-white hover:bg-black shadow-lg hover:shadow-2xl' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                      >
                        {pkg.price ? 'Select Package' : 'Contact for Price'}
                      </button>
                    )}
                  </div>
                )) : (
                  <div className="col-span-1 md:col-span-2 text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium italic text-lg">Standard packages are not listed. Contact the vendor directly for a customized premium quote.</p>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Reviews Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-px bg-[#C2185B]" />
                    <span className="text-[#C2185B] text-[11px] font-black uppercase tracking-[0.3em]">Client Love</span>
                  </div>
                  <h3 className="font-display text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                    Trusted Experiences
                  </h3>
                </div>
                {isAuthenticated && (
                  <button onClick={() => setReviewModalOpen(true)} className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all hover:-translate-y-1 active:scale-95">
                    Write a Review
                  </button>
                )}
              </div>

              <div className="flex flex-col lg:flex-row gap-10">
                {/* Score Summary */}
                <div className="w-full lg:w-1/3 bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100 text-center flex flex-col justify-center items-center shadow-inner">
                  <p className="text-7xl font-display font-black text-gray-900 mb-4 tracking-tighter">
                    {vendor.dynamicRating?.average?.toFixed(1) || vendor.rating?.average?.toFixed(1) || 'New'}
                  </p>
                  <div className="mb-4">
                    <StarRating rating={vendor.dynamicRating?.average || vendor.rating?.average || 0} showCount={false} size="lg" />
                  </div>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                    Based on {vendor.dynamicRating?.count || vendor.rating?.count || 0} Reviews
                  </p>
                </div>

                {/* Review List */}
                <div className="w-full lg:w-2/3 space-y-6">
                  {reviews.length === 0 ? (
                    <p className="text-gray-500 font-medium italic mt-8 text-center lg:text-left">No reviews available yet. Be the first to share your experience!</p>
                  ) : (
                    reviews.map(rev => (
                      <div key={rev._id} className="p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm relative group hover:shadow-lg transition-all">
                        {user?._id === rev.user?._id && (
                          <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditReviewData(rev); setReviewModalOpen(true); }} className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:underline">Edit</button>
                            <button onClick={() => handleDeleteReview(rev._id)} className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline">Delete</button>
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-[#D4AF37] flex items-center justify-center font-black text-white text-lg shadow-md">
                              {getInitials(rev.user?.name)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-lg">{rev.user?.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase mt-1">{formatDate(rev.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mb-4">
                          <StarRating rating={rev.rating} size="sm" showCount={false} />
                        </div>
                        <p className="text-gray-700 font-medium leading-relaxed italic text-base">"{rev.comment}"</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.section>

          </div>

          {/* RIGHT COLUMN - Sticky Sidebar (Contact Section) */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-28 space-y-8">

              {/* Premium Book Now Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 p-10 text-center"
              >
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Starting Investment</p>
                <h4 className="text-5xl font-display font-black text-gray-900 tracking-tighter mb-10">
                  {formatPrice(vendor.price)}
                </h4>

                <div className="space-y-4">
                  {(!isAuthenticated || user?.role === 'user') && (
                    <button
                      onClick={() => setBookingModalOpen(true)}
                      disabled={!vendor.price}
                      className="w-full py-5 bg-[#C2185B] hover:bg-[#9B1248] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(194,24,91,0.3)] transition-all flex items-center justify-center gap-3 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiCalendar size={18} /> Book Your Date
                    </button>
                  )}

                  <button onClick={() => { isAuthenticated ? dispatch(startChat(id)).then(() => navigate('/chat')) : navigate('/login') }} className="w-full py-5 bg-gray-50 border border-gray-200 text-gray-900 hover:border-gray-900 hover:bg-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 hover:-translate-y-1 active:scale-95 shadow-sm">
                    <FiMessageCircle size={18} /> Send Inquiry
                  </button>
                </div>
              </motion.div>

              {/* Direct Contact Sticky Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4AF37]/20 rounded-full blur-[60px] pointer-events-none" />
                <h4 className="font-display text-2xl font-black mb-8 relative z-10">Connect Directly</h4>

                <div className="space-y-6 relative z-10">
                  {vendor.isContactLocked ? (
                    <div className="p-6 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
                      <div className="flex items-center gap-3 text-[#D4AF37] mb-3">
                        <FiLock size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Details Locked</span>
                      </div>
                      <p className="text-xs text-gray-300 font-medium leading-relaxed">
                        Direct phone number and email will be unlocked automatically after you book or inquire.
                      </p>
                    </div>
                  ) : (
                    <>
                      {vendor.phone && (
                        <a href={`tel:${vendor.phone}`} className="flex items-center gap-5 group w-full bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all border border-transparent hover:border-white/20">
                          <div className="w-12 h-12 rounded-xl bg-[#D4AF37] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <FiPhone size={20} />
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-gray-400 font-black mb-1">Call Now</p>
                            <p className="font-bold text-white text-base">+91 {vendor.phone}</p>
                          </div>
                        </a>
                      )}
                      {vendor.phone && getWhatsAppLink(vendor.phone) ? (
                        <button onClick={(e) => {
                          e.preventDefault()
                          const waLink = getWhatsAppLink(vendor.phone, `Hi ${vendor.businessName}, I found you on ShaadiSaathi and would like to book your service.`)
                          console.log('🔗 Opening WhatsApp for vendor:', vendor.businessName, waLink)
                          window.open(waLink, '_blank')
                        }} className="flex items-center gap-5 group w-full bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all border border-transparent hover:border-white/20 text-left">
                          <div className="w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <FiMessageCircle size={20} />
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-gray-400 font-black mb-1">WhatsApp</p>
                            <p className="font-bold text-white text-base">Chat with us</p>
                          </div>
                        </button>
                      ) : (
                        <div title="WhatsApp number not available" className="flex items-center gap-5 group w-full bg-white/5 p-4 rounded-2xl transition-all border border-transparent opacity-50 cursor-not-allowed">
                          <div className="w-12 h-12 rounded-xl bg-gray-600 text-white flex items-center justify-center shadow-lg">
                            <FiMessageCircle size={20} />
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-gray-400 font-black mb-1">WhatsApp</p>
                            <p className="font-bold text-white text-base">Not Available</p>
                          </div>
                        </div>
                      )}
                      {vendor.email && (
                        <a href={`mailto:${vendor.email}`} className="flex items-center gap-5 group w-full bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all border border-transparent hover:border-white/20">
                          <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg border border-white/20">
                            <FiMail size={20} />
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-gray-400 font-black mb-1">Email</p>
                            <p className="font-bold text-white text-sm truncate max-w-[150px]">{vendor.email}</p>
                          </div>
                        </a>
                      )}
                    </>
                  )}
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-2xl border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 lg:hidden flex gap-4">
        {(!isAuthenticated || user?.role === 'user') && (
          <button
            onClick={() => setBookingModalOpen(true)}
            disabled={!vendor.price}
            className="flex-1 py-4 bg-[#C2185B] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <FiCalendar size={16} /> Book
          </button>
        )}
        <button
          onClick={() => { isAuthenticated ? dispatch(startChat(id)).then(() => navigate('/chat')) : navigate('/login') }}
          className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <FiMessageCircle size={16} /> Inquire
        </button>
      </div>

      {/* Modals */}
      <BookingModal isOpen={bookingModalOpen} onClose={() => setBookingModalOpen(false)} vendor={vendor} navigate={navigate} />

      <AnimatePresence>
        {galleryModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center">
            <button onClick={() => setGalleryModal({ open: false, index: 0 })} className="absolute top-6 right-6 md:top-10 md:right-10 text-white/70 hover:text-white transition-colors bg-white/10 w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md z-50 shadow-2xl hover:bg-white/20">
              <FiX size={28} />
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setGalleryModal(p => ({ ...p, index: (p.index - 1 + images.length) % images.length })) }}
                  className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 z-50 shadow-2xl"
                ><FiChevronLeft size={36} /></button>
                <button
                  onClick={(e) => { e.stopPropagation(); setGalleryModal(p => ({ ...p, index: (p.index + 1) % images.length })) }}
                  className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 z-50 shadow-2xl"
                ><FiChevronRight size={36} /></button>
              </>
            )}

            <motion.img
              key={galleryModal.index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              src={images[galleryModal.index]?.url}
              className="max-w-[95vw] max-h-[85vh] object-contain rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10"
            />

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl px-8 py-3 rounded-full text-white font-bold tracking-[0.2em] text-xs border border-white/20 shadow-xl">
              {galleryModal.index + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => { setReviewModalOpen(false); setEditReviewData(null); }}
        targetId={id}
        targetType="vendor"
        existingReview={editReviewData}
        onSuccess={() => {
          loadReviews();
          dispatch(fetchVendorById(id));
        }}
      />
    </div>
  )
}
