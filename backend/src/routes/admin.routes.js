const express = require('express');
const { 
  getAllCards, 
  toggleCardStatus, 
  getCardHistory,
  getAdminStats 
} = require('../controllers/adminController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Semua route butuh auth + adminAuth
router.use(auth);
router.use(adminAuth);

router.get('/cards', getAllCards);
router.get('/stats', getAdminStats);
router.patch('/cards/:cardId/toggle-status', toggleCardStatus);
router.get('/cards/:cardId/history', getCardHistory);

module.exports = router;