const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { storeName, ownerName, email, password, phone, address } = req.body;

    const existingMerchant = await prisma.merchant.findUnique({
      where: { email }
    });

    if (existingMerchant) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const merchant = await prisma.merchant.create({
      data: {
        storeName,
        ownerName,
        email,
        password: hashedPassword,
        phone,
        address
      },
      select: {
        id: true,
        email: true,
        storeName: true,
        ownerName: true,
        createdAt: true
      }
    });

    const token = generateToken(merchant.id);

    res.status(201).json({
      success: true,
      message: 'Merchant berhasil didaftarkan',
      data: { merchant, token }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mendaftarkan merchant'
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const merchant = await prisma.merchant.findUnique({
      where: { email }
    });

    if (!merchant || !await bcrypt.compare(password, merchant.password)) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    const token = generateToken(merchant.id);

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        merchant: {
          id: merchant.id,
          email: merchant.email,
          storeName: merchant.storeName,
          ownerName: merchant.ownerName
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal login'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        storeName: true,
        ownerName: true,
        phone: true,
        address: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: merchant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil profil'
    });
  }
};

module.exports = { register, login, getProfile };
