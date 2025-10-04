const socketIo = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

class SocketHandler {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://192.168.1.44:3000",
        methods: ["GET", "POST"]
      }
    });

    this.serialPort = null;
    this.parser = null;
    this.arduinoConnected = false;
    
    this.initializeSerialPort();
    this.setupEventHandlers();
  }

  initializeSerialPort() {
    try {
      // Ganti dengan port Arduino Anda
      // Windows: COM3, COM4, dll
      // Linux/Mac: /dev/ttyUSB0, /dev/ttyACM0
      const portPath = process.env.ARDUINO_PORT || 'COM3';
      
      this.serialPort = new SerialPort({
        path: portPath,
        baudRate: 9600,
        autoOpen: false
      });

      this.parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

      // Open port
      this.serialPort.open((err) => {
        if (err) {
          console.error('❌ Failed to open serial port:', err.message);
          console.log('⚠️  Server will run without Arduino connection');
          this.arduinoConnected = false;
        } else {
          console.log('✅ Arduino Serial Port Connected:', portPath);
          this.arduinoConnected = true;
        }
      });

      // Handle incoming data from Arduino
      this.parser.on('data', (data) => {
        const line = data.trim();
        console.log('📡 Arduino:', line);
        this.handleArduinoData(line);
      });

      this.serialPort.on('error', (err) => {
        console.error('❌ Serial Port Error:', err.message);
        this.arduinoConnected = false;
        this.emitToAll('arduino:status', { connected: false });
      });

      this.serialPort.on('close', () => {
        console.log('⚠️  Serial port closed');
        this.arduinoConnected = false;
        this.emitToAll('arduino:status', { connected: false });
      });

    } catch (error) {
      console.error('❌ Serial Port Initialization Error:', error.message);
      console.log('⚠️  Server will run without Arduino connection');
      this.arduinoConnected = false;
    }
  }

  handleArduinoData(line) {
    // Broadcast raw data
    this.emitToAll('arduino:data', { 
      data: line, 
      timestamp: new Date() 
    });

    // Parse and emit specific events
    if (line.startsWith('KEY_PRESSED:')) {
      const key = line.split(':')[1].trim();
      this.emitToAll('keypad:pressed', { key });
      console.log('⌨️  Key pressed:', key);
    } 
    else if (line.startsWith('INPUT_BUFFER:')) {
      const buffer = line.split(':')[1].trim();
      this.emitToAll('keypad:buffer', { buffer });
    } 
    else if (line.startsWith('INPUT_CONFIRMED:')) {
      const value = line.split(':')[1].trim();
      this.emitToAll('keypad:confirmed', { value });
      console.log('✅ Input confirmed:', value);
    } 
    else if (line.startsWith('UID:')) {
      const uid = line.split(':')[1].trim();
      this.emitToAll('rfid:card-detected', { 
        cardId: uid,
        timestamp: new Date() 
      });
      console.log('💳 RFID scanned:', uid);
    } 
    else if (line.startsWith('CARD_COUNT:')) {
      const count = parseInt(line.split(':')[1].trim());
      this.emitToAll('rfid:card-count', { count });
    }
    else if (line.includes('DUPLICATE_CARD')) {
      this.emitToAll('rfid:duplicate', { 
        message: 'Card already scanned' 
      });
    }
    else if (line.includes('ALL_CARDS_CLEARED')) {
      this.emitToAll('rfid:cleared', { 
        message: 'All cards cleared' 
      });
    }
    else if (line.includes('CARD_LIMIT_REACHED')) {
      this.emitToAll('rfid:limit-reached', { 
        message: 'Maximum cards reached' 
      });
    }
  }

  sendToArduino(command) {
    if (this.serialPort && this.serialPort.isOpen) {
      this.serialPort.write(command + '\n', (err) => {
        if (err) {
          console.error('❌ Error writing to Arduino:', err.message);
        } else {
          console.log('📤 Sent to Arduino:', command);
        }
      });
      return true;
    } else {
      console.error('❌ Arduino not connected');
      return false;
    }
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 Client connected:', socket.id);

      // Send Arduino connection status
      socket.emit('arduino:status', { 
        connected: this.arduinoConnected 
      });

      // RFID Events (existing)
      socket.on('rfid:connect', () => {
        socket.emit('rfid:status', { 
          connected: this.arduinoConnected 
        });
      });

      socket.on('rfid:disconnect', () => {
        socket.emit('rfid:status', { connected: false });
      });

      socket.on('rfid:scan', () => {
        // Real scanning handled by Arduino automatically
        if (!this.arduinoConnected) {
          // Fallback simulation if Arduino not connected
          setTimeout(() => {
            socket.emit('rfid:card-detected', {
              cardId: 'RF' + Math.random().toString().slice(2, 8),
              timestamp: new Date()
            });
          }, 2000);
        }
      });

      // New Arduino Command Events
      socket.on('arduino:command', (data) => {
        const success = this.sendToArduino(data.command);
        socket.emit('arduino:command-result', { 
          success, 
          command: data.command 
        });
      });

      // Keypad Events
      socket.on('keypad:get-buffer', () => {
        // Arduino akan otomatis emit buffer saat ada perubahan
        socket.emit('keypad:request-sent', { 
          message: 'Buffer will be sent on next keypress' 
        });
      });

      // RFID Management Events
      socket.on('rfid:show-all', () => {
        this.sendToArduino('S');
      });

      socket.on('rfid:clear-all', () => {
        this.sendToArduino('C');
      });

      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
      });
    });
  }

  emitToAll(event, data) {
    this.io.emit(event, data);
  }

  emitToUser(userId, event, data) {
    this.io.to(userId).emit(event, data);
  }

  // Graceful shutdown
  close() {
    if (this.serialPort && this.serialPort.isOpen) {
      this.serialPort.close((err) => {
        if (err) {
          console.error('Error closing serial port:', err);
        } else {
          console.log('Serial port closed successfully');
        }
      });
    }
  }
}

module.exports = SocketHandler;