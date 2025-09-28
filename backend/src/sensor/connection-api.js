const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'arduino_data',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Variables to track reader status
let lastActivity = Date.now();
const ACTIVITY_TIMEOUT = 10000; // 10 seconds

// Check database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('Connected to PostgreSQL database');
  }
});

// Create transactions table if it doesn't exist
const createTransactionsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        rfid_id VARCHAR(255),
        keypad_code VARCHAR(255),
        transaction_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'completed',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Transactions table created or already exists');
  } catch (error) {
    console.error('Error creating transactions table:', error);
  }
};

// Middleware to check reader connection status
const checkReaderStatus = async (req, res, next) => {
  try {
    // Check for recent activity in the database
    const rfidResult = await pool.query('SELECT created_at FROM rfid_readings ORDER BY created_at DESC LIMIT 1');
    const keypadResult = await pool.query('SELECT created_at FROM keypad_inputs ORDER BY created_at DESC LIMIT 1');
    
    let latestActivity = null;
    
    if (rfidResult.rows.length > 0) {
      latestActivity = new Date(rfidResult.rows[0].created_at);
    }
    
    if (keypadResult.rows.length > 0) {
      const keypadActivity = new Date(keypadResult.rows[0].created_at);
      if (!latestActivity || keypadActivity > latestActivity) {
        latestActivity = keypadActivity;
      }
    }
    
    if (latestActivity && (Date.now() - latestActivity) < ACTIVITY_TIMEOUT) {
      lastActivity = Date.now();
      req.readerConnected = true;
    } else {
      req.readerConnected = false;
    }
    
    next();
  } catch (error) {
    console.error('Error checking reader status:', error);
    req.readerConnected = false;
    next();
  }
};

// Periodically check reader connection
setInterval(async () => {
  const wasConnected = readerConnected;
  const isConnected = await checkReaderConnection();
  
  // If connection status changed, emit event
  if (wasConnected !== isConnected) {
    io.emit('reader-status', { connected: isConnected });
  }
}, 5000);

// API Routes
app.get('/api/status', async (req, res) => {
  try {
    const isConnected = await checkReaderConnection();
    res.json({ 
      connected: isConnected,
      message: isConnected ? 'Reader terhubung' : 'Reader tidak terhubung'
    });
  } catch (error) {
    console.error('Error in status endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent RFID readings
app.get('/api/rfid', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM rfid_readings ORDER BY timestamp DESC LIMIT 10'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching RFID data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent keypad inputs
app.get('/api/keypad', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM keypad_inputs ORDER BY timestamp DESC LIMIT 10'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching keypad data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process a transaction
app.post('/api/transaction', checkReaderStatus, async (req, res) => {
  // Check if reader is connected
  if (!req.readerConnected) {
    return res.status(400).json({ error: 'Reader tidak terhubung' });
  }
  
  const { rfid_id, keypad_code, transaction_type, pin, amount } = req.body;
  
  // Validate input for standard transaction
  if (transaction_type && (!rfid_id && !keypad_code)) {
    return res.status(400).json({ error: 'RFID ID atau kode keypad diperlukan' });
  }
  
  // Validate transaction type if provided
  if (transaction_type && !['masuk', 'keluar'].includes(transaction_type)) {
    return res.status(400).json({ error: 'Jenis transaksi tidak valid' });
  }
  
  try {
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // For payment transactions with PIN
      if (pin) {
        // Verify PIN (in a real app, you would check against stored PIN)
        // For demo purposes, we'll accept any 6-digit PIN
        if (pin.length !== 6 || !/^\d+$/.test(pin)) {
          return res.status(400).json({ error: 'PIN tidak valid' });
        }
        
        // Process payment transaction
        const result = await client.query(
          `INSERT INTO transactions 
           (rfid_id, keypad_code, transaction_type, status, amount) 
           VALUES ($1, $2, 'payment', 'completed', $3) 
           RETURNING id, timestamp`,
          [rfid_id, pin, amount || 0]
        );
        
        await client.query('COMMIT');
        
        // Emit payment transaction event
        io.emit('payment-processed', {
          id: result.rows[0].id,
          rfid_id,
          keypad_code: pin,
          transaction_type: 'payment',
          amount: amount || 0,
          timestamp: result.rows[0].timestamp,
          status: 'completed'
        });
        
        return res.status(201).json({
          success: true,
          transaction: {
            id: result.rows[0].id,
            rfid_id,
            keypad_code: pin,
            transaction_type: 'payment',
            amount: amount || 0,
            timestamp: result.rows[0].timestamp,
            status: 'completed'
          }
        });
      }
      
      // Standard transaction (entry/exit)
      const result = await client.query(
        `INSERT INTO transactions 
         (rfid_id, keypad_code, transaction_type, status) 
         VALUES ($1, $2, $3, 'completed') 
         RETURNING id, timestamp`,
        [rfid_id, keypad_code, transaction_type]
      );
      
      await client.query('COMMIT');
      
      // Emit transaction event
      io.emit('new-transaction', {
        id: result.rows[0].id,
        rfid_id,
        keypad_code,
        transaction_type,
        timestamp: result.rows[0].timestamp,
        status: 'completed'
      });
      
      res.status(201).json({
        success: true,
        transaction: {
          id: result.rows[0].id,
          rfid_id,
          keypad_code,
          transaction_type,
          timestamp: result.rows[0].timestamp,
          status: 'completed'
        }
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error processing transaction:', error);
    res.status(500).json({ error: 'Gagal memproses transaksi' });
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send current reader status
  socket.emit('reader-status', { connected: readerConnected });
  
  // Listen for heartbeat from Python slave
  socket.on('reader-heartbeat', () => {
    lastHeartbeat = Date.now();
    const wasConnected = readerConnected;
    readerConnected = true;
    
    if (!wasConnected) {
      io.emit('reader-status', { connected: true });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Check heartbeat timeout
setInterval(() => {
  if (lastHeartbeat && Date.now() - lastHeartbeat > HEARTBEAT_TIMEOUT) {
    const wasConnected = readerConnected;
    readerConnected = false;
    
    if (wasConnected) {
      io.emit('reader-status', { connected: false });
    }
  }
}, 5000);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Create necessary tables if they don't exist
async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create transactions table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        rfid_id VARCHAR(50),
        keypad_code VARCHAR(50),
        transaction_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    client.release();
  }
}

// Initialize database on startup
initDatabase();