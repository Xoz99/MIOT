// Lokasi: backend/src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// --- BAGIAN IMPORT YANG SUDAH DIRAPIKAN ---
const authRoutes = require('./routes/auth.routes');
const merchantRoutes = require('./routes/merchant.routes');
const productRoutes = require('./routes/product.routes');
const transactionRoutes = require('./routes/transaction.routes');
const rfidRoutes = require('./routes/rfid.routes');
const cardRoutes = require('./routes/card.routes'); // <-- INI YANG PENTING
const errorHandler = require('./middleware/errorHandler');
// -----------------------------------------

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.MAX_REQUESTS_PER_HOUR || 1000,
  message: {
    success: false,
    message: 'Terlalu banyak request, coba lagi nanti'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/rfid', rfidRoutes);
app.use('/api/cards', cardRoutes); // <-- DAN INI YANG PENTING

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan'
  });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;