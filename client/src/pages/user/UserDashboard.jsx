import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getSocket } from '../../utils/socket'
import { fetchUserDashboard } from '../../store/slices/bookingSlice'
import { fetchUnreadChatCount } from '../../store/slices/chatSlice'
import { resendVerification } from '../../store/slices/authSlice'
import { formatPrice, formatDateShort, getStatusColor, getInitials } from '../../utils/helpers'
import { FiCalendar, FiHeart, FiMessageCircle, FiBell, FiArrowRight, FiUser, FiEdit3, FiShare2, FiUsers, FiMail, FiCheck, FiLayout, FiSmartphone, FiGlobe, FiSettings } from 'react-icons/fi'
import { motion } from 'framer-motion'
import Badge from '../../components/common/Badge'

export default function UserDashboard() {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const userIdFromQuery = searchParams.get('userId')
  const { user } = useSelector(s => s.auth)
  const { bookings, cabBookings, userDashboard } = useSelector(s => s.booking)
  const { unreadCount } = useSelector(s => s.notifications)

  const fetchData = useCallback(() => {
    const targetUserId = user?.role === 'admin' ? userIdFromQuery : null
    dispatch(fetchUserDashboard(targetUserId))
    dispatch(fetchUnreadChatCount())
  }, [dispatch, user?.role, userIdFromQuery])

  useEffect(() => {
    fetchData()

    const socket = getSocket()
    if (socket) {
      socket.on('booking_updated', fetchData)
      socket.on('new_booking', fetchData)
      socket.on('bookingUpdated', fetchData)
    }

    return () => {
      if (socket) {
        socket.off('booking_updated', fetchData)
        socket.off('new_booking', fetchData)
        socket.off('bookingUpdated', fetchData)
      }
    }
  }, [fetchData])

  const { unreadCount: chatUnread } = useSelector(s => s.chat)

  const stats = [
    { icon: <FiCalendar />, label: 'Total Bookings', value: userDashboard?.stats?.totalBookings || 0, link: '/bookings', color: 'blue' },
    { icon: <FiHeart />, label: 'Wishlist', value: user?.wishlist?.length || 0, link: '/wishlist', color: 'pink' },
    { icon: <FiMessageCircle />, label: 'Messages', value: chatUnread || 0, link: '/chat', color: 'green' },
    { icon: <FiBell />, label: 'Notifications', value: unreadCount || 0, link: '/notifications', color: 'orange' },
  ]

  const colorMap = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600',
    pink: 'bg-gradient-to-br from-pink-50 to-pink-100/50 text-pink-600',
    green: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-600',
    orange: 'bg-gradient-to-br from-orange-50 to-orange-100/50 text-orange-600',
  }

  const allRecentBookings = [...(bookings || []), ...(cabBookings || [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  return (
    <div className="pb-24 animate-fade-in relative">
      <div className="absolute inset-0 floral-pattern opacity-[0.03] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 px-4">
        {/* User Dashboard Header */}
        <div className="bg-gradient-to-br from-[#C2185B] via-[#8E244D] to-gray-900 rounded-2xl md:rounded-[3rem] p-6 sm:p-10 md:p-16 mb-8 md:mb-12 text-white relative overflow-hidden shadow-premium">
          <div className="absolute inset-0 floral-pattern opacity-[0.05]" />
          <div className="absolute top-0 right-0 w-72 h-72 md:w-[500px] md:h-[500px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-12">
            <div className="w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-xl border-2 border-white/20 p-1 flex items-center justify-center shadow-2xl flex-shrink-0 relative group">
              <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-800">
                {user?.avatar?.url ? (
                  <img src={user.avatar.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                ) : (
                  <span className="text-4xl font-display font-black text-[#D4AF37]">{getInitials(user?.name)}</span>
                )}
              </div>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center text-white shadow-lg border-4 border-[#8E244D]">
                <FiUser size={16} />
              </div>
            </div>

            <div className="text-center md:text-left flex-1">
              <div className="divider-luxe !justify-start mb-6 !gap-3">
                <div className="divider-line !bg-[#D4AF37]/30 !w-8" />
                <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] italic">User Dashboard</span>
                <div className="divider-line !bg-[#D4AF37]/30 !w-8" />
              </div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-black mb-4 tracking-tighter leading-none">
                Hello, <span className="text-[#D4AF37]">{user?.name?.split(' ')[0]}</span>
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4">
                <p className="text-white/60 font-bold text-sm uppercase tracking-widest">{user?.email}</p>
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <p className="text-white/60 font-bold text-sm uppercase tracking-widest">Premium Member</p>
              </div>

              {user?.weddingDate && (
                <div className="mt-6 md:mt-8 inline-flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 px-6 md:px-8 py-3.5 md:py-4 rounded-2xl shadow-xl max-w-full">
                  <span className="text-xl md:text-2xl">💍</span>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Wedding Date</p>
                    <p className="text-white font-display font-black text-base md:text-lg tracking-tight">
                      {formatDateShort(user.weddingDate)} <span className="text-white/40 font-normal">in</span> {user.weddingCity || 'your city'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((s, i) => (
            <Link key={s.label} to={s.link} className="bg-white rounded-2xl md:rounded-[2rem] p-6 md:p-8 shadow-premium hover:shadow-premium-hover border border-pink-50 transition-all duration-500 group relative overflow-hidden flex flex-col">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-pink-50 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-700" />
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-[#FFF8F0] text-[#C2185B] shadow-sm group-hover:rotate-6 transition-all`}>
                <span className="text-2xl">{s.icon}</span>
              </div>
              <p className="font-display text-5xl font-black text-gray-900 tracking-tighter mb-2">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] italic">{s.label === 'Wishlist' ? 'Saved Vendors' : s.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">
          {/* Recent Bookings */}
          <div className="lg:col-span-2 bg-white rounded-2xl md:rounded-[3rem] shadow-premium border border-pink-50 p-6 md:p-10 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFF8F0] rounded-bl-full opacity-40" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10 relative z-10">
              <h2 className="font-display text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Recent Bookings</h2>
              <Link to="/bookings" className="text-[10px] font-black text-[#C2185B] uppercase tracking-[0.3em] flex items-center gap-3 hover:gap-5 transition-all italic">
                View All Bookings <FiArrowRight size={18} />
              </Link>
            </div>

            <div className="flex-1 relative z-10">
              {allRecentBookings.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-[#FFF8F0]/30 rounded-[2rem] border border-dashed border-pink-100 min-h-[350px]">
                  <span className="text-6xl mb-6">📅</span>
                  <h3 className="font-display text-2xl font-black text-gray-900 mb-2 tracking-tight">No bookings yet</h3>
                  <p className="text-gray-400 font-medium italic mb-8 max-w-xs">Browse our trusted vendors to start planning your perfect wedding.</p>
                  <Link to="/services" className="bg-[#C2185B] text-white font-black text-[10px] uppercase tracking-[0.4em] py-5 px-12 rounded-2xl shadow-xl hover:scale-105 transition-all">Browse Vendors</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {allRecentBookings.map(b => (
                    <Link key={b._id} to={b.vehicles ? `/cab-booking/${b._id}` : `/bookings/${b._id}`} className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-3xl hover:bg-[#FFF8F0]/50 border border-transparent hover:border-pink-50 transition-all duration-500 group">
                      <div className="flex items-center gap-6 flex-1 min-w-0">
                        <div className="w-20 h-20 rounded-2xl bg-gray-100 shadow-sm flex-shrink-0 overflow-hidden relative flex items-center justify-center text-3xl">
                          {b.vehicles ? '🚕' : (b.vendor?.images?.[0]?.url ? (
                            <img src={b.vendor?.images?.[0]?.url} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" />
                          ) : '🏛️')}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-2 italic">{b.vehicles ? 'Baraat Cab' : (b.vendor?.category?.name || 'Vendor')}</p>
                          <p className="font-display text-xl sm:text-2xl font-black text-gray-900 truncate group-hover:text-[#C2185B] transition-colors leading-none mb-3">{b.vendor?.businessName || (b.vehicles ? `${b.vehicles.length} Vehicle(s)` : 'Wedding Service')}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3 italic">
                            <FiCalendar className="text-[#C2185B]" /> {formatDateShort(b.eventDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-pink-50">
                        <span className={`text-[8px] font-black px-4 py-1.5 rounded-lg uppercase tracking-[0.2em] italic ${getStatusColor(b.status)}`}>
                          {b.status?.replace('_', ' ') || 'Pending'}
                        </span>
                        <span className="font-display text-2xl font-black text-gray-900 tracking-tighter">{formatPrice(b.amount || b.totalAmount)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-10">
            {/* Email Verification */}
            {!user?.isVerified && user?.role !== 'admin' && (
              <div className="bg-[#8E244D] rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 text-white relative overflow-hidden shadow-premium">
                <div className="absolute inset-0 floral-pattern opacity-[0.05]" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-3xl">🔏</span>
                    <p className="font-display text-2xl font-black tracking-tight leading-none">Email Verification</p>
                  </div>
                  <p className="text-white/60 text-sm font-medium italic mb-6 md:mb-8">Please verify your email address to unlock all features and start booking your wedding services.</p>
                  <button
                    onClick={() => dispatch(resendVerification({ email: user.email }))}
                    className="w-full bg-white text-[#8E244D] font-black text-[10px] uppercase tracking-[0.3em] py-4 md:py-5 rounded-2xl shadow-xl hover:scale-105 transition-all"
                  >
                    Resend Verification Email
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions List */}
            <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-premium border border-pink-50 p-6 md:p-10 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-50/20 rounded-tl-full" />
              <h3 className="font-display text-2xl font-black text-gray-900 mb-6 md:mb-8 tracking-tight relative z-10">Quick Actions</h3>
              <div className="space-y-4 relative z-10">
                {[
                  { to: '/services', icon: '🔍', label: 'Browse Vendors', color: '#C2185B' },
                  { to: '/baraat-cabs', icon: '🚗', label: 'Imperial Fleet', color: '#8E244D' },
                  { to: '/wishlist', icon: '❤️', label: 'Saved Vendors', color: '#D4AF37' },
                  { to: '/profile', icon: '👤', label: 'My Profile', color: '#6366f1' },
                  { to: '/chat', icon: '💬', label: 'My Messages', color: '#10b981' },
                ].map(({ to, icon, label, color }) => (
                  <Link key={to} to={to} className="flex items-center gap-6 p-5 rounded-[1.5rem] hover:bg-[#FFF8F0] border border-transparent hover:border-pink-50 transition-all duration-500 group">
                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                      {icon}
                    </span>
                    <span className="font-black text-gray-900 group-hover:text-[#C2185B] transition-colors text-[10px] uppercase tracking-[0.2em] italic">{label}</span>
                    <FiArrowRight size={18} className="ml-auto text-gray-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            INVITATION REDESIGN SECTION 
            ========================================= */}
        <div className="mt-20">
          {/* Hero Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] rounded-2xl md:rounded-[3rem] p-6 sm:p-10 md:p-16 relative overflow-hidden shadow-premium mb-8 md:mb-12"
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#C2185B]/20 to-transparent rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-[#D4AF37]/20 to-transparent rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-12">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 mb-6">
                  <span className="text-[#D4AF37]">✨</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Premium Feature</span>
                </div>
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
                  Design Your <span className="text-[#D4AF37] italic">Dream</span> Wedding Invitation
                </h2>
                <p className="text-white/70 text-base md:text-lg lg:text-xl font-medium mb-6 md:mb-10 max-w-2xl mx-auto lg:mx-0">
                  Create, personalize, and share stunning digital invitations. Track RSVPs in real-time and manage your guest list effortlessly.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-[#1a1a2e] font-black text-[12px] uppercase tracking-[0.2em] py-4 px-10 rounded-2xl shadow-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-3"
                  >
                    <FiEdit3 size={18} /> Create Invitation
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto bg-white/10 text-white font-black text-[12px] uppercase tracking-[0.2em] py-4 px-10 rounded-2xl border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-3 backdrop-blur-sm"
                  >
                    <FiLayout size={18} /> Browse Templates
                  </motion.button>
                </div>
              </div>

              {/* Decorative Right Side (Preview Cards) */}
              <div className="flex-1 relative w-full max-w-md lg:max-w-none h-[400px] hidden md:block pointer-events-none">
                <motion.div 
                  initial={{ rotate: 5, x: 50, opacity: 0 }}
                  whileInView={{ rotate: 12, x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="absolute right-0 top-10 w-64 h-80 bg-white p-4 rounded-[2rem] shadow-2xl border border-gray-100 z-10"
                >
                  <div className="w-full h-full bg-[#FFF8F0] rounded-xl overflow-hidden relative">
                     <div className="absolute inset-0 floral-pattern opacity-10" />
                     <div className="absolute inset-0 flex items-center justify-center flex-col text-[#C2185B]">
                       <span className="text-4xl mb-4">🌺</span>
                       <h3 className="font-display text-xl font-bold">Aman & Priya</h3>
                     </div>
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ rotate: -15, x: -50, opacity: 0 }}
                  whileInView={{ rotate: -5, x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="absolute right-32 top-20 w-64 h-80 bg-white p-4 rounded-[2rem] shadow-2xl border border-gray-100 z-20"
                >
                  <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-black rounded-xl overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center flex-col text-[#D4AF37]">
                       <span className="text-4xl mb-4">✨</span>
                       <h3 className="font-display text-xl font-bold">Royal Wedding</h3>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Invitations', value: '3', icon: <FiMail />, color: 'from-blue-500 to-cyan-500' },
              { label: 'Guests Invited', value: '450', icon: <FiUsers />, color: 'from-purple-500 to-pink-500' },
              { label: 'RSVP Received', value: '382', icon: <FiCheck />, color: 'from-emerald-500 to-teal-500' },
              { label: 'Times Shared', value: '1.2k', icon: <FiShare2 />, color: 'from-orange-500 to-red-500' },
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl md:rounded-[2rem] p-6 md:p-8 shadow-premium border border-pink-50 flex flex-col sm:flex-row items-center gap-4 md:gap-6 group hover:-translate-y-1 transition-transform duration-300 text-center sm:text-left"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} text-white flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="font-display text-3xl font-black text-gray-900 leading-none mb-1">{stat.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Templates Gallery */}
          <div className="mb-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h3 className="font-display text-3xl font-black text-gray-900 tracking-tight mb-2">Premium Templates</h3>
                <p className="text-gray-500 font-medium">Choose from our handcrafted selection of designer templates.</p>
              </div>
              <button className="text-[10px] font-black text-[#C2185B] uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-4 transition-all">
                View All <FiArrowRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { name: 'Royal Rajputana', category: 'Traditional', img: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80', isPopular: true },
                { name: 'Modern Minimalist', category: 'Minimal', img: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&q=80', isPopular: false },
                { name: 'Floral Elegance', category: 'Premium', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80', isPopular: true },
              ].map((template, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="group rounded-2xl md:rounded-[2rem] overflow-hidden bg-white shadow-premium border border-pink-50 relative"
                >
                  {template.isPopular && (
                    <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-[#1a1a2e] text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img src={template.img} alt={template.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <button className="bg-white text-[#C2185B] font-black text-[11px] uppercase tracking-[0.2em] py-3 px-8 rounded-full shadow-2xl hover:scale-105 transition-transform">
                        Use Template
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 absolute bottom-0 left-0 right-0 z-10">
                    <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1 block">
                      {template.category}
                    </span>
                    <h4 className="font-display text-2xl font-bold text-white leading-tight">
                      {template.name}
                    </h4>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Features Grid & Live Editor Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Features */}
            <div>
              <h3 className="font-display text-3xl font-black text-gray-900 tracking-tight mb-8">Everything you need</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: <FiLayout />, title: 'Drag & Drop Editor', desc: 'Customize easily without coding.' },
                  { icon: <FiSmartphone />, title: 'QR Code RSVP', desc: 'Scan to confirm attendance instantly.' },
                  { icon: <FiGlobe />, title: 'Multi-language', desc: 'Invite guests in their native tongue.' },
                  { icon: <FiShare2 />, title: 'WhatsApp Ready', desc: 'Optimized for instant messaging sharing.' },
                ].map((feat, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="flex gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-pink-50 text-[#C2185B] flex items-center justify-center text-xl flex-shrink-0">
                      {feat.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{feat.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Live Editor Panel Mockup */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-premium border border-gray-100 p-6 md:p-8"
            >
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center"><FiSettings size={14}/></div>
                  <span className="font-bold text-sm">Editor Preview</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Couple Names</label>
                  <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-sm font-medium text-gray-700 flex items-center justify-between">
                    <span>Aman & Priya</span>
                    <FiEdit3 className="text-gray-400" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Event Date</label>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-sm font-medium text-gray-700">
                      Dec 12, 2024
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Color Theme</label>
                    <div className="flex gap-2 mt-2">
                      <div className="w-8 h-8 rounded-full bg-[#C2185B] shadow-inner ring-2 ring-offset-2 ring-[#C2185B]" />
                      <div className="w-8 h-8 rounded-full bg-[#D4AF37] shadow-inner opacity-50 cursor-pointer" />
                      <div className="w-8 h-8 rounded-full bg-[#1a1a2e] shadow-inner opacity-50 cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="h-2 w-full bg-gradient-to-r from-[#C2185B] to-[#D4AF37] rounded-full opacity-20" />
                </div>
              </div>
            </motion.div>

          </div>
        </div>

      </div>
    </div>
  )
}
