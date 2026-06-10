import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchVendors, fetchCategories } from '../store/slices/vendorSlice'
import { fetchBlogs, fetchTestimonials, fetchHomeStats } from '../store/slices/featureSlice'
import { motion, AnimatePresence, useInView, useMotionValue, animate } from 'framer-motion'
import { useRef } from 'react'
import ServiceCard from '../components/vendor/ServiceCard'
import VendorCard from '../components/vendor/VendorCard'
import { SkeletonCard } from '../components/common/Skeleton'
import StarRating from '../components/common/StarRating'
import WeddingGallery from '../components/home/WeddingGallery'
import RealWeddingStories from '../components/home/RealWeddingStories'
import HappyCouples from '../components/home/HappyCouples'
import { INDIAN_CITIES, optimizeImage } from '../utils/helpers'
import { FiSearch, FiMapPin, FiArrowRight, FiCheck, FiUsers, FiStar, FiAward, FiMessageCircle, FiCheckCircle, FiCalendar, FiClock, FiEye } from 'react-icons/fi'
import api from '../utils/api'
import { getSocket } from '../utils/socket'
import { useTranslation } from 'react-i18next'


const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1587271636175-90d58cdad458?auto=format&fit=crop&w=1200&q=70', // Wedding Mandap
  'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?auto=format&fit=crop&w=1200&q=70', // Indian Bride
  'https://plus.unsplash.com/premium_photo-1682092018999-2c8fcfe944f3?auto=format&fit=crop&w=1200&q=70', // Palace Wedding
]



const STATS = [
  { value: '10+', label: 'Happy Couples', icon: '💑' },
  { value: '10+', label: 'Top Vendors', icon: '✅' },
  { value: '1+', label: 'Cities Covered', icon: '🗺️' },
  { value: '4/5', label: 'Customer Rating', icon: '⭐' },
]

const WHY_US = [
  { icon: '🔍', title: 'Easy Discovery', desc: 'Find verified vendors across Bihar in your city with advanced filters.' },
  { icon: '💬', title: 'Direct Chat', desc: 'Message vendors directly and get instant quotes and availability updates.' },
  { icon: '🔒', title: 'Verified Payment', desc: 'Safe manual verification. Your payment is protected until service delivery.' },
  { icon: '⭐', title: 'Genuine Reviews', desc: 'Only verified customers can review. No fake ratings, ever.' },
  { icon: '🚗', title: 'Baraat Cab Bundle', desc: 'Book bulk cabs for baraat in one click. India\'s first KM-based booking engine.' },
  { icon: '📱', title: 'Local Expertise', desc: 'Our Bihar-based wedding experts are available to help you plan.' },
]

const DEMO_TESTIMONIALS = [
  {
    name: 'Rahul & Priya',
    city: 'Patna',
    rating: 5,
    text: 'ShaadiSaathi ne hamari wedding planning bahut easy bana di. Vendors compare karna aur booking karna super simple tha.',
    date: '2 months ago'
  },
  {
    name: 'Aman Kumar',
    city: 'Darbhanga',
    rating: 5,
    text: 'Premium Baraat Cabs feature amazing hai. Humne ek hi jagah se luxury cars aur bus book kar liya.',
    date: '1 month ago'
  },
  {
    name: 'Sneha & Aditya',
    city: 'Muzaffarpur',
    rating: 5,
    text: 'Photography aur decoration vendors bahut achhe mile. Overall experience smooth aur trusted raha.',
    date: '3 months ago'
  },
  {
    name: 'Neha Sharma',
    city: 'Delhi',
    rating: 5,
    text: 'AI Wedding Planner ne budget aur planning dono organize kar diya. Time aur stress dono bacha.',
    date: '1 month ago'
  },
  {
    name: 'Rohan Singh',
    city: 'Ranchi',
    rating: 5,
    text: 'Vendor dashboard ka experience smooth tha. Leads aur bookings manage karna easy hai.',
    date: '2 months ago'
  },
  {
    name: 'Kavya & Mohit',
    city: 'Lucknow',
    rating: 5,
    text: 'ShaadiSaathi sach me shaadi ka sacha saathi laga. Ek platform par sab services mil gayi.',
    date: '3 weeks ago'
  }
]

function StatCard({ stat, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-2 relative overflow-hidden"
    >
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="text-4xl mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 drop-shadow-sm">
        {stat.icon}
      </div>
      <div className="font-display text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2 flex items-baseline justify-center">
        {stat.prefix}
        {stat.value}
        <span className="text-[#C2185B]">{stat.suffix}</span>
      </div>
      <div className="h-1 w-12 bg-gray-100 group-hover:bg-[#D4AF37] mx-auto my-3 rounded-full transition-colors duration-300" />
      <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">{stat.label}</p>
    </motion.div>
  )
}

