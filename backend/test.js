// test_controller.js
try {
    const controller = require('./src/controllers/rfidController');
    console.log('Available functions:', Object.keys(controller));
    console.log('verifyCard:', typeof controller.verifyCard);
    console.log('processPayment:', typeof controller.processPayment);
  } catch (error) {
    console.error('Import error:', error.message);
  }