import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toggleWishlist } from '../../store/slices/authSlice'
import StarRating from '../common/StarRating'
import { formatPrice, truncate } from '../../utils/helpers'
import { FiHeart, FiMapPin, FiAward, FiCheck, FiArrowRight } from 'react-icons/fi'
import { toast } from 'react-hot-toast'

export default function VendorCard({ vendor }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((s) => s.auth)

  const getOptimizedUrl = (url, width = 600) => {
    if (!url || !url.includes('cloudinary')) return url
    return url.replace('/upload/', `/upload/c_scale,w_${width},f_auto,q_auto/`)
  }

  const getPrimaryImage = () => {
    if (vendor.coverImage?.url) return vendor.coverImage.url
    if (typeof vendor.coverImage === 'string') return vendor.coverImage
    if (Array.isArray(vendor.images) && vendor.images.length > 0) {
      const primary = vendor.images.find((i) => i && i.isPrimary)
      if (primary && primary.url) return primary.url
      if (primary && typeof primary === 'string') return primary
      const first = vendor.images[0]
      if (first && first.url) return first.url
      if (first && typeof first === 'string') return first
    }
    if (Array.isArray(vendor.gallery) && vendor.gallery.length > 0) {
      return vendor.gallery[0]
    }
    return null
  }
  const primaryImage = getPrimaryImage()
  const optimizedImage = getOptimizedUrl(primaryImage)
  const isWishlisted = user?.wishlist?.includes(vendor._id)

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Please login to save to wishlist')
      navigate('/login')
      return
    }
    dispatch(toggleWishlist(vendor._id))
  }

  const vendorBadges = {
    verified: { label: 'Verified', icon: <FiCheck />, variant: 'green' },
    topRated: { label: 'Top Rated', icon: <FiAward />, variant: 'gold' },
    quickResponder: { label: 'Quick Responder', icon: null, variant: 'blue' },
    experienced: { label: 'Experienced', icon: null, variant: 'purple' },
  }

  return (
    <div 
      onClick={() => navigate(`/vendors/${vendor._id}`)}
      className="block group h-full cursor-pointer"
    >
      <div className="bg-white rounded-[2.5rem] shadow-premium hover:shadow-premium-hover border border-gray-100 hover:border-[#D4AF37] transition-all duration-700 overflow-hidden relative flex flex-col h-full group">
        {/* Subtle pattern background for the card */}
        <div className="absolute inset-0 floral-pattern opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 z-0 pointer-events-none" />
        
        {/* Image Section */}
        <div className="relative h-60 overflow-hidden bg-cream flex-shrink-0 z-10 border-b border-gold-200">
          {primaryImage ? (
            <img
              src={optimizedImage}
              alt={vendor.businessName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-maroon-50 to-cream-100">
              <span className="text-6xl group-hover:scale-110 transition-transform duration-500">{vendor.category?.icon || '🏛️'}</span>
            </div>
          )}

          {/* Elegant Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/80 via-maroon-900/20 to-transparent opacity-80" />

          {/* Overlay badges */}
          <div className="absolute top-5 left-5 flex flex-wrap gap-2 z-20">
            {vendor.isFeatured && <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg shadow-xl backdrop-blur-md">⭐ Top Vendor</span>}
            {vendor.isTrending && <span className="bg-white/90 backdrop-blur-md text-[#C2185B] text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg shadow-xl border border-pink-100">🔥 Trending</span>}
          </div>

          {/* Wishlist Icon */}
          <button
            onClick={handleWishlist}
            className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg z-20 ${
              isWishlisted ? 'bg-[#C2185B] text-white' : 'bg-white/90 backdrop-blur-md text-gray-400 hover:text-red-500 hover:bg-gold-50 hover:scale-110'
            }`}
          >
            <FiHeart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Category pill */}
          <div className="absolute bottom-5 left-5 z-20">
            <span className="bg-black/40 backdrop-blur-md border border-white/30 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
              {vendor.category?.icon} {vendor.category?.name}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 flex flex-col flex-1 relative z-10 bg-white/50 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-display font-black text-gray-900 text-2xl leading-tight group-hover:text-[#C2185B] transition-colors line-clamp-1">
              {vendor.businessName}
            </h3>
          </div>

          {/* Location & Rating row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-gray-500 text-[11px] font-black uppercase tracking-widest">
              <FiMapPin className="text-[#D4AF37]" size={14} />
              <span className="truncate max-w-[140px]">{vendor.location?.city}</span>
            </div>
            <div className="flex items-center gap-1">
              <StarRating rating={vendor.rating?.average} count={vendor.rating?.count} size="sm" showCount={true} />
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-2 flex-1 font-medium">
            {truncate(vendor.tagline || vendor.description, 80)}
          </p>

          {/* Badges row */}
          <div className="flex flex-wrap gap-2 mb-6 min-h-[24px]">
            {vendor.badges?.slice(0, 2).map((b) => {
              const info = vendorBadges[b]
              if (!info) return null
              return (
                <span key={b} className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm flex items-center gap-1 shadow-sm ${
                  info.variant === 'green' ? 'bg-cream-100 text-maroon-800 border border-gold-200' :
                  info.variant === 'gold' ? 'bg-gold-50 text-gold-800 border border-gold-300' :
                  info.variant === 'blue' ? 'bg-maroon-50 text-maroon-800 border border-maroon-200' :
                  'bg-gray-50 text-gray-800 border border-gray-200'
                }`}>
                  {info.icon} {info.label}
                </span>
              )
            })}
          </div>

          {/* Price & Action Buttons */}
          <div className="pt-6 border-t border-gray-50 mt-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-1">Starting At</p>
                <p className="font-display font-black text-gray-900 text-2xl tracking-tighter">{formatPrice(vendor.basePrice)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigate(`/vendors/${vendor._id}`)
                }}
                className="flex items-center justify-center gap-1 bg-[#FFF8F0] hover:bg-[#FFE5D9] text-[#C2185B] py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 border border-pink-100"
              >
                View Details
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!vendor?._id) return;
                  navigate(`/book-vendor/${vendor._id}`)
                }}
                className="flex items-center justify-center gap-1 bg-gradient-to-r from-[#C2185B] to-[#8E244D] hover:from-[#8E244D] hover:to-[#5C1130] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-pink-100 transition-all duration-300"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
