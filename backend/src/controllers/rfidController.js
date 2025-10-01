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
    const { cardId, pin, amount, items, totalAmount } = req.body;
    
    const paymentAmount = amount || totalAmount;

    console.log('=== PAYMENT REQUEST ===');
    console.log('Raw cardId:', cardId);
    console.log('Type:', typeof cardId);
    console.log('Length:', cardId?.length);
    console.log('Pin length:', pin?.length);
    console.log('Amount:', paymentAmount);

    if (!cardId || !pin || !paymentAmount) {
      return res.status(400).json({
        success: false,
        message: 'cardId, pin, dan amount harus diisi'
      });
    }

    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount harus lebih dari 0'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Debug: Cari semua kartu untuk comparison
      console.log('=== SEARCHING CARD ===');
      const allCards = await tx.rfidCard.findMany({
        select: { cardId: true, isActive: true }
      });
      console.log('All cards in DB:', allCards);
      console.log('Looking for:', cardId);

      // Cari kartu
      const card = await tx.rfidCard.findUnique({
        where: { cardId: String(cardId).trim() }
      });

      console.log('=== CARD LOOKUP RESULT ===');
      console.log('Found:', !!card);
      if (card) {
        console.log('Card ID:', card.cardId);
        console.log('Is Active:', card.isActive);
        console.log('Balance:', card.balance);
      }

      if (!card || !card.isActive) {
        throw new Error('Kartu tidak valid atau tidak aktif');
      }

      const isPinValid = await bcrypt.compare(pin, card.pin);
      console.log('PIN Valid:', isPinValid);
      
      if (!isPinValid) {
        throw new Error('PIN salah');
      }

      if (card.balance < paymentAmount) {
        throw new Error('Saldo tidak cukup');
      }

      // Update stock produk
      if (items && items.length > 0) {
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });

          if (!product) {
            throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
          }

          if (product.stock < item.quantity) {
            throw new Error(`Stock ${product.name} tidak mencukupi`);
          }

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }
      }

      // Update saldo
      const updatedCard = await tx.rfidCard.update({
        where: { cardId: String(cardId).trim() },
        data: { balance: { decrement: parseInt(paymentAmount) } }
      });

      return {
        cardId,
        amount: parseInt(paymentAmount),
        oldBalance: card.balance,
        newBalance: updatedCard.balance,
        items: items || [],
        timestamp: new Date().toISOString()
      };
    });

    console.log('Payment successful');
    
    res.json({
      success: true,
      message: 'Pembayaran berhasil',
      data: result
    });

  } catch (error) {
    console.error('=== PAYMENT ERROR ===');
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message || 'Gagal memproses pembayaran'
    });
  }
};

module.exports = { verifyCard, processPayment };