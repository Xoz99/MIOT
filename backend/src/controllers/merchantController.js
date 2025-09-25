const prisma = require('../config/database');

const getDashboardStats = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalProducts, totalTransactions, todayRevenue] = await Promise.all([
      prisma.product.count({ where: { merchantId } }),
      prisma.transaction.count({ where: { merchantId } }),
      prisma.transaction.aggregate({
        where: {
          merchantId,
          createdAt: { gte: today }
        },
        _sum: { amount: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        totalTransactions,
        todayRevenue: todayRevenue._sum.amount || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik'
    });
  }
};

module.exports = { getDashboardStats };
