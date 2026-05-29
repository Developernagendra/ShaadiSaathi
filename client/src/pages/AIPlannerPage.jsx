import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAIRecommendations } from '../store/slices/featureSlice';
import { LuSparkles as Sparkles, LuMapPin as MapPin, LuWallet as Wallet, LuCalendar as Calendar, LuHeart as Heart, LuInfo as Info, LuSave as Save, LuMessageSquare, LuSend } from 'react-icons/lu';
import toast from 'react-hot-toast';

const AIPlannerPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    brideName: '',
    groomName: '',
    weddingDate: '',
    city: '',
    budget: '',
    guestCount: '',
    weddingType: 'Traditional',
    traditions: '',
  });

  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Hi! I am your AI Wedding Concierge. How can I help you customize your plan today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { aiRecommendations, loading } = useSelector((state) => state.feature);

  useEffect(() => {
    const savedPlan = sessionStorage.getItem('lastGeneratedPlan');
    // For now we rely on fresh generation or standard redux state
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(getAIRecommendations(formData)).then((res) => {
      if (!res.error) {
        sessionStorage.setItem('lastGeneratedPlan', JSON.stringify(res.payload));
        setStep(2);
      }
    });
  };

  const handleSavePlan = () => {
    if (!user) {
      toast.error('Please login to save your wedding plan!');
      sessionStorage.setItem('pendingSavePlan', JSON.stringify(aiRecommendations));
      navigate('/login?redirect=/ai-planner');
    } else {
      toast.success('Wedding plan saved to your profile!');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    setChatMessages(prev => [...prev, { role: 'user', text: chatInput }]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'That sounds beautiful! I have noted your preference. Would you like me to adjust the budget allocation or suggest specific vendors for this?' 
      }]);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#111] bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#C2185B]/20 pt-24 pb-20 font-sans selection:bg-[#D4AF37] selection:text-white">
      <div className="absolute inset-0 floral-pattern opacity-[0.03] pointer-events-none" />
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-[#D4AF37]/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-[#C2185B]/20 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* 🤖 HERO SECTION */}
        <div className="text-center mb-16 relative">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#C2185B] to-[#D4AF37] rounded-full mb-6 shadow-[0_0_40px_rgba(212,175,55,0.4)] border-4 border-white/10">
            <Sparkles className="text-white text-3xl animate-pulse" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-display font-black text-white mb-6 tracking-tight drop-shadow-2xl">
            Plan Your <span className="text-[#D4AF37] italic">Dream Wedding</span> <br className="hidden md:block" />with AI
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-white/70 text-lg md:text-2xl font-medium italic max-w-2xl mx-auto leading-relaxed mb-10">
            Experience the future of wedding planning. Your smart, personalized concierge is here to curate perfection.
          </motion.p>
          
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row justify-center gap-4">
               <button onClick={() => document.getElementById('planner-form').scrollIntoView({ behavior: 'smooth' })} className="bg-gradient-to-r from-[#D4AF37] to-[#B38D22] text-gray-900 px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-105 transition-transform flex items-center justify-center gap-2">
                 Start Planning <Sparkles size={16} />
               </button>
               <button onClick={() => navigate('/budget-calculator')} className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-white/20 transition-colors">
                 Create Wedding Budget
               </button>
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              id="planner-form"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/10 backdrop-blur-3xl rounded-[3rem] p-8 md:p-12 border border-white/20 shadow-premium relative overflow-hidden max-w-4xl mx-auto"
            >
              <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Basic Info */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] flex items-center gap-2 mb-6">
                      <Heart size={16} /> The Happy Couple
                    </h3>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="group">
                        <label className="block text-[9px] font-bold text-white/50 mb-2 uppercase tracking-widest">Bride's Name</label>
                        <input type="text" name="brideName" value={formData.brideName} onChange={handleChange} placeholder="Priya" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 outline-none focus:border-[#D4AF37] focus:bg-white/10 transition-all text-sm font-bold" required />
                      </div>
                      <div className="group">
                        <label className="block text-[9px] font-bold text-white/50 mb-2 uppercase tracking-widest">Groom's Name</label>
                        <input type="text" name="groomName" value={formData.groomName} onChange={handleChange} placeholder="Arjun" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 outline-none focus:border-[#D4AF37] focus:bg-white/10 transition-all text-sm font-bold" required />
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-[9px] font-bold text-white/50 mb-2 uppercase tracking-widest flex items-center gap-1">
                        <Calendar size={12} /> Wedding Date
                      </label>
                      <input type="date" name="weddingDate" value={formData.weddingDate} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white/80 outline-none focus:border-[#D4AF37] focus:bg-white/10 transition-all text-sm font-bold appearance-none" required />
                    </div>
                  </div>

                  {/* Logistics */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] flex items-center gap-2 mb-6">
                      <Info size={16} /> Wedding Logistics
                    </h3>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="group">
                        <label className="block text-[9px] font-bold text-white/50 mb-2 uppercase tracking-widest">City</label>
                        <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Jaipur" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 outline-none focus:border-[#D4AF37] focus:bg-white/10 transition-all text-sm font-bold" required />
                      </div>
                      <div className="group">
                        <label className="block text-[9px] font-bold text-white/50 mb-2 uppercase tracking-widest">Guest Count</label>
                        <input type="number" name="guestCount" value={formData.guestCount} onChange={handleChange} placeholder="300" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 outline-none focus:border-[#D4AF37] focus:bg-white/10 transition-all text-sm font-bold" required />
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-[9px] font-bold text-white/50 mb-2 uppercase tracking-widest flex items-center gap-1">
                        <Wallet size={12} /> Estimated Budget (₹)
                      </label>
                      <input type="number" name="budget" value={formData.budget} onChange={handleChange} placeholder="1500000" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 outline-none focus:border-[#D4AF37] focus:bg-white/10 transition-all text-sm font-bold" required />
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div className="space-y-6 pt-8 border-t border-white/10">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Style & Traditions</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1 group">
                        <label className="block text-[9px] font-bold text-white/50 mb-2 uppercase tracking-widest">Vibe</label>
                        <select name="weddingType" value={formData.weddingType} onChange={handleChange} className="w-full bg-[#2d2d2d] border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#D4AF37] transition-all text-sm font-bold appearance-none">
                          <option>Traditional</option>
                          <option>Modern Royal</option>
                          <option>Destination</option>
                          <option>Minimalist</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 group">
                        <label className="block text-[9px] font-bold text-white/50 mb-2 uppercase tracking-widest">Special Requests (Optional)</label>
                        <input type="text" name="traditions" value={formData.traditions} onChange={handleChange} placeholder="E.g. Vintage cars, pastel floral decor..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 outline-none focus:border-[#D4AF37] focus:bg-white/10 transition-all text-sm font-bold" />
                      </div>
                   </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-[#C2185B] to-[#8E244D] text-white font-black text-[12px] uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(194,24,91,0.4)] hover:shadow-[0_0_50px_rgba(194,24,91,0.6)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating AI Plan...</>
                    ) : (
                      <>Generate My Wedding Plan <Sparkles size={20} /></>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 xl:grid-cols-12 gap-8"
            >
              {loading ? (
                <div className="xl:col-span-12 flex flex-col items-center justify-center py-32 bg-white/5 backdrop-blur-xl rounded-[3rem] shadow-premium border border-white/10">
                  <div className="w-24 h-24 relative mb-8">
                    <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#D4AF37]" size={36} />
                  </div>
                  <p className="text-2xl font-display font-black text-white">Analyzing millions of possibilities...</p>
                  <p className="text-white/50 mt-3 font-medium italic">Crafting the perfect celebration for {formData.brideName} & {formData.groomName}</p>
                </div>
              ) : aiRecommendations && (
                <>
                  {/* Left Side: Planner Dashboard */}
                  <div className="xl:col-span-8 space-y-8">
                    
                    {/* Header */}
                    <div className="bg-white/10 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 text-white border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#C2185B]/20 to-[#D4AF37]/10" />
                      <div className="relative z-10 text-center md:text-left">
                        <h2 className="font-display text-4xl font-black mb-2">{formData.brideName} & {formData.groomName}'s Plan</h2>
                        <p className="text-[#D4AF37] font-bold uppercase tracking-widest text-[10px] flex items-center justify-center md:justify-start gap-3">
                          <span><MapPin size={12} className="inline mr-1" /> {formData.city}</span>
                          <span><Calendar size={12} className="inline mr-1" /> {new Date(formData.weddingDate).toLocaleDateString()}</span>
                        </p>
                      </div>
                      <button 
                        onClick={handleSavePlan}
                        className="relative z-10 bg-white text-[#C2185B] px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-pink-50 transition-all shadow-xl hover:scale-105"
                      >
                        <Save size={16} /> Save Plan
                      </button>
                    </div>

                    {/* Quick Budget Insights */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-100">
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="font-display text-2xl font-black flex items-center gap-2 text-gray-900">
                          <Wallet className="text-[#D4AF37]" /> Smart Budget Insights
                        </h2>
                        <button onClick={() => navigate('/budget-calculator')} className="text-[10px] font-black uppercase tracking-widest text-[#C2185B] hover:underline">Detailed Tool &rarr;</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(aiRecommendations.budgetAllocation).map(([key, val]) => (
                          <div key={key} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#D4AF37]/30 transition-all">
                            <div className="flex justify-between items-center mb-3">
                              <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em]">{key}</p>
                              <p className="text-lg font-black text-gray-900">₹{val.toLocaleString()}</p>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                               <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B38D22]" style={{ width: `${Math.random() * 40 + 20}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Smart Timeline */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-100">
                      <h2 className="font-display text-2xl font-black flex items-center gap-2 text-gray-900 mb-8">
                        <Calendar className="text-[#D4AF37]" /> Smart Planning Timeline
                      </h2>
                      <div className="relative pl-6 space-y-10 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-[#C2185B] before:to-gray-100">
                        {aiRecommendations.timeline.map((item, idx) => (
                          <div key={idx} className="relative group">
                            <div className="absolute -left-[34px] top-1 w-5 h-5 bg-white border-[4px] border-[#C2185B] rounded-full z-10 group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(194,24,91,0.3)]" />
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 hover:shadow-lg transition-all">
                              <p className="text-[10px] font-black text-[#C2185B] uppercase tracking-[0.2em] mb-1">{item.time}</p>
                              <p className="font-bold text-gray-900 text-lg leading-snug">{item.task}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right Side: 💬 AI CHAT UI */}
                  <div className="xl:col-span-4 flex flex-col h-[800px]">
                    <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 flex-1 flex flex-col overflow-hidden relative">
                      {/* Chat Header */}
                      <div className="bg-gradient-to-r from-[#C2185B] to-[#8E244D] p-6 text-white flex items-center gap-4 shadow-md z-10">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                          <Sparkles className="text-yellow-300" size={24} />
                        </div>
                        <div>
                          <h3 className="font-display font-black text-lg">AI Assistant</h3>
                          <p className="text-[9px] uppercase tracking-widest text-white/70 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Online
                          </p>
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                        {chatMessages.map((msg, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={idx} 
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[#1a1a1a] text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                              {msg.text}
                            </div>
                          </motion.div>
                        ))}
                        {isTyping && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                             <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                               <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                               <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                               <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                             </div>
                          </motion.div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Quick Suggestions */}
                      <div className="p-4 bg-white border-t border-gray-50 flex gap-2 overflow-x-auto scrollbar-hide">
                        {['Suggest Vendors', 'Cut Budget 10%', 'Add Haldi Task'].map(chip => (
                          <button key={chip} onClick={() => setChatInput(chip)} className="flex-shrink-0 bg-[#FFF8F0] border border-pink-100 text-[#C2185B] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-pink-50 transition-colors whitespace-nowrap">
                            {chip}
                          </button>
                        ))}
                      </div>

                      {/* Input Area */}
                      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
                        <div className="relative flex items-center">
                          <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask AI Planner..." 
                            className="w-full bg-gray-50 border border-gray-200 rounded-full py-4 pl-5 pr-14 outline-none focus:border-[#C2185B] focus:bg-white transition-all text-sm font-medium"
                          />
                          <button type="submit" disabled={!chatInput.trim()} className="absolute right-2 w-10 h-10 bg-[#C2185B] text-white rounded-full flex items-center justify-center hover:bg-[#8E244D] disabled:opacity-50 transition-all shadow-md">
                            <LuSend size={16} className="-ml-0.5 mt-0.5" />
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIPlannerPage;
