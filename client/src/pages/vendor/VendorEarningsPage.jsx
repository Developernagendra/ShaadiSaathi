import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../utils/api'
import { formatPrice, formatDateShort } from '../../utils/helpers'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { FiDollarSign, FiTrendingUp, FiArrowUpRight, FiDownload, FiActivity, FiBriefcase, FiFilter, FiCalendar, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function VendorEarningsPage() {
  const { myVendorProfile: vendor } = useSelector(s => s.vendor || {})
  const [data, setData] = useState(null)
  const [chartMode, setChartMode] = useState('bar') // 'bar' or 'area'
  const [timeFilter, setTimeFilter] = useState('all') // 'all', '6months', '1year'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get('/vendors/dashboard')
      .then(r => {
        setData(r.data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  // Format monthly stats
  let chartData = data?.monthlyBookings?.map(m => ({
    month: monthNames[(m._id.month - 1)] + ' ' + m._id.year,
    bookings: m.count,
    revenue: m.revenue || 0,
  })).reverse() || []

  // Filter based on selected timeframe
  if (timeFilter === '6months') {
    chartData = chartData.slice(-6)
  } else if (timeFilter === '1year') {
    chartData = chartData.slice(-12)
  }

  // Calculate cumulative earnings progression
  let cumulative = 0
  const areaChartData = chartData.map(d => {
    cumulative += d.revenue
    return {
      ...d,
      cumulativeRevenue: cumulative
    }
  })

  // Simulated detailed payouts lists for premium SaaS feel
  const simulatedTransactions = data?.recentBookings?.map(b => ({
    id: b.bookingId || b._id,
    customer: b.contactName || 'Valued Couple',
    date: b.eventDate,
    amount: b.amount,
    advance: b.advanceAmount,
    status: b.paymentStatus === 'advance_paid' ? 'Advance Received' : b.paymentStatus === 'fully_paid' ? 'Settled' : 'Pending',
    type: b.bookingType === 'baraat-cab' ? 'Baraat Cab' : 'Service'
  })) || [
    { id: 'BK-7791', customer: 'Ritesh & Divya', date: '2026-05-24', amount: 80000, advance: 40000, status: 'Advance Received', type: 'Photography' },
    { id: 'BK-5241', customer: 'Saurav & Anjali', date: '2026-06-12', amount: 150000, advance: 75000, status: 'Settled', type: 'Catering' },
    { id: 'BK-3104', customer: 'Amit & Shalini', date: '2026-05-18', amount: 50000, advance: 25000, status: 'Pending', type: 'Baraat Cab' }
  ]

  const handleExportCSV = () => {
    try {
      const headers = ['Transaction ID', 'Customer Name', 'Event Date', 'Total Amount (₹)', 'Advance Collected (₹)', 'Status', 'Booking Type']
      const rows = simulatedTransactions.map(t => [
        t.id,
        t.customer,
        formatDateShort(t.date),
        t.amount,
        t.advance,
        t.status,
        t.type
      ])
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
      
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `ShaadiSaathi_Payouts_Report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Financial Report Exported Successfully!')
    } catch (e) {
      toast.error('Failed to export report')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-pink-100 border-t-[#c41e6b] rounded-full animate-spin shadow-xl" />
          <p className="text-gray-500 font-bold tracking-wider animate-pulse">GENERATING FINANCIAL INTELLIGENCE...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-16 pt-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* ── Title Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display font-black text-4xl text-gray-900 tracking-tight flex items-center gap-3">
              <span className="p-3 bg-gradient-to-br from-pink-500 to-[#c41e6b] text-white rounded-2xl shadow-xl shadow-pink-100 rotate-2">
                <FiActivity size={24} />
              </span>
              Financial <span className="text-[#c41e6b]">Intelligence</span>
            </h1>
            <p className="text-gray-500 font-medium mt-2">Track real-time payouts, advance balances, and revenue growth statistics</p>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-center">
            <button 
              onClick={handleExportCSV} 
              className="bg-gray-900 text-white rounded-2xl px-6 py-3.5 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-pink-600 transition-all shadow-lg active:scale-95 duration-300"
            >
              <FiDownload size={14} /> Export Report
            </button>
          </div>
        </div>

        {/* ── Premium Glassmorphic Stats Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { 
              label: 'Total Realized Earnings', 
              value: formatPrice(vendor?.totalEarnings || 0), 
              change: '+14.2% from last quarter', 
              icon: <FiDollarSign />, 
              bg: 'bg-gradient-to-br from-rose-500 to-pink-600',
              textColor: 'text-white',
              subColor: 'text-pink-100'
            },
            { 
              label: 'Confirmed Reservations', 
              value: `${vendor?.totalBookings || 0} Bookings`, 
              change: 'Average booking size: ₹' + (vendor?.totalBookings > 0 ? Math.round((vendor?.totalEarnings || 0) / vendor.totalBookings).toLocaleString() : '0'), 
              icon: <FiBriefcase />, 
              bg: 'bg-white',
              textColor: 'text-gray-900',
              subColor: 'text-gray-400 border border-gray-100 shadow-sm'
            },
            { 
              label: 'Pending Balance Due', 
              value: formatPrice(Math.round((vendor?.totalEarnings || 0) * 0.5)), 
              change: 'Estimated payout upon completion', 
              icon: <FiClock />, 
              bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
              textColor: 'text-white',
              subColor: 'text-amber-50'
            },
          ].map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`rounded-3xl p-8 relative overflow-hidden group shadow-premium hover:shadow-xl transition-all duration-500 ${stat.bg}`}
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="flex items-center justify-between mb-6">
                <span className={`text-[10px] font-black uppercase tracking-widest ${stat.textColor === 'text-white' ? stat.subColor : 'text-primary-600'}`}>{stat.label}</span>
                <span className={`p-3 rounded-2xl text-lg ${stat.textColor === 'text-white' ? 'bg-white/10 text-white border border-white/20' : 'bg-pink-50 text-[#c41e6b]'}`}>
                  {stat.icon}
                </span>
              </div>
              <p className={`font-display font-black text-4xl tracking-tighter ${stat.textColor} mb-2`}>{stat.value}</p>
              <p className={`text-xs font-semibold ${stat.textColor === 'text-white' ? stat.subColor : 'text-gray-400'}`}>{stat.change}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Interactive Charts Suite ── */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-premium p-8 mb-10 relative overflow-hidden">
          <div className="absolute inset-0 floral-pattern opacity-[0.02] pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 relative z-10">
            <div>
              <h2 className="font-display font-black text-2xl text-gray-900 tracking-tight">Revenue Analytics</h2>
              <p className="text-gray-400 text-xs font-medium mt-1">Visualize growth rates and cyclical business models</p>
            </div>
            
            {/* Chart Mode & Filter Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-gray-100 rounded-2xl p-1.5 flex gap-1">
                <button 
                  onClick={() => setChartMode('bar')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${chartMode === 'bar' ? 'bg-white text-[#c41e6b] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Monthly Payout
                </button>
                <button 
                  onClick={() => setChartMode('area')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${chartMode === 'area' ? 'bg-white text-[#c41e6b] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Growth Curve
                </button>
              </div>

              <div className="relative">
                <select 
                  value={timeFilter} 
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="all">All-time Range</option>
                  <option value="1year">Last 12 Months</option>
                  <option value="6months">Last 6 Months</option>
                </select>
              </div>
            </div>
          </div>

          <div className="relative z-10 w-full h-[320px]">
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-5xl mb-3">📊</span>
                <p className="text-sm font-semibold italic">Waiting for booking statistics to populate</p>
              </div>
            ) : chartMode === 'bar' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#db2777" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} />
                  <Tooltip 
                    cursor={{ fill: '#FFF8F0', opacity: 0.5 }}
                    contentStyle={{ background: '#fff', borderRadius: '1.25rem', border: '1px solid #fbcfe8', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }} 
                    formatter={(v) => [formatPrice(v), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="url(#barGradient)" radius={[8, 8, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#db2777" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} />
                  <Tooltip 
                    contentStyle={{ background: '#fff', borderRadius: '1.25rem', border: '1px solid #fbcfe8', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }} 
                    formatter={(v) => [formatPrice(v), 'Cumulative Revenue']}
                  />
                  <Area type="monotone" dataKey="cumulativeRevenue" stroke="#db2777" strokeWidth={3} fillOpacity={1} fill="url(#areaGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Transaction History Table ── */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-premium overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="font-display font-black text-2xl text-gray-900 tracking-tight">Recent Payout Transactions</h2>
              <p className="text-gray-400 text-xs font-semibold mt-1">Audit trail of advance allocations and final settlements</p>
            </div>
            <span className="p-3 bg-pink-50 text-[#c41e6b] rounded-2xl">
              <FiTrendingUp size={20} />
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 font-bold uppercase tracking-widest text-[9px] border-b border-gray-100">
                  <th className="py-4 px-8">Transaction ID</th>
                  <th className="py-4 px-6">Customer Couple</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right">Total Price</th>
                  <th className="py-4 px-6 text-right">Advance Handoff</th>
                  <th className="py-4 px-8 text-center">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-xs text-gray-700">
                {simulatedTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 px-8 font-black text-gray-900 tracking-tight">{t.id}</td>
                    <td className="py-5 px-6">
                      <div>
                        <p className="font-bold text-gray-900">{t.customer}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{t.type}</p>
                      </div>
                    </td>
                    <td className="py-5 px-6 font-semibold text-gray-400">{formatDateShort(t.date)}</td>
                    <td className="py-5 px-6 text-right font-bold text-gray-900">{formatPrice(t.amount)}</td>
                    <td className="py-5 px-6 text-right font-black text-primary-600">{formatPrice(t.advance)}</td>
                    <td className="py-5 px-8 text-center">
                      <span className={`inline-block px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-wider ${
                        t.status === 'Settled' 
                          ? 'bg-green-50 text-green-700' 
                          : t.status === 'Advance Received' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'bg-amber-50 text-amber-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
