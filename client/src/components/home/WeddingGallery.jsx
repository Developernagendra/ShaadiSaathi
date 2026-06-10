import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZoomIn, FiMapPin, FiCalendar, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
const GALLERY_IMAGES = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    category: 'Ceremonies',
    location: 'Darbhanga, Bihar',
    date: '12 Dec, 2026',
    title: 'The Sacred Sindoor Daan',
    aspectRatio: 'aspect-[3/4]',
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1587271636175-90d58cdad458?auto=format&fit=crop&w=800&q=80',
    category: 'Bridal Portraits',
    location: 'Darbhnaga, Bihar',
    date: '10 Nov, 2026',
    title: 'Bihari Bridal Elegance',
    aspectRatio: 'aspect-square',
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1542042161784-26ab9e041e89?auto=format&fit=crop&w=800&q=80',
    category: 'Pre-Wedding',
    location: 'Patna, Bihar',
    date: '05 Oct, 2026',
    title: 'Heritage Romance',
    aspectRatio: 'aspect-video',
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
    category: 'Receptions',
    location: 'Muzaffarpur, Bihar',
    date: '20 Jan, 2026',
    title: 'Grand Bihari Reception',
    aspectRatio: 'aspect-[4/3]',
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?auto=format&fit=crop&w=800&q=80',
    category: 'Mehndi & Haldi',
    location: 'Darbhanga, Bihar',
    date: '15 Feb, 2026',
    title: 'Vibrant Ubtan Joy',
    aspectRatio: 'aspect-[3/4]',
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80',
    category: 'Candid Moments',
    location: 'Bhagalpur, Bihar',
    date: '08 Mar, 2026',
    title: 'Family Blessings',
    aspectRatio: 'aspect-[4/5]',
  },
  {
    id: 7,
    url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
    category: 'Pre-Wedding',
    location: 'Nalanda, Bihar',
    date: '14 Apr, 2026',
    title: 'Historic Love',
    aspectRatio: 'aspect-[16/9]',
  },
  {
    id: 8,
    url: 'https://i.pinimg.com/1200x/d4/26/1a/d4261a79fd9c5f95065d0d00e7264622.jpg',
    category: 'Groom Moments',
    location: 'Patna, Bihar',
    date: '22 May, 2026',
    title: 'Groom Entry in Maur',
    aspectRatio: 'aspect-square',
  },
  {
    id: 9,
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    category: 'Ceremonies',
    location: 'Munger, Bihar',
    date: '30 Jun, 2026',
    title: 'Kanya Daan Rituals',
    aspectRatio: 'aspect-[3/4]',
  },
  {
    id: 10,
    url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80',
    category: 'Receptions',
    location: 'Purnia, Bihar',
    date: '12 Jul, 2026',
    title: 'Joyful Celebration',
    aspectRatio: 'aspect-[4/3]',
  }
];

const GALLERY_CATEGORIES = ['All Photos', 'Ceremonies', 'Pre-Wedding', 'Receptions', 'Candid Moments', 'Bridal Portraits', 'Groom Moments', 'Mehndi & Haldi'];

