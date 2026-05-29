import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  FiHome, FiUser, FiCalendar, FiHeart, FiUsers, FiMail,
  FiBell, FiSettings, FiBriefcase, FiGrid, FiDollarSign,
  FiImage, FiStar, FiMessageSquare, FiPieChart, FiTag, FiBookOpen, FiActivity, FiCheckSquare
} from 'react-icons/fi'
import { FaTruck } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'

export default function Sidebar({ closeSidebar, isCollapsed }) {
  const location = useLocation()
  const { user } = useSelector(s => s.auth || {})
  const role = user?.role
  const { t } = useTranslation()

  const userLinks = [
    { to: '/dashboard', label: t('userDashboard.dashboard', 'Dashboard'), icon: <FiHome /> },
    { to: '/profile', label: t('userDashboard.profile', 'My Profile'), icon: <FiUser /> },
    { to: '/bookings', label: t('userDashboard.myBookings', 'My Bookings'), icon: <FiCalendar /> },
    { to: '/wishlist', label: t('userDashboard.wishlist', 'Saved Vendors'), icon: <FiHeart /> },
    { to: '/guests', label: t('userDashboard.guests', 'Guests'), icon: <FiUsers /> },
    { to: '/invitation-creator', label: t('userDashboard.invitations', 'Invitations'), icon: <FiMail /> },
    { to: '/notifications', label: t('userDashboard.notifications', 'Notifications'), icon: <FiBell /> },
    { to: '/settings', label: t('userDashboard.settings', 'Settings'), icon: <FiSettings /> },
  ]

  const vendorLinks = [
    { to: '/vendor/dashboard', label: t('vendorDashboard.dashboard', 'Dashboard'), icon: <FiHome /> },
    { to: '/vendor/profile', label: t('vendorDashboard.profile', 'Business Profile'), icon: <FiBriefcase /> },
    { to: '/vendor/services', label: t('vendorDashboard.myServices', 'My Services'), icon: <FiGrid /> },
    { to: '/vendor/packages', label: t('vendorDashboard.packages', 'Packages'), icon: <FiTag /> },
    { to: '/vendor/gallery', label: t('vendorDashboard.gallery', 'Upload Gallery'), icon: <FiImage /> },
    { to: '/vendor/bookings', label: t('vendorDashboard.bookings', 'Customer Bookings'), icon: <FiCalendar /> },
    { to: '/vendor/calendar', label: t('vendorDashboard.calendar', 'Calendar'), icon: <FiActivity /> },
    { to: '/vendor/reviews', label: t('vendorDashboard.reviews', 'Reviews'), icon: <FiStar /> },
    { to: '/vendor/notifications', label: t('vendorDashboard.notifications', 'Notifications'), icon: <FiBell /> },
    { to: '/vendor/settings', label: t('vendorDashboard.settings', 'Settings'), icon: <FiSettings /> },
  ]

  // Add Imperial Fleet for Transport Vendors
  if (role === 'vendor') {
    vendorLinks.splice(4, 0, { to: '/vendor/manage-cabs', label: t('vendorDashboard.myFleet', 'My Fleet'), icon: <FaTruck /> })
  }

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: <FiHome /> },
    { to: '/admin/users', label: 'Manage Users', icon: <FiUsers /> },
    { to: '/admin/vendors', label: 'Manage Vendors', icon: <FiBriefcase /> },
    { to: '/admin/approvals', label: 'Approvals', icon: <FiActivity /> },
    { to: '/admin/services-approval', label: 'Service Approvals', icon: <FiCheckSquare /> },
    { to: '/admin/categories', label: 'Categories', icon: <FiTag /> },
    { to: '/admin/bookings', label: 'Bookings', icon: <FiCalendar /> },
    { to: '/admin/blogs', label: 'Blogs', icon: <FiBookOpen /> },
    { to: '/admin/leads', label: 'Leads', icon: <FiMessageSquare /> },
    { to: '/admin/imperial-fleet', label: 'Fleet Registry', icon: <FaTruck /> },
    { to: '/admin/reviews', label: 'Reviews', icon: <FiStar /> },
    { to: '/admin/settings', label: 'Settings', icon: <FiSettings /> },
  ]

  const links = role === 'admin' ? adminLinks : role === 'vendor' ? vendorLinks : userLinks

  return (
    <aside className="w-full h-full overflow-y-auto scrollbar-hide pb-24 md:pb-6">
      <div className="p-4 space-y-1.5 flex flex-col h-full">
        <div className="mb-6 hidden md:block px-4">
          {!isCollapsed && <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">{role} Workspace</p>}
        </div>

        {links.map((link) => {
          const isHome = link.to === '/dashboard' || link.to === '/admin' || link.to === '/vendor/dashboard'
          const isActive = isHome 
            ? location.pathname === link.to 
            : location.pathname.startsWith(link.to)
          
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeSidebar}
              className={`group flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 px-6'} py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-500 relative ${isActive
                  ? 'bg-white text-[#C2185B] shadow-premium border border-pink-50'
                  : 'text-gray-500 hover:bg-white hover:text-[#C2185B] hover:shadow-sm'
                }`}
              title={isCollapsed ? link.label : ''}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#C2185B] rounded-r-full shadow-lg shadow-pink-500/50" />
              )}
              <span className={`text-[18px] transition-all duration-500 ${isActive ? 'text-[#C2185B] scale-110 drop-shadow-md' : 'text-gray-300 group-hover:text-[#C2185B] group-hover:scale-110'}`}>
                {link.icon}
              </span>
              {!isCollapsed && (
                <span className="whitespace-nowrap tracking-wide">
                  {link.label}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
