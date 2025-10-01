const express = require('express');
const { 
  registerCard, 
  getMerchantCards,
  verifyPinAndGetBalance // ⬅️ IMPORT FUNCTION BARU
} = require('../controllers/cardController');
const auth = require('../middleware/auth');

const router = express.Router();

// Route untuk mendaftarkan kartu baru (hanya untuk merchant yang sudah login)
router.post('/register', auth, registerCard);

// Route untuk mendapatkan semua kartu milik merchant yang sedang login
router.get('/', auth, getMerchantCards);

// ⬇️ ROUTE BARU UNTUK VERIFY PIN ⬇️
// Route untuk verifikasi PIN dan ambil saldo kartu
// TIDAK PAKAI auth middleware karena ini digunakan sebelum login/transaksi
router.post('/verify-pin', verifyPinAndGetBalance);

module.exports = router;