const express = require('express');
const { 
  registerCard,           
  getRegisteredCards,       
  updateCardStatus,       
  topUpBalance,           
  verifyCard, 
  processPayment 
} = require('../controllers/rfidController');
const auth = require('../middleware/auth');

const router = express.Router();

// Card Registration Routes - Tambah routes ini
router.post('/register-card', auth, registerCard);
router.get('/cards', auth, getRegisteredCards);
router.put('/cards/:cardId/status', auth, updateCardStatus);
router.post('/cards/:cardId/topup', auth, topUpBalance);

// Payment Routes - yang sudah ada
router.post('/verify', auth, verifyCard);
router.post('/payment', auth, processPayment);

module.exports = router;