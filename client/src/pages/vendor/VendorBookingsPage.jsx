import { useEffect, useState, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchVendorBookings, fetchVendorCabBookings, updateBookingStatus, updateCabBookingStatus, updateLocalBooking } from '../../store/slices/bookingSlice'
import { formatPrice, formatDateShort, getStatusColor } from '../../utils/helpers'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import { FiCalendar, FiUser, FiPhone, FiMapPin, FiArrowRight, FiCheckCircle, FiXCircle, FiPlay, FiStar } from 'react-icons/fi'
import { FaTruck } from 'react-icons/fa'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getSocket } from '../../utils/socket'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' }
]

export default function VendorBookingsPage() {
  const dispatch = useDispatch()
  const socket = getSocket()
  const [searchParams, setSearchParams] = useSearchParams()
  const vendorIdFromQuery = searchParams.get('vendorId')
  const { user } = useSelector(s => s.auth)
  const { vendorBookings, vendorCabBookings, loading, serviceCounts, cabCounts } = useSelector(s => s.booking)
  const initialType = searchParams.get('type') || 'services'
  const [activeTab, setActiveTab] = useState('all')
  const [bookingType, setBookingType] = useState(initialType)
  const [statusModal, setStatusModal] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')
  const pollTimer = useRef(null)

  const fetchData = useCallback(() => {
    const targetVendorId = user?.role === 'admin' ? vendorIdFromQuery : null
    const params = {
      status: activeTab === 'all' ? undefined : activeTab,
      vendorId: targetVendorId
    };
    if (bookingType === 'services') {
      dispatch(fetchVendorBookings(params))
    } else {
      dispatch(fetchVendorCabBookings(params))
    }
  }, [dispatch, activeTab, bookingType, vendorIdFromQuery, user?.role])

  useEffect(() => {
    fetchData()
    pollTimer.current = setInterval(fetchData, 30000)
    return () => clearInterval(pollTimer.current)
  }, [fetchData])

  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      fetchData();
    };

    const handleNewBooking = () => {
      toast.success('New booking received!', { icon: '🔔' });
      handleRefresh();
    };

    socket.on('new_booking', handleNewBooking);
    socket.on('newBooking', handleNewBooking);
    socket.on('booking_updated', ({ booking }) => {
      dispatch(updateLocalBooking(booking))
      handleRefresh() // Refresh counts and list
    })

    return () => {
      socket.off('new_booking', handleNewBooking);
      socket.off('newBooking', handleNewBooking);
      socket.off('booking_updated');
    }
  }, [socket, dispatch, activeTab, bookingType])

  const handleUpdateStatus = async (id, status) => {
    setNewStatus(status)
    setStatusModal(id)
  }

  const submitStatusUpdate = async () => {
    if (!statusModal || !newStatus) return
    if (bookingType === 'services') {
      await dispatch(updateBookingStatus({ id: statusModal, status: newStatus, note }))
    } else {
      await dispatch(updateCabBookingStatus({ id: statusModal, status: newStatus, note }))
    }
    setStatusModal(null); setNewStatus(''); setNote('')
    fetchData()
  }

  const handleTypeChange = (type) => {
    setBookingType(type)
    setSearchParams({ ...Object.fromEntries(searchParams), type })
  }

  const currentList = bookingType === 'services' ? vendorBookings : vendorCabBookings

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20 px-4 animate-fade-in">
      <div className="max-w-6xl mx-auto">

        {/* ── Premium Dashboard Header ── */}
        <div className="bg-white rounded-[3rem] p-10 md:p-14 mb-12 shadow-premium border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-50" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-1 w-12 bg-primary-600 rounded-full" />
              <span className="text-primary-600 text-[10px] font-black uppercase tracking-[0.5em] italic">Vendor Control Panel</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">Manage <br /><span className="text-primary-600 underline decoration-primary-100 decoration-8 underline-offset-8">Reservations</span></h1>
          </div>

          <div className="flex flex-col gap-6 w-full md:w-auto">
            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
              {[
                { id: 'services', label: 'Wedding Services' },
                { id: 'baraat-cab', label: 'Baraat Cabs' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => handleTypeChange(type.id)}
                  className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bookingType === type.id ? 'bg-white text-gray-900 shadow-xl scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Status Tabs with Counts ── */}
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide mb-10 -mx-4 px-4 md:mx-0 md:px-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-500 flex items-center gap-4 group border-2 ${activeTab === tab.id
                ? 'bg-gray-900 text-white border-gray-900 shadow-2xl scale-105'
                : 'bg-white border-transparent text-gray-400 hover:border-gray-200 hover:text-gray-900 shadow-sm'}`}
            >
              {tab.label}
              <span className={`px-3 py-1.5 rounded-xl text-[9px] ${activeTab === tab.id ? 'bg-white/20 text-white font-black' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
                {(bookingType === 'services' ? serviceCounts?.[tab.id] : cabCounts?.[tab.id]) || 0}
              </span>
            </button>
          ))}
        </div>

        {/* ── Reservations List ── */}
        {loading ? (
          <div className="grid gap-8">
            {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-[3rem] h-64 animate-shimmer shadow-sm" />)}
          </div>
        ) : currentList.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3rem] border border-dashed border-primary-100 p-24 text-center shadow-premium">
            <EmptyState icon={bookingType === 'baraat-cab' ? '🚕' : '💍'} title="Inbox Zero!" message={`You have no ${activeTab === 'all' ? '' : activeTab} ${bookingType === 'baraat-cab' ? 'baraat cab' : 'wedding service'} reservations to handle right now.`} />

          </motion.div>
        ) : (
          <div className="grid gap-8">
            <AnimatePresence mode="popLayout">
              {currentList?.map((b, i) => (
                <motion.div
                  key={b._id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  className="bg-white rounded-[3rem] shadow-premium border border-gray-50 p-8 md:p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 ${getStatusColor(b.status).split(' ')[0]} opacity-[0.03] rounded-bl-[4rem] group-hover:opacity-[0.07] transition-all`} />

                  <div className="flex flex-col lg:flex-row lg:items-center gap-12">
                    {/* Customer Visual Identity */}
                    <div className="flex items-center gap-8 flex-1 min-w-0">
                      <div className="w-24 h-24 rounded-[2rem] bg-gray-50 flex items-center justify-center text-3xl font-black text-gray-300 flex-shrink-0 border-2 border-dashed border-gray-200 relative group-hover:rotate-6 transition-transform">
                        {(b.userId?.avatar?.url || b.user?.avatar?.url) ? (
                          <img src={b.userId?.avatar?.url || b.user?.avatar?.url} className="w-full h-full object-cover rounded-[2rem]" />
                        ) : (
                          (b.userId?.name || b.user?.name || '?').charAt(0)
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-gray-50 group-hover:scale-110 transition-all">
                          <FiUser className="text-primary-600 text-sm" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                          <h3 className="font-display font-black text-3xl text-gray-900 truncate tracking-tight">{b.contactName || b.userId?.name || b.user?.name}</h3>
                          <div className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm border ${getStatusColor(b.status)}`}>
                            {b.status?.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <span className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100/50"><FiCalendar className="text-primary-600" />{formatDateShort(b.eventDate)}</span>
                          <span className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100/50"><FiPhone className="text-blue-600" />{b.contactPhone || b.userId?.phone || b.user?.phone}</span>
                          <span className="text-gray-300 italic">#{b.bookingId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Service/Trip Context */}
                    <div className="flex-1">
                      {bookingType === 'baraat-cab' ? (

                        <div className="bg-[#FFF8F0] p-6 rounded-[2rem] border border-pink-50/50 relative">
                          <div className="flex items-center justify-between gap-4 mb-4">
                            <span className="text-[11px] font-black uppercase tracking-widest text-gray-600 truncate">{b.pickupLocation?.city}</span>
                            <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Category: Baraat Cab</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-amber-600"><FaTruck size={14} /></div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-700">
                                {b.cabIds && b.cabIds.length > 0
                                  ? b.cabIds?.map(c => `${c.name} (${c.vehicleNumber})`).join(', ')
                                  : b.vehicles?.map(v => `${v.count}x ${(v.vehicleType || '').replace('_', ' ')}`).join(', ')}
                              </span>
                              <span className="text-[10px] text-gray-400 italic">Pickup: {b.pickupLocation?.address}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50/80 p-7 rounded-[2rem] border border-gray-100/50">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3">
                              <FiStar className="text-amber-500" />
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Selected Package</span>
                            </div>
                            <span className="bg-primary-100 text-primary-800 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Category: Wedding Service</span>
                          </div>
                          <p className="text-lg font-black text-gray-900 tracking-tight">
                            {b.serviceName || (b.bookingType === 'cab' ? 'Baraat Cab' : 'Wedding Service')}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium mt-1 italic">{b.packageSelected?.name || 'Standard Professional Service'}</p>
                        </div>
                      )}
                    </div>

                    {/* Financials & Logic */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-6 lg:w-56 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Reservation Value</p>
                        <p className="font-display font-black text-4xl text-gray-900 tracking-tighter leading-none">{formatPrice(b.amount)}</p>
                      </div>

                      {/* Workflow Buttons */}
                      <div className="flex flex-wrap lg:flex-col gap-3 w-full">
                        {b.status === 'pending' && (
                          <div className="flex gap-2 w-full">
                            <button onClick={() => handleUpdateStatus(b._id, 'confirmed')} className="flex-1 bg-green-600 text-white rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-100">
                              <FiCheckCircle /> Confirm
                            </button>
                            <button onClick={() => handleUpdateStatus(b._id, 'rejected')} className="flex-1 bg-red-50 text-red-600 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100">
                              <FiXCircle /> Reject
                            </button>
                          </div>
                        )}
                        {b.status === 'confirmed' && (
                          <button onClick={() => handleUpdateStatus(b._id, 'completed')} className="w-full bg-gray-900 text-white rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black shadow-lg shadow-gray-200">
                            <FiCheckCircle /> Mark Complete
                          </button>
                        )}
                        {b.status === 'in_progress' && (
                          <button onClick={() => handleUpdateStatus(b._id, 'completed')} className="w-full bg-gray-900 text-white rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black shadow-lg shadow-gray-200">
                            <FiCheckCircle /> Mark Complete
                          </button>
                        )}
                        <Link
                          to={bookingType === 'baraat-cab' ? `/cab-booking/${b._id}` : `/vendor/bookings/${b._id}`}

                          className="w-full text-center text-gray-300 hover:text-primary-600 text-[10px] font-black uppercase tracking-[0.3em] py-2 transition-colors flex items-center justify-center gap-2"
                        >
                          Details <FiArrowRight className="inline ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Modal isOpen={!!statusModal} onClose={() => setStatusModal(null)} title="Reservation Update" size="md">
        <div className="p-10 text-center">
          <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner rotate-3 ${newStatus === 'confirmed' ? 'bg-green-50 text-green-600' : ['cancelled', 'rejected'].includes(newStatus) ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-600'}`}>
            {newStatus === 'confirmed' ? <FiCheckCircle /> : ['cancelled', 'rejected'].includes(newStatus) ? <FiXCircle /> : <FiArrowRight />}
          </div>
          <h3 className="font-display font-black text-3xl text-gray-900 mb-3 tracking-tight">Confirm <span className="text-primary-600 capitalize">{newStatus}</span>?</h3>
          <p className="text-gray-400 mb-10 text-sm font-medium italic leading-relaxed px-10">This update will be sent to the customer instantly via real-time sync and email notification.</p>

          <div className="text-left mb-10">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block ml-1">Admin Notes (Optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} placeholder="e.g. Booking confirmed, looking forward to serving you..." className="w-full bg-gray-50 border-2 border-transparent focus:border-primary-200 focus:bg-white rounded-3xl px-8 py-6 text-sm outline-none transition-all resize-none shadow-inner" />
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStatusModal(null)} className="flex-1 font-black text-[10px] uppercase tracking-[0.4em] text-gray-300 hover:text-gray-500 transition-colors">Back</button>
            <button onClick={submitStatusUpdate} className="flex-2 bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest py-6 px-10 rounded-[1.5rem] shadow-2xl hover:bg-black transition-all">Submit Update</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
