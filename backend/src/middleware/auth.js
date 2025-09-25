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
    
    const user = await prisma.merchant.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, storeName: true, ownerName: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token tidak valid'
    });
  }
};

module.exports = auth;
