const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// --- IMPORT ROUTES ---
const authRoutes = require('./routes/auth.routes');
const merchantRoutes = require('./routes/merchant.routes');
const productRoutes = require('./routes/product.routes');
const transactionRoutes = require('./routes/transaction.routes');
const rfidRoutes = require('./routes/rfid.routes');
const cardRoutes = require('./routes/card.Routes');
const adminRoutes = require('./routes/admin.routes');
const adminAuthRoutes = require('./routes/adminAuth.routes');
const errorHandler = require('./middleware/errorHandler');
const publicRoutes = require('./routes/public.routes');

const app = express();

// Security middleware
app.use(helmet());


// CORS HARUS DI ATAS SEMUA ROUTES
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.44:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

app.use('/api/auth', authRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/rfid', rfidRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);


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