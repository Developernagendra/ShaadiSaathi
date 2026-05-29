import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../utils/api'
import { formatDateShort } from '../../utils/helpers'
import StarRating from '../../components/common/StarRating'
import { FiMessageSquare, FiCornerUpRight, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function VendorReviewsPage() {
  const { myVendorProfile: vendor } = useSelector(s => s.vendor)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [replying, setReplying] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [stats, setStats] = useState({ average: 0, count: 0, distribution: {} })

  const load = () => {
    setLoading(true)
    api.get(`/reviews/dashboard`)
      .then(r => {
        setReviews(r.data.reviews)
        const dist = {}
        r.data.reviews.forEach(rv => {
          dist[rv.rating] = (dist[rv.rating] || 0) + 1
        })
        setStats({ 
          average: vendor?.rating?.average || 0, 
          count: vendor?.rating?.count || 0, 
          distribution: dist 
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (vendor) load() }, [vendor])

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return
    try {
      await api.post(`/reviews/${reviewId}/reply`, { comment: replyText })
      toast.success('Reply submitted!')
      setReplying(null)
      setReplyText('')
      load()
    } catch { toast.error('Failed to reply') }
  }

  const handleStatusChange = async (reviewId, status) => {
    try {
      await api.patch(`/reviews/${reviewId}/status`, { status })
      toast.success(`Review ${status}`)
      load()
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-6">Customer Reviews</h1>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-10 items-center">
          <div className="text-center">
            <p className="text-6xl font-bold text-primary-700">{Number(stats.average).toFixed(1)}</p>
            <div className="flex justify-center my-2">
              <StarRating rating={stats.average} showCount={false} size="lg" />
            </div>
            <p className="text-gray-500 font-medium">{stats.count} reviews</p>
          </div>
          
          <div className="flex-1 w-full space-y-3">
            {[5, 4, 3, 2, 1].map(star => {
              const count = stats.distribution[star] || 0
              const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-4">
                  <span className="text-sm font-bold text-gray-500 w-4">{star}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-sm text-gray-400 w-10 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl shimmer" />)}</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <span className="text-5xl block mb-4">⭐</span>
            <h3 className="text-xl font-bold text-gray-800">No Reviews Yet</h3>
            <p className="text-gray-500 mt-2">Satisfy your customers to get your first review!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map(r => (
              <div key={r._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-lg font-bold text-primary-700">
                      {r.user?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{r.user?.name}</p>
                      <p className="text-xs text-gray-400">{formatDateShort(r.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StarRating rating={r.rating} showCount={false} size="sm" />
                    <div className="mt-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                        r.status === 'approved' ? 'bg-green-100 text-green-700' : 
                        r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 leading-relaxed">{r.comment}</p>
                
                {r.images?.length > 0 && (
                  <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                    {r.images.map((img, idx) => (
                      <img key={idx} src={img.url} className="w-20 h-20 rounded-xl object-cover border border-gray-100" alt="Review" />
                    ))}
                  </div>
                )}
                
                <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                  {r.status !== 'approved' && (
                    <button onClick={() => handleStatusChange(r._id, 'approved')} className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100">
                      Approve
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button onClick={() => handleStatusChange(r._id, 'rejected')} className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100">
                      Reject
                    </button>
                  )}
                </div>

                {r.vendorReply?.comment ? (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border-l-4 border-primary-400">
                    <p className="text-xs font-bold text-primary-700 mb-1 flex items-center gap-1"><FiCornerUpRight /> Your Response</p>
                    <p className="text-sm text-gray-600">{r.vendorReply.comment}</p>
                  </div>
                ) : replying === r._id ? (
                  <div className="mt-4 space-y-3">
                    <textarea 
                      value={replyText} 
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Write your response..." 
                      className="input-field py-3 text-sm h-24 resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleReply(r._id)} className="btn-primary py-2 px-4 text-xs">Post Reply</button>
                      <button onClick={() => setReplying(null)} className="btn-outline py-2 px-4 text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setReplying(r._id)} className="mt-4 text-xs font-bold text-primary-600 flex items-center gap-1 hover:underline">
                    <FiMessageSquare size={14} /> Reply to review
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
