const express = require('express');
const { verifyCard, processPayment } = require('../controllers/rfidController');
const auth = require('../middleware/auth');

const router = express.Router();

// Test endpoint tanpa auth
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'RFID API is working',
    endpoints: ['/verify', '/payment'],
    timestamp: new Date().toISOString()
  });
});

// Core endpoints - hanya import yang ada
router.post('/verify', auth, verifyCard);
router.post('/payment', auth, processPayment);

// Test endpoints tanpa auth untuk development
router.post('/test/verify', verifyCard);
router.post('/test/payment', processPayment);

module.exports = router;