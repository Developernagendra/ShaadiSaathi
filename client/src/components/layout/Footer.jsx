import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiInstagram, FiFacebook, FiYoutube, FiTwitter, FiMail, FiPhone, FiMapPin, 
  FiArrowRight, FiArrowUp, FiCamera, FiMusic, FiHeart, FiStar, FiShield, FiLoader, FiCheckCircle, FiCheck
} from 'react-icons/fi'
import { FaWhatsapp, FaCcVisa, FaCcMastercard, FaPaypal } from 'react-icons/fa'
import { LuCar, LuUtensils, LuPaintbrush } from 'react-icons/lu'
import api from '../../utils/api'

export default function Footer() {
  const [contact, setContact] = useState({
    email: 'support@shaadisaathi.com',
    phone: '+91 7903075243',
    address: 'Darbhanga, Bihar, India',
    company: 'ShaadiSaathi',
    socialLinks: {
      instagram: 'https://www.instagram.com/_shaadisaathi/',
      facebook: '#',
      youtube: '#',
      twitter: '#'
    }
  })

  const [showScrollTop, setShowScrollTop] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter a valid email address.')
      return
    }
    setStatus('loading')
    setError('')
    
    try {
      await api.post('/newsletter/subscribe', { email })
      setStatus('success')
      setEmail('')
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const { data } = await api.get('/features/contact-info')
        if (data.success && data.data) {
          setContact(prev => ({ ...prev, ...data.data }))
        }
      } catch (err) {
        console.error('Footer contact fetch error:', err)
      }
    }
    fetchContact()

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const services = [
    { name: 'Photography', slug: 'photography', icon: <FiCamera /> },
    { name: 'Catering', slug: 'catering', icon: <LuUtensils /> },
    { name: 'Decoration', slug: 'decoration', icon: <FiStar /> },
    { name: 'Wedding Cars', slug: 'wedding-cars', icon: <LuCar /> },
    { name: 'Mehndi Artists', slug: 'mehndi-artists', icon: <LuPaintbrush /> },
    { name: 'Wedding Venues', slug: 'venues', icon: <FiMapPin /> },
    { name: 'Music & DJ', slug: 'music-dj', icon: <FiMusic /> }
  ]

  const quickLinks = [
    { to: '/', label: 'Home' },
    { to: '/services', label: 'Vendors' },
    { to: '/baraat-cabs', label: 'Baraat Cabs' },
    { to: '/ai-planner', label: 'AI Planner' },
    { to: '/budget-calculator', label: 'Budget Planner' },
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact Us' },
  ]

  const legal = [
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms of Service' },
    { to: '/faq', label: 'Help Center' },
  ]

  return (
    <footer className="bg-[#0a0a0a] text-gray-400 relative overflow-hidden font-sans">
      
      {/* ── Scroll To Top Button ── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-gradient-to-r from-[#D4AF37] to-[#B38D22] text-[#1a1a1a] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-110 hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all"
            aria-label="Scroll to top"
          >
            <FiArrowUp size={20} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Premium Top CTA / Newsletter ── */}
      <div className="relative border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] via-[#C2185B]/20 to-[#1a1a1a] z-0" />
        <div className="absolute top-0 right-0 w-72 h-72 md:w-[500px] md:h-[500px] bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 py-20 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-4 leading-tight drop-shadow-2xl">
              Stay Inspired for <br /><span className="italic font-light text-[#D4AF37]">Your Big Day</span>
            </h2>
            <p className="text-white/70 text-lg font-medium italic max-w-lg">
              Get wedding updates, special offers, and premium vendor insights straight to your inbox.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row gap-3 relative group focus-within:border-[#D4AF37]/50 transition-colors">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#C2185B] to-[#D4AF37] rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 pointer-events-none"></div>
            <input 
              type="email" 
              required
              disabled={status === 'loading'}
              value={email}
              onChange={e => {setEmail(e.target.value); setError('')}}
              placeholder="Enter your email address"
              className="relative flex-1 bg-white/10 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/40 outline-none focus:bg-white/20 transition-all font-medium"
            />
            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="relative bg-gradient-to-r from-[#C2185B] to-[#8E244D] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-[0_0_20px_rgba(194,24,91,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 overflow-hidden"
            >
              {status === 'loading' ? (
                <><FiLoader className="animate-spin text-lg" /> SUBSCRIBING...</>
              ) : status === 'error' ? (
                'TRY AGAIN'
              ) : (
                <>SUBSCRIBE <FiArrowRight className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
            {error && <p className="absolute -bottom-8 left-6 text-red-400 text-sm font-bold animate-pulse">{error}</p>}
          </form>
        </div>
      </div>

      {/* ── Success Modal ── */}
      <AnimatePresence>
        {status === 'success' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setStatus('idle')}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-[#D4AF37]/30 rounded-3xl p-8 md:p-12 max-w-md w-full shadow-[0_30px_100px_rgba(212,175,55,0.15)] text-center overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C2185B]/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/2" />
              
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 text-4xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}>
                  <FiCheckCircle />
                </motion.div>
              </div>

              <h3 className="text-3xl font-display font-black text-white mb-2">🎉 Thank You!</h3>
              <p className="text-[#D4AF37] font-bold uppercase tracking-widest text-[10px] mb-8">Subscription Successful</p>
              
              <div className="space-y-4 text-left bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                <p className="text-gray-300 font-medium text-sm mb-4">You will now receive:</p>
                <ul className="space-y-3">
                  {['Wedding Planning Tips', 'Premium Vendor Offers', 'Baraat Cab Deals', 'Exclusive Updates'].map((item, i) => (
                    <motion.li 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (i * 0.1) }}
                      className="flex items-center gap-3 text-white/80 text-sm font-medium"
                    >
                      <FiCheck className="text-emerald-400 shrink-0" /> {item}
                    </motion.li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => setStatus('idle')}
                className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-colors"
              >
                Continue Exploring
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Main Footer ── */}
      <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* Brand & Mission */}
          <div className="lg:col-span-4 pr-0 lg:pr-8">
            <Link to="/" className="flex items-center gap-4 mb-8 group inline-flex relative">
              <div className="absolute inset-0 bg-[#C2185B] blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
              <div className="relative w-14 h-14 bg-gradient-to-br from-[#C2185B] to-[#8E244D] rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl rotate-3 group-hover:rotate-0 transition-transform">💒</div>
              <div className="relative flex flex-col">
                <span className="font-display font-black text-3xl text-white tracking-tighter leading-none">{contact.company.slice(0, 6)}<span className="text-[#D4AF37]">{contact.company.slice(6)}</span></span>
                <span className="text-[9px] font-black uppercase tracking-[0.4em] mt-2 text-[#D4AF37] italic">Your Wedding Partner</span>
              </div>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium italic">
              India's premier wedding marketplace. Helping you find the best vendors, premium baraat cabs, and smart AI planning tools for your dream wedding.
            </p>
            <div className="flex gap-3">
              {[
                { icon: <FiInstagram size={18} />, href: contact.socialLinks.instagram },
                { icon: <FiFacebook size={18} />, href: contact.socialLinks.facebook },
                { icon: <FiYoutube size={18} />, href: contact.socialLinks.youtube },
                { icon: <FiTwitter size={18} />, href: contact.socialLinks.twitter },
              ].map((social, i) => (
                <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#C2185B] hover:text-white hover:border-[#C2185B] transition-all shadow-sm hover:shadow-[0_0_15px_rgba(194,24,91,0.5)] hover:-translate-y-1">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-display font-black text-lg mb-8 relative inline-block">
              Quick Links
              <div className="absolute -bottom-2 left-0 w-1/2 h-0.5 bg-[#D4AF37]"></div>
            </h4>
            <ul className="space-y-4">
              {quickLinks.map(({ to, label }) => (
                <li key={label}>
                  <Link 
                    to={to} 
                    className="text-gray-400 hover:text-white text-sm font-medium transition-all hover:translate-x-2 inline-flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C2185B] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-display font-black text-lg mb-8 relative inline-block">
              Premium Services
              <div className="absolute -bottom-2 left-0 w-1/2 h-0.5 bg-[#D4AF37]"></div>
            </h4>
            <ul className="space-y-4">
              {services.map((cat) => (
                <li key={cat.slug}>
                  <Link to={`/services?category=${cat.slug}`} className="text-gray-400 hover:text-[#D4AF37] text-sm font-medium transition-all hover:translate-x-2 inline-flex items-center gap-3 group">
                    <span className="text-gray-500 group-hover:text-[#D4AF37] transition-colors">{cat.icon}</span>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-display font-black text-lg mb-8 relative inline-block">
              Contact Us
              <div className="absolute -bottom-2 left-0 w-1/2 h-0.5 bg-[#D4AF37]"></div>
            </h4>
            <div className="space-y-5">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-start gap-4 group cursor-pointer bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all hover:bg-white/10"
              >
                <span className="w-8 h-8 rounded-full bg-[#C2185B]/20 flex items-center justify-center text-[#C2185B] shrink-0"><FiMapPin /></span>
                <span className="text-gray-300 text-sm font-medium leading-snug">{contact.address}</span>
              </a>
              
              <a href={`tel:${contact.phone?.replace(/\s+/g, '')}`} className="flex items-center gap-4 group hover:translate-x-2 transition-transform">
                <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#D4AF37] shrink-0 border border-white/10"><FiPhone /></span>
                <span className="text-white text-sm font-bold tracking-wider">{contact.phone}</span>
              </a>
              
              <a href={`mailto:${contact.email}`} className="flex items-center gap-4 group hover:translate-x-2 transition-transform">
                <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#D4AF37] shrink-0 border border-white/10"><FiMail /></span>
                <span className="text-gray-400 text-sm font-medium group-hover:text-white transition-colors">{contact.email}</span>
              </a>

              <a 
                href={`https://wa.me/${contact.phone?.replace(/\s+/g, '').replace('+', '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-6 w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)]"
              >
                <FaWhatsapp size={16} /> WhatsApp Support
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Decorative Divider ── */}
      <div className="flex justify-center items-center py-4 relative opacity-50">
        <div className="w-1/3 h-[1px] bg-gradient-to-r from-transparent to-[#D4AF37]/30"></div>
        <div className="px-4 text-[#D4AF37]"><FiHeart size={14} /></div>
        <div className="w-1/3 h-[1px] bg-gradient-to-l from-transparent to-[#D4AF37]/30"></div>
      </div>

      {/* ── Bottom Bar & Trust Badges ── */}
      <div className="bg-[#050505] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-gray-500 text-sm font-medium text-center md:text-left">
            &copy; {new Date().getFullYear()} {contact.company}. All rights reserved. Made with <FiHeart className="inline text-[#C2185B] fill-[#C2185B]" size={12}/> in India.
          </p>
          
          <div className="flex items-center gap-4 text-gray-600">
             <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mr-2 flex items-center gap-1"><FiShield /> Secure Payments</span>
             <FaCcVisa size={24} className="hover:text-white transition-colors cursor-pointer" />
             <FaCcMastercard size={24} className="hover:text-white transition-colors cursor-pointer" />
             <FaPaypal size={24} className="hover:text-white transition-colors cursor-pointer" />
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {legal.map(({ to, label }) => (
              <Link key={to} to={to} className="text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
