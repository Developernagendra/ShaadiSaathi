import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCategories } from '../store/slices/vendorSlice'
import { motion } from 'framer-motion'
import VendorCard from '../components/vendor/VendorCard'
import { SkeletonCard } from '../components/common/Skeleton'
import PackageSection from '../components/packages/PackageSection'
import { INDIAN_CITIES } from '../utils/helpers'
import { FiSearch, FiMapPin, FiArrowRight } from 'react-icons/fi'
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
  const { t } = useTranslation()
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
            <span>Premium Wedding Marketplace</span>
          </motion.div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white leading-tight mb-4 text-shadow drop-shadow-2xl">
            {t('home.title', 'Find Trusted Wedding Services For Your Special Day')}
          </h1>

          <div className="mb-10">
            <p className="text-white/90 text-sm sm:text-base md:text-xl font-medium max-w-2xl mx-auto text-shadow leading-relaxed italic">
              Trusted vendors, smart planning tools aur seamless booking ke saath apni wedding journey ko simple banayein.
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
            <div className="flex items-center gap-3 px-4 py-2 border-t md:border-t-0 md:border-l border-gray-100 w-full md:w-auto md:min-w-[200px]">
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
              Explore <span className="text-[#D4AF37] italic">Wedding Services</span>
            </motion.h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {STATIC_SERVICES.map((service, i) => (
              <Link
                key={service.slug}
                to={`/services?category=${service.slug}`}
                className="flex flex-col items-center gap-3 p-6 bg-white rounded-[1.5rem] shadow-sm hover:shadow-premium hover:-translate-y-1 hover:border-pink-200/50 transition-all duration-300 group text-center border border-gray-100 active:scale-95 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-[#C2185B] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="w-16 h-16 bg-[#FFF8F0] rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  {service.icon}
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-900 group-hover:text-[#C2185B] transition-colors break-words">
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
                Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D6D] to-[#6A11CB] italic">Vendors</span>
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
      <section className="py-10 md:py-16 lg:py-24 px-4 relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#111111]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C2185B]/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full mb-6 border border-white/20">
              <span className="text-[#D4AF37]">✨</span> Premium Transport
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-tight">
              Luxury <span className="text-[#D4AF37] italic">Baraat Cabs</span>
            </h2>
            <p className="text-white/80 text-base md:text-lg font-medium italic mb-8 max-w-lg">
              Experience seamless wedding transport. From decorated sedans to luxury buses, perfectly coordinated for your grand celebration.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href="https://wa.me/919876543210?text=Hi%2C%20I%20want%20to%20book%20Baraat%20Cabs" target="_blank" rel="noreferrer" className="bg-[#25D366] text-white font-black text-xs uppercase tracking-widest py-4 px-8 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:scale-105 transition-all text-center flex items-center justify-center gap-2">
                WhatsApp Booking
              </a>
              <Link to="/baraat-cabs" className="bg-white/10 text-white border border-white/20 font-black text-xs uppercase tracking-widest py-4 px-8 rounded-full hover:bg-white/20 transition-all text-center">
                Explore Fleet
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
            {/* Simple fleet mock display */}
            <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/10 hover:bg-white/20 transition">
              <div className="text-4xl mb-2">🚗</div>
              <h4 className="text-white font-bold text-sm">Luxury Sedans</h4>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/10 hover:bg-white/20 transition">
              <div className="text-4xl mb-2">🚙</div>
              <h4 className="text-white font-bold text-sm">Premium SUVs</h4>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/10 hover:bg-white/20 transition">
              <div className="text-4xl mb-2">🚌</div>
              <h4 className="text-white font-bold text-sm">AC Buses</h4>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/10 hover:bg-white/20 transition">
              <div className="text-4xl mb-2">🏎️</div>
              <h4 className="text-white font-bold text-sm">Vintage Cars</h4>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 5. Why Choose ShaadiSaathi ── */}
      <section className="py-10 md:py-16 lg:py-24 px-4 bg-[#FFF8F0]">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-2 md:mb-4 tracking-tight">
              Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D6D] to-[#6A11CB] italic">ShaadiSaathi?</span>
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
            Ready To Plan Your <span className="italic text-[#D4AF37]">Dream Wedding?</span>
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
