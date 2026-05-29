import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getSocket } from '../../utils/socket'
import { addNotification } from '../../store/slices/notificationSlice'
import { receiveMessage } from '../../store/slices/chatSlice'
import { updateLocalBooking } from '../../store/slices/bookingSlice'
import toast from 'react-hot-toast'

export default function SocketListener() {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const socket = getSocket()

  // Request browser notification permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [])

  useEffect(() => {
    if (!socket || !user) return

    // Sound alert function
    const playNotificationSound = () => {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(err => {
          console.warn('Audio play failed, falling back to Web Audio synthesis:', err);
          playSynthesizedChime();
        });
      } catch (e) {
        playSynthesizedChime();
      }
    }

    // Synthesized premium chime using Web Audio API (highly reliable and premium)
    const playSynthesizedChime = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        // High-end glass double-chime (ding-dong) sound
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(830.61, now); // A5 note
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.4);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5 note
        gain2.gain.setValueAtTime(0.15, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.6);
      } catch (e) {
        console.error('Synthesizer failed:', e);
      }
    }

    // Show HTML5 native browser notification
    const showBrowserNotification = (notification) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          });
        } catch (e) {
          console.error('Browser Notification failed:', e);
        }
      }
    }

    // Unified notification receiver
    const handleNewNotification = (notification) => {
      // 1. Save in Redux
      dispatch(addNotification(notification))

      // 2. Play sound
      playNotificationSound()

      // 3. Show Toast
      toast(notification.title, {
        icon: '🔔',
        position: 'bottom-right',
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
        }
      })

      // 4. Show browser native pop-up
      showBrowserNotification(notification)
    }

    // Listeners for both formats
    socket.on('newNotification', handleNewNotification)
    socket.on('new_notification', handleNewNotification)

    // Listen for new chat messages
    socket.on('new_message', (data) => {
      dispatch(receiveMessage(data))
      
      // Only show toast if not on the chat page
      if (window.location.pathname !== '/chat') {
        toast(`New message from ${data.message.sender?.name || 'User'}`, {
          icon: '💬',
          position: 'bottom-right'
        })
      }
    })

    // Listen for booking updates
    socket.on('booking_updated', ({ booking }) => {
      toast(`Booking #${booking.bookingId} ${booking.status}`, {
        icon: '📅',
        position: 'bottom-right'
      })
      dispatch(updateLocalBooking(booking))
    })

    socket.on('bookingUpdated', (booking) => {
      toast(`Booking #${booking.bookingId} ${booking.status}`, {
        icon: '📅',
        position: 'bottom-right'
      })
      dispatch(updateLocalBooking(booking))
    })

    // Listen for new bookings (Vendor/Admin)
    socket.on('new_booking', ({ booking }) => {
      toast.success(`New Booking Received! #${booking.bookingId}`, {
        icon: '✨',
        position: 'bottom-right'
      })
    })

    return () => {
      socket.off('newNotification', handleNewNotification)
      socket.off('new_notification', handleNewNotification)
      socket.off('new_message')
      socket.off('booking_updated')
      socket.off('bookingUpdated')
      socket.off('new_booking')
    }
  }, [socket, user, dispatch])

  return null
}
