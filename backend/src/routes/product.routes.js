const express = require('express');
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { productValidation } = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getProducts);
router.post('/', auth, productValidation, createProduct);
router.put('/:id', auth, updateProduct);
router.delete('/:id', auth, deleteProduct);

module.exports = router;
