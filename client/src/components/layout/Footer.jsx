import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiInstagram, FiFacebook, FiYoutube, FiTwitter, FiMail, FiPhone, FiMapPin,
  FiArrowUp, FiCamera, FiMusic, FiStar, FiLoader, FiClock, FiLinkedin, FiHeart
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { LuCar, LuUtensils, LuPaintbrush } from 'react-icons/lu'
import api from '../../utils/api'

export default function Footer() {
  const [contact, setContact] = useState({
    email: 'n4narendrakr@gmail.com',
    phone: '+91 7903075243',
    address: 'Darbhanga, Bihar, India',
    company: 'ShaadiSaathi',
    socialLinks: {
      instagram: 'https://www.instagram.com/_shaadisaathi/',
      facebook: '#',
      youtube: '#',
      twitter: '#',
      linkedin: '#'
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
      setTimeout(() => setStatus('idle'), 5000)
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

  const quickLinks = [
    { to: '/', label: 'Home' },
    { to: '/services', label: 'Services' },
    { to: '/vendors', label: 'Vendors' },
    { to: '/baraat-cabs', label: 'Baraat Cabs' },
    { to: '/ai-planner', label: 'AI Planner' },
    { to: '/contact', label: 'Contact' },
  ]

  const services = [
    { name: 'Photography', to: '/services?category=photography', icon: <FiCamera size={16} /> },
    { name: 'Catering', to: '/services?category=catering', icon: <LuUtensils size={16} /> },
    { name: 'Decoration', to: '/services?category=decoration', icon: <FiStar size={16} /> },
    { name: 'Mehndi', to: '/services?category=mehndi', icon: <LuPaintbrush size={16} /> },
    { name: 'Venue', to: '/services?category=venues', icon: <FiMapPin size={16} /> },
    { name: 'Makeup Artist', to: '/services?category=makeup', icon: <FiHeart size={16} /> },
    { name: 'DJ', to: '/services?category=dj', icon: <FiMusic size={16} /> },
    { name: 'Baraat Cabs', to: '/baraat-cabs', icon: <LuCar size={16} /> },
  ]

  return (
    <footer className="relative bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#111827] text-slate-300 font-sans overflow-hidden">
      
      {/* ── Background Effects ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Pink Glow */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
        {/* Purple Blob */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3"></div>
        {/* Gold Accent */}
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10">

        {/* ── Scroll To Top Button ── */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-gradient-to-tr from-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] hover:-translate-y-1 transition-all duration-300"
              aria-label="Scroll to top"
            >
              <FiArrowUp size={20} strokeWidth={3} />
            </motion.button>
          )}
        </AnimatePresence>
        {/* ── MAIN FOOTER LAYOUT ── */}
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            
            {/* Column 1: Brand & Social */}
            <div className="space-y-6">
              <Link to="/" className="inline-block group">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg group-hover:rotate-6 transition-transform duration-300">💒</div>
                  <span className="font-black text-2xl text-white tracking-tight">{contact.company.slice(0, 6)}<span className="text-pink-400">{contact.company.slice(6)}</span></span>
                </div>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                India's trusted wedding planning platform connecting couples with verified wedding professionals.
              </p>
              <div className="flex gap-4 pt-2">
                {[
                  { icon: <FiFacebook size={18} />, href: contact.socialLinks.facebook },
                  { icon: <FiInstagram size={18} />, href: contact.socialLinks.instagram },
                  { icon: <FiYoutube size={18} />, href: contact.socialLinks.youtube },
                  { icon: <FiLinkedin size={18} />, href: contact.socialLinks.linkedin },
                  { icon: <FiTwitter size={18} />, href: contact.socialLinks.twitter },
                ].map((social, i) => (
                  <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white hover:border-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] backdrop-blur-sm">
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]"></span> Quick Links
              </h4>
              <ul className="space-y-4">
                {quickLinks.map(({ to, label }) => (
                  <li key={label}>
                    <Link to={to} className="text-slate-400 hover:text-white text-sm font-medium transition-colors hover:translate-x-2 inline-block">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Wedding Services */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span> Wedding Services
              </h4>
              <ul className="space-y-4">
                {services.map((srv) => (
                  <li key={srv.name}>
                    <Link to={srv.to} className="text-slate-400 hover:text-white text-sm font-medium transition-colors hover:translate-x-2 inline-flex items-center gap-3 group">
                      <span className="text-slate-500 group-hover:text-pink-400 transition-colors">{srv.icon}</span>
                      {srv.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Contact Us */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span> Contact Us
              </h4>
              <ul className="space-y-6">
                <li>
                  <a href={`tel:${contact.phone?.replace(/\\s+/g, '')}`} className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-yellow-400 shrink-0 group-hover:bg-yellow-500/20 group-hover:scale-110 transition-all duration-300"><FiPhone size={18} /></div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Phone Number</p>
                      <p className="text-slate-300 font-medium group-hover:text-white transition-colors">{contact.phone}</p>
                    </div>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${contact.email}`} className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-pink-400 shrink-0 group-hover:bg-pink-500/20 group-hover:scale-110 transition-all duration-300"><FiMail size={18} /></div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Email Address</p>
                      <p className="text-slate-300 font-medium group-hover:text-white transition-colors">{contact.email}</p>
                    </div>
                  </a>
                </li>
                <li className="flex items-start gap-3 group">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 shrink-0 group-hover:bg-purple-500/20 group-hover:scale-110 transition-all duration-300"><FiMapPin size={18} /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Location</p>
                    <p className="text-slate-300 font-medium">{contact.address}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 group">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all duration-300"><FiClock size={18} /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Support Hours</p>
                    <p className="text-slate-300 font-medium">Mon-Sun: 9AM - 8PM</p>
                  </div>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* ── NEWSLETTER SECTION ── */}
        <div className="max-w-4xl mx-auto px-4 pb-20">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">Stay Inspired For Your Big Day</h3>
                <p className="text-slate-400 font-medium">Get exclusive wedding planning tips and premium vendor offers.</p>
              </div>
              <form onSubmit={handleSubscribe} className="w-full md:w-auto flex-1 flex flex-col sm:flex-row gap-3 relative group">
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email" 
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:bg-white/20 focus:ring-2 focus:ring-pink-500/20 transition-all font-medium"
                  required
                />
                <button 
                  type="submit" 
                  disabled={status === 'loading'}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {status === 'loading' ? <><FiLoader className="animate-spin" /> Subscribing</> : 'Subscribe'}
                </button>
                {status === 'success' && <p className="absolute -bottom-8 left-2 text-emerald-400 text-sm font-semibold animate-pulse">✅ Successfully subscribed!</p>}
                {status === 'error' && <p className="absolute -bottom-8 left-2 text-red-400 text-sm font-semibold">❌ {error}</p>}
              </form>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="border-t border-white/10 bg-black/40 backdrop-blur-md relative z-10">
          <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm font-medium text-center md:text-left">
              &copy; {new Date().getFullYear()} ShaadiSaathi. All Rights Reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <Link to="/privacy" className="text-slate-500 hover:text-white text-sm font-medium transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-slate-500 hover:text-white text-sm font-medium transition-colors">Terms & Conditions</Link>
              <Link to="/refund" className="text-slate-500 hover:text-white text-sm font-medium transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}
