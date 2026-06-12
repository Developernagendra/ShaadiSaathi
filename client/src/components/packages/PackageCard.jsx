import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiShield, FiArrowRight } from 'react-icons/fi';

export default function PackageCard({ pkg, onOpenDetails, onOpenQuote }) {
  const isGold = pkg.priority === 2 || pkg.name?.toLowerCase().includes('gold') || pkg.isPopular;
  const isPremium = pkg.priority >= 3 || pkg.name?.toLowerCase().includes('premium');

  // Premium fallback images
  const defaultImage = isPremium
    ? "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800"
    : isGold
      ? "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800"
      : "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=800";

  const coverImage = pkg.coverImage || pkg.image || defaultImage;

  const displayPrice = pkg.finalPrice
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(pkg.finalPrice)
    : pkg.price;

  const originalPrice = (pkg.discount > 0 && pkg.price)
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(pkg.price)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
      viewport={{ once: true, margin: "-50px" }}
      className={`group relative flex flex-col transition-all duration-300 overflow-hidden rounded-[20px] w-full max-w-[340px] flex-shrink-0 mx-auto sm:mx-0
        ${isGold ? 'bg-gradient-to-b from-[#FFFDF0] to-white border border-[#D4AF37]/30 shadow-[0_8px_20px_rgba(212,175,55,0.08)] hover:shadow-[0_15px_30px_rgba(212,175,55,0.15)] z-10'
          : isPremium ? 'bg-gradient-to-b from-gray-900 to-[#18181B] border border-gray-800 shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] text-white'
            : 'bg-white/90 backdrop-blur-xl border border-gray-100 shadow-sm hover:shadow-lg'}`}
    >
      {/* Compact Hero Image */}
      <div className="relative w-full h-[180px] overflow-hidden bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
        <img
          src={coverImage}
          alt={pkg.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20">
          {pkg.badge ? (
            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-md backdrop-blur-md border ${isGold ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38D22] text-white border-[#D4AF37]/50' :
                isPremium ? 'bg-white/10 border-white/20 text-[#D4AF37]' :
                  'bg-[#C2185B] text-white border-[#C2185B]/50'
              }`}>
              {pkg.badge}
            </span>
          ) : <div />}

          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-md text-[8px] font-bold uppercase tracking-wider">
            <FiShield size={10} className={isGold || isPremium ? "text-[#D4AF37]" : ""} />
            Verified
          </div>
        </div>
      </div>

      {/* Compact Content Section */}
      <div className="p-4 flex flex-col flex-1 relative z-20">

        {/* Header */}
        <div className="mb-3">
          <h3 className={`font-serif text-[19px] font-bold mb-1 leading-tight ${isPremium ? 'text-white' : 'text-gray-900'}`}>
            {pkg.name}
          </h3>
          <p className={`text-[12px] line-clamp-2 leading-snug ${isPremium ? 'text-gray-400' : 'text-gray-500'}`}>
            {pkg.shortDescription || 'Perfect for your special day with exclusive curated services.'}
          </p>
        </div>

        {/* Compact Features */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {pkg.features && pkg.features.slice(0, 3).map((feature, idx) => (
              <div key={idx} className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1
                ${isPremium ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                <FiCheck className={isGold || isPremium ? 'text-[#D4AF37]' : 'text-[#C2185B]'} size={10} />
                <span className="truncate max-w-[120px]">{feature}</span>
              </div>
            ))}
            {pkg.features?.length > 3 && (
              <div className={`px-2 py-1 rounded-md text-[9px] font-black tracking-wider flex items-center
                ${isPremium ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                +{pkg.features.length - 3} MORE
              </div>
            )}
          </div>
        </div>

        {/* Single Row Pricing */}
        <div className={`mt-auto mb-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 ${isPremium ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-serif text-[22px] font-black leading-none ${isGold || isPremium ? 'text-[#D4AF37]' : 'text-[#C2185B]'}`}>
              {displayPrice}
            </span>
            {originalPrice && (
              <span className={`text-[11px] font-bold line-through ${isPremium ? 'text-gray-500' : 'text-gray-400'}`}>
                {originalPrice}
              </span>
            )}
          </div>
          {pkg.discount > 0 && (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[9px] font-black tracking-wider">
              {pkg.discount}% OFF
            </span>
          )}
        </div>

        {/* Footer Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onOpenDetails(pkg)}
            className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border font-black text-[10px] uppercase tracking-wider transition-colors
              ${isPremium ? 'border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Details
          </button>
          <button
            onClick={() => onOpenQuote(pkg)}
            className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-transform active:scale-95 shadow-sm
            ${isPremium || isGold
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38D22] text-white hover:opacity-90'
                : 'bg-gray-900 text-white hover:bg-gray-800'}`}
          >
            Book Now <FiArrowRight size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
