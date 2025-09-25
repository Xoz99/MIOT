const socketIo = require('socket.io');

class SocketHandler {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('rfid:connect', () => {
        socket.emit('rfid:status', { connected: true });
      });

      socket.on('rfid:disconnect', () => {
        socket.emit('rfid:status', { connected: false });
      });

      socket.on('rfid:scan', () => {
        // Simulate card detection
        setTimeout(() => {
          socket.emit('rfid:card-detected', {
            cardId: 'RF' + Math.random().toString().slice(2, 8),
            timestamp: new Date()
          });
        }, 2000);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  emitToAll(event, data) {
    this.io.emit(event, data);
  }

  emitToUser(userId, event, data) {
    this.io.to(userId).emit(event, data);
  }
}

module.exports = SocketHandler;
