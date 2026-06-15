import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchVendors, fetchCategories, setFilters, clearFilters } from '../store/slices/vendorSlice'
import VendorCard from '../components/vendor/VendorCard'
import { SkeletonCard } from '../components/common/Skeleton'
import EmptyState from '../components/common/EmptyState'
import { INDIAN_CITIES, formatPrice } from '../utils/helpers'
import { FiSearch, FiFilter, FiX, FiMapPin, FiChevronDown, FiStar } from 'react-icons/fi';

import { motion, AnimatePresence } from 'framer-motion'
import { getSocket } from '../utils/socket'

const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated ✨' },
  { value: 'createdAt', label: 'Newest First 🆕' },
  { value: 'price', label: 'Price: Low to High 💸' },
  { value: 'price_desc', label: 'Price: High to Low 💎' },
  { value: 'bookings', label: 'Most Booked 📈' },
]

const PRICE_RANGES = [
  { label: 'Under ₹25,000', min: 0, max: 25000 },
  { label: '₹25,000 – ₹75,000', min: 25000, max: 75000 },
  { label: '₹75,000 – ₹2,00,000', min: 75000, max: 200000 },
  { label: '₹2,00,000 – ₹5,00,000', min: 200000, max: 500000 },
  { label: 'Above ₹5,00,000', min: 500000, max: '' },
]

const RATING_OPTIONS = [
  { label: 'Any Rating', value: '' },
  { label: '4.5 & Above (Excellent)', value: '4.5' },
  { label: '4.0 & Above (Very Good)', value: '4.0' },
  { label: '3.0 & Above (Good)', value: '3.0' },
]

