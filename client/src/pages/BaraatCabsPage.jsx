import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMapPin, FiUsers, FiArrowRight, FiFilter, FiStar, FiPlus, FiMinus, FiCalendar, FiSearch, FiShield, FiAlertTriangle } from 'react-icons/fi';
import { FaTruck, FaCrown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import 'react-lazy-load-image-component/src/effects/blur.css'
import api from '../utils/api'
import { apiCache } from '../utils/apiCache'
import { formatPrice } from '../utils/helpers'
import { toast } from 'react-hot-toast'
import BaraatCabsSkeleton from '../components/common/BaraatCabsSkeleton'

export default function BaraatCabsPage() {
  const navigate = useNavigate()

  // Check cache synchronously so we skip the skeleton entirely on cache hits
  const getInitialItems = () => {
    const cachedKey = `/fleet/browse?`
    const cached = apiCache.get(cachedKey)
    return cached ? (cached.cabs || cached.data || []) : []
  }

  const [items, setItems] = useState(getInitialItems)
  const [loading, setLoading] = useState(() => {
    return !apiCache.has('/fleet/browse?')
  })

  // Full set of filters
  const [filters, setFilters] = useState({
    city: '',
    guests: '',
    date: '',
    type: '',
    availability: '', // 'available', 'limited', 'sold_out'
    maxPrice: '',
    vendor: '',
    minSeats: ''
  })

  const [showFilters, setShowFilters] = useState(false)
  const [fleetSelection, setFleetSelection] = useState([]) // Array of { cabId, count, data }

  useEffect(() => {
    fetchData()
  }, [filters.city, filters.date])

  const fetchData = async () => {
    const params = new URLSearchParams()
    if (filters.city) params.append('city', filters.city)
    if (filters.date) params.append('date', filters.date)

    const cacheKey = `/fleet/browse?${params.toString()}`
    if (apiCache.has(cacheKey)) {
      const cached = apiCache.get(cacheKey)
      setItems(cached.cabs || cached.data || [])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await api.get(cacheKey)
      if (res.data.status === 'success') {
        apiCache.set(cacheKey, res.data)
        setItems(res.data.cabs || res.data.data || [])
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load marketplace fleet.')
    } finally {
      setLoading(false)
    }
  }

  // --- FILTER ENGINE (CLIENT SIDE FOR INSTANT RESPONSIVENESS) ---
  const filteredItems = useMemo(() => {
    return items.filter(cab => {
      // 1. Vehicle Type
      if (filters.type && cab.type !== filters.type) return false

      // 2. Seating capacity
      if (filters.minSeats && cab.seatingCapacity < Number(filters.minSeats)) return false

      // 3. Availability
      const available = cab.availableFleet ?? cab.totalFleet ?? cab.quantityAvailable ?? 1
      if (filters.availability) {
        if (filters.availability === 'available' && available <= 3) return false
        if (filters.availability === 'limited' && (available > 3 || available === 0)) return false
        if (filters.availability === 'sold_out' && available > 0) return false
      }

      // 4. Price Limit
      const price = cab.price || cab.pricing?.baseFare || 0
      if (filters.maxPrice && price > Number(filters.maxPrice)) return false

      // 5. Vendor Filter
      if (filters.vendor) {
        const vId = cab.vendor?._id || cab.vendor
        if (vId?.toString() !== filters.vendor.toString()) return false
      }

      return true
    })
  }, [items, filters])

  // Extract unique vendors from loaded items
  const uniqueVendors = useMemo(() => {
    const vendorsMap = {}
    items.forEach(cab => {
      const v = cab.vendor
      const vId = v?._id || cab.vendorId
      const vName = v?.businessName || cab.vendorName || 'Verified Partner'
      if (vId) {
        vendorsMap[vId] = vName
      }
    })
    return Object.entries(vendorsMap).map(([id, name]) => ({ id, name }))
  }, [items])

  // --- FLEET BUILDER LOGIC ---
  const handleUpdateCart = (cab, action) => {
    setFleetSelection(prev => {
      const existing = prev.find(item => item.cabId === cab._id)
      const maxLimit = cab.availableFleet ?? cab.totalFleet ?? cab.quantityAvailable ?? 1

      if (action === 'add') {
        if (existing) {
          if (existing.count >= maxLimit) {
            toast.error(`Only ${maxLimit} vehicles of this type available.`)
            return prev
          }
          return prev.map(item => item.cabId === cab._id ? { ...item, count: item.count + 1 } : item)
        } else {
          if (maxLimit < 1) {
            toast.error('Vehicle currently sold out.')
            return prev
          }
          return [...prev, { cabId: cab._id, count: 1, data: cab }]
        }
      } else if (action === 'remove') {
        if (existing && existing.count > 1) {
          return prev.map(item => item.cabId === cab._id ? { ...item, count: item.count - 1 } : item)
        } else {
          return prev.filter(item => item.cabId !== cab._id)
        }
      }
      return prev
    })
  }

  const fleetStats = useMemo(() => {
    let totalCapacity = 0
    let totalFare = 0
    let totalVehicles = 0

    fleetSelection.forEach(item => {
      totalVehicles += item.count
      totalCapacity += (item.data.seatingCapacity || 4) * item.count
      totalFare += (item.data.price || item.data.pricing?.baseFare || 0) * item.count
    })

    return { totalCapacity, totalFare, totalVehicles }
  }, [fleetSelection])

  const guestTarget = Number(filters.guests) || 0
  const capacityProgress = guestTarget > 0 ? Math.min(100, (fleetStats.totalCapacity / guestTarget) * 100) : 0

  const handleSmartRecommend = () => {
    if (!guestTarget || guestTarget <= 0) {
      toast.error('Please enter a valid guest count first.')
      return
    }

    if (items.length === 0) {
      toast.error('No vehicles available in this city to recommend.')
      return
    }

    // Sort items by cost per seat (cheapest first)
    const sortedVehicles = [...items].sort((a, b) => {
      const cpsA = (a.price || a.pricing?.baseFare || 1) / (a.seatingCapacity || 1)
      const cpsB = (b.price || b.pricing?.baseFare || 1) / (b.seatingCapacity || 1)
      return cpsA - cpsB
    })

    let remainingGuests = guestTarget
    const newSelection = []

    for (const vehicle of sortedVehicles) {
      if (remainingGuests <= 0) break
      const capacity = vehicle.seatingCapacity || 4
      const maxAvailable = vehicle.availableFleet ?? vehicle.totalFleet ?? vehicle.quantityAvailable ?? 1

      if (maxAvailable <= 0) continue

      let countNeeded = Math.ceil(remainingGuests / capacity)
      countNeeded = Math.min(countNeeded, maxAvailable)

      if (countNeeded > 0) {
        newSelection.push({
          cabId: vehicle._id,
          count: countNeeded,
          data: vehicle
        })
        remainingGuests -= (capacity * countNeeded)
      }
    }

    setFleetSelection(newSelection)
    toast.success('Smart Recommendation Applied!')
  }

  const handleCheckout = () => {
    if (fleetSelection.length === 0) {
      toast.error('Please select at least one vehicle for your fleet.')
      return
    }
    if (!filters.city || !filters.date) {
      toast.error('Please specify your city and event date in the top search panel.')
      return
    }

    // Double-check availability limits before redirecting
    for (const item of fleetSelection) {
      const liveCab = items.find(i => i._id === item.cabId)
      if (liveCab) {
        const currentLimit = liveCab.availableFleet ?? liveCab.totalFleet ?? 1
        if (item.count > currentLimit) {
          toast.error(`Availability changed. Only ${currentLimit} vehicles of ${liveCab.name} are available now.`)
          return
        }
      }
    }

    const payload = fleetSelection.map(item => ({
      cabId: item.cabId,
      vendorId: item.data?.vendor?._id || item.data?.vendor || item.data?.vendorId,
      count: item.count,
      pricePerVehicle: item.data?.price || item.data?.pricing?.baseFare || 0,
      totalFare: (item.data?.price || item.data?.pricing?.baseFare || 0) * item.count,
      data: item.data
    }))

    navigate('/cab-booking', {
      state: {
        bookingType: 'baraat-fleet',
        fleetSelection: payload,
        city: filters.city,
        eventDate: filters.date,
        guestCount: filters.guests || fleetStats.totalCapacity,
        totalAmount: fleetStats.totalFare
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans selection:bg-[#D4AF37]/20 selection:text-[#D4AF37]">
      {/* ── HERO SECTION ── */}
      <div className="relative bg-[#1A1C23] pt-32 pb-48 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=2000" alt="Wedding Fleet" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCF8] via-[#1A1C23]/80 to-[#1A1C23]/90" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-[#D4AF37]/10 backdrop-blur-md border border-[#D4AF37]/30 mb-8 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <FaCrown className="text-[#D4AF37] text-lg" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Premium Wedding Transportation</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-black text-white mb-6 tracking-tight drop-shadow-2xl">
            Arrive in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] italic block sm:inline">Royal Elegance</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-300 font-medium text-base sm:text-lg md:text-2xl italic max-w-3xl mx-auto drop-shadow-md mb-10">
            Make your grand entrance unforgettable. Curate your custom fleet from our handpicked selection of luxury vintage cars, premium SUVs, and luxury coaches.
          </motion.p>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })} className="px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#B38D22] text-white rounded-full font-black uppercase tracking-widest text-xs hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2 w-full sm:w-auto justify-center">
              View Fleet <FiArrowRight size={16} />
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all flex items-center gap-2 w-full sm:w-auto justify-center">
              Get Instant Quote
            </button>
          </motion.div>
        </div>
      </div>

      {/* ── FLOATING SEARCH PANEL ── */}
      <div className="max-w-6xl mx-auto px-4 relative z-20 -mt-24 mb-16">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/90 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/40 shadow-[0_30px_60px_rgba(0,0,0,0.12)] flex flex-col md:flex-row gap-4 sticky top-24 z-50">
          <div className="flex-1 bg-gray-50/80 rounded-2xl p-4 flex items-center gap-4 hover:bg-pink-50/50 transition-colors border border-transparent hover:border-pink-100">
            <FiMapPin className="text-[#D4AF37] text-2xl shrink-0" />
            <div className="w-full">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Step 1: Base City</p>
              <input type="text" placeholder="Where is the event?" value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} className="bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 w-full font-bold text-lg" />
            </div>
          </div>
          <div className="flex-1 bg-gray-50/80 rounded-2xl p-4 flex items-center gap-4 hover:bg-pink-50/50 transition-colors border border-transparent hover:border-pink-100">
            <FiUsers className="text-[#D4AF37] text-2xl shrink-0" />
            <div className="w-full">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Guests</p>
              <input type="number" placeholder="How many people?" value={filters.guests} onChange={e => setFilters({ ...filters, guests: e.target.value })} className="bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 w-full font-bold text-lg" />
            </div>
          </div>
          <div className="flex-1 bg-gray-50/80 rounded-2xl p-4 flex items-center gap-4 hover:bg-pink-50/50 transition-colors border border-transparent hover:border-pink-100">
            <FiCalendar className="text-[#D4AF37] text-2xl shrink-0" />
            <div className="w-full">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Event Date</p>
              <input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} className="bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 w-full font-bold text-lg" />
            </div>
          </div>
          <div className="md:w-auto w-full flex items-center justify-center">
            <button className="bg-gray-900 text-white w-full md:w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg hover:bg-black hover:scale-105 transition-all">
              <FiSearch size={24} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 pb-24">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* VEHICLE LIST & FILTERS */}
          <div className="flex-1 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
              <div>
                <h2 className="font-serif text-4xl md:text-[42px] font-bold text-gray-900 tracking-tight">Premium Fleet</h2>
              </div>
              <div className="flex gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${showFilters ? 'bg-gray-100 text-gray-900 border-gray-200' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'} shadow-sm`}
                >
                  <FiFilter size={14} /> Filters
                </button>
                <button onClick={handleSmartRecommend} className="px-6 py-3.5 bg-[#1A1C23] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10">
                  <FiStar className="text-[#D4AF37]" size={14} /> Auto-Build Fleet
                </button>
              </div>
            </div>

            {/* DYNAMIC COLLAPSIBLE FILTER PANEL */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {/* Vehicle Type */}
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Vehicle Type</label>
                      <select
                        value={filters.type}
                        onChange={e => setFilters({ ...filters, type: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      >
                        <option value="">All Types</option>
                        <option value="sedan">Sedan</option>
                        <option value="suv">SUV</option>
                        <option value="luxury_car">Luxury Car</option>
                        <option value="vintage_car">Vintage Car</option>
                        <option value="bus">Bus / Coach</option>
                        <option value="tempo_traveller">Tempo Traveller</option>
                        <option value="horse_carriage">Horse Carriage</option>
                      </select>
                    </div>

                    {/* Availability Status */}
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Availability Status</label>
                      <select
                        value={filters.availability}
                        onChange={e => setFilters({ ...filters, availability: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      >
                        <option value="">All Statuses</option>
                        <option value="available">🟢 Available ({'>'} 3 available)</option>
                        <option value="limited">🟡 Limited Availability (≤ 3 available)</option>
                        <option value="sold_out">🔴 Fully Booked (0 available)</option>
                      </select>
                    </div>

                    {/* Capacity */}
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Min Capacity (Guests)</label>
                      <select
                        value={filters.minSeats}
                        onChange={e => setFilters({ ...filters, minSeats: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      >
                        <option value="">Any Capacity</option>
                        <option value="4">4+ Seats</option>
                        <option value="6">6+ Seats</option>
                        <option value="8">8+ Seats</option>
                        <option value="12">12+ Seats</option>
                        <option value="20">20+ Seats</option>
                      </select>
                    </div>

                    {/* Max Price */}
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Max Price Per Vehicle</label>
                      <select
                        value={filters.maxPrice}
                        onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      >
                        <option value="">Any Price</option>
                        <option value="15000">Under ₹15,000</option>
                        <option value="30000">Under ₹30,000</option>
                        <option value="50000">Under ₹50,000</option>
                        <option value="100000">Under ₹1,00,000</option>
                      </select>
                    </div>

                    {/* Vendor */}
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Vendor Partner</label>
                      <select
                        value={filters.vendor}
                        onChange={e => setFilters({ ...filters, vendor: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      >
                        <option value="">All Vendors</option>
                        {uniqueVendors.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex items-end">
                      <button
                        onClick={() => setFilters({
                          ...filters,
                          type: '',
                          availability: '',
                          maxPrice: '',
                          vendor: '',
                          minSeats: ''
                        })}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-black uppercase tracking-widest text-[10px] py-4 rounded-xl transition-all shadow-inner border border-gray-200/50"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <BaraatCabsSkeleton />
            ) : items.length === 0 ? (
              /* Scenario A: No approved vehicles exist for query (Zero Cabs in selected City/Date) */
              <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50 rounded-full blur-[100px] pointer-events-none" />
                <img src="https://illustrations.popsy.co/amber/car.svg" alt="Empty" className="w-48 h-48 mx-auto mb-8 opacity-60 grayscale" />
                <h3 className="font-display font-black text-3xl text-gray-900 mb-3">No Approved Vehicles in this City</h3>
                <p className="text-gray-500 text-lg font-medium italic max-w-md mx-auto mb-8">
                  {filters.city ? `We currently don't have any approved active fleet vehicles registered in "${filters.city}".` : 'Select a base city to view our available luxury fleets.'}
                </p>
                {filters.city && (
                  <button onClick={() => setFilters({ ...filters, city: 'Patna' })} className="px-6 py-3 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#FFF8F0] rounded-xl font-bold transition-all">
                    Explore Patna Fleet
                  </button>
                )}
              </div>
            ) : filteredItems.length === 0 ? (
              /* Scenario B: Cabs exist in city, but filters returned zero matching */
              <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <FiAlertTriangle className="mx-auto text-4xl text-amber-500 mb-6" />
                <h3 className="font-display font-black text-2xl text-gray-900 mb-2">No Matching Cabs</h3>
                <p className="text-gray-500 text-md max-w-md mx-auto mb-8">
                  There are {items.length} approved vehicles in this city, but none match your active filters. Try clearing or expanding your selection criteria.
                </p>
                <button
                  onClick={() => setFilters({
                    ...filters,
                    type: '',
                    availability: '',
                    maxPrice: '',
                    vendor: '',
                    minSeats: ''
                  })}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold transition-all hover:bg-black"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {filteredItems.map(cab => {
                  const selectedItem = fleetSelection.find(i => i.cabId === cab._id)
                  const count = selectedItem ? selectedItem.count : 0
                  const isSelected = count > 0

                  const total = cab.totalFleet || cab.quantityAvailable || 1
                  const available = cab.availableFleet ?? total
                  const isVerifiedVendor = cab.vendor?.verified || cab.vendor?.badges?.includes('verified') || cab.isAdminVehicle
                  const rating = cab.rating?.average || cab.vendor?.rating?.average || 4.8
                  const cityLabel = cab.location?.city ? cab.location.city.charAt(0).toUpperCase() + cab.location.city.slice(1) : 'Patna'

                  return (
                    <motion.div
                      key={cab._id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className={`w-full max-w-full bg-white rounded-[2rem] overflow-hidden flex flex-col xl:flex-row shadow-lg hover:shadow-2xl border border-gray-100 transition-all duration-300 group ${isSelected ? 'ring-2 ring-[#D4AF37] shadow-[0_10px_40px_rgba(212,175,55,0.15)] scale-[1.01]' : ''}`}
                    >
                      {/* Left: Image Section */}
                      <div className="w-full xl:w-[45%] h-72 xl:h-auto relative overflow-hidden shrink-0">
                        <LazyLoadImage
                          src={cab.images?.[0]?.url || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800'}
                          alt={cab.name}
                          effect="blur"
                          wrapperProps={{ style: { display: "block", width: "100%", height: "100%" } }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1C23]/90 via-transparent to-[#1A1C23]/20" />

                        {/* Top Left Badge */}
                        <div className="absolute top-5 left-5">
                          <div className="bg-[#1A1C23]/80 backdrop-blur-md px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] border border-[#D4AF37]/30">
                            {cab.type?.replace('_', ' ')}
                          </div>
                        </div>

                        {/* Bottom Overlay: Vendor & Rating */}
                        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                          <div className="flex items-center gap-3 bg-[#1A1C23]/80 backdrop-blur-md p-2.5 rounded-2xl border border-white/10">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B38D22] flex items-center justify-center font-bold text-white text-sm overflow-hidden shrink-0 shadow-inner">
                              {cab.vendor?.businessName?.substring(0, 2).toUpperCase() || 'CB'}
                            </div>
                            <div className="pr-2">
                              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#D4AF37] leading-none mb-1">Premium Partner</p>
                              <p className="font-bold text-xs text-white leading-none truncate max-w-[120px]">
                                {cab.vendor?.businessName || cab.vendorName || 'Luxury Fleet'}
                              </p>
                            </div>
                          </div>
                          <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-lg">
                            <FiStar className="text-[#D4AF37] fill-[#D4AF37]" size={14} /> 
                            <span className="text-[#1A1C23] text-xs font-black">{rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Content Section */}
                      <div className="p-6 md:p-8 flex-1 flex flex-col justify-center bg-white relative">
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-bl-full pointer-events-none" />
                        )}
                        <div className="mb-4">
                          <h3 className="font-serif font-bold text-3xl xl:text-4xl text-[#1A1C23] mb-3 group-hover:text-[#D4AF37] transition-colors">
                            {cab.name || cab.vehicleName || `${cab.brand} ${cab.model}`}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-gray-500 font-bold text-sm">
                            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100"><FiUsers className="text-[#D4AF37]" size={16} /> Up to {cab.seatingCapacity} Guests</span>
                            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100"><FiMapPin className="text-[#D4AF37]" size={16} /> Base City: {cityLabel}</span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                          <div>
                            {available === 0 ? (
                              <span className="inline-flex items-center gap-2 border border-rose-200 text-rose-700 bg-rose-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> FULLY BOOKED
                              </span>
                            ) : available <= 3 ? (
                              <span className="inline-flex items-center gap-2 border border-amber-200 text-amber-700 bg-amber-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> LIMITED AVAILABILITY
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 border border-emerald-200 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> AVAILABLE
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 text-gray-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                              Total: {total} | Left: {available}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 mb-8">
                          <div className="flex items-center gap-3 text-sm text-gray-600 font-medium"><FiShield className="text-[#D4AF37]" size={18} /> Fully Insured & Sanitized</div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 font-medium"><FaCrown className="text-[#D4AF37]" size={18} /> Highly rated professional chauffeur</div>
                        </div>

                        <div className="border-t border-gray-100 pt-6 mt-auto flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 w-full max-w-full overflow-hidden shrink-0">
                          <div className="shrink-0 w-full xl:w-auto">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Starting Price</p>
                            <p className="font-serif font-black text-4xl text-[#1A1C23] tracking-tight">
                              {formatPrice(cab.price || cab.pricing?.baseFare || 0)}
                            </p>
                          </div>

                          <div className="flex justify-end items-center gap-[16px] flex-wrap flex-col sm:flex-row w-full xl:w-auto shrink">
                            <button onClick={() => navigate(`/baraat-cabs/details/${cab._id}`)} className="h-[48px] bg-white border border-gray-200 text-[#1A1C23] rounded-[16px] flex items-center justify-center font-black uppercase tracking-widest text-[11px] sm:text-xs transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#1A1C23] px-6 w-full sm:w-auto sm:min-w-[180px] sm:flex-1 xl:flex-none">
                              View Details
                            </button>
                            
                            {available <= 0 ? (
                              <div className="h-[48px] bg-gray-100 border border-gray-200 text-gray-400 rounded-[16px] flex items-center justify-center text-[11px] sm:text-xs font-black uppercase tracking-widest select-none px-6 w-full sm:w-auto sm:min-w-[180px] sm:flex-1 xl:flex-none">
                                Currently Unavailable
                              </div>
                            ) : count === 0 ? (
                              <button
                                onClick={() => handleUpdateCart(cab, 'add')}
                                className="h-[48px] bg-gradient-to-r from-[#D4AF37] to-[#B38D22] text-white rounded-[16px] flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[11px] sm:text-xs transition-all duration-300 shadow-[0_4px_14px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.4)] hover:-translate-y-0.5 active:scale-95 px-6 w-full sm:w-auto sm:min-w-[180px] sm:flex-1 xl:flex-none"
                              >
                                Quick Book <FiPlus size={16} />
                              </button>
                            ) : (
                              <div className="h-[48px] bg-[#1A1C23] rounded-[16px] p-1.5 shadow-lg flex items-center justify-between gap-2 transition-all w-full sm:w-auto sm:min-w-[180px] sm:flex-1 xl:flex-none">
                                <button onClick={() => handleUpdateCart(cab, 'remove')} className="w-9 h-9 bg-white/10 rounded-[12px] flex items-center justify-center text-white hover:bg-white/20 transition-colors shrink-0 active:scale-95">
                                  <FiMinus size={16} />
                                </button>
                                <span className="flex-1 text-center font-bold text-white text-base">{count}</span>
                                <button onClick={() => handleUpdateCart(cab, 'add')} disabled={count >= available} className="w-9 h-9 bg-gradient-to-br from-[#D4AF37] to-[#B38D22] rounded-[12px] flex items-center justify-center text-white hover:brightness-110 transition-all shadow-inner disabled:opacity-50 shrink-0 active:scale-95">
                                  <FiPlus size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── LIVE BARAAT CART (SIDEBAR - STEP 4) ── */}
          <div className="w-full lg:w-[450px]">
            <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.08)] border border-gray-100 sticky top-32 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4AF37]/5 rounded-bl-[5rem] pointer-events-none" />

              <div className="mb-8 relative z-10">
                <p className="text-[#D4AF37] font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2"><span className="w-6 h-[2px] bg-[#D4AF37]" /> Step 4</p>
                <h3 className="font-serif text-4xl font-bold text-gray-900 tracking-tight">Fleet Summary</h3>
              </div>

              {/* Capacity Progress */}
              <div className="mb-8 bg-[#FFF9F2] p-6 rounded-[2rem] border border-[#F4E6D2] relative z-10">
                <div className="flex justify-between items-end mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#B38D22]">Guest Capacity</p>
                  <p className="font-black text-2xl text-gray-900 leading-none">{fleetStats.totalCapacity} <span className="text-gray-400 text-base font-bold">/ {guestTarget || '?'}</span></p>
                </div>
                <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-[#F4E6D2]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${capacityProgress}%` }}
                    className={`h-full rounded-full transition-all duration-700 ${capacityProgress >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-[#D4AF37] to-[#F4D03F]'}`}
                  />
                </div>
              </div>

              {/* Selected Vehicles List */}
              <div className="space-y-4 mb-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                {fleetSelection.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-200 rounded-[2rem] bg-gray-50/30">
                    <FaTruck className="mx-auto text-2xl mb-3 text-gray-300" />
                    CART IS EMPTY
                  </div>
                ) : (
                  fleetSelection.map((item, idx) => (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={idx} className="flex gap-4 items-center p-4 rounded-[2rem] bg-gray-50 border border-gray-100 hover:border-[#D4AF37]/50 transition-colors">
                      <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shrink-0 shadow-sm">
                        <img src={item.data?.images?.[0]?.url || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=200'} alt="car" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-base leading-none mb-2">{item.data.name || item.data.type}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white px-2 py-1 rounded-lg inline-block border border-gray-100 shadow-sm">{item.count} x {formatPrice(item.data.price || item.data.pricing?.baseFare)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-black text-gray-900 text-lg">{formatPrice((item.data.price || item.data.pricing?.baseFare || 0) * item.count)}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-100 pt-8 mb-8 space-y-6 relative z-10">
                <div className="flex justify-between text-[11px] font-black text-gray-500 uppercase tracking-widest">
                  <span>Vehicles Selected</span>
                  <span className="text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{fleetStats.totalVehicles}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Estimation</span>
                  <span className="font-serif font-black text-4xl text-gray-900 tracking-tighter">{formatPrice(fleetStats.totalFare)}</span>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={handleCheckout}
                disabled={fleetSelection.length === 0}
                className="w-full py-5 bg-[#8C9093] text-white rounded-full font-black uppercase tracking-widest text-[11px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <span>PROCEED TO BOOKING</span> <FiArrowRight size={16} />
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                <FiShield /> Secure Payment Protection
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
