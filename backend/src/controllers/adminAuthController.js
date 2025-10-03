const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("=== ADMIN LOGIN ATTEMPT ===");
    console.log("Email:", email);

    const merchant = await prisma.merchant.findUnique({
      where: { email }
    });

    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Cek apakah user adalah admin
    if (merchant.role !== 'admin') {
      console.log("Access denied - Not admin:", merchant.role);
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya admin yang diperbolehkan.'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, merchant.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    const token = generateToken(merchant.id, 'admin');

    res.json({
      success: true,
      message: 'Login admin berhasil',
      data: {
        admin: {
          id: merchant.id,
          email: merchant.email,
          ownerName: merchant.ownerName,
          role: 'admin'
        },
        token
      }
    });

    console.log("Admin login successful");
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal login'
    });
  }
};

module.exports = { adminLogin };