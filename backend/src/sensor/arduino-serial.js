const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Express app setup
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serial port configuration - update COM port as needed
let port;
try {
  port = new SerialPort({
    path: 'COM3', // Change this to match your Arduino's COM port
    baudRate: 9600,
  });
} catch (err) {
  console.error('Error opening serial port:', err.message);
}

// Create parser
const parser = port ? port.pipe(new ReadlineParser({ delimiter: '\r\n' })) : null;

// Store the latest data
let latestRfidData = null;
let latestKeypadData = null;

// Handle serial data
if (parser) {
  parser.on('data', (data) => {
    console.log('Received data:', data);
    
    // Process data based on prefix
    if (data.startsWith('R:')) {
      // RFID data
      latestRfidData = data.substring(2);
      io.emit('rfid-data', { id: latestRfidData, timestamp: new Date() });
    } else if (data.startsWith('K:')) {
      // Keypad data
      latestKeypadData = data.substring(2);
      io.emit('keypad-data', { input: latestKeypadData, timestamp: new Date() });
    }
  });
}

// API routes
app.get('/api/status', (req, res) => {
  res.json({ 
    status: port ? 'connected' : 'disconnected',
    port: port ? port.path : null
  });
});

app.get('/api/data', (req, res) => {
  res.json({
    rfid: latestRfidData,
    keypad: latestKeypadData,
    timestamp: new Date()
  });
});

// Socket connection
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send current data on connection
  if (latestRfidData) {
    socket.emit('rfid-data', { id: latestRfidData, timestamp: new Date() });
  }
  
  if (latestKeypadData) {
    socket.emit('keypad-data', { input: latestKeypadData, timestamp: new Date() });
  }
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle process termination
process.on('SIGINT', () => {
  if (port) {
    port.close();
    console.log('Serial port closed');
  }
  process.exit();
});