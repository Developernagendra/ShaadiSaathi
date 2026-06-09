import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { selectTemplate, setActiveCategory, resetBuilder } from '../../store/slices/invitationSlice';
import TemplateCard from '../../components/invitation/TemplateCard';
import { FiArrowLeft, FiSearch, FiFilter, FiGrid, FiList, FiHeart } from 'react-icons/fi';

const categories = [
  'All',
  'Hindu Wedding',
  'Muslim Nikah',
  'Sikh Wedding',
  'Christian Wedding',
  'South Indian Wedding',
  'Bengali Wedding',
  'Royal Wedding',
  'Luxury Wedding',
  'Floral Wedding',
  'Modern Wedding',
  'Minimal Wedding',
  'Traditional Wedding',
];

export default function TemplateLibrary() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { templates, activeCategory, favoriteTemplates } = useSelector(s => s.invitation);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
    const matchesFav = !showFavoritesOnly || favoriteTemplates.includes(t.id);
    return matchesCategory && matchesSearch && matchesFav;
  });

  const handleUseTemplate = (templateId) => {
    dispatch(resetBuilder());
    dispatch(selectTemplate(templateId));
    navigate('/invitation-creator/new');
  };

  return (
    <div className="pb-24 animate-fade-in relative">
      <div className="absolute inset-0 floral-pattern opacity-[0.03] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Link to="/invitation-creator" className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-all">
              <FiArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Template Library</h1>
              <p className="text-gray-400 font-medium text-sm mt-1">Choose from {templates.length} handcrafted designer templates</p>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-[#C2185B] transition-all shadow-sm"
              />
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-xs font-bold uppercase tracking-widest transition-all ${
                  showFavoritesOnly ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                <FiHeart size={14} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
                <span className="hidden sm:inline">Favorites</span>
              </button>

              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-[#C2185B] shadow-sm' : 'text-gray-400'}`}
                >
                  <FiGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-[#C2185B] shadow-sm' : 'text-gray-400'}`}
                >
                  <FiList size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Tabs */}
        <div className="mb-8 -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-2 min-w-max">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => dispatch(setActiveCategory(cat))}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-[#C2185B] text-white shadow-lg shadow-pink-200'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-[#C2185B] hover:text-[#C2185B]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-bold text-gray-400">
            Showing <span className="text-gray-900">{filteredTemplates.length}</span> templates
            {activeCategory !== 'All' && <span> in <span className="text-[#C2185B]">{activeCategory}</span></span>}
          </p>
        </div>

        {/* Template Grid */}
        {filteredTemplates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-[3rem] shadow-premium border border-pink-50 p-16 text-center"
          >
            <span className="text-5xl mb-4 block">🔍</span>
            <h3 className="font-display text-xl font-black text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-400 text-sm mb-6">Try a different search or category.</p>
            <button
              onClick={() => { setSearch(''); dispatch(setActiveCategory('All')); setShowFavoritesOnly(false); }}
              className="text-[#C2185B] font-bold text-xs uppercase tracking-widest"
            >
              Clear Filters
            </button>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredTemplates.map((template, idx) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={idx}
                onSelect={handleUseTemplate}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {filteredTemplates.map((template, idx) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl shadow-premium border border-pink-50 p-4 flex items-center gap-4 group hover:shadow-premium-hover transition-all"
              >
                <div className="w-20 h-24 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={template.img} alt={template.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 truncate">{template.name}</h4>
                    {template.isPremium && (
                      <span className="bg-purple-100 text-purple-600 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Premium</span>
                    )}
                    {template.isPopular && (
                      <span className="bg-amber-100 text-amber-700 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Popular</span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">{template.category}</p>
                  <div className="flex gap-1 mt-2">
                    <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: template.colors.bg }} />
                    <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: template.colors.accent }} />
                    <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: template.colors.text }} />
                  </div>
                </div>
                <button
                  onClick={() => handleUseTemplate(template.id)}
                  className="bg-[#C2185B] text-white font-black text-[10px] uppercase tracking-[0.15em] py-3 px-6 rounded-xl hover:bg-[#8E244D] transition-all shadow-lg flex-shrink-0"
                >
                  Use
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
