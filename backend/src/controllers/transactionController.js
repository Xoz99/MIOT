const prisma = require('../config/database');

const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    
    const where = {
      merchantId: req.user.id,
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        rfidCard: { select: { cardId: true } },
        items: {
          include: {
            product: { select: { name: true, price: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.transaction.count({ where });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil transaksi'
    });
  }
};

module.exports = { getTransactions };
