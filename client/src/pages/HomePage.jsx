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
import { INDIAN_CITIES, optimizeImage } from '../utils/helpers'
import { FiSearch, FiMapPin, FiArrowRight, FiCheck, FiUsers, FiStar, FiAward, FiMessageCircle, FiCheckCircle, FiCalendar } from 'react-icons/fi'
import api from '../utils/api'
import { getSocket } from '../utils/socket'
import { useTranslation } from 'react-i18next'


const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1587271636175-90d58cdad458?auto=format&fit=crop&w=1200&q=70', // Wedding Mandap
  'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?auto=format&fit=crop&w=1200&q=70', // Indian Bride
  'https://plus.unsplash.com/premium_photo-1682092018999-2c8fcfe944f3?auto=format&fit=crop&w=1200&q=70', // Palace Wedding
]



const STATS = [
  { value: '10', label: 'Happy Couples', icon: '💑' },
  { value: '10', label: 'Verified Vendors', icon: '✅' },
  { value: '5', label: 'Cities Covered', icon: '🗺️' },
  { value: '3/5', label: 'Average Rating', icon: '⭐' },
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
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const count = useMotionValue(0)
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (inView) {
      const controls = animate(count, stat.value, {
        duration: 2.5,
        ease: "easeOut",
        onUpdate: (val) => {
          if (stat.decimals) {
            setDisplayValue(val.toFixed(stat.decimals))
          } else {
            setDisplayValue(Math.floor(val))
          }
        }
      })
      return controls.stop
    }
  }, [inView, count, stat.value, stat.decimals])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-2 relative overflow-hidden"
    >
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="text-4xl mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 drop-shadow-sm">
        {stat.icon}
      </div>
      <div className="font-display text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2 flex items-baseline justify-center">
        {stat.prefix}
        {displayValue}
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
                value: stats?.bookings || 0,
                suffix: '+',
                label: 'Happy Couples',
                icon: '💎',
                color: 'from-pink-500 to-[#C2185B]'
              },
              {
                value: stats?.vendors || 0,
                suffix: '+',
                label: 'Top Vendors',
                icon: '📍',
                color: 'from-[#D4AF37] to-yellow-600'
              },
              {
                value: stats?.cities || 0,
                suffix: '',
                prefix: '0',
                label: 'Cities Covered',
                icon: '🌍',
                color: 'from-blue-500 to-indigo-600'
              },
              {
                value: parseFloat(stats?.rating) || 0,
                suffix: '/5',
                label: 'User Rating',
                icon: '⭐',
                color: 'from-purple-500 to-pink-600',
                decimals: 1
              },
            ].map((stat, idx) => (
              <StatCard key={stat.label} stat={stat} delay={idx * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Curated Services ── */}
      <section className="py-24 px-4 bg-[#FFF8F0]/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#C2185B]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />

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
                    {cat.vendorCount >= 0 && (
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
      <section className="relative py-24 px-4 bg-[#FFF8F0]/30 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#C2185B]/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-2 bg-white px-5 py-2 rounded-full border border-[#D4AF37]/20 shadow-sm mb-6">
                <span className="text-[#D4AF37] font-black text-[10px] uppercase tracking-widest">🌟 Top Picks</span>
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
                Featured <span className="text-[#C2185B] italic">Vendors</span>
              </motion.h2>
              <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-gray-500 font-medium text-lg mt-4 italic max-w-xl">
                Discover India's most trusted, premium wedding professionals handpicked just for you.
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
              <div className="col-span-full py-20 px-6 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-dashed border-gray-200 text-center max-w-2xl mx-auto w-full">
                <div className="text-5xl mb-6">✨</div>
                <h3 className="font-display font-black text-3xl text-gray-900 mb-4">Curating Top Vendors</h3>
                <p className="text-lg text-gray-500 font-medium italic">We are currently handpicking the best vendors for this section.</p>
              </div>
            ) : filteredFeatured.length === 0 ? (
              <div className="col-span-full py-20 px-6 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-dashed border-gray-200 text-center max-w-2xl mx-auto w-full">
                <div className="text-5xl mb-6">🔍</div>
                <h3 className="font-display font-black text-3xl text-gray-900 mb-4">No Vendors Found</h3>
                <p className="text-lg text-gray-500 font-medium italic mb-8">We couldn't find any premium vendors matching your exact filters.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('')
                    setSelectedCity('')
                    setSelectedPriceRange('')
                    setSelectedRating('')
                  }}
                  className="bg-gradient-to-r from-[#C2185B] to-[#8E244D] text-white font-black py-4 px-10 rounded-[2rem] text-[10px] uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  Clear All Filters
                </button>
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
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C2185B]/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

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
                <Link to="/cab-booking" className="bg-gradient-to-r from-[#D4AF37] to-[#B38D22] text-gray-900 font-black text-xs uppercase tracking-[0.3em] py-5 px-10 rounded-[2rem] shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 w-full sm:w-auto">
                  Book Baraat Cabs <FiArrowRight size={18} />
                </Link>
                <Link to="/cab-booking" className="bg-white/10 backdrop-blur-md text-white border border-white/20 font-black text-xs uppercase tracking-[0.3em] py-5 px-10 rounded-[2rem] hover:bg-white/20 transition-all text-center w-full sm:w-auto">
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
                    <Link to="/cab-booking" className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-xl hover:bg-[#C2185B] hover:rotate-12 transition-all cursor-pointer">
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
      <section className="relative py-24 px-4 bg-gradient-to-b from-white via-[#FFF8F0]/30 to-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#C2185B]/5 rounded-full blur-[150px] -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[150px] translate-y-1/2" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center justify-center gap-2 bg-white px-5 py-2 rounded-full border border-pink-100 shadow-sm mb-6">
              <span className="text-[#C2185B] font-black text-[10px] uppercase tracking-widest">💍 Why ShaadiSaathi?</span>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Sab Kuch Jo Chahiye, <br className="hidden md:block" />
              <span className="text-[#C2185B] italic">Ek Hi Jagah</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-gray-500 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
              Experience the future of wedding planning. From luxury baraat cabs to smart AI budgeting, we manage every single detail in one beautiful platform.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: 1, icon: '🚖', title: 'Baraat Cabs', desc: 'Premium luxury cars and bulk buses for your wedding baraat.', link: '/cab-booking' },
              { id: 2, icon: '📸', title: 'Photography', desc: 'Candid & traditional photographers to capture your best moments.', link: '/services?category=photography' },
              { id: 3, icon: '🏰', title: 'Wedding Venues', desc: 'Book the most luxurious palaces, banquets, and resorts.', link: '/services?category=venues' },
              { id: 4, icon: '🍲', title: 'Premium Catering', desc: 'Delicious multi-cuisine catering for your grand feast.', link: '/services?category=catering' },
              { id: 5, icon: '🌸', title: 'Decoration', desc: 'Elegant floral and thematic decor to light up your special day.', link: '/services?category=decoration' },
              { id: 6, icon: '✨', title: 'Mehndi Artists', desc: 'Professional artists for intricate and beautiful bridal mehndi.', link: '/services?category=mehndi-artists' },
              { id: 7, icon: '🤖', title: 'AI Wedding Planner', desc: 'Smart AI assistant to organize and plan your entire wedding timeline.', link: '/ai-planner' },
              { id: 8, icon: '💰', title: 'Budget Planning', desc: 'Intelligent budget analytics to optimize your wedding expenses.', link: '/budget-calculator' }
            ].map((feature, idx) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(194,24,91,0.08)] hover:-translate-y-2 transition-all duration-300 relative overflow-hidden flex flex-col"
              >
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-pink-50 to-gold-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mb-6 relative z-10 group-hover:rotate-6 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-display font-black text-xl text-gray-900 mb-3 relative z-10">{feature.title}</h3>
                <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8 flex-grow relative z-10">{feature.desc}</p>

                <Link to={feature.link} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#C2185B] hover:text-[#8E244D] transition-colors relative z-10">
                  Explore <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16 bg-gradient-to-r from-[#1a1a1a] to-[#2d2d2d] rounded-[2rem] p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-gray-800">
            <div>
              <h3 className="font-display font-black text-2xl text-white mb-2">Trusted by {stats?.bookings || 0}+ Couples in Bihar</h3>
              <p className="text-gray-400 font-medium text-sm flex items-center gap-2">
                <FiCheckCircle className="text-[#D4AF37]" /> Verified Vendors • Secure Payments • 24/7 Support
              </p>
            </div>
            <Link to="/services" className="shrink-0 bg-white text-[#1a1a1a] px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Explore All Services
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Wedding Inspiration (Blogs) ── */}
      <section className="py-24 px-4 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-50/50 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
            <div className="text-center md:text-left">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-2 bg-pink-50 px-4 py-1.5 rounded-full border border-pink-100 mb-4">
                <span className="text-[#C2185B] font-black text-[9px] uppercase tracking-widest">💍 Wedding Inspiration</span>
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="font-display text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                Latest From <span className="text-[#C2185B] italic">Our Blog</span>
              </motion.h2>
            </div>
            <Link to="/blog" className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-900 border-2 border-gray-100 px-6 py-3 rounded-full hover:border-[#C2185B] hover:text-[#C2185B] transition-all">
              View All Inspiration <FiArrowRight />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {blogs.length > 0 ? blogs.slice(0, 3).map((blog, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
              >
                <Link to={`/blog/${blog.slug || blog._id}`} className="group block bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(194,24,91,0.12)] border border-gray-100 flex flex-col h-full hover:-translate-y-2 transition-all duration-500">
                  <div className="h-64 overflow-hidden relative">
                    <img src={optimizeImage(blog.coverImage, 400)} alt={blog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-[#C2185B] shadow-sm border border-white/50">
                      {blog.category || 'Wedding Tips'}
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <p className="text-[#D4AF37] text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FiCalendar size={12} /> {new Date(blog.createdAt || blog.date).toLocaleDateString()}
                    </p>
                    <h3 className="font-display font-black text-2xl text-gray-900 group-hover:text-[#C2185B] transition-colors leading-snug mb-4">
                      {blog.title}
                    </h3>
                    <div className="mt-auto border-t border-gray-50 pt-5 flex items-center justify-between">
                      <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Read Article</span>
                      <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-[#C2185B] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors">
                        <FiArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )) : (
              <div className="col-span-full py-16 text-center bg-[#FFF8F0]/50 rounded-[3rem] border border-dashed border-pink-100">
                <p className="text-gray-500 font-medium italic">New inspiration and blogs coming soon!</p>
              </div>
            )}
          </div>

          <div className="mt-12 text-center md:hidden">
            <Link to="/blog" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#C2185B] border-2 border-pink-100 px-8 py-4 rounded-full hover:bg-pink-50 transition-all">
              View All Inspiration <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-4 bg-gradient-to-b from-[#FFF8F0] to-white relative overflow-hidden">
        <div className="absolute inset-0 floral-pattern opacity-[0.03] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-[#C2185B] text-xl mb-4 block animate-bounce">✨</span>
            <p className="text-[#D4AF37] font-black text-[10px] uppercase tracking-[0.3em] mb-4">Real experiences from families who trusted ShaadiSaathi.</p>
            <h2 className="text-4xl md:text-5xl font-display font-black text-gray-900 tracking-tighter mb-4">
              Happy <span className="text-[#C2185B]">Couples</span> ❤️
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#D4AF37] to-[#C2185B] mx-auto rounded-full" />
          </div>

          <div className="px-4 md:px-12 relative">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 animate-pulse">
                    <div className="w-24 h-4 bg-gray-200 rounded mb-6" />
                    <div className="h-20 bg-gray-100 rounded-xl mb-8" />
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gray-200" />
                      <div className="space-y-3">
                        <div className="w-24 h-3 bg-gray-200 rounded" />
                        <div className="w-16 h-2 bg-gray-100 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayTestimonials.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200 shadow-sm">
                <FiMessageCircle className="mx-auto text-5xl text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Testimonials Yet</h3>
                <p className="text-gray-500 font-medium">Hear what couples have to say about us soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayTestimonials.map((t, idx) => (
                  <div key={idx} className="bg-white h-full rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 border border-gray-100 flex flex-col group hover:-translate-y-2">
                    <div className="flex justify-between items-start mb-6">
                      <StarRating rating={t.rating} size="sm" showCount={false} />
                      <span className="text-6xl text-[#FFF8F0] font-display leading-none rotate-180 inline-block h-8 font-black">"</span>
                    </div>

                    <p className="text-gray-600 text-base leading-relaxed mb-8 italic flex-grow line-clamp-4 group-hover:line-clamp-none transition-all duration-500">
                      "{t.text}"
                    </p>

                    <div className="flex items-center gap-4 mt-auto pt-6 border-t border-gray-50">
                      <div className="relative">
                        <img
                          src={optimizeImage(t.image, 100) || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=FFF8F0&color=C2185B`}
                          alt={t.name}
                          className="w-14 h-14 rounded-full object-cover shadow-md border-2 border-white"
                          loading="lazy"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                          {t.city} • {t.date}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

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
