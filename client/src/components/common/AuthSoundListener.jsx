import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '').replace('/api', '') || 'https://shaadisaathi-3.onrender.com';

const AuthSoundListener = () => {
  // Use a ref to track the last time a sound type was played (cooldown mechanism)
  const lastPlayedRef = useRef({
    success: 0,
    logout: 0,
    alert: 0
  });

  useEffect(() => {
    // Connect to the Socket.IO server
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('🔊 AuthSoundListener connected to socket:', socket.id);
    });

    socket.on('auth-event', (data) => {
      if (!data || !data.type) return;

      const { type, message } = data;
      let soundFile = '';
      let soundCategory = '';

      // Map event type to sound file
      switch (type) {
        case 'USER_LOGIN':
        case 'VENDOR_LOGIN':
        case 'VENDOR_REGISTER':
          soundFile = '/sounds/success.mp3';
          soundCategory = 'success';
          break;
        case 'USER_LOGOUT':
          soundFile = '/sounds/logout.mp3';
          soundCategory = 'logout';
          break;
        case 'ADMIN_ACTION':
          soundFile = '/sounds/alert.mp3';
          soundCategory = 'alert';
          break;
        default:
          return; // Ignore unknown events
      }

      // Check Cooldown (3 seconds)
      const now = Date.now();
      const COOLDOWN_MS = 3000;
      if (now - lastPlayedRef.current[soundCategory] < COOLDOWN_MS) {
        console.log(`[AuthSound] Skipping ${soundCategory} sound due to cooldown.`);
        return;
      }

      // Update last played time
      lastPlayedRef.current[soundCategory] = now;

      // Play Sound
      try {
        const audio = new Audio(soundFile);
        audio.volume = 0.5; // Subtle volume for premium UX
        const playPromise = audio.play();
        
        // Handle autoplay restrictions gracefully
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.warn(`[AuthSound] Autoplay prevented for ${soundFile}. User must interact with document first.`, error);
          });
        }
      } catch (err) {
        console.error(`[AuthSound] Failed to play ${soundFile}:`, err);
      }

      // Show Toast Notification
      if (message) {
        // Customize toast based on category
        if (soundCategory === 'success') {
          toast.success(`${message} 🎉`, { id: type });
        } else if (soundCategory === 'logout') {
          toast(`${message} 👋`, { icon: 'ℹ️', id: type });
        } else if (soundCategory === 'alert') {
          toast(`${message} ⚡`, { icon: '🔔', id: type });
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return null; // Headless component
};

export default AuthSoundListener;