export default function ServicesPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { vendors, categories, fetchLoading: loading, pagination } = useSelector(s => s.vendor)

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)

  const { categorySlug: paramCategorySlug } = useParams()
  const categorySlug = paramCategorySlug || searchParams.get('category') || ''

  const [localFilters, setLocalFilters] = useState({
    city: searchParams.get('city') || '',
    categorySlug: categorySlug,
    minPrice: '',
    maxPrice: '',
    rating: '',
    sortBy: 'rating',
    date: searchParams.get('date') || ''
  })

  const activeCategoryData = useMemo(() => {
    if (!categorySlug || !categories) return null;
    return categories.find(c => c.slug === categorySlug);
  }, [categorySlug, categories]);

  const loadVendors = useCallback(() => {
    dispatch(fetchVendors({
      page,
      limit: 12,
      search: searchInput || undefined,
      city: localFilters.city || undefined,
      category: categorySlug || undefined,
      minPrice: localFilters.minPrice || undefined,
      maxPrice: localFilters.maxPrice || undefined,
      rating: localFilters.rating || undefined,
      sortBy: localFilters.sortBy,
      date: localFilters.date || undefined,
    }))
  }, [dispatch, page, searchInput, localFilters, categorySlug])

  useEffect(() => {
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories())
    }
  }, [dispatch, categories?.length])

  useEffect(() => {
    loadVendors()
    const socket = getSocket()
    if (socket) {
      socket.on('vendor_updated', loadVendors)
    }
    return () => {
      if (socket) {
        socket.off('vendor_updated', loadVendors)
      }
    }
  }, [loadVendors])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    loadVendors()
  }

  const handlePriceRange = (range) => {
    setLocalFilters(prev => ({
      ...prev,
      minPrice: prev.minPrice === range.min && prev.maxPrice === range.max ? '' : range.min,
      maxPrice: prev.minPrice === range.min && prev.maxPrice === range.max ? '' : range.max
    }))
    setPage(1)
  }

  const handleClearFilters = () => {
    setLocalFilters({ city: '', categorySlug: '', minPrice: '', maxPrice: '', rating: '', sortBy: 'rating', date: '' })
    setSearchInput('')
    setPage(1)
    setSearchParams({})
  }

  const activeFilterCount = [
    localFilters.city,
    localFilters.minPrice,
    localFilters.rating,
    localFilters.date
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-[#FFF8F0]/30 pt-20 relative overflow-hidden font-sans">
      <div className="absolute inset-0 floral-pattern opacity-[0.02] pointer-events-none" />

      {/* ── 🏆 VENDORS HERO SECTION ── */}
      <div className="relative bg-[#1a1a1a] py-20 md:py-28 px-4 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 floral-pattern opacity-[0.05]" />
        <div className="absolute top-0 right-0 w-80 h-80 md:w-[600px] md:h-[600px] bg-[#C2185B]/20 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 md:w-[600px] md:h-[600px] bg-[#D4AF37]/10 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/3" />

        <div className="max-w-7xl mx-auto relative z-10 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-12">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 mb-4 md:mb-6">
                <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">
                  {activeCategoryData ? `Explore ${activeCategoryData.name}` : 'Verified Partners'}
                </span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-black text-white leading-tight mb-4 md:mb-6 tracking-tighter drop-shadow-2xl">
                Find Trusted Wedding <br className="hidden md:block" />
                <span className="text-[#D4AF37] italic">{activeCategoryData ? activeCategoryData.name : 'Vendors'}</span>
              </h1>
              <p className="text-white/70 text-lg md:text-xl font-medium italic leading-relaxed max-w-2xl">
                {activeCategoryData?.description || 'Browse India\'s most premium wedding professionals. Handpicked for your perfect celebration.'}
              </p>
            </motion.div>
          </div>

          {/* Search Box */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="w-full md:w-auto">
            <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2rem] md:rounded-[2.5rem] p-3 flex flex-col md:flex-row gap-3 w-full md:w-[480px] shadow-[0_0_50px_rgba(0,0,0,0.3)] relative group">
              <div className="flex-1 relative w-full">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37] text-xl" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search vendors..."
                  className="w-full bg-white/5 pl-12 pr-4 py-4 rounded-xl md:rounded-2xl outline-none text-white placeholder-white/50 text-base font-medium transition-all focus:bg-white/10"
                />
              </div>
              <button type="submit" className="bg-gradient-to-r from-[#D4AF37] to-[#B38D22] text-gray-900 font-black text-[10px] uppercase tracking-[0.3em] px-8 py-4 md:py-5 rounded-xl md:rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 w-full md:w-auto">
                Explore
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 md:py-16">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* ── 🔍 SEARCH & FILTER UI (Sidebar) ── */}
          <aside className="hidden lg:block w-[320px] flex-shrink-0">
            <div className="bg-white rounded-[3rem] shadow-premium border border-pink-50 p-10 sticky top-28">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-pink-50">
                <h3 className="font-display font-black text-2xl text-gray-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <button onClick={handleClearFilters} className="text-[9px] font-black text-[#C2185B] uppercase tracking-[0.2em] bg-pink-50 px-4 py-2 rounded-xl transition-all">
                    Reset ({activeFilterCount})
                  </button>
                )}
              </div>

              <div className="space-y-10">
                {/* Date Filter */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 block">Wedding Date</label>
                  <div className="relative group">
                    <input
                      type="date"
                      value={localFilters.date}
                      onChange={e => { setLocalFilters(prev => ({ ...prev, date: e.target.value })); setPage(1) }}
                      className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-6 py-4 text-gray-900 focus:outline-none focus:border-[#C2185B] focus:bg-white transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                {/* City Filter */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 block">Select City</label>
                  <div className="relative group">
                    <FiMapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-[#C2185B]" />
                    <select
                      value={localFilters.city}
                      onChange={e => { setLocalFilters(prev => ({ ...prev, city: e.target.value })); setPage(1) }}
                      className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-6 py-4 pl-14 text-gray-900 focus:outline-none focus:border-[#C2185B] focus:bg-white transition-all font-bold appearance-none cursor-pointer text-sm"
                    >
                      <option value="">All Cities</option>
                      {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <FiChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 block">Minimum Rating</label>
                  <div className="relative group">
                    <FiStar className="absolute left-5 top-1/2 -translate-y-1/2 text-yellow-500" />
                    <select
                      value={localFilters.rating}
                      onChange={e => { setLocalFilters(prev => ({ ...prev, rating: e.target.value })); setPage(1) }}
                      className="w-full bg-gray-50 border border-transparent rounded-[1.5rem] px-6 py-4 pl-14 text-gray-900 focus:outline-none focus:border-[#C2185B] focus:bg-white transition-all font-bold appearance-none cursor-pointer text-sm"
                    >
                      {RATING_OPTIONS.map(o => <option key={o.label} value={o.value}>{o.label}</option>)}
                    </select>
                    <FiChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 block">Price Range</label>
                  <div className="space-y-3">
                    {PRICE_RANGES.map(range => {
                      const isActive = localFilters.minPrice === range.min && localFilters.maxPrice === range.max;
                      return (
                        <button
                          key={range.label}
                          onClick={() => handlePriceRange(range)}
                          className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black transition-all tracking-wider ${isActive ? 'bg-gradient-to-r from-[#C2185B] to-[#8E244D] text-white shadow-lg' : 'bg-gray-50 border border-transparent text-gray-600 hover:border-[#C2185B]/30 hover:bg-white'}`}
                        >
                          {range.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="bg-white rounded-[2rem] p-6 mb-10 shadow-premium border border-pink-50 flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#B38D22] text-white rounded-2xl flex items-center justify-center font-display font-black text-2xl shadow-lg">
                  {pagination?.total || vendors?.length || 0}
                </div>
                <div>
                  <p className="text-gray-900 font-display font-black text-xl tracking-tight leading-none mb-1">Premium Vendors</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Available to book</p>
                </div>
              </div>

              {/* Sort */}
              <div className="relative min-w-[220px]">
                <select
                  value={localFilters.sortBy}
                  onChange={e => { setLocalFilters(prev => ({ ...prev, sortBy: e.target.value })); setPage(1) }}
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 outline-none focus:border-[#C2185B] focus:bg-white appearance-none pr-12 cursor-pointer transition-all"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <FiChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Mobile Filter Button */}
              <button onClick={() => setFiltersOpen(true)} className="lg:hidden bg-gray-900 text-white p-4 rounded-2xl">
                <FiFilter size={20} />
              </button>
            </div>

            {/* Mobile Filters Overlay */}
            <AnimatePresence>
              {filtersOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setFiltersOpen(false)} />
                  <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] z-50 p-8 max-h-[85vh] overflow-y-auto shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="font-display font-black text-2xl">Filters</h3>
                      <button onClick={() => setFiltersOpen(false)} className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600"><FiX size={20} /></button>
                    </div>
                    {/* Simplified mobile filters map */}
                    <div className="space-y-6">
                      <select value={localFilters.city} onChange={e => setLocalFilters(prev => ({ ...prev, city: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold">
                        <option value="">All Cities</option>
                        {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="mt-8">
                      <button onClick={() => { loadVendors(); setFiltersOpen(false) }} className="w-full bg-[#C2185B] text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl shadow-xl">Apply Filters</button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* ── Vendors Grid ── */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (!vendors || vendors.length === 0) ? (
              <div className="bg-white rounded-[3rem] p-16 text-center shadow-premium">
                <div className="w-24 h-24 bg-pink-50 text-[#C2185B] rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-6">🔍</div>
                <h3 className="font-display font-black text-2xl text-gray-900 mb-2">No Vendors Found</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Try adjusting your filters or searching for something else to discover our premium vendors.</p>
                <button onClick={handleClearFilters} className="bg-[#C2185B] text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 rounded-xl shadow-lg">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(vendors || []).map(v => <VendorCard key={v._id} vendor={v} />)}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-16">
                    {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setPage(i + 1)}
                        className={`w-12 h-12 rounded-xl font-display font-black text-lg transition-all ${page === i + 1 ? 'bg-[#C2185B] text-white shadow-lg' : 'bg-white text-gray-400 hover:text-[#C2185B]'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
