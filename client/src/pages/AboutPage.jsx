import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight, FiShield, FiHeart, FiStar, FiCheck, FiMapPin, FiGrid, FiCalendar, FiAward } from 'react-icons/fi'

export default function AboutPage() {
  const stats = [
    { value: '10+', label: 'Happy Couples', icon: <FiHeart /> },
    { value: '10+', label: 'Top Vendors', icon: <FiAward /> },
    { value: '1+', label: 'Cities Covered', icon: <FiMapPin /> },
    { value: '4/5', label: 'Customer Rating', icon: <FiStar /> },
  ]

  const features = [
    { title: 'Trusted Vendors', desc: 'Handpicked and verified professionals for your big day.', icon: <FiShield /> },
    { title: 'Premium Baraat Cabs', desc: 'India’s first bulk transportation engine for weddings.', icon: '🚗' },
    { title: 'AI Wedding Planner', desc: 'Smart tools to organize your tasks and timeline.', icon: <FiGrid /> },
    { title: 'Budget Tools', desc: 'Keep track of every penny with our simple budget calculator.', icon: <FiCalendar /> },
  ]

  return (
    <div className="min-h-screen bg-[#FFF8F0]/30 pt-16 relative overflow-hidden">
      <div className="absolute inset-0 floral-pattern opacity-[0.02] pointer-events-none" />

      {/* ── Hero Section ── */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-gray-900">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 3, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80"
          alt="ShaadiSaathi Story"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-black/50 to-transparent" />
        <div className="absolute inset-0 floral-pattern opacity-[0.05]" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] px-6 py-2.5 rounded-full mb-6 shadow-xl">
              <span className="animate-pulse">✨</span> ShaadiSaathi – शादी का सच्चा साथी
            </div>
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-black text-white leading-none mb-6 drop-shadow-2xl tracking-tighter">
              Our <span className="text-[#C2185B] italic">Story</span>
            </h1>
            <p className="text-lg md:text-2xl text-white/90 font-medium italic max-w-3xl mx-auto drop-shadow-md leading-relaxed mb-10">
              Your trusted platform for finding wedding vendors, venues, photographers, catering, and Premium Baraat Cabs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/services" className="btn-primary !py-4 !px-8 shadow-[0_0_40px_rgba(194,24,91,0.4)] flex items-center justify-center gap-2">
                Explore Vendors <FiArrowRight />
              </Link>
              <Link to="/cab-booking" className="bg-white/10 backdrop-blur-md border border-white/30 text-white font-black text-[11px] uppercase tracking-widest py-4 px-8 rounded-2xl hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                Book Baraat Cabs 🚗
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Who We Are ── */}
      <section className="py-24 px-4 bg-white relative z-20 -mt-10 rounded-t-[3rem] border-t border-pink-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="divider-luxe mb-6">
              <div className="divider-line" />
              <span className="text-[#C2185B] text-2xl">🪷</span>
              <div className="divider-line" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Who We Are
            </h2>
            <p className="text-gray-500 text-xl md:text-2xl leading-relaxed font-medium italic max-w-3xl mx-auto">
              ShaadiSaathi is a one-stop wedding platform designed to simplify Indian wedding planning. We bring the best wedding professionals and services to your fingertips, ensuring your special day is nothing short of perfect.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#FFF8F0] to-white rounded-[2.5rem] p-10 md:p-14 shadow-premium border border-gold-100 hover:shadow-premium-hover transition-all duration-500 group"
          >
            <div className="w-16 h-16 bg-[#C2185B] text-white rounded-2xl flex items-center justify-center text-3xl mb-8 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
              🎯
            </div>
            <h3 className="font-display text-3xl md:text-4xl font-black text-gray-900 mb-4">Our Mission</h3>
            <p className="text-gray-600 text-lg leading-relaxed font-medium">
              Making wedding planning easy, affordable, and stress-free. We believe that organizing your big day should be a joyful experience, not a chore.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-10 md:p-14 shadow-premium border border-gray-700 hover:shadow-premium-hover transition-all duration-500 group"
          >
            <div className="w-16 h-16 bg-[#D4AF37] text-white rounded-2xl flex items-center justify-center text-3xl mb-8 shadow-lg group-hover:scale-110 group-hover:-rotate-6 transition-transform">
              👁️
            </div>
            <h3 className="font-display text-3xl md:text-4xl font-black text-white mb-4">Our Vision</h3>
            <p className="text-gray-300 text-lg leading-relaxed font-medium">
              To become India’s trusted digital wedding ecosystem. Setting the standard for transparency, quality, and convenience in the wedding industry.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-24 px-4 bg-white border-y border-pink-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-50 rounded-full blur-[100px] -z-10" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[#C2185B] text-xs font-black uppercase tracking-[0.3em] mb-4">The ShaadiSaathi Advantage</h2>
            <h3 className="font-display text-4xl md:text-5xl font-black text-gray-900">Why Choose Us</h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:border-[#D4AF37]/50 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-2 text-center"
              >
                <div className="w-16 h-16 mx-auto bg-[#FFF8F0] rounded-2xl flex items-center justify-center text-3xl mb-6 text-[#C2185B] group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <h4 className="font-display font-black text-xl text-gray-900 mb-3">{feat.title}</h4>
                <p className="text-gray-500 font-medium text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 bg-[#1a1a1a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#C2185B]/20 to-[#D4AF37]/10" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="text-4xl text-[#D4AF37] mb-4 flex justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  {stat.icon}
                </div>
                <div className="font-display text-5xl md:text-6xl font-black text-white mb-2 tracking-tighter">
                  {stat.value}
                </div>
                <div className="h-1 w-8 bg-[#C2185B] mx-auto my-3 rounded-full" />
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder Story ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto bg-[#FFF8F0] rounded-[3rem] p-10 md:p-16 border border-gold-100 shadow-premium relative overflow-hidden">
          <div className="absolute top-0 right-0 text-[200px] opacity-5 leading-none font-display pointer-events-none">"</div>
          <div className="relative z-10 grid md:grid-cols-5 gap-10 items-center">
            <div className="md:col-span-2">
              <div className="w-40 h-40 md:w-full md:h-80 mx-auto rounded-[2rem] overflow-hidden shadow-2xl rotate-3">
                <img
                  src="https://images.unsplash.com/photo-1555243896-771a81d114ba?q=80"
                  alt="Founder Journey"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="md:col-span-3 text-center md:text-left">
              <h2 className="text-[#C2185B] text-xs font-black uppercase tracking-[0.3em] mb-3">Our Genesis</h2>
              <h3 className="font-display text-3xl md:text-4xl font-black text-gray-900 mb-6">Why We Started ShaadiSaathi</h3>
              <p className="text-gray-600 leading-relaxed font-medium mb-6">
                Planning a wedding should be a joyous celebration, not a logistical nightmare. After witnessing countless families struggle with finding trustworthy vendors, negotiating hidden fees, and managing stressful transportation, we knew there had to be a better way.
              </p>
              <p className="text-gray-600 leading-relaxed font-medium">
                We built ShaadiSaathi to bring transparency, ease, and absolute reliability to the Indian wedding ecosystem. Your big day is our biggest priority.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

