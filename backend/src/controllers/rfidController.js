// backend/src/controllers/rfidController.js
const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

const verifyCard = async (req, res) => {
  try {
    const { cardId, pin } = req.body;

    if (!cardId || !pin) {
      return res.status(400).json({
        success: false,
        message: 'cardId dan pin harus diisi'
      });
    }

    console.log(`Verifying card: ${cardId}`);

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
      message: 'Verifikasi berhasil',
      data: {
        cardId: card.cardId,
        ownerName: card.ownerName,
        balance: card.balance,
        phone: card.phone
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
    const { cardId, pin, amount } = req.body;

    if (!cardId || !pin || !amount) {
      return res.status(400).json({
        success: false,
        message: 'cardId, pin, dan amount harus diisi'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount harus lebih dari 0'
      });
    }

    console.log(`Processing payment: ${cardId}, amount: ${amount}`);

    const result = await prisma.$transaction(async (tx) => {
      // Verify card
      const card = await tx.rfidCard.findUnique({
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

      // Update card balance directly (tanpa create transaction record untuk sementara)
      const updatedCard = await tx.rfidCard.update({
        where: { cardId },
        data: {
          balance: { decrement: parseInt(amount) }
        }
      });

      return {
        cardId,
        amount: parseInt(amount),
        oldBalance: card.balance,
        newBalance: updatedCard.balance,
        timestamp: new Date().toISOString()
      };
    });

    console.log(`Payment successful: ${result.cardId}`);

    res.json({
      success: true,
      message: 'Pembayaran berhasil',
      data: result
    });

  } catch (error) {
    console.error('Payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Gagal memproses pembayaran'
    });
  }
};

module.exports = { verifyCard, processPayment };