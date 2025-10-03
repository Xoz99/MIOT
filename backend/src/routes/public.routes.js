const express = require('express');
const { registerCardPublic } = require('../controllers/publicCardController');

const router = express.Router();

router.post('/cards/register', registerCardPublic);

module.exports = router;