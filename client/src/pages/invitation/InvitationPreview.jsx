import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { loadInvitation, setPreviewDevice } from '../../store/slices/invitationSlice';
import InvitationCanvas from '../../components/invitation/InvitationCanvas';
import ShareModal from '../../components/invitation/ShareModal';
import DownloadModal from '../../components/invitation/DownloadModal';
import { FiArrowLeft, FiSmartphone, FiTablet, FiMonitor, FiShare2, FiDownload, FiEdit3, FiMaximize2 } from 'react-icons/fi';

export default function InvitationPreview() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const canvasRef = useRef(null);
  const { invitations, previewDevice, templates, currentInvitation } = useSelector(s => s.invitation);
  const [shareOpen, setShareOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (id) {
      const inv = invitations.find(i => i._id === id);
      if (inv) dispatch(loadInvitation(inv));
    }
  }, [id, invitations, dispatch]);

  const template = templates.find(t => t.id === currentInvitation.templateId) || templates[0];

  const devices = [
    { id: 'mobile', icon: <FiSmartphone size={16} />, label: 'Mobile' },
    { id: 'tablet', icon: <FiTablet size={16} />, label: 'Tablet' },
    { id: 'desktop', icon: <FiMonitor size={16} />, label: 'Desktop' },
  ];

  const getCanvasWidth = () => {
    switch (previewDevice) {
      case 'mobile': return '375px';
      case 'tablet': return '600px';
      case 'desktop': return '900px';
      default: return '375px';
    }
  };

  return (
    <div className="pb-24 animate-fade-in min-h-screen">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/invitation-creator" className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-all">
            <FiArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Preview: {currentInvitation.couple.groomName || 'Groom'} & {currentInvitation.couple.brideName || 'Bride'}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mt-1">{template.category} • {template.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={id ? `/invitation-creator/edit/${id}` : '/invitation-creator/new'}
            className="hidden sm:flex items-center gap-2 bg-gray-100 text-gray-700 font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-all"
          >
            <FiEdit3 size={14} /> Edit
          </Link>
          <button onClick={() => setShareOpen(true)} className="flex items-center gap-2 bg-blue-50 text-blue-600 font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-all">
            <FiShare2 size={14} /> <span className="hidden sm:inline">Share</span>
          </button>
          <button onClick={() => setDownloadOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-[#C2185B] to-[#8E244D] text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-lg hover:shadow-pink-200 transition-all">
            <FiDownload size={14} /> <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* Device Switcher */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {devices.map(d => (
            <button
              key={d.id}
              onClick={() => dispatch(setPreviewDevice(d.id))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                previewDevice === d.id
                  ? 'bg-white text-[#C2185B] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {d.icon}
              {d.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-all"
        >
          <FiMaximize2 size={16} />
        </button>
      </div>

      {/* Preview Area */}
      <div className="flex items-start justify-center">
        <motion.div
          layout
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ width: getCanvasWidth(), maxWidth: '100%' }}
          className="mx-auto"
        >
          {previewDevice === 'mobile' ? (
            <div className="relative bg-black rounded-[3.5rem] p-3 shadow-2xl border border-gray-700 mx-auto" style={{ maxWidth: '390px' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-30" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-gray-600 rounded-full z-30" />
              <div ref={canvasRef} data-invitation-canvas className="bg-white rounded-[2.5rem] overflow-hidden shadow-inner">
                <InvitationCanvas />
              </div>
            </div>
          ) : previewDevice === 'tablet' ? (
            <div className="relative bg-gray-900 rounded-[2.5rem] p-4 shadow-2xl border border-gray-700 mx-auto" style={{ maxWidth: '620px' }}>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rounded-full z-30" />
              <div ref={canvasRef} data-invitation-canvas className="bg-white rounded-[1.5rem] overflow-hidden shadow-inner">
                <InvitationCanvas />
              </div>
            </div>
          ) : (
            <div ref={canvasRef} data-invitation-canvas className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <InvitationCanvas />
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} invitationId={id} />
      <DownloadModal isOpen={downloadOpen} onClose={() => setDownloadOpen(false)} canvasRef={canvasRef} />
    </div>
  );
}
