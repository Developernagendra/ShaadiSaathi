import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createInvitation, updateInvitation, resetBuilder, loadInvitation,
  setInvitationStatus, selectTemplate, generateAIContent, clearAIContent,
} from '../../store/slices/invitationSlice';
import CoupleInfoPanel from '../../components/invitation/panels/CoupleInfoPanel';
import EventInfoPanel from '../../components/invitation/panels/EventInfoPanel';
import SubEventsPanel from '../../components/invitation/panels/SubEventsPanel';
import RSVPSettingsPanel from '../../components/invitation/panels/RSVPSettingsPanel';
import ThemeSettingsPanel from '../../components/invitation/panels/ThemeSettingsPanel';
import MediaUploadPanel from '../../components/invitation/panels/MediaUploadPanel';
import AdvancedSettingsPanel from '../../components/invitation/panels/AdvancedSettingsPanel';
import InvitationCanvas from '../../components/invitation/InvitationCanvas';
import DevicePreview from '../../components/invitation/DevicePreview';
import TemplateCard from '../../components/invitation/TemplateCard';
import ShareModal from '../../components/invitation/ShareModal';
import DownloadModal from '../../components/invitation/DownloadModal';
import {
  FiChevronDown, FiChevronRight, FiSave, FiShare2, FiDownload, FiEye,
  FiArrowLeft, FiHeart, FiCalendar, FiMusic, FiGrid, FiDroplet, FiMail,
  FiImage, FiSettings, FiStar, FiZap, FiCopy, FiLayout
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const panelSections = [
  { id: 'couple', label: 'Couple Info', icon: <FiHeart size={16} />, component: CoupleInfoPanel },
  { id: 'event', label: 'Event Details', icon: <FiCalendar size={16} />, component: EventInfoPanel },
  { id: 'subevents', label: 'Wedding Events', icon: <FiStar size={16} />, component: SubEventsPanel },
  { id: 'rsvp', label: 'RSVP Settings', icon: <FiMail size={16} />, component: RSVPSettingsPanel },
  { id: 'theme', label: 'Theme & Style', icon: <FiDroplet size={16} />, component: ThemeSettingsPanel },
  { id: 'media', label: 'Media Upload', icon: <FiImage size={16} />, component: MediaUploadPanel },
  { id: 'advanced', label: 'Advanced', icon: <FiSettings size={16} />, component: AdvancedSettingsPanel },
];

const aiOptions = [
  { type: 'wedding', label: 'Wedding Invitation' },
  { type: 'reception', label: 'Reception Invite' },
  { type: 'mehndi', label: 'Mehndi Invite' },
  { type: 'haldi', label: 'Haldi Invite' },
  { type: 'romantic_quote', label: 'Romantic Quote' },
  { type: 'traditional_quote', label: 'Traditional Quote' },
  { type: 'hindi_quote', label: 'Hindi Quote' },
];

export default function InvitationBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const canvasRef = useRef(null);

  const { currentInvitation, templates, invitations, aiContent, aiLoading } = useSelector(s => s.invitation);
  const [activePanel, setActivePanel] = useState('couple');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const isEditMode = !!id;

  // Load existing invitation for editing
  useEffect(() => {
    if (isEditMode) {
      const existing = invitations.find(i => i._id === id);
      if (existing) {
        dispatch(loadInvitation(existing));
      }
    }
  }, [id, isEditMode, invitations, dispatch]);

  const handleSave = () => {
    if (isEditMode) {
      dispatch(updateInvitation({ id, data: currentInvitation }));
      toast.success('Invitation updated!');
    } else {
      dispatch(createInvitation(currentInvitation));
      toast.success('Invitation saved!');
    }
  };

  const handlePublish = () => {
    dispatch(setInvitationStatus('published'));
    handleSave();
    toast.success('Invitation published! 🎉');
  };

  const handleAIGenerate = (type) => {
    dispatch(generateAIContent({ type }));
  };

  const togglePanel = (id) => {
    setActivePanel(activePanel === id ? null : id);
  };

  return (
    <div className="pb-12 animate-fade-in -mx-4 md:-mx-8 -mt-4 md:-mt-8">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/invitation-creator"
            className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-all"
          >
            <FiArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              {isEditMode ? 'Edit Invitation' : 'Create Invitation'}
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                currentInvitation.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {currentInvitation.status}
              </span>
            </h1>
            <p className="text-[10px] text-gray-400 font-medium">
              {currentInvitation.couple.groomName && currentInvitation.couple.brideName
                ? `${currentInvitation.couple.groomName} & ${currentInvitation.couple.brideName}`
                : 'Untitled Invitation'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Button */}
          <button
            onClick={() => setShowAI(!showAI)}
            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-lg hover:shadow-purple-200 hover:scale-105 transition-all"
          >
            <FiZap size={14} /> AI Writer
          </button>

          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="hidden md:flex items-center gap-2 bg-gray-100 text-gray-700 font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-all"
          >
            <FiLayout size={14} /> Templates
          </button>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="md:hidden flex items-center gap-2 bg-gray-100 text-gray-700 font-bold text-[10px] uppercase tracking-widest px-3 py-2.5 rounded-xl hover:bg-gray-200 transition-all"
          >
            <FiEye size={14} />
          </button>

          <button onClick={handleSave} className="flex items-center gap-2 bg-gray-900 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-all shadow-lg">
            <FiSave size={14} /> Save
          </button>

          <button onClick={handlePublish} className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-[#C2185B] to-[#8E244D] text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-lg hover:shadow-pink-200 transition-all">
            Publish
          </button>

          <button onClick={() => setShareOpen(true)} className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all">
            <FiShare2 size={16} />
          </button>

          <button onClick={() => setDownloadOpen(true)} className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-all">
            <FiDownload size={16} />
          </button>
        </div>
      </div>

      {/* AI Panel (Collapsible) */}
      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-b border-purple-100 overflow-hidden"
          >
            <div className="px-4 md:px-6 py-4">
              <div className="flex items-center gap-3 mb-3">
                <FiZap className="text-purple-600" size={16} />
                <span className="text-xs font-bold text-purple-700">AI Invitation Writer</span>
                <span className="text-[8px] bg-purple-100 text-purple-600 font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Beta</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {aiOptions.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => handleAIGenerate(opt.type)}
                    disabled={aiLoading}
                    className="bg-white text-purple-700 border border-purple-200 font-bold text-[10px] uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-purple-100 hover:border-purple-300 transition-all disabled:opacity-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {aiLoading && (
                <div className="flex items-center gap-2 text-purple-500 text-xs font-medium">
                  <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                  Generating with AI...
                </div>
              )}
              {aiContent && !aiLoading && (
                <div className="bg-white rounded-xl p-4 border border-purple-100 mt-2">
                  <p className="text-sm text-gray-700 leading-relaxed italic mb-3">"{aiContent.content}"</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiContent.content);
                      toast.success('Content copied!');
                    }}
                    className="text-[10px] font-bold text-purple-600 uppercase tracking-widest flex items-center gap-1 hover:text-purple-800"
                  >
                    <FiCopy size={12} /> Copy Text
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Selector (Collapsible) */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-50 border-b border-gray-200 overflow-hidden"
          >
            <div className="px-4 md:px-6 py-4">
              <p className="text-xs font-bold text-gray-600 mb-3">Quick Template Selector</p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { dispatch(selectTemplate(t.id)); }}
                    className={`flex-shrink-0 w-20 group relative rounded-xl overflow-hidden ${
                      currentInvitation.templateId === t.id ? 'ring-2 ring-[#C2185B] ring-offset-2' : ''
                    }`}
                  >
                    <div className="aspect-[3/4]">
                      <img src={t.img} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <p className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[7px] font-bold text-center py-1 truncate px-1">
                      {t.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 3-Panel Layout */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-160px)]">

        {/* LEFT PANEL - Customization Controls */}
        <div className={`w-full lg:w-[340px] xl:w-[380px] flex-shrink-0 bg-white border-r border-gray-100 overflow-y-auto ${showPreview ? 'hidden lg:block' : ''}`}>
          <div className="p-4 md:p-5 space-y-1">
            {panelSections.map(section => {
              const isOpen = activePanel === section.id;
              const Panel = section.component;
              return (
                <div key={section.id} className="rounded-2xl overflow-hidden">
                  <button
                    onClick={() => togglePanel(section.id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 transition-all rounded-2xl ${
                      isOpen
                        ? 'bg-pink-50 text-[#C2185B]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`${isOpen ? 'text-[#C2185B]' : 'text-gray-400'}`}>{section.icon}</span>
                      <span className="text-xs font-bold uppercase tracking-widest">{section.label}</span>
                    </div>
                    {isOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-2">
                          <Panel />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER PANEL - Live Canvas */}
        <div className={`flex-1 bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto p-4 md:p-8 ${showPreview ? 'hidden lg:block' : ''}`}>
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Editor</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-600">Auto-updating</span>
              </div>
            </div>
            <div ref={canvasRef} data-invitation-canvas>
              <InvitationCanvas />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Preview */}
        <div className={`w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 bg-white border-l border-gray-100 overflow-y-auto ${!showPreview ? 'hidden lg:block' : ''}`}>
          <div className="p-4 md:p-5 h-full">
            <DevicePreview />
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between z-40 shadow-lg">
        <button
          onClick={() => setShowPreview(false)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            !showPreview ? 'bg-[#C2185B] text-white' : 'text-gray-400'
          }`}
        >
          <FiSettings size={14} /> Edit
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            showPreview ? 'bg-[#C2185B] text-white' : 'text-gray-400'
          }`}
        >
          <FiEye size={14} /> Preview
        </button>
        <button onClick={handlePublish} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-[#1a1a2e]">
          Publish
        </button>
      </div>

      {/* Modals */}
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />
      <DownloadModal isOpen={downloadOpen} onClose={() => setDownloadOpen(false)} canvasRef={canvasRef} />
    </div>
  );
}
