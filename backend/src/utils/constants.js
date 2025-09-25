module.exports = {
  TRANSACTION_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },
  
  PRODUCT_CATEGORIES: [
    'Makanan',
    'Minuman',
    'Snack',
    'Dessert',
    'Lainnya'
  ],
  
  RFID_SETTINGS: {
    TIMEOUT: 30000,
    MAX_ATTEMPTS: 3,
    PIN_LENGTH: 6
  },
  
  PAYMENT_LIMITS: {
    MIN_AMOUNT: 1000,
    MAX_AMOUNT: 1000000,
    DAILY_LIMIT: 5000000
  },
  
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  }
};
