const express = require('express');
const { getDashboardStats } = require('../controllers/merchantController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', auth, getDashboardStats);

module.exports = router;
