import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiHeart, FiMapPin, FiCalendar, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

const STORIES = [
  {
    id: 1,
    bride: 'Priya',
    groom: 'Aarav',
    location: 'Darbhnaga, Bihar',
    date: 'Jan , 2026',
    category: 'Royal Bihari Heritage',
    preview: '"Our dream wedding became reality with ShaadiSaathi. From the perfect Maur to the magical Sindoor Daan, every vendor went above and beyond."',
    budget: '₹15L - ₹20L',
    services: ['Venue', 'Photography', 'Decor', 'Catering'],
    image: 'https://i.pinimg.com/1200x/9b/42/da/9b42dae18ec602ce84c14bcb8edf6748.jpg',
    featured: true,
  },
  {
    id: 2,
    bride: 'Sneha',
    groom: 'Rahul',
    location: 'Muzaffarpur, Bihar',
    date: 'Nov 20, 2026',
    category: 'Intimate Haldi Celebration',
    preview: '"We wanted a small, meaningful ceremony with traditional Ubtan rituals. ShaadiSaathi helped us find the perfect boutique vendors in Gaya."',
    budget: '₹8L - ₹12L',
    services: ['Photography', 'Makeup', 'Pandit'],
    image: 'https://plus.unsplash.com/premium_photo-1682092018999-2c8fcfe944f3?auto=format&fit=crop&w=800&q=80',
    featured: false,
  },
  {
    id: 3,
    bride: 'Anjali',
    groom: 'Vikram',
    location: 'Muzaffarpur, Bihar',
    date: 'Jan 15, 2026',
    category: 'Grand Baraat Entry',
    preview: '"The Baraat Cab bundle was a lifesaver! Coordinating 50 guests across cities for our Muzaffarpur wedding was completely stress-free."',
    budget: '₹20L - ₹30L',
    services: ['Baraat Cabs', 'Venue', 'Band'],
    image: 'https://i.pinimg.com/736x/50/ec/3c/50ec3c5f166da95b09ebca446fb92423.jpg',
    featured: false,
  }
];

