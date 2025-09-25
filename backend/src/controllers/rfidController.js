const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

const verifyCard = async (req, res) => {
  try {
    const { cardId, pin } = req.body;

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
        balance: card.balance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memverifikasi kartu'
    });
  }
};

const processPayment = async (req, res) => {
  try {
    const { cardId, pin, amount, items } = req.body;
    
    const result = await prisma.$transaction(async (prisma) => {
      const card = await prisma.rfidCard.findUnique({
        where: { cardId }
      });

      if (!card || !card.isActive) {
        throw new Error('Kartu tidak valid');
      }

      const isPinValid = await bcrypt.compare(pin, card.pin);
      if (!isPinValid) {
        throw new Error('PIN salah');
      }

      if (card.balance < amount) {
        throw new Error('Saldo tidak cukup');
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

      // Create transaction items
      if (items && items.length > 0) {
        await prisma.transactionItem.createMany({
          data: items.map(item => ({
            transactionId: transaction.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        });

        // Update product stock
        for (const item of items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity }
            }
          });
        }
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

    res.json({
      success: true,
      message: 'Pembayaran berhasil',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Gagal memproses pembayaran'
    });
  }
};

module.exports = { verifyCard, processPayment };
