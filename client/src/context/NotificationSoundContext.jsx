import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import ToastSoundListener from '../components/common/ToastSoundListener';

const NotificationSoundContext = createContext();

export const NotificationSoundProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const audioRefs = useRef({});

  // Load mute preference
  useEffect(() => {
    const saved = localStorage.getItem('shaadi_sound_muted');
    if (saved === 'true') setIsMuted(true);
  }, []);

  // Preload audio files
  useEffect(() => {
    const loadAudio = (type, filename) => {
      const audio = new Audio(`/sounds/${filename}`);
      audio.volume = 0.5; // Default volume 
      audioRefs.current[type] = audio;
    };

    loadAudio('success', 'success.mp3');
    loadAudio('error', 'error.mp3');
    loadAudio('approval', 'approval.mp3');
    loadAudio('lead', 'lead.mp3');
    loadAudio('notification', 'notification.mp3');
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('shaadi_sound_muted', String(next));
      return next;
    });
  }, []);

  const playSound = useCallback((type = 'notification') => {
    if (isMuted) return;

    // Fallback to 'notification' if type not found
    const audio = audioRefs.current[type] || audioRefs.current['notification'];
    
    if (audio) {
      // Clone node to allow overlapping sounds
      const clone = audio.cloneNode();
      clone.volume = audio.volume;
      const playPromise = clone.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Autoplay was prevented. 
          // Do not crash the app, just log a warning.
          console.warn(`Autoplay prevented for sound type: ${type}. User must interact with document first.`, error);
        });
      }
    }
  }, [isMuted]);

  return (
    <NotificationSoundContext.Provider value={{ isMuted, toggleMute, playSound }}>
      <ToastSoundListener />
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
