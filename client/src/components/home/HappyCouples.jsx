import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiChevronLeft, FiChevronRight, FiCheckCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const COUPLES_DATA = [
  {
    id: 1,
    coupleNames: 'Aarav & Priya',
    city: 'Darbhnaga, Bihar',
    image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=400&q=80',
    rating: 5,
    text: '"ShaadiSaathi made our wedding planning effortless. We found amazing vendors in Patna and everything was perfectly organized from the Baraat to the Sindoor Daan."',
    services: ['Photography', 'Catering', 'Decoration']
  },
  {
    id: 2,
    coupleNames: 'Rahul & Sneha',
    city: 'Darbhnaga, Bihar',
    image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=400&q=80',
    rating: 5,
    text: '"We were stressed about managing out-of-town guests, but the Baraat Cab bundle and the verified venues made it a breeze. Highly recommend!"',
    services: ['Baraat Cabs', 'Venue', 'Makeup']
  },
  {
    id: 3,
    coupleNames: 'Vikram & Anjali',
    city: 'Muzaffarpur, Bihar',
    image: 'https://images.unsplash.com/photo-1542042161784-26ab9e041e89?auto=format&fit=crop&w=400&q=80',
    rating: 5,
    text: '"The luxury aesthetic of ShaadiSaathi translates into their service. The vendors we hired for our Haldi and Reception were extremely professional and premium."',
    services: ['Pandit', 'Decoration', 'Photography']
  }
];

const STATS = [
  { icon: '👰', value: 10, suffix: '+', label: 'Happy Couples', color: 'from-pink-500 to-rose-400' },
  { icon: '🏆', value: 10, suffix: '+', label: 'Top Vendors', color: 'from-emerald-500 to-teal-400' },
  { icon: '🗺️', value: 1, suffix: '+', label: 'Cities Covered', color: 'from-purple-500 to-indigo-400' },
  { icon: '⭐', value: 4, suffix: '/5', label: 'Customer Rating', color: 'from-yellow-500 to-amber-400' }
];

const FloatingHeart = ({ delay, left, duration }) => (
  <motion.div
    initial={{ y: '100vh', opacity: 0, scale: 0 }}
    animate={{
      y: '-20vh',
      opacity: [0, 1, 0],
      scale: [0.5, 1, 0.5],
      x: ['0px', '50px', '-50px', '0px']
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      delay: delay,
      ease: "easeInOut"
    }}
    className="absolute text-[#FF4D6D]/20 text-2xl z-0 pointer-events-none"
    style={{ left: `${left}%` }}
  >
    ❤️
  </motion.div>
);

// Simple Animated Counter Component
const Counter = ({ from = 0, to, duration = 2 }) => {
  const [count, setCount] = useState(from);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percent = Math.min(progress / (duration * 1000), 1);

      setCount(from + (to - from) * percent);

      if (percent < 1) {
        animationFrame = requestAnimationFrame(animateCount);
      }
    };

    animationFrame = requestAnimationFrame(animateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [from, to, duration]);

  // Format to 1 decimal place if it has decimals, else integer
  return <span>{to % 1 !== 0 ? count.toFixed(1) : Math.floor(count)}</span>;
};

