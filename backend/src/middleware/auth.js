const prisma = require('../config/database');
const { verifyToken } = require('../config/jwt');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan'
      });
    }

    const decoded = verifyToken(token);
    console.log('Decoded token:', decoded); // DEBUG
    
    const user = await prisma.merchant.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        email: true, 
        storeName: true, 
        ownerName: true,
        role: true // TAMBAH INI
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      storeName: user.storeName,
      ownerName: user.ownerName,
      role: user.role || 'merchant' // PENTING
    };

    console.log('req.user set to:', req.user); // DEBUG
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token tidak valid'
    });
  }
};

module.exports = auth;