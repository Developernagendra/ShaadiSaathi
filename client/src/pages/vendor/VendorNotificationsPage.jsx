import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { formatDateShort } from '../../utils/helpers'
import { FiBell, FiCheckCircle, FiInfo, FiAlertCircle, FiTrash2, FiMail, FiArrowRight } from 'react-icons/fi'
import toast from 'react-hot-toast'
import EmptyState from '../../components/common/EmptyState'

export default function VendorNotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get('/notifications')
      .then(r => setNotifications(r.data.notifications))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleNotifClick = (n) => {
    if (!n.isRead) {
      handleMarkAsRead(n._id)
    }
    if (n.link) {
      navigate(n.link)
    } else {
      navigate('/vendor/dashboard')
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
    } catch { toast.error('Failed to update') }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n._id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed to delete') }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'booking': return <FiCheckCircle className="text-green-500" />
      case 'payment': return <FiCheckCircle className="text-blue-500" />
      case 'alert': return <FiAlertCircle className="text-red-500" />
      default: return <FiInfo className="text-primary-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900">Notifications</h1>
          {notifications.length > 0 && (
            <button 
              onClick={() => {
                api.patch('/notifications/read-all').then(() => {
                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
                  toast.success('All marked as read')
                })
              }} 
              className="text-sm font-bold text-primary-600 hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl shimmer" />)}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState icon="🔔" title="No Notifications" message="We'll notify you about new bookings, payments, and system updates." />
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div 
                key={n._id} 
                onClick={() => handleNotifClick(n)}
                className={`bg-white rounded-2xl p-5 shadow-sm border ${n.isRead ? 'border-gray-100 opacity-75' : 'border-primary-100 bg-primary-50/10'} flex items-start gap-4 transition-all group cursor-pointer hover:border-primary-300 hover:shadow-md`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${n.isRead ? 'bg-gray-50' : 'bg-primary-50'}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-bold text-sm ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</h3>
                    <span className="text-[10px] text-gray-400 font-medium">{formatDateShort(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2">{n.message}</p>
                  {n.link && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                      View details <FiArrowRight size={10} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.isRead && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n._id);
                      }} 
                      className="text-[10px] font-bold text-primary-600 hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n._id);
                    }} 
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
