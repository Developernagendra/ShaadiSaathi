import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  LuMail as Mail, LuShare2 as Share2, LuDownload as Download, 
  LuEye as Eye, LuPalette as Palette, LuMapPin as MapPin, 
  LuCalendar as Calendar, LuClock as Clock, LuSmartphone as Smartphone,
  LuImage as Image
} from 'react-icons/lu';
import { FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const templates = [
  { id: 1, name: 'Royal Gold', color: '#D4AF37', text: 'text-gray-900', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80', frame: 'border-[#D4AF37]' },
  { id: 2, name: 'Velvet Pink', color: '#C2185B', text: 'text-white', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80', frame: 'border-[#C2185B]' },
  { id: 3, name: 'Ivory Elegance', color: '#FFFFFF', text: 'text-gray-900', img: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&q=80', frame: 'border-gray-200' },
  { id: 4, name: 'Midnight Sparkle', color: '#111827', text: 'text-white', img: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=80', frame: 'border-gray-900' },
];

const InvitationPage = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [formData, setFormData] = useState({
    groom: 'Rahul',
    bride: 'Anjali',
    date: '2026-06-15',
    time: '19:00',
    venue: 'ITC Maurya, New Delhi',
    message: 'Together with their families'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDownload = () => {
    setIsGenerating(true);
    toast.loading('Generating high-quality PDF...', { id: 'pdf' });
    setTimeout(() => {
      setIsGenerating(false);
      toast.success('Invitation Downloaded Successfully!', { id: 'pdf' });
    }, 2000);
  };

  const handleShare = (platform) => {
    toast.success(`Opening ${platform} to share...`);
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 font-sans selection:bg-[#C2185B]/20 selection:text-[#C2185B]">
      
      {/* ── ✨ Hero Section ── */}
      <div className="max-w-7xl mx-auto px-4 mb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex gap-3 mb-6">
          <span className="bg-pink-50 border border-pink-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#C2185B] shadow-sm">
            Digital Invites Studio
          </span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-4">
          Design Your <span className="text-[#C2185B]">Dream Invite</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-500 max-w-2xl mx-auto text-lg font-medium">
          Create, customize, and share beautiful paperless wedding invitations instantly.
        </motion.p>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* ── LEFT: EDITOR ── */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Template Selection */}
            <section className="bg-white p-8 md:p-10 rounded-[3rem] shadow-premium border border-pink-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold-50 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="inline-flex items-center gap-2 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] mb-4 relative z-10">
                <div className="w-8 h-px bg-[#D4AF37]" /> Step 1
              </div>
              <h3 className="font-display text-2xl font-black text-gray-900 mb-8 relative z-10">
                Select a Premium Theme
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className="group relative rounded-3xl overflow-hidden aspect-[4/5] outline-none"
                  >
                    <div className={`absolute inset-0 border-4 rounded-3xl z-20 transition-all duration-300 pointer-events-none ${selectedTemplate.id === t.id ? 'border-[#C2185B]' : 'border-transparent group-hover:border-gray-300'}`} />
                    {selectedTemplate.id === t.id && (
                      <div className="absolute top-3 right-3 z-30 w-6 h-6 bg-[#C2185B] rounded-full flex items-center justify-center text-white shadow-lg">
                        <FiCheck size={14} />
                      </div>
                    )}
                    <img 
                      src={t.img} 
                      className={`w-full h-full object-cover transition-transform duration-700 ${selectedTemplate.id === t.id ? 'scale-110' : 'group-hover:scale-105'}`} 
                      alt={t.name} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center p-4">
                      <span className="text-[10px] text-white font-black uppercase tracking-widest text-center">{t.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Details Form */}
            <section className="bg-white p-8 md:p-10 rounded-[3rem] shadow-premium border border-pink-50 relative">
              <div className="inline-flex items-center gap-2 text-[#C2185B] text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                <div className="w-8 h-px bg-[#C2185B]" /> Step 2
              </div>
              <h3 className="font-display text-2xl font-black text-gray-900 mb-8">
                Customize Details
              </h3>
              
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Groom's Name</label>
                    <input type="text" name="groom" value={formData.groom} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#C2185B] focus:bg-white outline-none transition-all font-bold text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Bride's Name</label>
                    <input type="text" name="bride" value={formData.bride} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#C2185B] focus:bg-white outline-none transition-all font-bold text-gray-900" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Short Message</label>
                  <input type="text" name="message" value={formData.message} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#C2185B] focus:bg-white outline-none transition-all font-medium text-gray-700 italic" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Event Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#C2185B] focus:bg-white outline-none transition-all font-bold text-gray-900" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Event Time</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#C2185B] focus:bg-white outline-none transition-all font-bold text-gray-900" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Venue Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" name="venue" value={formData.venue} onChange={handleChange} className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#C2185B] focus:bg-white outline-none transition-all font-bold text-gray-900" />
                  </div>
                </div>
              </div>
            </section>

            {/* Actions & Sharing */}
            <section className="bg-gray-900 p-8 md:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C2185B]/20 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row gap-6 relative z-10">
                <button 
                  onClick={handleDownload} 
                  disabled={isGenerating}
                  className="flex-1 bg-gradient-to-r from-[#C2185B] to-[#8E244D] text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(194,24,91,0.3)] hover:shadow-[0_15px_40px_rgba(194,24,91,0.5)] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {isGenerating ? 'Generating...' : <><Download size={18} /> Download High-Res PDF</>}
                </button>
                <button 
                  onClick={() => toast.success('Save link copied to clipboard!')} 
                  className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
                >
                  <Eye size={18} /> Save to Profile
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-800 relative z-10">
                <h4 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
                  <Share2 size={16} className="text-[#D4AF37]" /> Send Instant E-Invite
                </h4>
                <div className="flex gap-4">
                  <button onClick={() => handleShare('WhatsApp')} className="flex-1 bg-[#25D366] text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 hover:-translate-y-1 transition-all">
                    WhatsApp
                  </button>
                  <button onClick={() => handleShare('Email')} className="flex-1 bg-blue-500 text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:-translate-y-1 transition-all">
                    Email
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* ── RIGHT: LIVE PREVIEW (IPHONE MOCKUP) ── */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="sticky top-28 w-full max-w-[360px]">
              <div className="flex items-center justify-between mb-6 px-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Smartphone size={14} /> Live Preview
                </span>
                <span className="bg-green-50 text-green-600 border border-green-100 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Auto-syncing
                </span>
              </div>
              
              {/* iPhone Frame */}
              <div className="relative bg-black rounded-[3.5rem] p-3 shadow-2xl border border-gray-200">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-30" />
                
                {/* Screen Content */}
                <div 
                  ref={previewRef}
                  className="bg-white rounded-[2.5rem] overflow-hidden relative h-[700px] shadow-inner"
                >
                  <motion.div
                    key={selectedTemplate.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 bg-cover bg-center z-0"
                    style={{ backgroundImage: `url(${selectedTemplate.img})` }}
                  >
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                  </motion.div>

                  <div className="relative z-10 h-full flex flex-col pt-20 pb-10 px-8 text-center text-white">
                    <div className="mb-auto">
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-8 text-[#D4AF37]">
                        You're Invited
                      </p>
                      
                      <div className="space-y-2 mb-10">
                        <h2 className="text-5xl font-display font-black tracking-tight">{formData.groom}</h2>
                        <span className="text-[#D4AF37] text-2xl font-serif italic">&</span>
                        <h2 className="text-5xl font-display font-black tracking-tight">{formData.bride}</h2>
                      </div>
                      
                      <div className="w-12 h-px bg-[#D4AF37] mx-auto mb-6" />
                      
                      <p className="italic font-medium mb-12 text-white/90 leading-relaxed">
                        {formData.message}
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl mb-8 space-y-4">
                      <div className="flex flex-col items-center gap-1">
                        <Calendar size={18} className="text-[#D4AF37] mb-1" />
                        <span className="text-sm font-bold tracking-wide">
                          {new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Clock size={18} className="text-[#D4AF37] mb-1" />
                        <span className="text-sm font-bold tracking-wide">{formData.time} Onwards</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 mt-2 border-t border-white/20 pt-4">
                        <MapPin size={18} className="text-[#D4AF37] mb-1" />
                        <span className="text-sm font-bold leading-snug px-2">{formData.venue}</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <button className="bg-[#D4AF37] text-black w-full py-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg">
                        RSVP Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvitationPage;
