let io;

module.exports = {
  init: (serverInstance) => {
    const { Server } = require('socket.io');
    io = new Server(serverInstance, {
      cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
        credentials: true
      }
    });
    return io;
  },
  getSocket: () => {
    if (!io) {
      // throw new Error('Socket.io not initialized!');
      console.warn('⚠️ Socket.io not initialized yet.');
    }
    return io;
  }
};
