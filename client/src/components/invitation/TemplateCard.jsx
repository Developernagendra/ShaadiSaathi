import { useDispatch, useSelector } from 'react-redux';
import { selectTemplate, toggleFavorite } from '../../store/slices/invitationSlice';
import { FiHeart, FiCheck, FiLock } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function TemplateCard({ template, index = 0, onSelect }) {
  const dispatch = useDispatch();
  const { currentInvitation, favoriteTemplates } = useSelector(s => s.invitation);
  const isSelected = currentInvitation.templateId === template.id;
  const isFav = favoriteTemplates.includes(template.id);

  const handleSelect = () => {
    if (onSelect) {
      onSelect(template.id);
    } else {
      dispatch(selectTemplate(template.id));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      viewport={{ once: true }}
      className={`group rounded-[2rem] overflow-hidden bg-white shadow-premium border-2 transition-all duration-300 relative cursor-pointer ${
        isSelected ? 'border-[#C2185B] shadow-pink-200/50 ring-4 ring-pink-100' : 'border-transparent hover:border-pink-200 hover:shadow-premium-hover'
      }`}
      onClick={handleSelect}
    >
      {/* Badges */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {template.isPopular && (
          <span className="bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-[#1a1a2e] text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">
            Popular
          </span>
        )}
        {template.isPremium && (
          <span className="bg-gradient-to-r from-purple-600 to-purple-400 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
            <FiLock size={8} /> Premium
          </span>
        )}
      </div>

      {/* Selected check */}
      {isSelected && (
        <div className="absolute top-4 right-4 z-20 w-7 h-7 bg-[#C2185B] rounded-full flex items-center justify-center text-white shadow-lg">
          <FiCheck size={14} />
        </div>
      )}

      {/* Favorite button */}
      <button
        onClick={e => { e.stopPropagation(); dispatch(toggleFavorite(template.id)); }}
        className={`absolute top-4 right-4 z-20 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-all ${
          isSelected ? 'hidden' : ''
        } ${isFav ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500'}`}
      >
        <FiHeart size={12} fill={isFav ? 'currentColor' : 'none'} />
      </button>

      {/* Image */}
      <div className="aspect-[3/4] overflow-hidden relative">
        <img
          src={template.img}
          alt={template.name}
          className={`w-full h-full object-cover transition-transform duration-700 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70" />

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <button
            className="bg-white text-[#C2185B] font-black text-[10px] uppercase tracking-[0.15em] py-2.5 px-6 rounded-full shadow-2xl hover:scale-105 transition-transform"
            onClick={e => { e.stopPropagation(); handleSelect(); }}
          >
            {isSelected ? '✓ Selected' : 'Use Template'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 absolute bottom-0 left-0 right-0 z-10">
        <span className="text-[9px] font-black uppercase tracking-widest mb-0.5 block" style={{ color: template.colors.accent }}>
          {template.category}
        </span>
        <h4 className="font-bold text-white text-lg leading-tight">{template.name}</h4>
      </div>

      {/* Color preview dots */}
      <div className="absolute bottom-4 right-4 z-10 flex gap-1">
        <div className="w-3 h-3 rounded-full border border-white/30 shadow-sm" style={{ backgroundColor: template.colors.bg }} />
        <div className="w-3 h-3 rounded-full border border-white/30 shadow-sm" style={{ backgroundColor: template.colors.accent }} />
        <div className="w-3 h-3 rounded-full border border-white/30 shadow-sm" style={{ backgroundColor: template.colors.text }} />
      </div>
    </motion.div>
  );
}
