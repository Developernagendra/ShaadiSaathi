import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiClock, FiMapPin, FiHeart } from 'react-icons/fi';

export default function InvitationCanvas() {
  const { currentInvitation, templates } = useSelector(s => s.invitation);
  const { couple, event, subEvents, theme, advanced } = currentInvitation;
  const template = templates.find(t => t.id === currentInvitation.templateId) || templates[0];

  const groomName = couple.groomName || 'Groom';
  const brideName = couple.brideName || 'Bride';

  const weddingDateFormatted = event.weddingDate
    ? new Date(event.weddingDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Wedding Date';

  const timeFormatted = event.weddingTime || 'Time';

  const enabledEvents = subEvents.filter(e => e.enabled);

  // Countdown calculation
  const daysRemaining = event.weddingDate
    ? Math.max(0, Math.ceil((new Date(event.weddingDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={template.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full rounded-3xl overflow-hidden shadow-2xl relative"
        style={{
          backgroundColor: theme.bgColor,
          color: theme.textColor,
          fontFamily: theme.fontFamily,
          fontSize: `${theme.fontSize}px`,
          fontStyle: theme.fontStyle,
        }}
      >
        {/* Background Image Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${template.img})` }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </div>

        {/* Decorative Accents */}
        <div className="absolute top-0 left-0 w-40 h-40 rounded-full blur-[60px] opacity-30 z-0" style={{ backgroundColor: theme.accentColor }} />
        <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full blur-[80px] opacity-20 z-0" style={{ backgroundColor: theme.accentColor }} />

        {/* Content */}
        <div className="relative z-10 px-8 py-12 text-center min-h-[600px] flex flex-col">
          {/* "You're Invited" Header */}
          <div className="mb-auto">
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] font-black uppercase tracking-[0.5em] mb-8"
              style={{ color: theme.accentColor }}
            >
              You&apos;re Invited
            </motion.p>

            {/* Couple Photo */}
            {couple.couplePhoto && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="w-28 h-28 rounded-full mx-auto mb-8 overflow-hidden border-4 shadow-2xl"
                style={{ borderColor: theme.accentColor }}
              >
                <img
                  src={typeof couple.couplePhoto === 'string' ? couple.couplePhoto : URL.createObjectURL(couple.couplePhoto)}
                  alt="Couple"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            )}

            {/* Names */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2 mb-8"
            >
              <h2 className="text-4xl md:text-5xl font-black tracking-tight" style={{ fontFamily: theme.fontFamily }}>
                {groomName}
              </h2>
              <div className="flex items-center justify-center gap-4 my-3">
                <div className="h-px w-12 opacity-30" style={{ backgroundColor: theme.accentColor }} />
                <FiHeart size={18} style={{ color: theme.accentColor }} />
                <div className="h-px w-12 opacity-30" style={{ backgroundColor: theme.accentColor }} />
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight" style={{ fontFamily: theme.fontFamily }}>
                {brideName}
              </h2>
            </motion.div>

            {/* Couple Story */}
            {couple.coupleStory && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="italic opacity-80 leading-relaxed max-w-sm mx-auto mb-8 text-sm"
              >
                "{couple.coupleStory}"
              </motion.p>
            )}

            {/* Decorative Divider */}
            <div className="w-16 h-px mx-auto mb-8 opacity-40" style={{ backgroundColor: theme.accentColor }} />
          </div>

          {/* Event Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 mb-6 space-y-4"
          >
            <div className="flex flex-col items-center gap-1.5">
              <FiCalendar size={18} style={{ color: theme.accentColor }} />
              <span className="text-sm font-bold tracking-wide">{weddingDateFormatted}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <FiClock size={18} style={{ color: theme.accentColor }} />
              <span className="text-sm font-bold">{timeFormatted} Onwards</span>
            </div>
            {event.venueName && (
              <div className="flex flex-col items-center gap-1.5 pt-3 border-t border-white/15">
                <FiMapPin size={18} style={{ color: theme.accentColor }} />
                <span className="text-sm font-bold leading-snug">{event.venueName}</span>
                {event.venueAddress && (
                  <span className="text-xs opacity-60">{event.venueAddress}</span>
                )}
              </div>
            )}
          </motion.div>

          {/* Sub Events */}
          {enabledEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-2 gap-2 mb-6"
            >
              {enabledEvents.map((evt, i) => (
                <div
                  key={evt.name}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: theme.accentColor }}>
                    {evt.name}
                  </p>
                  {evt.date && (
                    <p className="text-[10px] font-medium opacity-70">
                      {new Date(evt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                  {evt.time && (
                    <p className="text-[10px] font-medium opacity-50">{evt.time}</p>
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {/* Countdown */}
          {advanced.countdownEnabled && daysRemaining !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mb-6"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">
                Counting Down
              </p>
              <p className="text-3xl font-black" style={{ color: theme.accentColor }}>
                {daysRemaining} <span className="text-sm font-bold opacity-60">days to go</span>
              </p>
            </motion.div>
          )}

          {/* RSVP Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-auto"
          >
            <button
              className="w-full py-4 rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
              style={{ backgroundColor: theme.accentColor, color: theme.bgColor }}
            >
              RSVP Now
            </button>
          </motion.div>

          {/* Branding */}
          <p className="text-[8px] opacity-30 mt-6 font-medium tracking-widest uppercase">
            Powered by ShaadiSaathi
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
