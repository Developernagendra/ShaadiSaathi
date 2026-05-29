// utils/socketHandlers.js
const initSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join user specific room
    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their personal room`);
    });

    // Join role-based rooms (admin, vendor)
    socket.on('join_role', (role) => {
      if (['admin', 'vendor'].includes(role)) {
        socket.join(role);
        console.log(`Socket ${socket.id} joined ${role} room`);
      }
    });

    // Join specific vendor business room
    socket.on('join_vendor_business', (vendorId) => {
      socket.join(`vendor_${vendorId}`);
      console.log(`Socket joining vendor business room: vendor_${vendorId}`);
    });

    // Join chat room
    socket.on('join_chat', (chatId) => {
      socket.join(`chat_${chatId}`);
    });

    // Leave chat room
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
    });

    // Typing indicator
    socket.on('typing', ({ chatId, userId }) => {
      socket.to(`chat_${chatId}`).emit('user_typing', { userId });
    });

    socket.on('stop_typing', ({ chatId, userId }) => {
      socket.to(`chat_${chatId}`).emit('user_stop_typing', { userId });
    });

    // Real-time Read Receipts
    socket.on('mark_read', async ({ chatId, userId }) => {
      try {
        const { Chat } = require('../models/index');
        const chat = await Chat.findById(chatId);
        if (chat) {
          let updated = false;
          chat.messages.forEach(msg => {
            if (msg.sender && msg.sender.toString() !== userId.toString() && !msg.isRead) {
              msg.isRead = true;
              msg.readAt = Date.now();
              updated = true;
            }
          });
          if (updated) {
            await chat.save();
            // Broadcast to the chat room that messages were read by this user
            socket.to(`chat_${chatId}`).emit('messages_read', { chatId, readBy: userId });
          }
        }
      } catch (err) {
        console.error('Socket mark_read error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { initSocketHandlers };
