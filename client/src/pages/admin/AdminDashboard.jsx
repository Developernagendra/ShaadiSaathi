// AdminDashboard.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { formatPrice, formatDateShort } from '../../utils/helpers'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FiUsers, FiBriefcase, FiCalendar, FiDollarSign, FiClock, FiArrowRight } from 'react-icons/fi'
import { FaTruck } from 'react-icons/fa'
import { getSocket } from '../../utils/socket'
import { toast } from 'react-hot-toast'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    api.get('/admin/stats')
      .then(res => setData(res.data.data))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

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
  }, [])

  if (loading) return (
    <div className="min-h-screen pt-12 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-gray-100 border-t-primary-600 rounded-full animate-spin shadow-xl" />
        <p className="text-gray-500 font-medium animate-pulse">Loading Admin Data...</p>
      </div>
    </div>
  )

  const stats = [
    { label: 'Total Users', value: data?.stats?.totalUsers || 0, icon: <FiUsers />, bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50', color: 'text-blue-600', link: '/admin/users' },
    { label: 'Active Vendors', value: data?.stats?.totalVendors || 0, icon: <FiBriefcase />, bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50', color: 'text-emerald-600', link: '/admin/vendors' },
    { label: 'Pending Approvals', value: data?.stats?.pendingVendors || 0, icon: <FiClock />, bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50', color: 'text-amber-600', link: '/admin/approvals' },
    { label: 'Total Bookings', value: data?.stats?.totalBookings || 0, icon: <FiCalendar />, bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50', color: 'text-purple-600', link: '/admin/bookings' },
    { label: 'Completed', value: data?.stats?.completedBookings || 0, icon: <FiCalendar />, bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50', color: 'text-indigo-600', link: '/admin/bookings' },
    { label: 'Imperial Fleet', value: data?.stats?.totalCabs || 0, icon: <FaTruck />, bg: 'bg-gradient-to-br from-gray-50 to-gray-200/50', color: 'text-gray-900', link: '/admin/imperial-fleet' },
  ]

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const chartData = (data?.monthlyBookings || [])
    .filter(m => m._id && m._id.month)
    .map(m => ({
      month: monthNames[(m._id.month - 1)] || 'Unknown',
      bookings: m.count || 0,
      revenue: m.revenue || 0,
    })).reverse()

  return (
    <div className="pb-24 animate-fade-in relative">
      <div className="absolute inset-0 floral-pattern opacity-[0.03] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10 px-4">
        {/* Imperial Registry Oversight Header */}
        <div className="bg-gradient-to-br from-[#1a1a1a] via-[#8E244D] to-[#C2185B] rounded-[3rem] p-10 md:p-20 mb-12 text-white relative overflow-hidden shadow-premium">
          <div className="absolute inset-0 floral-pattern opacity-[0.05]" />
          <div className="absolute top-0 right-0 w-72 h-72 md:w-[500px] md:h-[500px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-white/10 backdrop-blur-xl border-2 border-white/20 p-1 flex items-center justify-center shadow-2xl flex-shrink-0 relative group">
              <div className="w-full h-full rounded-[2rem] overflow-hidden bg-gray-900 flex items-center justify-center">
                <span className="text-6xl font-display font-black text-[#D4AF37]">🏛️</span>
              </div>
            </div>
            
            <div className="text-center md:text-left flex-1">
              <div className="divider-luxe !justify-start mb-6 !gap-3">
                <div className="divider-line !bg-[#D4AF37]/30 !w-8" />
                <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.5em] italic">Admin Dashboard Overview</span>
                <div className="divider-line !bg-[#D4AF37]/30 !w-8" />
              </div>
              <h1 className="font-display text-4xl md:text-7xl font-black mb-6 tracking-tighter leading-none">
                Admin <span className="text-[#D4AF37]">Dashboard</span>
              </h1>
              <p className="text-white/60 text-xl font-medium italic drop-shadow-md">Managing Bihar's top wedding vendors and couples.</p>
            </div>
            
            <div className="flex flex-col gap-4 relative z-10">
              <Link to="/admin/approvals" className="bg-[#C2185B] text-white font-black text-[10px] uppercase tracking-[0.3em] py-5 px-10 rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                Review Approvals <FiArrowRight size={16} />
              </Link>
              <Link to="/admin/categories" className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-[10px] uppercase tracking-[0.3em] py-5 px-10 rounded-2xl hover:bg-white/20 transition-all text-center">
                Manage Categories
              </Link>
            </div>
          </div>
        </div>

        {/* Imperial Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          {stats.map((s, i) => (
            <Link key={s.label} to={s.link} className="bg-white rounded-[2rem] p-8 shadow-premium hover:shadow-premium-hover border border-pink-50 transition-all duration-700 group relative overflow-hidden flex flex-col items-center text-center">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-pink-50 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-700" />
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-[#FFF8F0] text-[#C2185B] shadow-sm group-hover:rotate-12 transition-all`}>
                <span className="text-2xl">{s.icon}</span>
              </div>
              <p className="font-display text-4xl font-black text-gray-900 tracking-tighter mb-2 leading-none">{s.value}</p>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37] italic">{s.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
          {/* Revenue Ledger (Charts) */}
          <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-premium border border-pink-50 p-10 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFF8F0] rounded-bl-full opacity-40" />
            
            <div className="flex items-center justify-between mb-12 relative z-10">
              <h2 className="font-display text-3xl font-black text-gray-900 tracking-tight">Booking Analytics</h2>
              <select className="bg-[#FFF8F0] border border-pink-50 text-[10px] font-black text-gray-600 uppercase tracking-widest rounded-xl py-3 px-6 outline-none shadow-sm italic">
                <option>Current Month</option>
                <option>Previous Months</option>
              </select>
            </div>
            
            <div className="h-72 md:h-[400px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={15} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#FFF8F0', opacity: 0.5 }} 
                    contentStyle={{ borderRadius: '24px', border: '1px solid #fdf2f8', boxShadow: '0 20px 50px rgba(194, 24, 91, 0.05)', padding: '20px' }} 
                  />
                  <Bar dataKey="bookings" fill="url(#colorRoyal)" radius={[12, 12, 0, 0]} name="Bookings" barSize={40} />
                  <defs>
                    <linearGradient id="colorRoyal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C2185B" stopOpacity={1} />
                      <stop offset="100%" stopColor="#8E244D" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Imperial Petitions (Pending Approvals) */}
          <div className="bg-white rounded-[3rem] shadow-premium border border-pink-50 p-10 md:p-12 flex flex-col relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-50/10 rounded-tl-full opacity-40" />
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <h2 className="font-display text-3xl font-black text-gray-900 tracking-tight leading-none">Petitions</h2>
              <Link to="/admin/approvals" className="w-12 h-12 rounded-2xl bg-[#FFF8F0] hover:bg-[#C2185B] text-[#C2185B] hover:text-white flex items-center justify-center transition-all shadow-sm">
                <FiArrowRight size={20} />
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide relative z-10">
              {(data?.recentVendors || []).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-[#FFF8F0]/30 rounded-[2.5rem] border border-dashed border-pink-100 min-h-[300px]">
                  <span className="text-6xl mb-6">🔱</span>
                  <h3 className="font-display text-2xl font-black text-gray-900 mb-2 tracking-tight">Everything Clear</h3>
                  <p className="text-gray-400 font-medium italic">No pending approvals at the moment.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(data?.recentVendors || []).map(v => (
                    <div key={v._id} className="flex items-center gap-6 p-6 bg-[#FFF8F0]/50 rounded-[2rem] border border-transparent hover:border-pink-50 transition-all duration-500 group">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-lg font-display font-black text-[#C2185B] flex-shrink-0">
                        {v.businessName?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-xl font-black text-gray-900 truncate group-hover:text-[#C2185B] transition-colors leading-none mb-2">{v.businessName}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">{v.category?.name}</p>
                      </div>
                      <Link to={`/admin/approvals`} className="text-[9px] font-black px-6 py-3 rounded-xl bg-gradient-to-r from-[#C2185B] to-[#8E244D] text-white shadow-lg shadow-pink-200/50 hover:from-[#8E244D] hover:to-[#5C1130] transition-all uppercase tracking-[0.2em] italic hover:scale-105 active:scale-95">
                        Review
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Imperial Registry Scroll (Users Table) */}
        <div className="bg-white rounded-[3rem] shadow-premium border border-pink-50 overflow-hidden mb-12">
          <div className="p-10 md:p-12 border-b border-pink-50 flex items-center justify-between bg-gradient-to-r from-[#FFF8F0] to-white">
            <h2 className="font-display text-3xl font-black text-gray-900 flex items-center gap-6">
              <span className="p-4 bg-white shadow-sm text-[#C2185B] rounded-[1.5rem]"><FiUsers size={28} /></span>
              Recent Users
            </h2>
            <Link to="/admin/users" className="text-[10px] font-black text-[#C2185B] uppercase tracking-[0.3em] bg-white border border-pink-50 px-8 py-4 rounded-2xl shadow-xl hover:scale-105 transition-all italic">View All Users</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#FFF8F0]/30">
                <tr>
                  {['Full Name', 'Email Address', 'Joined Date', 'Role', 'Status'].map(h => (
                    <th key={h} className="py-6 px-10 text-gray-400 font-black text-[9px] uppercase tracking-[0.3em] italic">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {(data?.recentUsers || []).map(u => (
                  <tr key={u._id} className="hover:bg-[#FFF8F0]/50 transition-all duration-500 group">
                    <td className="py-6 px-10">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center font-display font-black text-[#D4AF37] text-xl border border-pink-50">
                          {u.name?.charAt(0)}
                        </div>
                        <span className="font-display text-2xl font-black text-gray-900 group-hover:text-[#C2185B] transition-colors leading-none">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-6 px-10 text-[10px] font-black text-gray-400 uppercase tracking-widest">{u.email}</td>
                    <td className="py-6 px-10 text-[10px] font-black text-[#D4AF37] uppercase tracking-widest italic">{formatDateShort(u.createdAt)}</td>
                    <td className="py-6 px-10">
                      <span className={`text-[8px] font-black px-4 py-1.5 rounded-lg uppercase tracking-[0.2em] italic ${u.role === 'admin' ? 'bg-[#8E244D] text-white shadow-lg shadow-pink-900/20' :
                          u.role === 'vendor' ? 'bg-[#FFF8F0] text-[#8E244D] border border-pink-100 shadow-sm' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {u.role === 'admin' ? 'Admin' : u.role === 'vendor' ? 'Vendor' : 'User'}
                      </span>
                    </td>
                    <td className="py-6 px-10">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse" />
                        <span className="text-[10px] font-black text-green-700 uppercase tracking-widest italic">Active</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { to: '/admin/users', icon: '👥', label: 'User Management', desc: 'Manage registered users' },
            { to: '/admin/vendors', icon: '🏪', label: 'Vendor Management', desc: 'Manage verified vendors' },
            { to: '/admin/bookings', icon: '📅', label: 'Booking History', desc: 'View all platform bookings' },
            { to: '/admin/categories', icon: '🏷️', label: 'Categories', desc: 'Manage service categories' },
            { to: '/admin/imperial-fleet', icon: '🚗', label: 'Imperial Fleet', desc: 'Manage wedding transport' },
          ].map(({ to, icon, label, desc }) => (
            <Link key={to} to={to} className="bg-white rounded-[2rem] p-10 border border-pink-50 shadow-premium hover:shadow-premium-hover transition-all duration-700 group flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#FFF8F0] flex items-center justify-center text-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm">
                {icon}
              </div>
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] italic group-hover:text-[#C2185B] transition-colors mb-2">{label}</p>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest italic">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
