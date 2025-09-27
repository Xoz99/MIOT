const express = require('express');
const { registerCard, getMerchantCards } = require('../controllers/cardController');
const auth = require('../middleware/auth'); // Middleware untuk proteksi

const router = express.Router();

// Route untuk mendaftarkan kartu baru (hanya untuk merchant yang sudah login)
router.post('/register', auth, registerCard);

// Route untuk mendapatkan semua kartu milik merchant yang sedang login
router.get('/', auth, getMerchantCards);

module.exports = router;