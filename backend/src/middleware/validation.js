const { body } = require('express-validator');

const registerValidation = [
  body('storeName').notEmpty().withMessage('Nama toko harus diisi'),
  body('ownerName').notEmpty().withMessage('Nama pemilik harus diisi'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
];

const loginValidation = [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').notEmpty().withMessage('Password harus diisi')
];

const productValidation = [
  body('name').notEmpty().withMessage('Nama produk harus diisi'),
  body('price').isNumeric().withMessage('Harga harus berupa angka'),
  body('stock').isNumeric().withMessage('Stok harus berupa angka')
];

module.exports = {
  registerValidation,
  loginValidation,
  productValidation
};
