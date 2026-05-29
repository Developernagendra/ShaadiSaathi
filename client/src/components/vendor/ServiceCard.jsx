import { useNavigate } from 'react-router-dom'
import { formatPrice } from '../../utils/helpers'
import { FiMapPin, FiStar, FiClock, FiCamera, FiCheckCircle } from 'react-icons/fi'

export default function ServiceCard({ service, onPreview }) {
  const navigate = useNavigate()

  const getOptimizedUrl = (url, width = 600) => {
    if (!url || !url.includes('cloudinary')) return url
    return url.replace('/upload/', `/upload/c_scale,w_${width},f_auto,q_auto/`)
  }

  const primaryImage = service.coverImage || (service.images && service.images.length > 0 ? (typeof service.images[0] === 'string' ? service.images[0] : service.images[0].url) : null) || service.gallery?.[0]
  const optimizedImage = getOptimizedUrl(primaryImage)

  // Determine if vendor is verified (Mock logic if backend doesn't provide it directly)
  const isVerified = service.vendor?.isVerified || service.rating?.average >= 4.0;

  return (
    <div 
      onClick={() => onPreview ? onPreview(service) : navigate(`/services/${service._id}`)}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${service.title}`}
      className="group bg-white rounded-[2.5rem] shadow-premium hover:shadow-[0_20px_50px_rgb(0,0,0,0.12)] border border-gray-100 hover:border-[#D4AF37]/50 focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/30 transition-all duration-500 overflow-hidden relative flex flex-col h-full cursor-pointer hover:-translate-y-2"
    >
      <div className="relative h-56 sm:h-64 overflow-hidden bg-gray-50 flex-shrink-0 z-10">
        {primaryImage ? (
          <img
            src={optimizedImage}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
            <FiCamera size={36} />
            <p className="text-[9px] font-black mt-2 uppercase tracking-widest italic">No Portfolio Media</p>
          </div>
        )}

        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {service.category && (
            <span className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#D4AF37] shadow-lg border border-[#D4AF37]/20 flex items-center gap-1.5">
              {service.category.name}
            </span>
          )}
        </div>

        {isVerified && (
          <div className="absolute top-4 right-4 z-20 bg-green-500 text-white p-2 rounded-full shadow-lg shadow-green-500/40" title="Verified Vendor">
            <FiCheckCircle size={16} strokeWidth={3} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between relative z-10 bg-white">
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="font-display font-black text-gray-900 text-xl leading-tight line-clamp-1 group-hover:text-[#D4AF37] transition-colors">
                {service.title}
              </h3>
              {service.vendor?.businessName && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  By {service.vendor.businessName}
                </p>
              )}
            </div>
            {service.rating?.average > 0 && (
              <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-100 text-yellow-600 px-3 py-1.5 rounded-xl text-xs font-black shrink-0 shadow-sm">
                <FiStar className="fill-yellow-500" />
                <span>{service.rating.average}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><FiMapPin className="text-[#D4AF37]" size={14} /> {service.city}</span>
            {service.duration && <span className="flex items-center gap-1.5"><FiClock className="text-[#D4AF37]" size={14} /> {service.duration}</span>}
          </div>
          
          <p className="text-gray-500 text-sm font-medium italic line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto text-center sm:text-left">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Starting Price</p>
            <p className="text-2xl font-display font-black text-[#D4AF37] mt-0.5">{formatPrice(service.startingPrice || service.price)}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/services/${service._id}`);
              }}
              className="flex-1 sm:flex-none bg-gray-50 text-gray-600 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-100 transition-all text-center"
            >
              View Profile
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/book-service/${service._id}`);
              }}
              className="flex-1 sm:flex-none bg-gradient-to-r from-[#C2185B] to-[#8E244D] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider hover:from-[#8E244D] hover:to-[#5C1130] transition-all shadow-[0_5px_15px_rgba(194,24,91,0.3)] hover:shadow-[0_8px_25px_rgba(194,24,91,0.5)] text-center"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
