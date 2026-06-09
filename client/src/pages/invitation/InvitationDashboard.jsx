import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchInvitations, deleteInvitation, resetBuilder } from '../../store/slices/invitationSlice';
import { FiPlus, FiEdit3, FiTrash2, FiShare2, FiEye, FiMail, FiUsers, FiCheck, FiArrowRight, FiLayout, FiStar, FiTrendingUp, FiGrid } from 'react-icons/fi';
import ShareModal from '../../components/invitation/ShareModal';
import toast from 'react-hot-toast';

export default function InvitationDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { invitations, templates, loading } = useSelector(s => s.invitation);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareId, setShareId] = useState(null);

  useEffect(() => {
    dispatch(fetchInvitations());
  }, [dispatch]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this invitation?')) {
      dispatch(deleteInvitation(id));
      toast.success('Invitation deleted');
    }
  };

  const openShare = (id) => {
    setShareId(id);
    setShareOpen(true);
  };

  const stats = [
    { label: 'Total Invitations', value: invitations.length, icon: <FiMail />, gradient: 'from-[#C2185B] to-[#8E244D]' },
    { label: 'Guests Invited', value: invitations.reduce((a, i) => a + (i.analytics?.rsvpCount || 0), 0) + 68, icon: <FiUsers />, gradient: 'from-purple-500 to-pink-500' },
    { label: 'RSVPs Received', value: invitations.reduce((a, i) => a + (i.analytics?.rsvpCount || 0), 0), icon: <FiCheck />, gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Total Views', value: invitations.reduce((a, i) => a + (i.analytics?.views || 0), 0), icon: <FiTrendingUp />, gradient: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="pb-24 animate-fade-in relative">
      <div className="absolute inset-0 floral-pattern opacity-[0.03] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#1a1a2e] via-[#2d2d44] to-[#1a1a2e] rounded-[3rem] p-10 md:p-16 relative overflow-hidden shadow-premium mb-10"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#C2185B]/20 to-transparent rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-[#D4AF37]/20 to-transparent rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 mb-6">
                <span className="text-[#D4AF37]">✨</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Invitation Studio</span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 tracking-tight">
                Welcome back, <span className="text-[#D4AF37] italic">{user?.name?.split(' ')[0] || 'there'}</span>
              </h1>
              <p className="text-white/60 text-lg font-medium mb-8 max-w-xl">
                Create beautiful wedding invitations and share them instantly with your guests. Design your dream invitation in minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link
                  to="/invitation-creator/new"
                  onClick={() => dispatch(resetBuilder())}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-[#1a1a2e] font-black text-[12px] uppercase tracking-[0.2em] py-4 px-10 rounded-2xl shadow-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95"
                >
                  <FiPlus size={18} /> Create Invitation
                </Link>
                <Link
                  to="/invitation-creator/templates"
                  className="w-full sm:w-auto bg-white/10 text-white font-black text-[12px] uppercase tracking-[0.2em] py-4 px-10 rounded-2xl border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-3 backdrop-blur-sm"
                >
                  <FiLayout size={18} /> Browse Templates
                </Link>
              </div>
            </div>

            {/* Decorative Cards */}
            <div className="flex-1 relative w-full max-w-sm h-[320px] hidden lg:block pointer-events-none">
              <motion.div
                initial={{ rotate: 5, x: 50, opacity: 0 }}
                animate={{ rotate: 12, x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="absolute right-0 top-5 w-56 h-72 bg-white p-3 rounded-[2rem] shadow-2xl border border-gray-100 z-10"
              >
                <div className="w-full h-full bg-[#FFF8F0] rounded-xl overflow-hidden relative">
                  <div className="absolute inset-0 floral-pattern opacity-10" />
                  <div className="absolute inset-0 flex items-center justify-center flex-col text-[#C2185B]">
                    <span className="text-3xl mb-3">🌺</span>
                    <h3 className="font-display text-lg font-bold">Floral Theme</h3>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ rotate: -15, x: -50, opacity: 0 }}
                animate={{ rotate: -5, x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="absolute right-24 top-12 w-56 h-72 bg-white p-3 rounded-[2rem] shadow-2xl border border-gray-100 z-20"
              >
                <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-black rounded-xl overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center flex-col text-[#D4AF37]">
                    <span className="text-3xl mb-3">✨</span>
                    <h3 className="font-display text-lg font-bold">Royal Theme</h3>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 shadow-premium border border-pink-50 flex flex-col sm:flex-row items-center gap-4 group hover:-translate-y-1 transition-transform duration-300 text-center sm:text-left"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div>
                <p className="font-display text-3xl font-black text-gray-900 leading-none mb-1">{stat.value}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* My Invitations */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-3xl font-black text-gray-900 tracking-tight">My Invitations</h2>
              <p className="text-gray-400 font-medium text-sm mt-1">Manage your wedding invitations</p>
            </div>
            <Link
              to="/invitation-creator/new"
              onClick={() => dispatch(resetBuilder())}
              className="hidden sm:flex items-center gap-2 bg-[#C2185B] text-white font-black text-[10px] uppercase tracking-[0.2em] py-3 px-6 rounded-xl hover:bg-[#8E244D] transition-all shadow-lg"
            >
              <FiPlus size={14} /> New
            </Link>
          </div>

          {invitations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-[3rem] shadow-premium border border-pink-50 p-16 text-center"
            >
              <span className="text-6xl mb-6 block">💌</span>
              <h3 className="font-display text-2xl font-black text-gray-900 mb-2">No invitations yet</h3>
              <p className="text-gray-400 font-medium mb-8 max-w-md mx-auto">Create your first wedding invitation and share it with your guests in minutes.</p>
              <Link
                to="/invitation-creator/new"
                onClick={() => dispatch(resetBuilder())}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C2185B] to-[#8E244D] text-white font-black text-[11px] uppercase tracking-[0.2em] py-4 px-10 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                <FiPlus size={16} /> Create Your First Invitation
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invitations.map((inv, idx) => {
                const template = templates.find(t => t.id === inv.templateId) || templates[0];
                return (
                  <motion.div
                    key={inv._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-[2rem] shadow-premium border border-pink-50 overflow-hidden group hover:shadow-premium-hover transition-all duration-300"
                  >
                    {/* Preview Image */}
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <img src={template.img} alt={template.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                      {/* Status Badge */}
                      <div className="absolute top-4 left-4">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg ${
                          inv.status === 'published' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-yellow-900'
                        }`}>
                          {inv.status}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openShare(inv._id)} className="w-8 h-8 bg-white/20 backdrop-blur-md text-white rounded-lg flex items-center justify-center hover:bg-white/40 transition-all">
                          <FiShare2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(inv._id)} className="w-8 h-8 bg-red-500/80 text-white rounded-lg flex items-center justify-center hover:bg-red-500 transition-all">
                          <FiTrash2 size={14} />
                        </button>
                      </div>

                      {/* Names overlay */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-display text-2xl font-black text-white leading-tight">
                          {inv.couple?.groomName || 'Groom'} & {inv.couple?.brideName || 'Bride'}
                        </h3>
                        <p className="text-white/60 text-xs font-medium mt-1">
                          {inv.event?.weddingDate ? new Date(inv.event.weddingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBD'}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">{template.category}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">
                          {inv.event?.venueName || 'Venue TBD'}
                        </p>
                      </div>

                      {/* Mini Stats */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <FiEye size={12} />
                          <span className="text-xs font-bold">{inv.analytics?.views || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <FiShare2 size={12} />
                          <span className="text-xs font-bold">{inv.analytics?.shares || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <FiCheck size={12} />
                          <span className="text-xs font-bold">{inv.analytics?.rsvpCount || 0} RSVPs</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link
                          to={`/invitation-creator/edit/${inv._id}`}
                          className="flex-1 bg-[#C2185B] text-white font-black text-[10px] uppercase tracking-[0.15em] py-3 rounded-xl text-center hover:bg-[#8E244D] transition-all flex items-center justify-center gap-2"
                        >
                          <FiEdit3 size={12} /> Edit
                        </Link>
                        <Link
                          to={`/invitation-creator/preview/${inv._id}`}
                          className="flex-1 bg-gray-100 text-gray-700 font-black text-[10px] uppercase tracking-[0.15em] py-3 rounded-xl text-center hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                          <FiEye size={12} /> Preview
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Create New Card */}
              <Link
                to="/invitation-creator/new"
                onClick={() => dispatch(resetBuilder())}
                className="bg-white rounded-[2rem] shadow-premium border-2 border-dashed border-pink-200 overflow-hidden flex flex-col items-center justify-center p-12 hover:border-[#C2185B] hover:bg-pink-50/20 transition-all group min-h-[350px]"
              >
                <div className="w-16 h-16 rounded-2xl bg-pink-50 text-[#C2185B] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <FiPlus size={28} />
                </div>
                <span className="font-bold text-gray-900 text-sm mb-1">Create New Invitation</span>
                <span className="text-xs text-gray-400">Start from scratch or use a template</span>
              </Link>
            </div>
          )}
        </div>

        {/* Featured Templates */}
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-display text-3xl font-black text-gray-900 tracking-tight mb-1">Premium Templates</h2>
              <p className="text-gray-400 font-medium text-sm">Handcrafted designer templates for every style</p>
            </div>
            <Link to="/invitation-creator/templates" className="text-[10px] font-black text-[#C2185B] uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-4 transition-all">
              View All <FiArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {templates.slice(0, 4).map((t, idx) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="group rounded-[2rem] overflow-hidden bg-white shadow-premium border border-pink-50 relative cursor-pointer hover:shadow-premium-hover transition-all duration-300"
              >
                {t.isPopular && (
                  <div className="absolute top-3 left-3 z-20 bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-[#1a1a2e] text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-lg">
                    Popular
                  </div>
                )}
                <div className="aspect-[3/4] overflow-hidden relative">
                  <img src={t.img} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <Link
                      to="/invitation-creator/new"
                      className="bg-white text-[#C2185B] font-black text-[10px] uppercase tracking-[0.15em] py-2.5 px-6 rounded-full shadow-2xl hover:scale-105 transition-transform"
                    >
                      Use Template
                    </Link>
                  </div>
                </div>
                <div className="p-4 absolute bottom-0 left-0 right-0 z-10">
                  <span className="text-[8px] font-black uppercase tracking-widest mb-0.5 block" style={{ color: t.colors.accent }}>
                    {t.category}
                  </span>
                  <h4 className="font-bold text-white text-base leading-tight">{t.name}</h4>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} invitationId={shareId} />
    </div>
  );
}
