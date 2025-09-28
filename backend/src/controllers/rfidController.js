// UPDATE: src/controllers/rfidController.js
const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

// Register new RFID card
const registerCard = async (req, res) => {
  try {
    const { cardId, ownerName, phone, pin, initialBalance } = req.body;

    // Validation
    if (!cardId || !ownerName || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Card ID, nama pemilik, dan PIN harus diisi'
      });
    }

    if (!/^RF\d{6}$/.test(cardId)) {
      return res.status(400).json({
        success: false,
        message: 'Format Card ID tidak valid'
      });
    }

    if (!/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN harus 6 digit angka'
      });
    }

    // Check if card already exists
    const existingCard = await prisma.rfidCard.findUnique({
      where: { cardId }
    });

    if (existingCard) {
      return res.status(400).json({
        success: false,
        message: 'Kartu sudah terdaftar'
      });
    }

    // Hash PIN
    const hashedPin = await bcrypt.hash(pin, 12);

    // Create new RFID card
    const card = await prisma.rfidCard.create({
      data: {
        cardId,
        ownerName,
        phone: phone || null,
        pin: hashedPin,
        balance: parseInt(initialBalance) || 50000,
        isActive: true,
        merchantId: req.user.id // Associate with current merchant
      },
      select: {
        id: true,
        cardId: true,
        ownerName: true,
        phone: true,
        balance: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log('✅ RFID Card registered:', card);

    res.status(201).json({
      success: true,
      message: 'Kartu RFID berhasil didaftarkan',
      data: card
    });

  } catch (error) {
    console.error('❌ Register card error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mendaftarkan kartu RFID'
    });
  }
};

// Get all registered cards for merchant
const getRegisteredCards = async (req, res) => {
  try {
    const cards = await prisma.rfidCard.findMany({
      where: { merchantId: req.user.id },
      select: {
        id: true,
        cardId: true,
        ownerName: true,
        phone: true,
        balance: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: cards
    });

  } catch (error) {
    console.error('❌ Get cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kartu'
    });
  }
};

// Update card status (activate/deactivate)
const updateCardStatus = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { isActive } = req.body;

    const card = await prisma.rfidCard.findFirst({
      where: { 
        cardId,
        merchantId: req.user.id 
      }
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Kartu tidak ditemukan'
      });
    }

    const updatedCard = await prisma.rfidCard.update({
      where: { id: card.id },
      data: { isActive: Boolean(isActive) },
      select: {
        cardId: true,
        ownerName: true,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: `Kartu berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      data: updatedCard
    });

  } catch (error) {
    console.error('❌ Update card status error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate status kartu'
    });
  }
};

// Top up card balance
const topUpBalance = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { amount, pin } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Jumlah top up harus lebih dari 0'
      });
    }

    const card = await prisma.rfidCard.findFirst({
      where: { 
        cardId,
        merchantId: req.user.id 
      }
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Kartu tidak ditemukan'
      });
    }

    if (!card.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Kartu tidak aktif'
      });
    }

    // Verify PIN if provided
    if (pin) {
      const isPinValid = await bcrypt.compare(pin, card.pin);
      if (!isPinValid) {
        return res.status(401).json({
          success: false,
          message: 'PIN salah'
        });
      }
    }

    // Update balance
    const updatedCard = await prisma.rfidCard.update({
      where: { id: card.id },
      data: {
        balance: { increment: parseInt(amount) }
      },
      select: {
        cardId: true,
        ownerName: true,
        balance: true
      }
    });

    res.json({
      success: true,
      message: 'Top up berhasil',
      data: {
        ...updatedCard,
        topUpAmount: parseInt(amount)
      }
    });

  } catch (error) {
    console.error('❌ Top up error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal melakukan top up'
    });
  }
};

// Existing functions (verifyCard, processPayment)
const verifyCard = async (req, res) => {
  try {
    const { cardId, pin } = req.body;

    if (!cardId || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Card ID dan PIN harus diisi'
      });
    }

    const card = await prisma.rfidCard.findUnique({
      where: { cardId }
    });

    if (!card || !card.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Kartu tidak ditemukan atau tidak aktif'
      });
    }

    const isPinValid = await bcrypt.compare(pin, card.pin);
    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        message: 'PIN salah'
      });
    }

    res.json({
      success: true,
      data: {
        cardId: card.cardId,
        ownerName: card.ownerName,
        balance: card.balance
      }
    });
  } catch (error) {
    console.error('Verify card error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memverifikasi kartu'
    });
  }
};

const processPayment = async (req, res) => {
  try {
    const { cardId, pin, amount, items } = req.body;
    
    console.log('🔄 Processing payment:', { cardId, amount, itemsCount: items?.length });
    
    if (!cardId || !pin || !amount || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Data pembayaran tidak lengkap'
      });
    }
    
    const result = await prisma.$transaction(async (prisma) => {
      // Verify card
      const card = await prisma.rfidCard.findUnique({
        where: { cardId }
      });

      if (!card || !card.isActive) {
        throw new Error('Kartu tidak valid atau tidak aktif');
      }

      const isPinValid = await bcrypt.compare(pin, card.pin);
      if (!isPinValid) {
        throw new Error('PIN salah');
      }

      if (card.balance < amount) {
        throw new Error('Saldo tidak cukup');
      }

      // Verify all products exist and have sufficient stock
      for (const item of items) {
        const product = await prisma.product.findFirst({
          where: { 
            id: item.productId,
            merchantId: req.user.id
          }
        });

        if (!product) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stok ${product.name} tidak cukup (tersisa: ${product.stock})`);
        }
      }

      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          amount,
          cardId,
          merchantId: req.user.id,
          status: 'completed'
        }
      });

      // Create transaction items and update stock
      for (const item of items) {
        await prisma.transactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }
        });

        // Update product stock
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity }
          }
        });
      }

      // Update card balance
      await prisma.rfidCard.update({
        where: { cardId },
        data: {
          balance: { decrement: amount }
        }
      });

      return transaction;
    });

    console.log('✅ Payment completed:', result);

    res.json({
      success: true,
      message: 'Pembayaran berhasil',
      data: result
    });
  } catch (error) {
    console.error('❌ Payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Gagal memproses pembayaran'
    });
  }
};

module.exports = { 
  registerCard, 
  getRegisteredCards,
  updateCardStatus,
  topUpBalance,
  verifyCard, 
  processPayment 
};