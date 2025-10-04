const http = require('http');
const app = require('./app');
const SocketHandler = require('./websocket/socketHandler');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize WebSocket
const socketHandler = new SocketHandler(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.CLIENT_URL || 'http://192.168.1.44:3000'}`);
  console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`🔌 Arduino Port: ${process.env.ARDUINO_PORT || 'COM3'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  socketHandler.close(); // Tutup serial port
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  socketHandler.close(); // Tutup serial port
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = server;