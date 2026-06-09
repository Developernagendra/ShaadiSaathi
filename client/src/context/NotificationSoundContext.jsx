import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const NotificationSoundContext = createContext();

export const NotificationSoundProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef(null);

  // Load mute preference
  useEffect(() => {
    const saved = localStorage.getItem('shaadi_sound_muted');
    if (saved === 'true') setIsMuted(true);
  }, []);

  // Initialize Web Audio API on first user interaction (bypasses Autoplay block)
  useEffect(() => {
    const initAudioContext = () => {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioCtxRef.current = new AudioContext();
        }
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => document.addEventListener(event, initAudioContext, { once: true }));
    
    return () => {
      events.forEach(event => document.removeEventListener(event, initAudioContext));
    };
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('shaadi_sound_muted', String(next));
      return next;
    });
  }, []);

  const playSynthesizedSound = useCallback((type) => {
    if (isMuted || !audioCtxRef.current) return;
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const now = ctx.currentTime;
    
    const createOsc = (type, freq, time, duration, gainStart, attack=0.01) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(gainStart, time + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
    };

    try {
      switch (type) {
        case 'success': // Bright uplifting double-chime (Login/Register)
          createOsc('sine', 523.25, now, 0.4, 0.2); // C5
          createOsc('sine', 783.99, now + 0.15, 0.6, 0.2); // G5
          break;
          
        case 'booking': // Warm solid bell (New Booking)
          createOsc('triangle', 440.00, now, 0.8, 0.2); // A4
          createOsc('sine', 880.00, now, 1.0, 0.1); // A5 harmonic
          break;
          
        case 'alert': // Sharp double-chime (Leads)
          createOsc('square', 880.00, now, 0.2, 0.05);
          createOsc('square', 880.00, now + 0.1, 0.3, 0.05);
          break;

        case 'payment': // Cash register / Coin plink
          createOsc('sine', 987.77, now, 0.3, 0.1); // B5
          createOsc('sine', 1318.51, now + 0.1, 0.5, 0.15); // E6
          break;

        case 'review': // Soft pleasant marimba
          createOsc('sine', 659.25, now, 0.4, 0.2, 0.05); // E5
          break;

        default: // Default generic chime
          createOsc('sine', 830.61, now, 0.4, 0.15);
      }
    } catch (err) {
      console.warn("Web Audio API error", err);
    }
  }, [isMuted]);

  return (
    <NotificationSoundContext.Provider value={{ isMuted, toggleMute, playSound: playSynthesizedSound }}>
      {children}
    </NotificationSoundContext.Provider>
  );
};

export const useNotificationSound = () => {
  const context = useContext(NotificationSoundContext);
  if (context === undefined) {
    throw new Error('useNotificationSound must be used within a NotificationSoundProvider');
  }
  return context;
};
