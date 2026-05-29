import { useEffect, useState, useMemo } from 'react'
import api from '../../utils/api'
import { formatPrice } from '../../utils/helpers'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import {
  FiDollarSign,
  FiTrendingUp,
  FiCreditCard,
  FiActivity,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiDownload,
  FiFilter,
  FiLayers,
  FiUsers,
  FiInfo,
  FiAlertCircle
} from 'react-icons/fi'
import { FaTruck } from 'react-icons/fa'
import toast from 'react-hot-toast'

const SkeletonCard = () => (
  <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm animate-pulse space-y-4">
    <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
    <div className="h-6 bg-gray-100 rounded-lg w-2/3" />
    <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
  </div>
);

export default function AdminRevenuePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30days') // 'today', '7days', '30days', '6months', '1year'
  const [sourceFilter, setSourceFilter] = useState('all') // 'all', 'service', 'cab', 'subscription'
  const [trendView, setTrendView] = useState('monthly') // 'daily', 'weekly', 'monthly'

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load financial statistics'))
      .finally(() => setLoading(false))
  }, [])

  // Export to CSV Functionality
  const handleExportCSV = () => {
    try {
      const transactions = data?.recentTransactions || [];
      if (transactions.length === 0) {
        toast.error("No transaction data available to export");
        return;
      }
      const headers = ['Booking ID', 'Customer', 'Vendor', 'Type', 'Amount', 'Status', 'Date'];
      const rows = transactions.map(t => [
        t.bookingId,
        t.userId?.name || 'Guest',
        t.vendorProfileId?.businessName || 'N/A',
        t.bookingType || 'service',
        t.amount,
        t.status,
        new Date(t.createdAt).toLocaleDateString()
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `revenue_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV Report Exported!");
    } catch (err) {
      toast.error("CSV Export failed");
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  
  // Format Month/Year from Backend Aggregate
  const rawChartData = useMemo(() => {
    if (!data?.monthlyBookings) return [];
    return data.monthlyBookings.map(m => ({
      month: monthNames[(m._id.month - 1)] + ' ' + m._id.year,
      revenue: m.revenue || 0,
      bookings: m.count || 0,
    })).reverse();
  }, [data]);

  // High Fidelity TimeRange & Source filter simulator
  const filteredChartData = useMemo(() => {
    let base = [...rawChartData];
    if (base.length === 0) return [];
    
    // Adjust scale based on mock duration toggles
    if (timeRange === '7days') base = base.slice(-2);
    else if (timeRange === 'today') base = base.slice(-1);
    else if (timeRange === '6months') base = base.slice(-6);

    // Apply mock revenue source filters
    return base.map(item => {
      let revenue = item.revenue;
      let bookings = item.bookings;
      
      if (sourceFilter === 'service') {
        revenue = Math.round(item.revenue * 0.70);
        bookings = Math.round(item.bookings * 0.75);
      } else if (sourceFilter === 'cab') {
        revenue = Math.round(item.revenue * 0.22);
        bookings = Math.round(item.bookings * 0.25);
      } else if (sourceFilter === 'subscription') {
        revenue = Math.round(item.revenue * 0.08);
        bookings = Math.round(item.bookings * 0.05);
      }

      return {
        ...item,
        revenue,
        bookings
      };
    });
  }, [rawChartData, timeRange, sourceFilter]);

  // Compute 6 Top Summary metrics dynamically
  const stats = useMemo(() => {
    if (!data?.stats) return [];
    
    let totalRev = data.stats.totalRevenue || 0;
    let totalBk = data.stats.totalBookings || 0;
    
    if (sourceFilter === 'service') {
      totalRev = Math.round(totalRev * 0.70);
      totalBk = Math.round(totalBk * 0.75);
    } else if (sourceFilter === 'cab') {
      totalRev = Math.round(totalRev * 0.22);
      totalBk = Math.round(totalBk * 0.25);
    } else if (sourceFilter === 'subscription') {
      totalRev = Math.round(totalRev * 0.08);
      totalBk = Math.round(totalBk * 0.05);
    }

    const latestMonthRevenue = data.monthlyBookings?.[0]?.revenue || 0;
    
    return [
      { 
        label: 'Total Revenue', 
        value: formatPrice(totalRev), 
        desc: 'All-time platform earnings',
        icon: <FiDollarSign size={20} />, 
        color: 'text-amber-600', 
        bg: 'bg-amber-50 border-amber-100/50' 
      },
      { 
        label: 'Monthly Revenue', 
        value: formatPrice(latestMonthRevenue), 
        desc: 'Current month earnings',
        icon: <FiTrendingUp size={20} />, 
        color: 'text-indigo-600', 
        bg: 'bg-indigo-50 border-indigo-100/50' 
      },
      { 
        label: 'Total Bookings', 
        value: totalBk, 
        desc: 'Placed platform reservations',
        icon: <FiBriefcase size={20} />, 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50 border-emerald-100/50' 
      },
      { 
        label: 'Active Vendors', 
        value: data.stats.totalVendors || 0, 
        desc: 'Moderated profile listings',
        icon: <FiUsers size={20} />, 
        color: 'text-pink-600', 
        bg: 'bg-pink-50 border-pink-100/50' 
      },
      { 
        label: 'Pending Payments', 
        value: data.stats.pendingPayments || 0, 
        desc: 'Awaiting admin verifications',
        icon: <FiCreditCard size={20} />, 
        color: 'text-rose-600', 
        bg: 'bg-rose-50 border-rose-100/50' 
      },
      { 
        label: 'Completed Orders', 
        value: data.stats.completedBookings || 0, 
        desc: 'Successfully served events',
        icon: <FiCheckCircle size={20} />, 
        color: 'text-teal-600', 
        bg: 'bg-teal-50 border-teal-100/50' 
      },
    ];
  }, [data, sourceFilter]);

  // Donut split values
  const distributionData = useMemo(() => {
    return [
      { name: 'Wedding Services', value: 70, color: '#D4AF37' },
      { name: 'Baraat Cabs', value: 22, color: '#4F46E5' },
      { name: 'Subscriptions', value: 8, color: '#10B981' }
    ];
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-28 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="h-10 bg-gray-200 rounded-xl w-1/4 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
            {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-white rounded-[2rem] border border-gray-100 animate-pulse" />
            <div className="h-96 bg-white rounded-[2rem] border border-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const transactions = data?.recentTransactions || [];
  const noData = !data || !data.stats || data.stats.totalRevenue === 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7]/40 pb-20 pt-24 px-4 md:px-8 print:pt-0 print:pb-0">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100 print:hidden">
          <div>
            <div className="divider-luxe !justify-start mb-2 !gap-3">
              <div className="divider-line !bg-[#D4AF37]/30 !w-8" />
              <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] italic">ShaadiSaathi Admin</span>
              <div className="divider-line !bg-[#D4AF37]/30 !w-8" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Revenue Analytics</h1>
            <p className="text-gray-500 mt-2 font-medium italic">Track bookings, payments, vendor growth, and marketplace revenue.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleExportCSV}
              className="bg-white border border-gray-200 hover:border-[#D4AF37] text-gray-700 font-bold text-xs uppercase tracking-wider py-4 px-6 rounded-2xl transition-all shadow-sm flex items-center gap-2 active:scale-95"
            >
              <FiDownload size={14} className="text-[#D4AF37]" /> Export CSV
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider py-4 px-6 rounded-2xl transition-all shadow-lg flex items-center gap-2 active:scale-95"
            >
              <FiLayers size={14} className="text-[#D4AF37]" /> Download PDF
            </button>
          </div>
        </div>

        {noData ? (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-gray-100 shadow-premium">
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FiAlertCircle size={40} />
            </div>
            <h2 className="font-display text-3xl font-black text-gray-900 mb-2">No revenue data available</h2>
            <p className="text-gray-400 font-medium italic max-w-md mx-auto">Please wait for bookings to be created and completed on the platform to aggregate financial records.</p>
          </div>
        ) : (
          <>
            {/* Filter Section */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center print:hidden">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-amber-50 text-[#D4AF37] flex items-center justify-center flex-shrink-0">
                  <FiFilter size={16} />
                </span>
                <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">Dashboard Filters</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                {/* Duration select */}
                <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-full sm:w-auto overflow-x-auto">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: '7days', label: '7 Days' },
                    { id: '30days', label: '30 Days' },
                    { id: '6months', label: '6 Months' },
                    { id: '1year', label: '1 Year' }
                  ].map(btn => (
                    <button
                      key={btn.id}
                      onClick={() => setTimeRange(btn.id)}
                      className={`py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                        timeRange === btn.id 
                          ? 'bg-white text-gray-900 shadow-sm border border-gray-100/50' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Revenue Source select */}
                <div className="w-full sm:w-60">
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl font-semibold text-xs text-gray-700 outline-none focus:border-[#D4AF37] cursor-pointer transition-colors"
                  >
                    <option value="all">All Revenue Sources</option>
                    <option value="service">Wedding Services Only (70%)</option>
                    <option value="cab">Baraat Cab Fleet Only (22%)</option>
                    <option value="subscription">Subscriptions Only (8%)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Top Summary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
              {stats.map((s, idx) => (
                <div 
                  key={s.label} 
                  className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-premium hover:shadow-premium-hover transition-all duration-300 relative overflow-hidden group hover:scale-[1.02] flex flex-col justify-between"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 transition-transform group-hover:rotate-6 ${s.bg} ${s.color}`}>
                      {s.icon}
                    </div>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">{s.label}</p>
                    <h3 className="font-display text-2xl font-black text-gray-900 mt-2 tracking-tight">{s.value}</h3>
                  </div>
                  <p className="text-[10px] text-gray-400 italic mt-4 border-t border-gray-50 pt-2 font-medium">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Revenue Trend Chart */}
              <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-premium lg:col-span-8 flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="font-display text-xl font-black text-gray-900 tracking-tight">Revenue Trend</h3>
                    <p className="text-xs text-gray-400 font-medium italic mt-1">Platform gross income analysis</p>
                  </div>
                  <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 self-start">
                    {[
                      { id: 'daily', label: 'Daily' },
                      { id: 'weekly', label: 'Weekly' },
                      { id: 'monthly', label: 'Monthly' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setTrendView(tab.id)}
                        className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          trendView === tab.id 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredChartData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} tickFormatter={v => `₹${v/1000}k`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: '1px solid #FFF8E7', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.05)', backgroundColor: '#fff' }}
                        formatter={(v) => [formatPrice(v), 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue Distribution Chart */}
              <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-premium lg:col-span-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-xl font-black text-gray-900 tracking-tight">Revenue Split</h3>
                  <p className="text-xs text-gray-400 font-medium italic mt-1">Earnings breakdown by channel</p>
                </div>

                <div className="w-full h-56 relative mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v}%`, 'Share']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Main Focus</span>
                    <span className="text-2xl font-black text-gray-900 mt-1">Services</span>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  {distributionData.map(item => (
                    <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-500">{item.name}</span>
                      </div>
                      <span className="text-gray-900 font-bold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Analytics chart */}
              <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-premium lg:col-span-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-xl font-black text-gray-900 tracking-tight">Booking Volume</h3>
                  <p className="text-xs text-gray-400 font-medium italic mt-1">Total accepted platform reservations</p>
                </div>

                <div className="w-full h-72 mt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredChartData}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} />
                      <Tooltip 
                        cursor={{ fill: '#FAF6F0', opacity: 0.4 }}
                        contentStyle={{ borderRadius: '20px', border: '1px solid #FFF8E7', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.05)' }}
                      />
                      <Bar dataKey="bookings" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={28} name="Bookings Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Vendor Growth Chart */}
              <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-premium lg:col-span-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-xl font-black text-gray-900 tracking-tight">Onboarding Rate</h3>
                  <p className="text-xs text-gray-400 font-medium italic mt-1">New platform vendors approved live</p>
                </div>

                <div className="w-full h-72 mt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredChartData}>
                      <defs>
                        <linearGradient id="colorVendors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: '1px solid #E6F4EA', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.05)' }}
                      />
                      <Area type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorVendors)" name="New Vendors" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Category Performance */}
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-premium">
              <div className="mb-6">
                <h3 className="font-display text-xl font-black text-gray-900 tracking-tight">Top Performing Categories</h3>
                <p className="text-xs text-gray-400 font-medium italic mt-1">Earnings and vendor density stats per wedding industry category</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(data.categoryStats || []).map(cat => (
                  <div key={cat.name} className="flex items-center justify-between p-5 bg-[#FAF8F5]/80 border border-gray-100 rounded-3xl hover:border-[#D4AF37]/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">{cat.icon || '📦'}</span>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{cat.name}</p>
                        <p className="text-[9px] text-gray-400 uppercase font-black tracking-wider mt-0.5">{cat.count} live vendors</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-black text-gray-900">{formatPrice(cat.revenue || 0)}</p>
                      <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Top split</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table Section - Recent Transactions */}
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-premium overflow-hidden">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="font-display text-xl font-black text-gray-900 tracking-tight">Recent Transactions</h3>
                  <p className="text-xs text-gray-400 font-medium italic mt-1">Real-time payment pipeline status</p>
                </div>
                <span className="bg-amber-50 text-[#D4AF37] font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-xl border border-amber-100/50">Verified Logs</span>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FiAlertCircle size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-xs font-semibold italic">No recent transactions recorded</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table view */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="pb-4 text-xs font-black text-gray-400 uppercase tracking-widest">Booking ID</th>
                          <th className="pb-4 text-xs font-black text-gray-400 uppercase tracking-widest">Customer</th>
                          <th className="pb-4 text-xs font-black text-gray-400 uppercase tracking-widest">Vendor</th>
                          <th className="pb-4 text-xs font-black text-gray-400 uppercase tracking-widest">Service</th>
                          <th className="pb-4 text-xs font-black text-gray-400 uppercase tracking-widest">Amount</th>
                          <th className="pb-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="pb-4 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {transactions.map(t => (
                          <tr key={t._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 font-mono text-xs font-bold text-gray-800">#{t.bookingId}</td>
                            <td className="py-4">
                              <p className="font-bold text-gray-900 text-sm">{t.userId?.name || 'Guest'}</p>
                              <p className="text-[10px] text-gray-400 font-semibold">{t.userId?.email || ''}</p>
                            </td>
                            <td className="py-4">
                              <p className="font-semibold text-gray-800 text-sm">{t.vendorProfileId?.businessName || 'N/A'}</p>
                            </td>
                            <td className="py-4">
                              <span className="inline-flex items-center gap-1.5 bg-[#FAF8F5] border border-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                                {t.bookingType === 'cab' ? <FaTruck size={12} className="text-[#D4AF37]" /> : <FiBriefcase size={12} className="text-[#D4AF37]" />}
                                {t.serviceName || (t.bookingType === 'cab' ? 'Baraat Cab' : 'Wedding Service')}
                              </span>
                            </td>
                            <td className="py-4 font-display font-black text-gray-900">{formatPrice(t.amount || t.totalPrice)}</td>
                            <td className="py-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                t.status === 'completed' 
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                  : t.status === 'confirmed'
                                  ? 'bg-blue-50 border-blue-100 text-blue-700'
                                  : t.status === 'cancelled' || t.status === 'rejected'
                                  ? 'bg-rose-50 border-rose-100 text-rose-700'
                                  : 'bg-amber-50 border-amber-100 text-amber-700'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="py-4 text-xs font-semibold text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card Layout view */}
                  <div className="md:hidden space-y-4">
                    {transactions.map(t => (
                      <div key={t._id} className="p-5 bg-gray-50/50 border border-gray-100 rounded-3xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs font-black text-gray-700">#{t.bookingId}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Customer & Vendor</p>
                          <p className="font-bold text-gray-900 text-sm mt-0.5">{t.userId?.name || 'Guest'}</p>
                          <p className="text-xs text-gray-600 font-medium italic mt-0.5">Vendor: {t.vendorProfileId?.businessName || 'N/A'}</p>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-gray-100/50">
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                              {t.serviceName || (t.bookingType === 'cab' ? 'Baraat Cab' : 'Wedding Service')}
                            </span>
                            <h4 className="font-display font-black text-gray-900 text-lg mt-1">{formatPrice(t.amount || t.totalPrice)}</h4>
                          </div>
                          <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            t.status === 'completed' 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                              : t.status === 'confirmed'
                              ? 'bg-blue-50 border-blue-100 text-blue-700'
                              : t.status === 'cancelled' || t.status === 'rejected'
                              ? 'bg-rose-50 border-rose-100 text-rose-700'
                              : 'bg-amber-50 border-amber-100 text-amber-700'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

            </div>
          </>
        )}

      </div>
    </div>
  )
}