export default function RealWeddingStories() {
  const featuredStory = STORIES.find(s => s.featured);
  const otherStories = STORIES.filter(s => !s.featured);

  return (
    <section className="relative py-24 px-4 overflow-hidden bg-white">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[#D4AF37]/10 to-[#C2185B]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header & Social Proof */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-8"
          >
            <div className="flex items-center gap-2 bg-pink-50 text-[#C2185B] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-sm border border-pink-100">
              <FiHeart className="animate-pulse" /> 10+ Happy Couples
            </div>
            <div className="flex items-center gap-2 bg-[#FFF8F0] text-[#D4AF37] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-sm border border-[#D4AF37]/20">
              <span className="text-sm">⭐</span> 4 Avg Rating
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6"
          >
            Real Wedding <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D6D] to-[#6A11CB] italic">Stories</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 font-medium text-lg max-w-2xl mx-auto italic"
          >
            Discover inspiring love stories and beautiful celebrations from couples who trusted ShaadiSaathi for their special day.
          </motion.p>
        </div>

        {/* Featured Story */}
        {featuredStory && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mb-12 relative rounded-[3rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-white group"
          >
            <div className="absolute inset-0">
              <img src={featuredStory.image} alt="Featured Wedding" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
            </div>

            <div className="absolute top-6 left-6 md:top-8 md:left-8">
              <span className="bg-[#D4AF37] text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                🌟 Featured Story
              </span>
            </div>

            <div className="relative z-10 p-8 md:p-16 flex flex-col justify-end h-[600px] md:h-[700px]">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-4 text-white/90 text-xs font-black uppercase tracking-widest mb-6">
                  <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/30"><FiMapPin className="text-[#D4AF37]" /> {featuredStory.location}</span>
                  <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/30"><FiCalendar className="text-[#D4AF37]" /> {featuredStory.date}</span>
                  <span className="flex items-center gap-1.5 bg-[#C2185B]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#C2185B]"><FiHeart /> {featuredStory.category}</span>
                </div>

                <h3 className="font-display font-black text-5xl md:text-7xl text-white mb-6 tracking-tight drop-shadow-2xl">
                  {featuredStory.bride} & {featuredStory.groom}
                </h3>

                <p className="text-xl md:text-2xl text-white/90 font-medium italic mb-8 border-l-4 border-[#D4AF37] pl-6 leading-relaxed">
                  {featuredStory.preview}
                </p>

                <div className="flex flex-wrap items-center gap-8 mb-10">
                  <div>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Wedding Budget</p>
                    <p className="text-white font-bold text-lg">{featuredStory.budget}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Services Booked</p>
                    <div className="flex flex-wrap gap-2">
                      {featuredStory.services.map(srv => (
                        <span key={srv} className="text-white font-bold text-sm bg-white/10 px-2 py-1 rounded-md border border-white/20">{srv}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <Link to="/services" className="inline-flex items-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-white transition-all duration-300 shadow-xl hover:shadow-[0_10px_30px_rgba(212,175,55,0.4)] hover:-translate-y-1">
                  View Full Story <FiArrowRight size={16} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {otherStories.map((story, idx) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + (idx * 0.1) }}
              className="bg-white rounded-[2.5rem] overflow-hidden shadow-premium hover:shadow-premium-hover hover:-translate-y-2 transition-all duration-500 border border-gray-100 group flex flex-col"
            >
              <div className="relative h-72 overflow-hidden">
                <img src={story.image} alt={`${story.bride} and ${story.groom}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                  <div>
                    <span className="bg-[#C2185B] text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-md mb-3 inline-block">
                      {story.category}
                    </span>
                    <h4 className="font-display font-black text-3xl text-white tracking-tight">
                      {story.bride} & {story.groom}
                    </h4>
                  </div>
                </div>
              </div>

              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">
                  <span className="flex items-center gap-1.5"><FiMapPin className="text-[#D4AF37]" size={14} /> {story.location}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span className="flex items-center gap-1.5"><FiCalendar className="text-[#D4AF37]" size={14} /> {story.date}</span>
                </div>

                <p className="text-gray-600 font-medium italic mb-8 leading-relaxed flex-1">
                  {story.preview}
                </p>

                <div className="pt-6 border-t border-gray-100 mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                    <FiCheckCircle className="text-green-500" /> {story.services.length} Services Booked
                  </div>
                  <Link to="/services" className="w-12 h-12 rounded-full bg-pink-50 text-[#C2185B] flex items-center justify-center group-hover:bg-[#C2185B] group-hover:text-white transition-all shadow-sm">
                    <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gray-900 rounded-[3rem] p-12 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] via-[#C2185B] to-[#6A11CB]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-[#C2185B]/20 to-[#6A11CB]/20 rounded-full blur-[100px] pointer-events-none" />

          <h3 className="font-display font-black text-4xl md:text-5xl text-white mb-4 relative z-10">
            Ready To Create Your Dream Story?
          </h3>
          <p className="text-gray-400 font-medium text-lg mb-10 max-w-2xl mx-auto relative z-10">
            Join thousands of couples who have planned their perfect day with our trusted vendors and planning tools.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <Link to="/services" className="bg-gradient-to-r from-[#D4AF37] to-[#B38D22] text-gray-900 font-black px-10 py-5 rounded-full text-[11px] uppercase tracking-[0.2em] shadow-xl hover:shadow-[0_15px_40px_rgba(212,175,55,0.4)] hover:-translate-y-1 transition-all">
              Find Wedding Vendors
            </Link>
            <Link to="/register" className="bg-white/10 text-white border border-white/20 font-black px-10 py-5 rounded-full text-[11px] uppercase tracking-[0.2em] hover:bg-white/20 transition-all">
              Start Planning Now
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
