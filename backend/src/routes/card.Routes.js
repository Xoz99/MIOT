const express = require('express');
const { 
  registerCard, 
  getMerchantCards,
  verifyPinAndGetBalance,
  getCardInfo,
  topUpCard
} = require('../controllers/cardController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', auth, registerCard);
router.get('/', auth, getMerchantCards);
router.post('/verify-pin', verifyPinAndGetBalance);
router.get('/info/:cardId', getCardInfo);        // TAMBAH
router.post('/topup', topUpCard);                // TAMBAH

module.exports = router;