export default function HappyCouples() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % COUPLES_DATA.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + COUPLES_DATA.length) % COUPLES_DATA.length);
  };

  // Auto-slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative py-32 px-4 overflow-hidden bg-white">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-b from-pink-50/30 via-purple-50/20 to-white" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-[#FF4D6D]/10 to-transparent rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#6A11CB]/10 to-transparent rounded-full blur-[150px] pointer-events-none" />

      {/* Floating Hearts */}
      <FloatingHeart delay={0} left={10} duration={15} />
      <FloatingHeart delay={5} left={30} duration={20} />
      <FloatingHeart delay={2} left={50} duration={18} />
      <FloatingHeart delay={8} left={70} duration={22} />
      <FloatingHeart delay={4} left={85} duration={16} />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6"
          >
            ❤️ Loved By <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D6D] to-[#6A11CB] italic">Happy Couples</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 font-medium text-lg md:text-xl max-w-3xl mx-auto italic leading-relaxed"
          >
            Thousands of couples have trusted ShaadiSaathi to make their wedding journey memorable, stress-free, and beautiful.
          </motion.p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-24">
          {STATS.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] p-6 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(255,77,109,0.1)] hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="text-4xl md:text-5xl mb-4 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 drop-shadow-sm">
                {stat.icon}
              </div>
              <div className="font-display font-black text-3xl md:text-4xl text-gray-900 mb-2 flex items-center justify-center">
                <Counter to={stat.value} />{stat.suffix}
              </div>
              <div className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-widest">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-5xl mx-auto mb-24">
          <div className="absolute top-1/2 -left-4 md:-left-12 -translate-y-1/2 z-20">
            <button onClick={prevSlide} className="w-12 h-12 bg-white text-gray-800 rounded-full flex items-center justify-center shadow-xl hover:bg-[#FF4D6D] hover:text-white transition-all hover:scale-110 border border-gray-100">
              <FiChevronLeft size={24} />
            </button>
          </div>

          <div className="absolute top-1/2 -right-4 md:-right-12 -translate-y-1/2 z-20">
            <button onClick={nextSlide} className="w-12 h-12 bg-white text-gray-800 rounded-full flex items-center justify-center shadow-xl hover:bg-[#FF4D6D] hover:text-white transition-all hover:scale-110 border border-gray-100">
              <FiChevronRight size={24} />
            </button>
          </div>

          <div className="overflow-hidden rounded-[3rem] shadow-premium relative bg-white border border-gray-100">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="grid grid-cols-1 md:grid-cols-5 h-full"
              >
                {/* Image Section */}
                <div className="md:col-span-2 relative h-64 md:h-auto">
                  <img src={COUPLES_DATA[currentIndex].image} alt={COUPLES_DATA[currentIndex].coupleNames} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/90 md:to-white hidden md:block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
                  <div className="absolute bottom-4 left-4 md:hidden text-white font-display font-black text-2xl">
                    {COUPLES_DATA[currentIndex].coupleNames}
                  </div>
                </div>

                {/* Content Section */}
                <div className="md:col-span-3 p-8 md:p-16 flex flex-col justify-center bg-white relative">
                  <div className="absolute top-8 right-8 text-6xl text-pink-100 font-serif leading-none hidden md:block">"</div>

                  <div className="hidden md:block mb-6">
                    <h3 className="font-display font-black text-3xl text-gray-900 mb-2">
                      {COUPLES_DATA[currentIndex].coupleNames}
                    </h3>
                    <p className="text-gray-500 font-medium flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                      {COUPLES_DATA[currentIndex].city}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 mb-6 text-[#D4AF37]">
                    {[...Array(COUPLES_DATA[currentIndex].rating)].map((_, i) => (
                      <FiStar key={i} size={20} className="fill-current" />
                    ))}
                  </div>

                  <p className="text-gray-700 text-lg md:text-xl italic leading-relaxed mb-8 relative z-10">
                    {COUPLES_DATA[currentIndex].text}
                  </p>

                  <div className="mt-auto">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                      Services Used
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {COUPLES_DATA[currentIndex].services.map((service, idx) => (
                        <span key={idx} className="bg-pink-50 text-[#C2185B] border border-pink-100 px-3 py-1.5 rounded-full text-[11px] font-bold">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {COUPLES_DATA.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${currentIndex === idx ? 'bg-[#FF4D6D] w-8' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl border border-gray-700"
        >
          {/* Internal gradient blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-[#FF4D6D]/20 to-[#D4AF37]/20 rounded-full blur-[100px] pointer-events-none" />

          <h3 className="font-display font-black text-4xl md:text-5xl text-white mb-6 relative z-10">
            Ready To Create Your Dream Wedding?
          </h3>

          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <Link to="/services" className="bg-gradient-to-r from-[#D4AF37] to-[#B38D22] text-gray-900 font-black px-10 py-5 rounded-full text-[11px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.5)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              ✨ Find Vendors
            </Link>
            <a href="https://wa.me/7903075243" target="_blank" rel="noopener noreferrer" className="bg-white/10 text-white border border-white/20 font-black px-10 py-5 rounded-full text-[11px] uppercase tracking-[0.2em] hover:bg-white/20 transition-all flex items-center justify-center gap-2">
              💬 Talk On WhatsApp
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
