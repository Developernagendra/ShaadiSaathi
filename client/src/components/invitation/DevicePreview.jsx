import { useDispatch, useSelector } from 'react-redux';
import { setPreviewDevice } from '../../store/slices/invitationSlice';
import InvitationCanvas from './InvitationCanvas';
import { FiSmartphone, FiTablet, FiMonitor } from 'react-icons/fi';

const devices = [
  { id: 'mobile', icon: <FiSmartphone size={16} />, label: 'Mobile', width: '320px', frame: 'rounded-[3rem]' },
  { id: 'tablet', icon: <FiTablet size={16} />, label: 'Tablet', width: '480px', frame: 'rounded-[2rem]' },
  { id: 'desktop', icon: <FiMonitor size={16} />, label: 'Desktop', width: '100%', frame: 'rounded-2xl' },
];

export default function DevicePreview() {
  const dispatch = useDispatch();
  const { previewDevice } = useSelector(s => s.invitation);
  const activeDevice = devices.find(d => d.id === previewDevice) || devices[0];

  return (
    <div className="flex flex-col h-full">
      {/* Device Switcher */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Preview</span>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          {devices.map(d => (
            <button
              key={d.id}
              onClick={() => dispatch(setPreviewDevice(d.id))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                previewDevice === d.id
                  ? 'bg-white text-[#C2185B] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title={d.label}
            >
              {d.icon}
              <span className="hidden sm:inline">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Device Frame */}
      <div className="flex-1 flex items-start justify-center overflow-auto py-4">
        <div
          className="transition-all duration-500 ease-out mx-auto"
          style={{ width: activeDevice.width, maxWidth: '100%' }}
        >
          {previewDevice === 'mobile' ? (
            /* iPhone-style frame */
            <div className="relative bg-black rounded-[3.5rem] p-3 shadow-2xl border border-gray-700 mx-auto" style={{ maxWidth: '360px' }}>
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-30" />
              {/* Home indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-gray-600 rounded-full z-30" />
              {/* Screen */}
              <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-inner max-h-[680px] overflow-y-auto scrollbar-hide">
                <InvitationCanvas />
              </div>
            </div>
          ) : previewDevice === 'tablet' ? (
            /* iPad-style frame */
            <div className="relative bg-gray-900 rounded-[2.5rem] p-4 shadow-2xl border border-gray-700 mx-auto" style={{ maxWidth: '520px' }}>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rounded-full z-30" />
              <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-inner max-h-[720px] overflow-y-auto scrollbar-hide">
                <InvitationCanvas />
              </div>
            </div>
          ) : (
            /* Desktop - no frame */
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 max-h-[720px] overflow-y-auto scrollbar-hide">
              <InvitationCanvas />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
