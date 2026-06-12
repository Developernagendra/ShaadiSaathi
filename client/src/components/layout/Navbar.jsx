import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logoutUser } from '../../store/slices/authSlice'
import { fetchNotifications, markAllRead, markSingleRead } from '../../store/slices/notificationSlice'
import { getInitials, timeAgo } from '../../utils/helpers'
import {
  FiMenu, FiX, FiUser, FiLogOut, FiHeart, FiShoppingCart,
  FiBell, FiHome, FiGrid, FiMessageCircle, FiChevronDown, FiBriefcase, FiCalendar, FiSearch
} from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import api from '../../utils/api'
import { apiCache } from '../../utils/apiCache'
import BrandLogo from '../common/BrandLogo'

// Preload component chunk
const preloadBaraatCabsChunk = () => import('../../pages/BaraatCabsPage')

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useSelector((s) => s.auth || {})
  const { items: notifications = [], unreadCount = 0 } = useSelector((s) => s.notifications || {})
  const { cartItems = [] } = useSelector((s) => s.ui || {})

  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const userMenuRef = useRef(null)
  const notifRef = useRef(null)
  const isHome = location.pathname === '/'
  const { t, i18n } = useTranslation()

  const handleLanguageToggle = () => {
    const newLang = i18n.language === 'hi' ? 'en' : 'hi'
    i18n.changeLanguage(newLang)
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchNotifications())
  }, [isAuthenticated, dispatch])

  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    dispatch(logoutUser())
    toast.success('Logged out successfully')
    navigate('/')
    setUserMenuOpen(false)
  }

  const navTransparent = isHome && !scrolled

  const publicLinks = [
    { to: '/services', label: t('nav.vendors', 'Vendors'), icon: <FiSearch /> },
    { to: '/ai-planner', label: t('nav.aiPlanner', 'AI Planner'), icon: <FiGrid /> },
    { to: '/budget-calculator', label: t('nav.budget', 'Budget'), icon: <FiCalendar /> },
    { to: '/baraat-cabs', label: t('nav.cabs', 'Baraat Cabs'), icon: '🚗' },
  ]

  const navLinks = !isAuthenticated
    ? publicLinks
    : user?.role === 'admin'
      ? [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/vendors', label: 'Vendors' },
        { to: '/admin/users', label: 'Users' },
      ]
      : user?.role === 'vendor'
        ? [
          { to: '/vendor/dashboard', label: t('nav.vendorDashboard', 'Vendor Dashboard') },
          { to: '/vendor/services', label: t('nav.services', 'My Services') },
          { to: '/vendor/bookings', label: t('nav.booking', 'Bookings') },
        ]
        : [
          { to: '/dashboard', label: t('nav.userDashboard', 'Dashboard') },
          { to: '/bookings', label: t('nav.booking', 'Bookings') },
          { to: '/wishlist', label: 'Wishlist' },
          { to: '/baraat-cabs', label: 'Baraat Cabs' },
        ]

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin'
    if (user?.role === 'vendor') return '/vendor/dashboard'
    return '/dashboard'
  }

  const handlePreloadBaraatCabs = () => {
    // 1. Preload the React Component Chunk
    preloadBaraatCabsChunk().catch(() => { });

    // 2. Preload the initial API data (if not already cached)
    // Must match the exact key BaraatCabsPage uses on mount (empty city = empty params)
    const cacheKey = `/fleet/browse?`;

    if (!apiCache.has(cacheKey)) {
      api.get(cacheKey).then(res => {
        if (res.data?.status === 'success') {
          apiCache.set(cacheKey, res.data);
        }
      }).catch(() => { });
    }
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navTransparent ? 'bg-transparent py-6' : 'bg-white/90 backdrop-blur-md shadow-premium border-b border-pink-50 py-3'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* ── Logo ── */}
            <BrandLogo 
              isDark={navTransparent} 
              onClick={() => setMobileOpen(false)} 
            />

            {/* ── Desktop Nav Links ── */}
            <div className="hidden lg:flex items-center gap-2">
              {navLinks.map((link) => {
                const isCabs = link.to === '/baraat-cabs';
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onMouseEnter={isCabs ? handlePreloadBaraatCabs : undefined}
                    className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-[0.2em] font-black transition-all duration-300 relative group flex items-center gap-2 ${isCabs
                      ? (navTransparent ? 'bg-white/10 text-white border border-white/30' : 'bg-[#FFF8F0] text-primary-600 border border-gold-200 shadow-sm hover:shadow-md')
                      : (navTransparent ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-primary-600')
                      } ${location.pathname === link.to ? (navTransparent ? 'text-white bg-white/20' : 'text-primary-600 bg-pink-50') : ''}`}
                  >
                    {isCabs && <span className="text-sm animate-pulse">🚗</span>}
                    {link.label}
                    {!isCabs && (
                      <span className={`absolute bottom-0 left-4 right-4 h-0.5 bg-[#D4AF37] transform origin-left transition-transform duration-300 scale-x-0 group-hover:scale-x-100 ${location.pathname === link.to ? 'scale-x-100' : ''}`} />
                    )}
                  </Link>
                );
              })}

              {!isAuthenticated && (
                <Link
                  to="/register/vendor"
                  className={`ml-4 px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-[0.2em] font-black transition-all duration-300 flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 ${navTransparent
                    ? 'bg-white text-primary-600 hover:bg-gold-50'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                >
                  <FiBriefcase size={14} />
                  Apna Business Jodein
                </Link>
              )}
            </div>

            {/* ── Right Side Actions ── */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Language Switcher */}
              <button
                onClick={handleLanguageToggle}
                className={`hidden sm:flex px-3 py-1.5 rounded-xl text-[11px] font-black tracking-widest transition-all ${navTransparent
                  ? 'text-white border border-white/20 hover:bg-white/10'
                  : 'text-primary-600 border border-primary-100 hover:bg-primary-50'
                  }`}
              >
                {i18n.language === 'hi' ? 'EN' : 'हिन्दी'}
              </button>

              {isAuthenticated ? (
                <>
                  {/* Cart */}
                  <Link to="/cart" className={`relative p-2.5 rounded-xl transition-all active:scale-95 group ${navTransparent ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-pink-50'}`}>
                    <FiShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
                    {cartItems.length > 0 && <span className="absolute top-1 right-1 bg-primary-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm ring-2 ring-white">{cartItems.length}</span>}
                  </Link>

                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <button onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false) }} className={`relative p-3 rounded-xl transition-all active:scale-95 border ${navTransparent ? 'text-white border-white/20 hover:bg-white/10' : 'text-gray-500 border-gray-100 hover:bg-pink-50 hover:text-primary-600'}`}>
                      <FiBell size={18} />
                      {unreadCount > 0 && <span className="absolute top-2 right-2 bg-primary-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-sm ring-2 ring-white animate-bounce">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </button>

                    <AnimatePresence>
                      {notifOpen && (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-[-60px] md:right-0 top-16 w-[90vw] md:w-96 max-w-sm bg-white rounded-[2rem] shadow-premium border border-pink-50 overflow-hidden z-50">
                          <div className="absolute inset-0 floral-pattern opacity-[0.02] pointer-events-none" />
                          <div className="flex items-center justify-between px-6 py-5 border-b border-pink-50 bg-[#FFF8F0]/50 relative z-10">
                            <h3 className="font-display font-black text-lg text-gray-900">Notifications</h3>
                            {unreadCount > 0 && <button onClick={() => dispatch(markAllRead())} className="text-[9px] font-black text-primary-600 uppercase tracking-widest italic">Mark all Read</button>}
                          </div>
                          <div className="max-h-[350px] overflow-y-auto relative z-10 scrollbar-hide">
                            {notifications.length === 0 ? (
                              <div className="text-center py-12 text-gray-400">
                                <FiBell size={32} className="mx-auto mb-3 opacity-20" />
                                <p className="text-xs font-medium italic">No new alerts</p>
                              </div>
                            ) : (
                              notifications.slice(0, 8).map((n) => (
                                <div
                                  key={n._id}
                                  onClick={() => {
                                    if (!n.isRead) {
                                      dispatch(markSingleRead(n._id))
                                    }
                                    if (n.link) {
                                      navigate(n.link)
                                    } else {
                                      navigate('/dashboard')
                                    }
                                    setNotifOpen(false)
                                  }}
                                  className={`px-6 py-4 hover:bg-[#FFF8F0]/30 transition-all duration-200 border-b border-pink-50 last:border-0 cursor-pointer flex gap-3 items-start relative group ${!n.isRead ? 'bg-primary-50/20' : ''}`}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs font-black text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">{n.title}</p>
                                      {!n.isRead && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch(markSingleRead(n._id));
                                          }}
                                          className="w-2 h-2 rounded-full bg-primary-600 self-center shadow-sm"
                                          title="Mark as read"
                                        />
                                      )}
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-semibold leading-relaxed line-clamp-2">{n.message}</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-[#D4AF37] mt-2">{timeAgo(n.createdAt)}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* User Menu */}
                  <div className="relative hidden sm:block" ref={userMenuRef}>
                    <button onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false) }} className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-all border shadow-sm ${navTransparent ? 'border-white/20 bg-white/10 text-white hover:bg-white/20' : 'border-gray-100 bg-white hover:bg-pink-50'}`}>
                      {user?.avatar?.url ? (
                        <img src={user.avatar.url} alt={user.name} className="w-8 h-8 rounded-lg object-cover border border-gray-100" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C2185B] to-[#8E244D] flex items-center justify-center text-white text-[10px] font-black">
                          {getInitials(user?.name)}
                        </div>
                      )}
                      <FiChevronDown size={14} className={`${navTransparent ? 'text-white/80' : 'text-gray-400'} ${userMenuOpen ? 'rotate-180' : ''} transition-transform hidden sm:block`} />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-0 top-14 w-64 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(194,24,91,0.2)] border border-white overflow-hidden z-50">
                          <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200">
                            <p className="font-black text-gray-900 text-xs truncate">{user?.name}</p>
                            <p className="text-[9px] font-bold text-primary-600 uppercase tracking-widest mt-1">{user?.role}</p>
                          </div>
                          <div className="p-1.5">
                            {[
                              { to: getDashboardLink(), icon: <FiHome />, label: 'Dashboard' },
                              { to: '/profile', icon: <FiUser />, label: 'Profile' },
                              { to: '/bookings', icon: <FiCalendar />, label: 'Bookings' },
                              { to: '/wishlist', icon: <FiHeart />, label: 'Wishlist' },
                              { to: '/chat', icon: <FiMessageCircle />, label: 'Messages' },
                            ].map((item) => (
                              <Link key={item.to} to={item.to} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-pink-50 hover:text-primary-600 transition-colors">
                                <span className="text-gray-400">{item.icon}</span>{item.label}
                              </Link>
                            ))}
                            <div className="h-px bg-gray-100 my-1.5 mx-3" />
                            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
                              <FiLogOut className="text-red-400" /> Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <Link to="/login" className={`text-[11px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all ${navTransparent ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}>Login</Link>
                  <Link to="/register" className={`bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl shadow-lg hover:bg-primary-700 transition-all hover:scale-105 active:scale-95`}>Join</Link>
                </div>
              )}

              {/* Mobile Toggle */}
              <button onClick={() => setMobileOpen(true)} className={`lg:hidden p-2.5 rounded-xl transition-all active:scale-90 ${navTransparent ? 'text-white bg-white/10' : 'text-gray-900 bg-gray-100'}`}>
                <FiMenu size={22} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white/95 backdrop-blur-2xl rounded-l-[2.5rem] z-[70] shadow-[0_0_60px_rgba(194,24,91,0.15)] overflow-hidden flex flex-col border-l border-white/50">
              <div className="absolute inset-0 floral-pattern opacity-[0.03] pointer-events-none" />

              <div className="p-6 flex items-center justify-between border-b border-pink-50 relative z-10">
                <BrandLogo asLink={false} />
                <button onClick={() => setMobileOpen(false)} className="p-2 bg-gray-100 rounded-xl text-gray-500 active:scale-90 transition-transform">
                  <FiX size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 relative z-10">
                {navLinks.map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${location.pathname === link.to ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <span className="text-xl">{link.icon || <FiGrid />}</span>
                    {link.label}
                  </Link>
                ))}

                {!isAuthenticated && (
                  <Link to="/register/vendor" onClick={() => setMobileOpen(false)} className="flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold bg-gold-50 text-gold-700 border border-gold-200">
                    <span className="text-xl">🏪</span>
                    Apna Business Jodein
                  </Link>
                )}
              </div>

              <div className="p-6 border-t border-pink-50 relative z-10 bg-gray-50">
                {!isAuthenticated ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-center text-gray-700 bg-white border border-gray-200 shadow-sm">Login</Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-center text-white bg-primary-600 shadow-lg shadow-primary-900/20">Join</Link>
                  </div>
                ) : (
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold text-red-600 bg-white border border-red-50 shadow-sm">
                    <FiLogOut /> Sign Out
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

