import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiZap, FiCalendar, FiMapPin, FiUsers, FiMessageCircle, FiStar } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const STATS = [
  { icon: '💑', value: '10+', label: 'Happy Couples' },
  { icon: '🏆', value: '10+', label: 'Top Vendors' },
  { icon: '🗺️', value: '1+', label: 'Cities Covered' },
  { icon: '⭐', value: '4/5', label: 'Customer Rating' }
];

const FEATURES = [
  {
    icon: <FiZap size={24} />,
    title: 'Budget Planner',
    desc: 'Create the perfect wedding budget instantly.',
    color: 'from-[#FF4D6D] to-[#FF758F]'
  },
  {
    icon: <FiMapPin size={24} />,
    title: 'Venue Finder',
    desc: 'Get venue recommendations based on your city.',
    color: 'from-[#6A11CB] to-[#2575FC]'
  },
  {
    icon: <FiUsers size={24} />,
    title: 'Vendor Matching',
    desc: 'Find verified wedding vendors within minutes.',
    color: 'from-[#D4AF37] to-[#F1C40F]'
  },
  {
    icon: <FiCalendar size={24} />,
    title: 'Timeline Generator',
    desc: 'Generate a complete wedding schedule automatically.',
    color: 'from-[#00C9FF] to-[#92FE9D]'
  }
];

export default function AIWeddingPlanner() {
  const [chatInput, setChatInput] = useState('');

  return (
    <section className="relative py-32 px-4 overflow-hidden bg-[#FFF8F5]">
      {/* Animated Gradient Mesh Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-gradient-to-bl from-[#6A11CB]/10 via-[#FF4D6D]/10 to-transparent rounded-full blur-[150px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-gradient-to-tr from-[#2575FC]/10 via-[#D4AF37]/10 to-transparent rounded-full blur-[150px] pointer-events-none" />
      
      {/* Floating Glow Orbs */}
      <motion.div 
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }} 
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#FF4D6D]/30 rounded-full blur-3xl" 
      />
      <motion.div 
        animate={{ y: [0, 30, 0], opacity: [0.2, 0.5, 0.2] }} 
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[#6A11CB]/30 rounded-full blur-3xl" 
      />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6A11CB]/10 to-[#2575FC]/10 border border-[#6A11CB]/20 px-6 py-2.5 rounded-full mb-6 shadow-[0_0_20px_rgba(106,17,203,0.15)]"
          >
            <span className="text-xl">✨</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6A11CB] to-[#2575FC] font-black text-[11px] uppercase tracking-[0.25em]">AI Wedding Planner</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: 0.1 }}
            className="font-display text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tight leading-tight mb-6"
          >
            Plan Your Dream Wedding <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D6D] via-[#FF758F] to-[#FFB347] italic">With AI</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: 0.2 }}
            className="text-gray-600 font-medium text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
          >
            Get personalized wedding recommendations, budget planning, vendor suggestions, timelines, and instant assistance powered by ShaadiSaathi AI.
          </motion.p>
        </div>

        {/* Main UI Section: Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          
          {/* Left Side: Abstract AI Visual */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative h-[600px] rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#0F172A] to-gray-900 border border-white/10 shadow-[0_30px_100px_rgba(106,17,203,0.2)] flex items-center justify-center p-8 group"
          >
            {/* Inner glows */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#6A11CB]/40 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FF4D6D]/30 rounded-full blur-[60px] animate-pulse" />
            
            {/* Center Floating Core */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 w-48 h-48 rounded-full bg-gradient-to-tr from-[#6A11CB] to-[#2575FC] p-1 shadow-[0_0_50px_rgba(37,117,252,0.5)] flex items-center justify-center before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-tr before:from-[#FF4D6D] before:to-[#FFB347] before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-1000"
            >
              <div className="absolute inset-1 bg-gray-900 rounded-full flex items-center justify-center z-10">
                <span className="text-6xl animate-pulse">🤖</span>
              </div>
            </motion.div>

            {/* Orbiting Icons */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="w-full h-full relative">
                <div className="absolute top-1/4 left-1/4 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] -rotate-45">💍</div>
                <div className="absolute bottom-1/4 right-1/4 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] rotate-45">📸</div>
                <div className="absolute top-1/2 right-12 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">🏛</div>
                <div className="absolute bottom-12 left-1/3 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">✨</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side: AI Chat Card */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-white/70 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 border border-white shadow-[0_20px_80px_rgba(0,0,0,0.05)] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D6D]/5 to-[#6A11CB]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#6A11CB] to-[#2575FC] p-[2px] shadow-[0_0_15px_rgba(106,17,203,0.3)]">
                  <div className="bg-white w-full h-full rounded-full flex items-center justify-center text-2xl">🤖</div>
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-gray-900">ShaadiSaathi AI</h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-green-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Online
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                <p className="text-gray-700 text-lg font-medium leading-relaxed mb-6">
                  Hello! I'm your wedding planning assistant. <br/>
                  How can I help today?
                </p>
                
                <div className="flex flex-wrap gap-3">
                  {['Plan My Budget', 'Find Best Vendors', 'Create Wedding Timeline', 'Venue Suggestions', 'Photography Packages', 'Catering Ideas'].map((tag, idx) => (
                    <button key={idx} className="bg-white border border-gray-200 hover:border-[#6A11CB] hover:text-[#6A11CB] text-gray-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative mt-8">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything about your wedding..." 
                  className="w-full bg-white border-2 border-gray-100 focus:border-[#6A11CB] rounded-2xl py-5 pl-6 pr-16 text-gray-700 font-medium outline-none transition-all shadow-sm focus:shadow-[0_0_20px_rgba(106,17,203,0.1)]"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-[#6A11CB] to-[#2575FC] text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform shadow-[0_5px_15px_rgba(106,17,203,0.3)]">
                  <FiSend size={20} className="mr-0.5 mt-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 4 Premium AI Features Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {FEATURES.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(106,17,203,0.1)] hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8F5] to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} text-white flex items-center justify-center mb-6 shadow-lg transform group-hover:rotate-12 transition-transform duration-500`}>
                  {feature.icon}
                </div>
                <h3 className="font-display font-black text-2xl text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live Stats & CTA */}
        <div className="bg-gradient-to-r from-[#0F172A] to-gray-900 rounded-[3rem] p-12 relative overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-gray-800">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#6A11CB]/30 to-transparent rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#FF4D6D]/20 to-transparent rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            
            <div className="flex-1 flex flex-wrap gap-6 justify-center lg:justify-start">
              {STATS.map((stat, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 min-w-[200px]">
                  <span className="text-3xl drop-shadow-md">{stat.icon}</span>
                  <div>
                    <p className="text-white font-black text-xl tracking-tight">{stat.value}</p>
                    <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center shrink-0">
              <Link to="/ai-planner" className="bg-gradient-to-r from-[#FF4D6D] to-[#FF758F] text-white font-black px-10 py-5 rounded-full text-[11px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(255,77,109,0.4)] hover:shadow-[0_15px_40px_rgba(255,77,109,0.6)] hover:-translate-y-1 transition-all flex items-center gap-2">
                ✨ Start AI Planning
              </Link>
              <Link to="/ai-chat" className="bg-white/10 text-white border border-white/20 font-black px-10 py-5 rounded-full text-[11px] uppercase tracking-[0.2em] hover:bg-white/20 transition-all flex items-center gap-2">
                💬 Chat With AI
              </Link>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
