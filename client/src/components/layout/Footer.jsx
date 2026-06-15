import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiInstagram, FiFacebook, FiLinkedin, FiMail, FiPhone, FiMapPin, FiArrowUp, FiHeart, FiChevronRight } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import api from '../../utils/api'
import { useTranslation } from 'react-i18next'
import BrandLogo from '../common/BrandLogo'

export default function Footer() {
  const { t } = useTranslation?.() || { t: (key) => key };
  const [contact, setContact] = useState({
    email: 'hello@shaadisaathi.com',
    phone: '+91 7903075243',
    address: 'Bihar, India',
    company: 'ShaadiSaathi',
    socialLinks: {
      instagram: 'https://www.instagram.com/_shaadisaathi/',
      facebook: '#',
      linkedin: '#',
      whatsapp: 'https://wa.me/917903075243'
    }
  })

  const [showScrollTop, setShowScrollTop] = useState(false)

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
    { to: '/packages', label: 'Packages' },
    { to: '/baraat-cabs', label: 'Baraat Cabs' },
  ]

  const companyLinks = [
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact' },
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms & Conditions' },
  ]

  return (
    <footer className="relative bg-[#0A0F1C] text-slate-300 font-sans overflow-hidden">
      
      {/* ── Background Effects ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C2185B]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#6A11CB]/10 rounded-full blur-[150px] translate-y-1/3 -translate-x-1/4"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
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
              className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-50 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-[#C2185B] to-[#8E244D] text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(194,24,91,0.4)] hover:shadow-[0_0_30px_rgba(194,24,91,0.6)] hover:-translate-y-1 transition-all duration-300"
              aria-label="Scroll to top"
            >
              <FiArrowUp size={20} strokeWidth={3} />
            </motion.button>
          )}
        </AnimatePresence>

{/* ── FOOTER STRUCTURE ── */}
        <div className="max-w-7xl mx-auto px-4 pb-16 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

            {/* Column 1: Brand */}
            <div className="space-y-6">
              <BrandLogo isDark={true} showTagline={false} />
              <div>
                <p className="text-white font-bold text-base mb-2">{t('home.title', 'Your Wedding, Perfected')}</p>
                <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-6">
                  {t('home.subtitle', 'Simplify your wedding journey with trusted vendors, smart tools, and seamless booking.')}
                </p>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6 tracking-wide">{t('footer.quickLinks', 'Quick Links')}</h4>
              <ul className="space-y-4">
                {quickLinks.map(({ to, label }) => (
                  <li key={label}>
                    <NavLink to={to} end={to === '/'} className={({ isActive }) => `text-sm font-medium transition-all duration-300 hover:translate-x-2 inline-block ${isActive ? 'text-[#C2185B]' : 'text-slate-400 hover:text-[#C2185B]'}`}>
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Vendors */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <FiHeart className="text-[#C2185B]" /> {t('nav.vendors', 'Vendors')}
              </h4>
              <ul className="space-y-4">
                <li><Link to="/services?category=venues" className="text-gray-400 hover:text-[#C2185B] transition-colors flex items-center gap-2"><FiChevronRight size={14} /> {t('vendor.venues', 'Venues')}</Link></li>
                <li><Link to="/services?category=photography" className="text-gray-400 hover:text-[#C2185B] transition-colors flex items-center gap-2"><FiChevronRight size={14} /> {t('vendor.photography', 'Photography')}</Link></li>
                <li><Link to="/services?category=bridal-makeup" className="text-gray-400 hover:text-[#C2185B] transition-colors flex items-center gap-2"><FiChevronRight size={14} /> {t('vendor.makeup', 'Makeup Artists')}</Link></li>
                <li><Link to="/services?category=catering" className="text-gray-400 hover:text-[#C2185B] transition-colors flex items-center gap-2"><FiChevronRight size={14} /> {t('vendor.catering', 'Catering')}</Link></li>
                <li><Link to="/services?category=event-planners" className="text-gray-400 hover:text-[#C2185B] transition-colors flex items-center gap-2"><FiChevronRight size={14} /> {t('vendor.decorators', 'Decorators')}</Link></li>
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6 tracking-wide">{t('footer.contact', 'Contact')}</h4>
              <ul className="space-y-5">
                <li>
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:bg-[#C2185B] group-hover:text-white group-hover:border-transparent transition-all duration-300">
                      <FiMail size={16} />
                    </div>
                    <span className="text-slate-400 group-hover:text-white text-sm font-medium transition-colors">{contact.email}</span>
                  </a>
                </li>
                <li>
                  <a href={`tel:${contact.phone?.replace(/\s+/g, '')}`} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:bg-[#C2185B] group-hover:text-white group-hover:border-transparent transition-all duration-300">
                      <FiPhone size={16} />
                    </div>
                    <span className="text-slate-400 group-hover:text-white text-sm font-medium transition-colors">{contact.phone}</span>
                  </a>
                </li>
                <li>
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:bg-[#C2185B] group-hover:text-white group-hover:border-transparent transition-all duration-300">
                      <FiMapPin size={16} />
                    </div>
                    <span className="text-slate-400 group-hover:text-white text-sm font-medium transition-colors">{contact.address}</span>
                  </div>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* ── SOCIAL SECTION ── */}
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex justify-center gap-4">
            <a href={contact.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white hover:border-transparent transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-pink-500/30">
              <FiInstagram size={20} />
            </a>
            <a href={contact.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-[#1877F2] hover:text-white hover:border-transparent transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-blue-500/30">
              <FiFacebook size={20} />
            </a>
            <a href={contact.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-[#0A66C2] hover:text-white hover:border-transparent transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-blue-600/30">
              <FiLinkedin size={20} />
            </a>
            <a href={contact.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-[#25D366] hover:text-white hover:border-transparent transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-green-500/30">
              <FaWhatsapp size={22} />
            </a>
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="border-t border-white/10 bg-black/20 relative z-10">
          <div className="max-w-7xl mx-auto px-4 py-8 pb-28 md:pb-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p className="text-slate-500 text-sm font-medium">&copy; {new Date().getFullYear()} {t('footer.rights', 'ShaadiSaathi. All rights reserved.')}</p>
              <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
                <Link to="/privacy" className="hover:text-white transition-colors">{t('nav.privacy', 'Privacy Policy')}</Link>
                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                <Link to="/terms" className="hover:text-white transition-colors">{t('nav.terms', 'Terms of Service')}</Link>
              </div>
            </div>
            
            <p className="text-slate-500 text-sm font-medium flex items-center justify-center gap-1.5">
              {t('footer.madeWith', 'Made with')} <span className="text-[#C2185B] animate-pulse">❤️</span> {t('footer.forIndian', 'for Indian Weddings')}
            </p>
          </div>
        </div>

      </div>
    </footer>
  )
}
