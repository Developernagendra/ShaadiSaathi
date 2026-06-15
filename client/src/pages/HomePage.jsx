import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCategories } from '../store/slices/vendorSlice'
import { motion } from 'framer-motion'
import VendorCard from '../components/vendor/VendorCard'
import { SkeletonCard } from '../components/common/Skeleton'
import PackageSection from '../components/packages/PackageSection'
import { INDIAN_CITIES } from '../utils/helpers'
import { FiSearch, FiMapPin, FiArrowRight } from 'react-icons/fi';
import { FaCrown, FaCheckCircle } from 'react-icons/fa';
import api from '../utils/api'
import { getSocket } from '../utils/socket'
import { useTranslation } from 'react-i18next'

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1587271636175-90d58cdad458?auto=format&fit=crop&w=1200&q=70', // Wedding Mandap
  'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?auto=format&fit=crop&w=1200&q=70', // Indian Bride
  'https://plus.unsplash.com/premium_photo-1682092018999-2c8fcfe944f3?auto=format&fit=crop&w=1200&q=70', // Palace Wedding
]

const STATIC_SERVICES = [
  { name: 'Photography', icon: '📷', slug: 'photography' },
  { name: 'Catering', icon: '🍽️', slug: 'catering' },
  { name: 'Decoration', icon: '✨', slug: 'event-planners' },
  { name: 'Venue', icon: '🏛️', slug: 'venues' },
  { name: 'Mehndi', icon: '✋', slug: 'mehndi' },
  { name: 'Makeup Artist', icon: '💄', slug: 'bridal-makeup' },
  { name: 'Tent House', icon: '🎪', slug: 'tent-house' },
  { name: 'Pandit', icon: '🕉️', slug: 'pandit' },
  { name: 'DJ', icon: '🎵', slug: 'dj' },
  { name: 'Baraat Cabs', icon: '🚗', slug: 'baraat-cabs' }
]

const WHY_US_CARDS = [
  { icon: '🛡️', title: 'Verified Vendors', desc: 'Every vendor is manually reviewed and verified by our expert team to ensure premium quality.' },
  { icon: '🔒', title: 'Secure Booking', desc: 'Safe and transparent booking process. Your payments are 100% protected on our platform.' },
  { icon: '💰', title: 'Best Price Guarantee', desc: 'Competitive pricing with no hidden charges. Get the best value for your dream wedding.' },
  { icon: '💬', title: 'WhatsApp Support', desc: 'Quick assistance whenever you need help. Connect directly with our wedding experts.' }
]