export default function WeddingGallery() {
  const [activeCategory, setActiveCategory] = useState('All Photos');
  const [filteredImages, setFilteredImages] = useState(GALLERY_IMAGES);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeCategory === 'All Photos') {
      setFilteredImages(GALLERY_IMAGES);
    } else {
      setFilteredImages(GALLERY_IMAGES.filter(img => img.category === activeCategory));
    }
  }, [activeCategory]);

  // Handle body scroll locking when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [lightboxOpen]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, currentIndex, filteredImages.length]);

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  return (
    <section className="relative py-24 px-4 overflow-hidden bg-gradient-to-br from-pink-50/50 via-white to-purple-50/50">
      {/* Luxury Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-[#FF4D6D]/10 to-transparent rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#6A11CB]/10 to-transparent rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md px-6 py-2.5 rounded-full border border-pink-100 shadow-sm mb-6"
          >
            <span className="text-[#C2185B] font-black text-[11px] uppercase tracking-[0.25em]">📸 Wedding Photo Gallery</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6"
          >
            A Glimpse of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D6D] to-[#6A11CB] italic">Forever</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 font-medium text-lg max-w-2xl mx-auto italic"
          >
            Explore our stunning collection of wedding photographs capturing the most precious moments and beautiful celebrations from across India.
          </motion.p>
        </div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-12"
        >
          {GALLERY_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-sm ${activeCategory === category
                ? 'bg-gradient-to-r from-[#C2185B] to-[#8E244D] text-white shadow-md transform scale-105'
                : 'bg-white text-gray-600 border border-gray-100 hover:border-pink-200 hover:text-[#C2185B]'
                }`}
            >
              {category} {category === 'All Photos' && <span className="opacity-70">(150+)</span>}
            </button>
          ))}
        </motion.div>

        {/* Masonry Grid */}
        <motion.div
          layout
          className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6"
        >
          <AnimatePresence>
            {filteredImages.map((img, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                key={img.id}
                onClick={() => openLightbox(index)}
                className={`relative break-inside-avoid rounded-3xl overflow-hidden cursor-pointer group shadow-premium border border-white/50 bg-white ${img.aspectRatio}`}
              >
                {/* Image */}
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  loading="lazy"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Top Tags */}
                <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 -translate-y-2 group-hover:translate-y-0">
                  <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-md">
                    {img.category}
                  </span>
                </div>

                {/* Center View CTA */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/50 shadow-2xl">
                    <FiZoomIn size={24} />
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 translate-y-4 group-hover:translate-y-0">
                  <h4 className="font-display font-black text-xl text-white tracking-tight mb-2 drop-shadow-md">
                    {img.title}
                  </h4>
                  <div className="flex items-center justify-between text-white/80 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><FiMapPin className="text-[#D4AF37]" size={12} /> {img.location}</span>
                    <span className="flex items-center gap-1.5"><FiCalendar className="text-[#D4AF37]" size={12} /> {img.date}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center"
            onContextMenu={(e) => e.preventDefault()} // Disable right-click to prevent downloads
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-6 right-6 md:top-10 md:right-10 w-14 h-14 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-2xl hover:scale-110 z-50"
            >
              <FiX size={24} />
            </button>

            {/* Navigation Arrows */}
            {filteredImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-2xl hover:scale-110 z-50"
                >
                  <FiChevronLeft size={32} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-2xl hover:scale-110 z-50"
                >
                  <FiChevronRight size={32} />
                </button>
              </>
            )}

            {/* Current Image & Info */}
            <div className="relative w-full max-w-6xl max-h-[85vh] flex flex-col items-center justify-center px-4 md:px-24">
              <motion.img
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                src={filteredImages[currentIndex]?.url}
                alt={filteredImages[currentIndex]?.title}
                className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/10"
              />
              <motion.div
                key={`info-${currentIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-4 left-0 right-0 text-center px-4"
              >
                <div className="inline-block bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                  <h3 className="font-display font-black text-2xl text-white tracking-tight mb-3">
                    {filteredImages[currentIndex]?.title}
                  </h3>
                  <div className="flex items-center justify-center gap-6 text-white/80 text-[11px] font-black uppercase tracking-widest">
                    <span className="flex items-center gap-2"><FiMapPin className="text-[#D4AF37]" size={14} /> {filteredImages[currentIndex]?.location}</span>
                    <span className="w-1 h-1 bg-white/30 rounded-full" />
                    <span className="flex items-center gap-2"><FiCalendar className="text-[#D4AF37]" size={14} /> {filteredImages[currentIndex]?.date}</span>
                    <span className="w-1 h-1 bg-white/30 rounded-full" />
                    <span className="text-[#C2185B]">{filteredImages[currentIndex]?.category}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white text-[10px] font-black tracking-widest">
              {currentIndex + 1} / {filteredImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