export default function HomePage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { vendors = [], categories = [], fetchLoading: loading, error = null } = useSelector((s) => s.vendor || {})
  const { blogs = [], testimonials = [], stats = null } = useSelector((s) => s.feature || {})

  const [heroIndex, setHeroIndex] = useState(0)
  const [searchCity, setSearchCity] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Featured Services State (Marketplace)
  const [featuredServices, setFeaturedServices] = useState([])
  const [featuredLoading, setFeaturedLoading] = useState(true)
  const [featuredError, setFeaturedError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedPriceRange, setSelectedPriceRange] = useState('')
  const [selectedRating, setSelectedRating] = useState('')

  const fetchFeatured = async () => {
    setFeaturedLoading(true)
    setFeaturedError(false)
    try {
      // Fetch dynamic approved vendors
      const { data } = await api.get('/vendors/featured')
      setFeaturedServices(data.vendors || data.data || [])
    } catch (err) {
      console.error("Failed to load featured vendors:", err);
      setFeaturedError(true)
    } finally {
      setFeaturedLoading(false)
    }
  }

  // Realtime updates setup
  useEffect(() => {
    fetchFeatured()

    const socket = getSocket()
    if (socket) {
      socket.on('service_updated', fetchFeatured)
    }

    return () => {
      if (socket) {
        socket.off('service_updated', fetchFeatured)
      }
    }
  }, [retryCount])

  // Local filter operation
  const filteredFeatured = featuredServices.filter((vendor) => {
    if (selectedCategory && vendor.category?.slug !== selectedCategory && vendor.category?._id !== selectedCategory) return false
    if (selectedCity && vendor.location?.city?.toLowerCase() !== selectedCity.toLowerCase()) return false
    if (selectedPriceRange) {
      const price = vendor.basePrice || 0
      if (selectedPriceRange === 'under-50k' && price >= 50000) return false
      if (selectedPriceRange === '50k-1l' && (price < 50000 || price > 100000)) return false
      if (selectedPriceRange === 'above-1l' && price <= 100000) return false
    }
    if (selectedRating) {
      const avgRating = vendor.rating?.average || 0
      if (parseFloat(avgRating) < parseFloat(selectedRating)) return false
    }
    return true
  })

  useEffect(() => {
    dispatch(fetchVendors({ limit: 8, sortBy: 'rating' }))
    dispatch(fetchBlogs())
    dispatch(fetchTestimonials())
    dispatch(fetchHomeStats())
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories())
    }
    const timer = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_IMAGES.length), 5000)
    return () => clearInterval(timer)
  }, [dispatch, categories?.length])

  // Temporarily log API and categories state for deep console debugging
  useEffect(() => {
    // Removed debug logs
  }, [categories, loading, error]);

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (searchCity) params.set('city', searchCity)
    navigate(`/services?${params.toString()}`)
  }

  const displayTestimonials = testimonials && testimonials.length > 0 ? testimonials : DEMO_TESTIMONIALS

  return (
    <div className="overflow-hidden">
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background images */}
        {HERO_IMAGES.map((src, i) => {
          const isActive = i === heroIndex;
          const isNext = i === (heroIndex + 1) % HERO_IMAGES.length;
          if (!isActive && !isNext) return null;

          return (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-1000"
              style={{ opacity: isActive ? 1 : 0 }}
            >
              <img
                src={src}
                alt="Wedding"
                className="w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        {/* Decorative elements */}
        <div className="absolute top-20 left-8 text-4xl opacity-30 animate-bounce">🌸</div>
        <div className="absolute top-32 right-12 text-3xl opacity-20 animate-pulse">✨</div>
        <div className="absolute bottom-32 left-16 text-3xl opacity-20 animate-bounce delay-300">🪷</div>
        <div className="absolute bottom-20 right-8 text-4xl opacity-30 animate-pulse delay-500">💐</div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white text-[10px] font-black uppercase tracking-[0.3em] px-6 py-2.5 rounded-full mb-8 shadow-xl"
          >
            <span className="text-gold">✨</span>
            <span>One Platform, Endless Celebrations</span>
          </motion.div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight mb-6 text-shadow drop-shadow-2xl">
            {t('home.title', 'Find trusted wedding services for your special day')}
          </h1>

          <div className="mb-12">
            <h2 className="text-white text-xl sm:text-2xl md:text-4xl font-bold mb-4 drop-shadow-lg">{t('home.subtitle', 'Your dream wedding starts here')}</h2>
            <p className="text-white/90 text-base sm:text-lg md:text-2xl font-medium max-w-3xl mx-auto text-shadow leading-relaxed italic">
              Trusted vendors, smart planning tools aur seamless booking ke saath apni wedding journey ko simple banayein. <br className="hidden sm:block" />
              Apni shaadi ke liye top vendors, venues aur wedding services easily discover karein.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="bg-white rounded-[2rem] p-3 shadow-2xl flex flex-col md:flex-row gap-3 max-w-4xl mx-auto mb-10 border border-gold-100 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-400 via-pink-500 to-gold-400 opacity-50" />
            <div className="flex items-center gap-3 flex-1 px-4 py-2">
              <FiSearch className="text-[#C2185B] flex-shrink-0" size={22} />
              <input
                type="text"
                placeholder="Ex: Luxury Venues, Bridal Makeup..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full outline-none text-gray-800 placeholder-gray-400 font-medium text-base"
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-2 border-t md:border-t-0 md:border-l border-gray-100 min-w-[200px]">
              <FiMapPin className="text-[#C2185B] flex-shrink-0" size={20} />
              <select
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="outline-none text-gray-800 font-bold text-sm bg-transparent w-full cursor-pointer"
              >
                <option value="">All Bihar Cities</option>
                {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary whitespace-nowrap !rounded-2xl py-4 px-10 text-sm shine-effect">
              Vendors Dhundein
            </button>
          </form>

          {/* Quick category pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'Venues 🏛️', slug: 'venues' },
              { label: 'Catering 🍽️', slug: 'catering' },
              { label: 'Photography 📷', slug: 'photography' },
              { label: 'Makeup 💄', slug: 'bridal-makeup' },
              { label: 'Decoration ✨', slug: 'event-planners' },
              { label: 'Cab 🚗', slug: 'baraat-cabs' }
            ].map((item) => (
              <button
                key={item.slug}
                onClick={() => navigate(`/services?category=${item.slug}`)}
                className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-white transition-all shadow-lg active:scale-95"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50 animate-bounce">
          <span className="text-xs">Scroll</span>
          <div className="w-0.5 h-8 bg-white/30 rounded-full" />
        </div>
      </section>

      {/* ── Trust Stats ── */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-gray-50 to-white">
        <div className="absolute inset-0 floral-pattern opacity-[0.02]" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              {
                value: stats?.bookings || '10',
                suffix: '+',
                label: 'Happy Couples',
                icon: '💎',
                color: 'from-pink-500 to-[#C2185B]'
              },
              {
                value: stats?.vendors || '10',
                suffix: '+',
                label: 'Top Vendors',
                icon: '📍',
                color: 'from-[#D4AF37] to-yellow-600'
              },
              {
                value: stats?.cities || '1',
                suffix: '+',
                prefix: '',
                label: 'Cities Covered',
                icon: '🌍',
                color: 'from-blue-500 to-indigo-600'
              },
              {
                value: stats?.rating || '4',
                suffix: '/5',
                label: 'Customer Rating',
                icon: '⭐',
                color: 'from-purple-500 to-pink-600',
                decimals: 1
              },
            ].map((stat, idx) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Curated Services ── */}
      <section className="py-24 px-4 bg-[#FFF8F0]/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 md:w-[400px] md:h-[400px] bg-[#C2185B]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 md:w-[500px] md:h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-2 bg-white px-5 py-2 rounded-full border border-pink-100 shadow-sm mb-6">
              <span className="text-[#C2185B] font-black text-[10px] uppercase tracking-widest">💍 Curated For You</span>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-4">
              Apki Shaadi Ke Liye <br className="hidden md:block" />
              <span className="text-[#D4AF37] italic">Chuninda Services</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-gray-500 font-medium text-lg max-w-2xl mx-auto italic">
              Everything you need for a dream wedding, beautifully organized in one place. Explore our premium and trusted services.
            </motion.p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {loading ? (
              Array(12).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-4 p-8 bg-white rounded-[2rem] shadow-premium animate-pulse border border-gray-50"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl" />
                  <div className="h-4 w-20 bg-gray-100 rounded-full mx-auto" />
                  <div className="h-3 w-12 bg-gray-50 rounded-full mx-auto" />
                </div>
              ))
            ) : error ? (
              <div className="col-span-full py-12 px-6 bg-red-50/50 rounded-[2.5rem] border border-red-100 text-center max-w-lg mx-auto w-full">
                <div className="text-4xl mb-4 animate-bounce">⚠️</div>
                <h3 className="font-display font-black text-xl text-gray-900 mb-2">
                  Failed to Load Services
                </h3>
                <p className="text-sm text-gray-500 mb-6 font-medium">
                  {error || 'Could not fetch category details. Please try again.'}
                </p>
                <button
                  type="button"
                  onClick={() => dispatch(fetchCategories())}
                  className="bg-[#C2185B] hover:bg-[#8E244D] text-white font-bold py-3 px-8 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
                >
                  Retry Fetch
                </button>
              </div>
            ) : Array.isArray(categories) && categories.length > 0 ? (
              categories.map((cat, i) => (
                <Link
                  key={cat._id || i}
                  to={cat.slug ? `/services?category=${cat.slug}` : '#'}
                  className="flex flex-col items-center gap-4 p-8 bg-white rounded-[2rem] shadow-premium hover:shadow-premium-hover hover:-translate-y-1 hover:border-pink-200/50 transition-all duration-500 group text-center border border-gray-50 active:scale-95 cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-[#C2185B] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="w-20 h-20 bg-[#FFF8F0] rounded-2xl flex items-center justify-center text-5xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm">
                    {cat.icon || '✨'}
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 block mb-1 group-hover:text-[#C2185B] transition-colors break-words max-w-full">
                      {cat.name || '...'}
                    </span>
                    {cat.vendorCount >= 10 && (
                      <span className="text-[9px] font-bold text-gold bg-gold/5 px-2 py-0.5 rounded-full whitespace-nowrap block mt-1">
                        {cat.vendorCount} TOP VENDORS
                      </span>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-16 px-6 bg-white rounded-[2.5rem] border border-dashed border-gray-200 text-center max-w-lg mx-auto w-full">
                <div className="text-4xl mb-4">🏜️</div>
                <h3 className="font-display font-black text-xl text-gray-800 mb-2">
                  No Categories Available
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  We are currently organizing new categories for your wedding planning. Please check back shortly!
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 🌟 Top Picks - Featured Vendors ── */}
      <section className="relative py-32 px-4 bg-gradient-to-br from-[#FFF8F0] via-[#FDF2F8] to-[#FFF5F3] overflow-hidden">
        {/* Luxury Animated Orbs & Mesh */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#FF4D6D]/15 to-transparent rounded-full blur-[150px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-[#6A11CB]/10 to-transparent rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D4AF37]/5 rounded-full blur-[200px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/40 shadow-sm mb-6">
                <span className="text-[#C2185B] font-black text-[11px] uppercase tracking-[0.25em]">🌟 Top Picks</span>
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
                Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D6D] to-[#6A11CB] italic">Vendors</span>
              </motion.h2>
              <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-gray-500 font-medium text-lg md:text-xl mt-4 max-w-xl leading-relaxed">
                Discover our most loved and highly rated wedding professionals handpicked for exceptional service and unforgettable experiences.
              </motion.p>
            </div>
            <Link to="/services" className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1a1a1a] bg-white border-2 border-gray-100 px-8 py-4 rounded-[2rem] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all shadow-md hover:shadow-xl active:scale-95">
              Explore All Vendors <FiArrowRight />
            </Link>
          </div>

          {/* Elegant Filter Bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-6 shadow-premium border border-pink-50/50 mb-12 flex flex-wrap gap-4 items-center justify-between relative overflow-visible">
            <div className="flex flex-wrap gap-4 items-center flex-1">
              {/* Category Filter */}
              <div className="flex-1 min-w-[160px] relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-[1.5rem] px-5 py-4 text-xs font-black text-gray-700 uppercase tracking-widest outline-none hover:border-[#D4AF37] transition-all cursor-pointer appearance-none"
                >
                  <option value="">All Categories</option>
                  {Array.isArray(categories) && categories.map((cat) => (
                    <option key={cat._id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
              </div>

              {/* City Filter */}
              <div className="flex-1 min-w-[160px] relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-[1.5rem] px-5 py-4 text-xs font-black text-gray-700 uppercase tracking-widest outline-none hover:border-[#D4AF37] transition-all cursor-pointer appearance-none"
                >
                  <option value="">All Cities</option>
                  {INDIAN_CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
              </div>

              {/* Price Filter */}
              <div className="flex-1 min-w-[160px] relative">
                <select
                  value={selectedPriceRange}
                  onChange={(e) => setSelectedPriceRange(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-[1.5rem] px-5 py-4 text-xs font-black text-gray-700 uppercase tracking-widest outline-none hover:border-[#D4AF37] transition-all cursor-pointer appearance-none"
                >
                  <option value="">Any Budget</option>
                  <option value="under-50k">Under ₹50k</option>
                  <option value="50k-1l">₹50k - ₹1L</option>
                  <option value="above-1l">Above ₹1L</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
              </div>

              {/* Rating Filter */}
              <div className="flex-1 min-w-[160px] relative">
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-[1.5rem] px-5 py-4 text-xs font-black text-gray-700 uppercase tracking-widest outline-none hover:border-[#D4AF37] transition-all cursor-pointer appearance-none"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4.0+ Stars ⭐</option>
                  <option value="4.5">4.5+ Stars 🌟</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(selectedCategory || selectedCity || selectedPriceRange || selectedRating) && (
              <button
                onClick={() => {
                  setSelectedCategory('')
                  setSelectedCity('')
                  setSelectedPriceRange('')
                  setSelectedRating('')
                }}
                className="text-[10px] font-black text-[#C2185B] hover:text-[#8E244D] uppercase tracking-widest transition-colors py-4 px-6 hover:bg-pink-50 rounded-[1.5rem]"
              >
                Clear Filters
              </button>
            )}
          </motion.div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {featuredLoading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="w-full">
                  <SkeletonCard />
                </div>
              ))
            ) : featuredError ? (
              <div className="col-span-full py-20 px-6 bg-red-50/30 rounded-[3rem] border border-red-100 text-center max-w-2xl mx-auto w-full shadow-sm">
                <div className="text-5xl mb-6 animate-bounce">⚠️</div>
                <h3 className="font-display font-black text-3xl text-gray-900 mb-4">Connection Interrupted</h3>
                <p className="text-lg text-gray-600 mb-8 font-medium italic">We couldn't reach the servers to fetch our top vendors. Please try again.</p>
                <button
                  onClick={() => setRetryCount((c) => c + 1)}
                  className="bg-gradient-to-r from-red-600 to-red-800 text-white font-black py-4 px-10 rounded-[2rem] text-[10px] uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  Retry Connection
                </button>
              </div>
            ) : featuredServices.length === 0 ? (
              <div className="col-span-full py-24 px-6 bg-white/70 backdrop-blur-xl rounded-[3rem] border border-white shadow-xl text-center max-w-2xl mx-auto w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D6D]/5 to-[#6A11CB]/5 pointer-events-none" />
                <div className="text-5xl mb-6 relative z-10 animate-bounce">✨</div>
                <h3 className="font-display font-black text-3xl text-gray-900 mb-4 relative z-10">New verified vendors are being added daily.</h3>
                <p className="text-lg text-gray-500 font-medium mb-8 relative z-10">We are handpicking the best professionals for your dream wedding.</p>
                <Link to="/vendor-register" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF4D6D] to-[#6A11CB] text-white font-black py-4 px-10 rounded-full text-[11px] uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(255,77,109,0.3)] hover:shadow-[0_15px_30px_rgba(255,77,109,0.4)] hover:-translate-y-1 relative z-10">
                  Become a Vendor
                </Link>
              </div>
            ) : filteredFeatured.length === 0 ? (
              <div className="col-span-full py-24 px-6 bg-white/70 backdrop-blur-xl rounded-[3rem] border border-white shadow-xl text-center max-w-2xl mx-auto w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D6D]/5 to-[#6A11CB]/5 pointer-events-none" />
                <div className="text-5xl mb-6 relative z-10 animate-bounce">✨</div>
                <h3 className="font-display font-black text-3xl text-gray-900 mb-4 relative z-10">New verified vendors are being added daily.</h3>
                <p className="text-lg text-gray-500 font-medium mb-8 relative z-10">We couldn't find vendors matching your exact filters, but we are expanding rapidly.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('')
                    setSelectedCity('')
                    setSelectedPriceRange('')
                    setSelectedRating('')
                  }}
                  className="bg-white text-gray-900 border border-gray-200 font-black py-4 px-10 rounded-full text-[11px] uppercase tracking-widest transition-all shadow-sm hover:shadow-md hover:-translate-y-1 relative z-10 mb-4 mx-2"
                >
                  Clear Filters
                </button>
                <Link to="/vendor-register" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF4D6D] to-[#6A11CB] text-white font-black py-4 px-10 rounded-full text-[11px] uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(255,77,109,0.3)] hover:shadow-[0_15px_30px_rgba(255,77,109,0.4)] hover:-translate-y-1 relative z-10 mx-2">
                  Become a Vendor
                </Link>
              </div>
            ) : (
              filteredFeatured.slice(0, 8).map((v, idx) => (
                <motion.div
                  key={v._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <VendorCard vendor={v} />
                </motion.div>
              ))
            )}
          </div>

          <div className="text-center mt-16 md:hidden">
            <Link to="/services" className="inline-flex items-center justify-center gap-2 w-full text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-[#1a1a1a] to-[#2d2d2d] px-8 py-5 rounded-[2rem] hover:shadow-xl transition-all shadow-lg active:scale-95">
              Explore All Vendors <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ── ✨ PREMIUM BARAAT CABS FLAGSHIP FEATURE ── */}
      <section className="py-24 md:py-32 px-4 relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#C2185B]">
        {/* Luxury Background Elements */}
        <div className="absolute inset-0 floral-pattern opacity-[0.05]" />
        <div className="absolute top-0 right-0 w-80 h-80 md:w-[600px] md:h-[600px] bg-[#D4AF37]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-[#C2185B]/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-12 items-center">

            {/* Left Column: Text & Features */}
            <motion.div
              className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.4em] px-6 py-2.5 rounded-full mb-8 border border-white/20 shadow-xl">
                <span className="animate-pulse text-[#D4AF37] text-lg">✨</span> Special Feature
              </div>

              <h2 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tighter leading-tight drop-shadow-2xl">
                Baraat <span className="text-[#D4AF37] italic">Cabs</span>
              </h2>

              <p className="text-white/80 text-lg md:text-2xl font-medium italic mb-12 leading-relaxed max-w-2xl drop-shadow-md">
                Experience luxury and comfort for your wedding transport. From decorated sedans to luxury buses, perfectly coordinated for your grand celebration.
              </p>

              {/* Premium Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 w-full max-w-3xl">
                {[
                  { icon: '🎀', title: 'Decorated Fleet', desc: 'Premium cars dressed for the occasion' },
                  { icon: '👔', title: 'Professional Drivers', desc: 'Trained, verified & well-mannered' },
                  { icon: '📍', title: 'Real-Time Tracking', desc: 'Live updates & WhatsApp alerts' },
                  { icon: '💰', title: 'Bulk Booking', desc: 'Special rates on multi-vehicle fleets' },
                ].map((item, idx) => (
                  <motion.div
                    key={item.title}
                    className="flex items-start gap-5 p-5 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#B38D22] rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform flex-shrink-0">
                      {item.icon}
                    </div>
                    <div className="text-left mt-1">
                      <h4 className="font-bold text-white text-base tracking-wide">{item.title}</h4>
                      <p className="text-xs text-white/60 font-medium mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
                <Link to="/baraat-cabs" className="bg-gradient-to-r from-[#D4AF37] to-[#B38D22] text-gray-900 font-black text-xs uppercase tracking-[0.3em] py-5 px-10 rounded-[2rem] shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 w-full sm:w-auto">
                  Book Baraat Cabs <FiArrowRight size={18} />
                </Link>
                <Link to="/baraat-cabs" className="bg-white/10 backdrop-blur-md text-white border border-white/20 font-black text-xs uppercase tracking-[0.3em] py-5 px-10 rounded-[2rem] hover:bg-white/20 transition-all text-center w-full sm:w-auto">
                  Explore Fleet
                </Link>
              </div>
            </motion.div>

            {/* Right Column: Smart Booking Preview UI */}
            <motion.div
              className="lg:col-span-5 relative w-full max-w-md mx-auto lg:mx-0 mt-10 lg:mt-0"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: 'spring' }}
              viewport={{ once: true }}
            >
              {/* Floating Element 1 */}
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl z-20 flex items-center justify-center shadow-2xl animate-[bounce_4s_infinite]">
                <span className="text-4xl">🚕</span>
              </div>

              {/* Floating Element 2 */}
              <div className="absolute -bottom-6 -left-6 bg-gradient-to-r from-[#C2185B] to-[#8E244D] px-6 py-3 rounded-2xl z-20 shadow-xl border border-pink-400/30 animate-[bounce_5s_infinite_reverse]">
                <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live Pricing
                </p>
              </div>

              {/* Main Booking Card */}
              <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.4)] border border-white/40 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-[4rem] opacity-50" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                  <h3 className="font-display font-black text-2xl text-gray-900 tracking-tight">Quick Estimate</h3>
                  <span className="bg-[#FFF8F0] text-[#D4AF37] text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-[#D4AF37]/20">Smart UI</span>
                </div>

                <div className="space-y-6 relative z-10">
                  {/* Locations with connecting line */}
                  <div className="relative space-y-4">
                    <div className="absolute left-6 top-10 bottom-10 w-[2px] border-l-2 border-dashed border-gray-200" />

                    <div className="bg-gray-50 rounded-[1.5rem] p-4 flex items-center gap-4 border border-gray-100 group-hover:border-pink-100 transition-colors">
                      <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)] flex-shrink-0 z-10 ml-2" />
                      <div className="flex-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Pickup From</p>
                        <p className="font-bold text-gray-800 text-sm">Hotel Maurya, Patna</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-[1.5rem] p-4 flex items-center gap-4 border border-gray-100 group-hover:border-pink-100 transition-colors">
                      <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)] flex-shrink-0 z-10 ml-2" />
                      <div className="flex-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Drop To</p>
                        <p className="font-bold text-gray-800 text-sm">Darbhanga, Bihar</p>
                      </div>
                    </div>
                  </div>

                  {/* Date & Vehicle */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-[1.5rem] p-4 border border-gray-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Date & Time</p>
                      <p className="font-bold text-gray-800 text-xs">24 Nov, 6:00 PM</p>
                    </div>
                    <div className="bg-gray-50 rounded-[1.5rem] p-4 border border-gray-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Vehicle</p>
                      <p className="font-bold text-gray-800 text-xs">Scorpio </p>
                    </div>
                  </div>

                  {/* Fare & Button */}
                  <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Estimated Fare</p>
                      <p className="font-display font-black text-3xl text-gray-900 tracking-tighter">₹3000</p>
                    </div>
                    <Link to="/baraat-cabs" className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-xl hover:bg-[#C2185B] hover:rotate-12 transition-all cursor-pointer">
                      <FiArrowRight size={24} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Why ShaadiSaathi Premium ── */}
      <section className="relative py-32 px-4 overflow-hidden bg-[#FFF8F0]">
        {/* Luxury Background Mesh & Blur Circles */}
        <div className="absolute inset-0 floral-pattern opacity-[0.03]" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[#FF4D6D]/10 to-[#6A11CB]/10 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#D4AF37]/10 to-[#FF4D6D]/10 rounded-full blur-[150px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center justify-center gap-2 bg-white/60 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/40 shadow-sm mb-6">
              <span className="text-[#C2185B] font-black text-[11px] uppercase tracking-[0.25em]">💍 Why Choose ShaadiSaathi?</span>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
              Bihar Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D6D] to-[#6A11CB] italic">Wedding Marketplace</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-gray-500 font-medium text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Helping couples discover and book trusted wedding services with absolute confidence.
            </motion.p>
          </div>

          {/* Stats Row Above Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 md:gap-8 mb-20"
          >
            {[
              { icon: '🏆', text: '50+ Verified Vendors' },
              { icon: '👰', text: '10+ Happy Couples' },
              { icon: '⭐', text: '4 Average Rating' },
              { icon: '📍', text: 'Available Across Bihar' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/60 backdrop-blur-xl border border-white/50 px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(255,77,109,0.1)] transition-all duration-300 hover:-translate-y-1">
                <span className="text-xl">{stat.icon}</span>
                <span className="text-gray-800 font-bold text-sm md:text-base">{stat.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🛡️', title: 'Verified Vendors', desc: 'Every vendor is manually reviewed and verified by our expert team to ensure premium quality.' },
              { icon: '🔒', title: 'Secure Booking', desc: 'Safe and transparent booking process. Your payments are 100% protected on our platform.' },
              { icon: '💰', title: 'Best Price Guarantee', desc: 'Competitive pricing with no hidden charges. Get the best value for your dream wedding.' },
              { icon: '💬', title: 'Instant WhatsApp Support', desc: 'Quick assistance whenever you need help. Connect directly with our wedding experts.' },
              { icon: '⭐', title: 'Trusted Reviews', desc: 'Real customer ratings and genuine experiences from verified couples who booked through us.' },
              { icon: '🎉', title: 'All Services in One Place', desc: 'Photography, Catering, Decoration, Mehndi, Venue, Pandit, DJ, Makeup Artist, Tent House and Baraat Cabs.' },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="group relative h-full"
              >
                {/* Gradient Border Illusion using Before */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D6D] to-[#6A11CB] rounded-[32px] opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-md" />

                <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-10 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(255,77,109,0.15)] hover:-translate-y-2 transition-all duration-500 h-full flex flex-col relative overflow-hidden z-10">
                  {/* Subtle Hover Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D6D]/5 to-[#6A11CB]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Animated Icon Circle */}
                  <div className="w-20 h-20 bg-gradient-to-br from-[#FF4D6D] to-[#FF758F] rounded-full flex items-center justify-center text-4xl text-white shadow-[0_10px_20px_rgba(255,77,109,0.3)] mb-8 relative z-10 group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-500">
                    {feature.icon}
                  </div>

                  <h3 className="font-display font-black text-2xl text-gray-900 mb-4 relative z-10 group-hover:text-[#FF4D6D] transition-colors">{feature.title}</h3>
                  <p className="text-gray-500 text-base font-medium leading-relaxed relative z-10">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Wedding Showcase Sections ── */}
      <WeddingGallery />
      <RealWeddingStories />

      {/* ── Premium Blog Content Hub ── */}
      <section className="py-32 px-4 relative overflow-hidden bg-[#FAFAFA]">
        {/* Soft Pink Gradient Mesh Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-[#ffb6c1]/20 to-transparent rounded-full blur-[150px] pointer-events-none mix-blend-multiply" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-gradient-to-tr from-[#9b5de5]/15 to-transparent rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
          <div className="absolute top-[40%] left-[20%] w-[500px] h-[500px] bg-gradient-to-r from-[#D4AF37]/20 to-transparent rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute inset-0 floral-pattern opacity-[0.03]" />
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Social Proof Above Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4 md:gap-8 mb-16"
          >
            {[
              { icon: '📚', text: '100+ Wedding Guides' },
              { icon: '👰', text: 'Trusted by Couples' },
              { icon: '⭐', text: 'Expert Advice' },
              { icon: '🎯', text: 'Planning Resources' }
            ].map((proof, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/80">
                <span className="text-xl">{proof.icon}</span>
                <span className="text-gray-800 font-bold text-xs uppercase tracking-widest">{proof.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C2185B]/10 to-[#D4AF37]/10 border border-[#C2185B]/20 px-4 py-2 rounded-full mb-6">
              <span className="text-xl">📰</span>
              <span className="text-[#C2185B] text-[10px] font-black uppercase tracking-[0.2em]">Latest From Our Blog</span>
            </motion.div>

            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="font-display text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tight leading-tight mb-8">
              Wedding Tips, Inspiration & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C2185B] via-[#8E244D] to-[#D4AF37] italic">Expert Advice</span>
            </motion.h2>

            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-gray-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
              Discover the latest wedding trends, planning tips, vendor guides, budgeting advice, and inspiration for your dream wedding.
            </motion.p>
          </div>

          {blogs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
              {/* Featured Large Blog */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="lg:col-span-7 h-full"
              >
                {blogs[0] && (
                  <Link to={`/blog/${blogs[0].slug || blogs[0]._id}`} className="group block h-full bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_80px_rgba(194,24,91,0.15)] border border-white hover:border-[#C2185B]/20 transition-all duration-700 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white pointer-events-none opacity-50 z-0" />

                    {/* Featured Ribbon */}
                    <div className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-gradient-to-r from-[#FF4D6D] to-[#C2185B] text-white px-5 py-2.5 rounded-full shadow-lg shadow-pink-500/30">
                      <span className="text-sm">🔥</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Featured Article</span>
                    </div>

                    <div className="h-[450px] overflow-hidden relative z-10 rounded-[2.5rem] m-2">
                      <img src={optimizeImage(blogs[0].coverImage, 1000)} alt={blogs[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />

                      <div className="absolute bottom-8 left-8 right-8 text-white">
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/80 mb-4">
                          <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white">
                            {blogs[0].category || 'Trending'}
                          </span>
                          <span className="flex items-center gap-1.5"><FiCalendar /> {new Date(blogs[0].createdAt || blogs[0].date).toLocaleDateString()}</span>
                          <span className="w-1 h-1 bg-white/50 rounded-full" />
                          <span className="flex items-center gap-1.5"><FiClock /> {blogs[0].readTime || '5 min read'}</span>
                        </div>
                        <h3 className="font-display font-black text-4xl lg:text-5xl text-white group-hover:text-pink-100 transition-colors leading-tight drop-shadow-xl mb-4">
                          {blogs[0].title}
                        </h3>
                        <p className="text-white/80 text-lg line-clamp-2 max-w-2xl font-medium leading-relaxed">
                          {blogs[0].excerpt || blogs[0].description || 'Discover everything you need to know about planning your dream wedding with our expert insights and tips.'}
                        </p>
                      </div>
                    </div>

                    <div className="p-8 relative z-10 flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-100 flex items-center justify-center">
                          {blogs[0].author?.avatar ? (
                            <img src={blogs[0].author.avatar} alt="Author" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-black text-[#C2185B] text-lg">{blogs[0].author?.name?.charAt(0) || 'W'}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Written By</p>
                          <p className="text-base font-bold text-gray-900">{blogs[0].author?.name || 'Wedding Expert'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 ml-auto">
                        <div className="hidden sm:flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                          <FiEye size={16} /> {blogs[0].views || Math.floor(Math.random() * 5000) + 1000} Views
                        </div>
                        <button className="bg-gray-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] group-hover:bg-[#C2185B] transition-colors shadow-xl group-hover:shadow-pink-500/30 flex items-center gap-2">
                          Read Article <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </Link>
                )}
              </motion.div>

              {/* Secondary Blogs List */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {blogs.slice(1, 4).map((blog, i) => (
                  <motion.div
                    key={blog._id || i}
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + (i * 0.15), duration: 0.6, ease: "easeOut" }}
                    className="flex-1"
                  >
                    <Link to={`/blog/${blog.slug || blog._id}`} className="group flex flex-col sm:flex-row bg-white/70 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(194,24,91,0.12)] border border-white hover:border-pink-100 transition-all duration-500 h-full">
                      <div className="sm:w-[40%] h-56 sm:h-auto overflow-hidden relative m-2 rounded-[1.5rem]">
                        <img src={optimizeImage(blog.coverImage, 400)} alt={blog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute top-3 left-3">
                          <span className="bg-white/90 backdrop-blur-md text-[#C2185B] px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm">
                            {blog.category || 'Inspiration'}
                          </span>
                        </div>
                      </div>
                      <div className="sm:w-[60%] p-6 flex flex-col justify-center relative">
                        <div className="flex items-center gap-3 text-gray-400 text-[8px] font-black uppercase tracking-widest mb-3">
                          <span className="flex items-center gap-1.5 text-[#C2185B]"><FiClock size={10} /> {blog.readTime || '3 min'}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full" />
                          <span>{new Date(blog.createdAt || blog.date).toLocaleDateString()}</span>
                        </div>

                        <h3 className="font-display font-black text-xl text-gray-900 group-hover:text-[#C2185B] transition-colors leading-tight mb-3 line-clamp-2">
                          {blog.title}
                        </h3>

                        <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-4">
                          {blog.excerpt || blog.description}
                        </p>

                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                              {blog.author?.avatar ? <img src={blog.author.avatar} alt="Author" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-500 bg-gray-100">{blog.author?.name?.charAt(0) || 'W'}</div>}
                            </div>
                            <span className="text-[10px] font-bold text-gray-600">{blog.author?.name || 'Expert'}</span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-[#C2185B] group-hover:bg-[#C2185B] group-hover:text-white transition-all shadow-sm">
                            <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty State */
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="max-w-2xl mx-auto py-20 px-8 text-center bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-[0_20px_60px_rgb(0,0,0,0.05)] border border-white">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-50 to-purple-50 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner border border-white">
                ✨
              </div>
              <h3 className="font-display font-black text-3xl text-gray-900 mb-4">Premium Content Hub</h3>
              <p className="text-gray-500 font-medium text-lg mb-8 leading-relaxed">Our editorial team is crafting world-class wedding guides, inspiration, and expert tips. Stay tuned for breathtaking content.</p>
              <div className="inline-flex items-center gap-2 bg-[#C2185B] text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-xl shadow-xl shadow-pink-500/20">
                Coming Soon
              </div>
            </motion.div>
          )}

          {/* Bottom CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-16 text-center border-t border-gray-200/50 pt-12 flex flex-col md:flex-row items-center justify-center gap-6"
          >
            <div className="text-left md:mr-8 hidden md:block">
              <p className="text-gray-900 font-display font-black text-2xl mb-1">✨ Explore More Insights</p>
              <p className="text-gray-500 text-sm font-medium">Join 10+ couples reading our guides.</p>
            </div>

            <Link to="/blog" className="w-full md:w-auto bg-gray-900 text-white px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] hover:-translate-y-1">
              View All Articles
            </Link>

            <Link to="/services" className="w-full md:w-auto bg-white text-gray-900 border-2 border-gray-100 px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:border-[#C2185B] hover:text-[#C2185B] transition-all hover:shadow-[0_10px_30px_rgba(194,24,91,0.1)] hover:-translate-y-1">
              Start Planning Your Wedding
            </Link>
          </motion.div>

        </div>
      </section>

      {/* ── Happy Couples Showcase ── */}
      <HappyCouples />

      {/* ── Vendor CTA ── */}
      <section className="py-14 px-4 bg-gray-950 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="text-5xl mb-4 block">💼</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
            Are You a Wedding Vendor?
          </h2>
          <p className="text-gray-400 mb-8">
            Join 10 vendors growing their business on ShaadiSaathi. Get leads, bookings, and build your brand.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register/vendor" className="btn-primary">
              Register as Vendor
            </Link>
            <Link to="/about" className="btn-outline border-gray-600 text-gray-300 hover:bg-gray-800">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