export default function HomePage() {
  const { t } = useTranslation?.() || { t: (key) => key };
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { categories = [] } = useSelector((s) => s.vendor || {})

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
      const { data } = await api.get('/vendors/featured')
      setFeaturedServices(data.vendors || data.data || [])
    } catch (err) {
      console.error("Failed to load featured vendors:", err);
      setFeaturedError(true)
    } finally {
      setFeaturedLoading(false)
    }
  }

  useEffect(() => {
    fetchFeatured()
    const socket = getSocket()
    if (socket) {
      socket.on('service_updated', fetchFeatured)
    }
    return () => {
      if (socket) socket.off('service_updated', fetchFeatured)
    }
  }, [retryCount])

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
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories())
    }
    const timer = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_IMAGES.length), 5000)
    return () => clearInterval(timer)
  }, [dispatch, categories?.length])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (searchCity) params.set('city', searchCity)
    navigate(`/services?${params.toString()}`)
  }

  return (
    <div className="w-full max-w-[100vw] overflow-hidden overflow-x-hidden">
      {/* ── 1. Hero Section ── */}
      <section className="relative h-[75vh] min-h-[500px] flex items-center justify-center">
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

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-24 md:pt-32 pb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.3em] px-4 sm:px-6 py-2.5 rounded-full mb-6 shadow-xl"
          >
            <span className="text-gold">✨</span>
            <span>{t('home.premium_marketplace', 'Premium Wedding Marketplace')}</span>
          </motion.div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white leading-tight mb-4 text-shadow drop-shadow-2xl">
            {t('home.title', 'Find Trusted Wedding Services For Your Special Day')}
          </h1>

          <div className="mb-10">
            <p className="text-white/90 text-sm sm:text-base md:text-xl font-medium max-w-2xl mx-auto text-shadow leading-relaxed italic">
              {t('home.subtitle', 'Trusted vendors, smart planning tools aur seamless booking ke saath apni wedding journey ko simple banayein.')}
            </p>
          </div>

          <form onSubmit={handleSearch} className="bg-white rounded-[2rem] p-3 shadow-2xl flex flex-col md:flex-row gap-3 max-w-4xl w-full mx-auto mb-8 border border-gold-100 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-400 via-pink-500 to-gold-400 opacity-50" />
            <div className="flex items-center gap-3 flex-1 px-4 py-2 w-full">
              <FiSearch className="text-[#C2185B] flex-shrink-0" size={22} />
              <input
                type="text"
                placeholder="Ex: Luxury Venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full outline-none text-gray-800 placeholder-gray-400 font-medium text-base min-w-0"
              />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3 px-4 py-2 border-t md:border-t-0 md:border-l border-gray-100 w-full md:w-auto md:min-w-[200px]">
              <div className="flex items-center gap-3 w-full">
                <FiMapPin className="text-[#C2185B] flex-shrink-0" size={20} />
                <select
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="outline-none text-gray-800 font-bold text-sm bg-transparent w-full cursor-pointer min-w-0"
                >
                  <option value="">All Cities</option>
                  {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary whitespace-nowrap !rounded-2xl py-4 px-10 text-sm shine-effect w-full md:w-auto flex-shrink-0">
              Find Vendors
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'Venues 🏛️', slug: 'venues' },
              { label: 'Catering 🍽️', slug: 'catering' },
              { label: 'Photography 📷', slug: 'photography' },
              { label: 'Makeup 💄', slug: 'bridal-makeup' }
            ].map((item) => (
              <button
                key={item.slug}
                onClick={() => navigate(`/services?category=${item.slug}`)}
                className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-4 sm:px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-white transition-all shadow-lg active:scale-95"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Services Section ── */}
      <section className="py-10 md:py-16 lg:py-24 px-4 bg-[#FFF8F0]/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 md:w-[400px] md:h-[400px] bg-[#C2185B]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 md:w-[500px] md:h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 md:mb-12">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-display text-2xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-2 md:mb-4">
              {t('home.explore', 'Explore')} <span className="text-[#D4AF37] italic">{t('home.wedding_services', 'Wedding Services')}</span>
            </motion.h2>
          </div>

          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 snap-x snap-mandatory scrollbar-hide">
            {STATIC_SERVICES.map((service, i) => (
              <Link
                key={service.slug}
                to={`/services?category=${service.slug}`}
                className="flex flex-col items-center gap-3 p-5 md:p-6 bg-white rounded-[1.5rem] shadow-sm hover:shadow-premium hover:-translate-y-1 hover:border-pink-200/50 transition-all duration-300 group text-center border border-gray-100 active:scale-95 relative overflow-hidden min-w-[140px] md:min-w-0 snap-start shrink-0"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-[#C2185B] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="w-14 h-14 md:w-16 md:h-16 bg-[#FFF8F0] rounded-2xl flex items-center justify-center text-2xl md:text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  {service.icon}
                </div>
                <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.15em] text-gray-900 group-hover:text-[#C2185B] transition-colors break-words">
                  {service.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Featured Vendors ── */}
      <section className="relative py-10 md:py-16 lg:py-24 px-4 bg-gradient-to-br from-[#FFF8F0] via-[#FDF2F8] to-[#FFF5F3] overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-10 gap-6">
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 shadow-sm mb-3 md:mb-4">
                <span className="text-[#C2185B] font-black text-[10px] uppercase tracking-[0.25em]">🌟 Top Picks</span>
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="font-display text-2xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                {t('home.featured', 'Featured')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D6D] to-[#6A11CB] italic">{t('home.vendors', 'Vendors')}</span>
              </motion.h2>
            </div>
            <Link to="/services" className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white bg-gray-900 px-6 py-3 rounded-full hover:bg-[#C2185B] transition-all shadow-md active:scale-95">
              View All Vendors <FiArrowRight />
            </Link>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-white/80 backdrop-blur-md rounded-[1.5rem] p-3 shadow-sm border border-pink-50 mb-6 flex flex-col sm:flex-row gap-3 items-center w-full max-w-full">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-700 outline-none w-full sm:flex-1">
              <option value="">All Categories</option>
              {categories.map((cat) => <option key={cat._id} value={cat.slug}>{cat.name}</option>)}
            </select>
            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-700 outline-none w-full sm:flex-1">
              <option value="">All Cities</option>
              {INDIAN_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredLoading ? (
              Array(6).fill(0).map((_, i) => <div key={i}><SkeletonCard /></div>)
            ) : filteredFeatured.length === 0 ? (
              <div className="col-span-full py-16 text-center text-gray-500 font-medium">No vendors found matching your criteria.</div>
            ) : (
              filteredFeatured.slice(0, 6).map((v, idx) => (
                <motion.div key={v._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} viewport={{ once: true }}>
                  <VendorCard vendor={v} />
                </motion.div>
              ))
            )}
          </div>

          <div className="text-center mt-10 md:hidden">
            <Link to="/services" className="inline-flex items-center justify-center gap-2 w-full text-[10px] font-black uppercase tracking-widest text-white bg-gray-900 px-6 py-4 rounded-full hover:shadow-xl transition-all shadow-lg">
              View All Vendors <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Wedding Packages ── */}
      <PackageSection />

      {/* ── 4. Baraat Cabs (USP Section) ── */}
      <section className="py-16 md:py-32 px-4 relative overflow-hidden bg-gradient-to-br from-[#050505] via-[#111111] to-[#050505]">
        {/* Luxury Background Effects */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#C2185B]/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
            {/* LEFT SIDE: Content */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-1/2 flex flex-col items-center text-center lg:items-start lg:text-left order-2 lg:order-1"
            >
              <div className="inline-flex items-center gap-2 bg-white/5 border border-[#D4AF37]/30 text-[#D4AF37] px-6 py-2 rounded-full mb-8 backdrop-blur-md shadow-lg shadow-[#D4AF37]/5">
                <FaCrown className="text-xl" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em]">👑 Luxury Baraat Cabs</span>
              </div>
              
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-lg leading-tight">
                Make Your Baraat <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] italic">Grand & Royal</span>
              </h2>
              
              <p className="text-gray-300 text-lg md:text-xl font-medium mb-12 leading-relaxed max-w-xl">
                Book premium wedding vehicles for your special day. From decorated luxury SUVs to vintage cars and complete baraat fleets.
              </p>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-y-3 sm:gap-y-5 gap-x-6 mb-12 w-full max-w-lg">
                {[
                  { icon: <FaCheckCircle />, text: 'Verified Drivers' },
                  { icon: <FaCheckCircle />, text: 'Luxury Fleet' },
                  { icon: <FaCheckCircle />, text: 'Live Availability' },
                  { icon: <FaCheckCircle />, text: 'WhatsApp Updates' },
                  { icon: <FaCheckCircle />, text: 'Wedding Decor Options' }
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-200 text-xs sm:text-sm md:text-base font-bold bg-white/5 border border-white/10 px-4 py-3 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors shadow-sm">
                    <span className="text-[#D4AF37] text-lg sm:text-xl drop-shadow-md">{feature.icon}</span>
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link to="/baraat-cabs" className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 md:px-10 md:py-5 bg-gradient-to-r from-[#D4AF37] to-[#B38D22] text-[#1a1a1a] font-black uppercase tracking-widest text-xs md:text-sm rounded-full overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.3)] hover:shadow-[0_0_60px_rgba(212,175,55,0.5)] hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto">
                  <span className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  🚘 Explore Luxury Baraat Cabs <FiArrowRight className="text-lg group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/contact" className="group inline-flex items-center justify-center gap-3 px-8 py-4 md:px-10 md:py-5 bg-white/5 border border-white/20 text-white font-black uppercase tracking-widest text-xs md:text-sm rounded-full hover:bg-white/10 hover:border-white/40 transition-all duration-300 w-full sm:w-auto backdrop-blur-md">
                  📞 Get Instant Quote
                </Link>
              </div>
            </motion.div>

            {/* RIGHT SIDE: Image Showcase */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-1/2 relative order-1 lg:order-2"
            >
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="w-full h-full"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80" 
                    alt="Decorated Luxury Baraat SUV" 
                    className="w-full h-[400px] md:h-[500px] lg:h-[650px] object-cover object-[center_30%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                </motion.div>

                {/* Floating Badges */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-6 left-6 md:top-10 md:left-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-[#1a1a1a] shadow-xl border border-white/50 flex items-center gap-2 pointer-events-none"
                >
                  🔥 Most Booked
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute top-24 right-[-10px] md:right-[-20px] lg:right-[-30px] bg-[#1a1a1a]/90 backdrop-blur-md px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-[#D4AF37] shadow-2xl border border-[#D4AF37]/30 flex items-center gap-2 pointer-events-none"
                >
                  ⭐ Premium Fleet
                </motion.div>

                <motion.div 
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute bottom-32 left-[-10px] md:left-[-20px] bg-gradient-to-r from-[#D4AF37] to-[#B38D22] px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-black shadow-2xl flex items-center gap-2 pointer-events-none"
                >
                  👑 Royal Choice
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  className="absolute bottom-6 right-6 md:bottom-10 md:right-10 bg-black/60 backdrop-blur-xl px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl border border-white/20 flex items-center gap-2 pointer-events-none"
                >
                  💎 Luxury Wedding Service
                </motion.div>
              </div>
              
              {/* Decorative Glow Behind Image */}
              <div className="absolute inset-0 bg-[#D4AF37]/20 blur-[100px] -z-10 rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 5. Why Choose ShaadiSaathi ── */}
      <section className="py-10 md:py-16 lg:py-24 px-4 bg-[#FFF8F0]">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-2 md:mb-4 tracking-tight">
              {t('home.why_choose', 'Why Choose')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D6D] to-[#6A11CB] italic">ShaadiSaathi?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US_CARDS.map((feature, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#FF4D6D] to-[#FF758F] rounded-full flex items-center justify-center text-3xl text-white shadow-md mb-6">
                  {feature.icon}
                </div>
                <h3 className="font-black text-lg text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Final CTA Section ── */}
      <section className="py-12 md:py-16 lg:py-24 px-4 bg-gradient-to-br from-[#C2185B] to-[#8E244D] text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]" />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 md:mb-6 tracking-tight drop-shadow-md">
            {t('home.ready_to_plan', 'Ready To Plan Your')} <span className="italic text-[#D4AF37]">{t('home.dream_wedding', 'Dream Wedding?')}</span>
          </h2>
          <p className="text-white/80 text-base md:text-lg mb-8 md:mb-10 font-medium">
            Join thousands of happy couples who found their perfect vendors on ShaadiSaathi.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/services" className="bg-white text-[#C2185B] font-black text-xs uppercase tracking-widest py-4 px-10 rounded-full shadow-lg hover:scale-105 transition-all">
              Find Vendors
            </Link>
            <Link to="/contact" className="bg-transparent border border-white/50 text-white font-black text-xs uppercase tracking-widest py-4 px-10 rounded-full hover:bg-white/10 transition-all">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
