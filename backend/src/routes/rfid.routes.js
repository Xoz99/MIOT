const express = require('express');
const { verifyCard, processPayment } = require('../controllers/rfidController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/verify', auth, verifyCard);
router.post('/payment', auth, processPayment);

module.exports = router;
