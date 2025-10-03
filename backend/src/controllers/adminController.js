const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all cards (admin only)
const getAllCards = async (req, res) => {
  try {
    console.log("=== GET ALL CARDS (ADMIN) ===");
    console.log("Requested by user:", req.user.id, "Role:", req.user.role);

    const cards = await prisma.rfidCard.findMany({
      include: {
        merchant: {
          select: {
            id: true,
            storeName: true,
            ownerName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${cards.length} cards`);

    res.json({
      success: true,
      data: cards
    });
  } catch (error) {
    console.error('Get all cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kartu'
    });
  }
};

// Toggle card status (block/unblock)
const toggleCardStatus = async (req, res) => {
  const { cardId } = req.params;

  try {
    console.log("=== TOGGLE CARD STATUS ===");
    console.log("Card ID:", cardId);
    console.log("By admin:", req.user.id);

    const card = await prisma.rfidCard.findUnique({
      where: { cardId: String(cardId).trim() }
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Kartu tidak ditemukan'
      });
    }

    const newStatus = !card.isActive;

    const updatedCard = await prisma.rfidCard.update({
      where: { cardId: String(cardId).trim() },
      data: { isActive: newStatus }
    });

    console.log(`Card ${cardId} status changed to: ${newStatus ? 'ACTIVE' : 'BLOCKED'}`);

    res.json({
      success: true,
      message: newStatus ? 'Kartu berhasil diaktifkan' : 'Kartu berhasil diblokir',
      data: updatedCard
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengubah status kartu'
    });
  }
};

// Get card transaction history
const getCardHistory = async (req, res) => {
  const { cardId } = req.params;

  try {
    console.log("=== GET CARD HISTORY ===");
    console.log("Card ID:", cardId);

    // Cek apakah ada model Transaction
    try {
      const transactions = await prisma.transaction.findMany({
        where: { cardId: String(cardId).trim() },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      res.json({
        success: true,
        data: transactions
      });
    } catch (err) {
      // Jika model Transaction belum ada, return empty
      console.log("Transaction model not found, returning empty array");
      res.json({
        success: true,
        data: [],
        message: 'Model transaksi belum tersedia'
      });
    }
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat transaksi'
    });
  }
};

// Get admin statistics
const getAdminStats = async (req, res) => {
  try {
    const totalCards = await prisma.rfidCard.count();
    const activeCards = await prisma.rfidCard.count({
      where: { isActive: true }
    });
    const blockedCards = await prisma.rfidCard.count({
      where: { isActive: false }
    });
    
    const totalBalance = await prisma.rfidCard.aggregate({
      _sum: { balance: true }
    });

    res.json({
      success: true,
      data: {
        totalCards,
        activeCards,
        blockedCards,
        totalBalance: totalBalance._sum.balance || 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik'
    });
  }
};

module.exports = {
  getAllCards,
  toggleCardStatus,
  getCardHistory,
  getAdminStats
};