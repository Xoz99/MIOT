const { PrismaClient } = require("@prisma/client");
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const registerCardPublic = async (req, res) => {
  try {
    const { cardId, ownerName, pin, balance } = req.body;

    console.log("=== PUBLIC CARD REGISTRATION ===");
    console.log("Card ID:", cardId);
    console.log("Owner:", ownerName);

    if (!cardId || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Card ID dan PIN harus diisi'
      });
    }

    if (pin.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'PIN harus 6 digit'
      });
    }

    const existingCard = await prisma.rfidCard.findUnique({
      where: { cardId: cardId.trim() }
    });

    if (existingCard) {
      return res.status(400).json({
        success: false,
        message: 'Kartu sudah terdaftar'
      });
    }

    const hashedPin = await bcrypt.hash(pin, 12);

    const newCard = await prisma.rfidCard.create({
      data: {
        cardId: cardId.trim(),
        owner_name: ownerName || 'Pemilik Kartu', // GANTI jadi owner_name
        pin: hashedPin,
        balance: parseInt(balance) || 0,
        merchantId: null,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Kartu berhasil didaftarkan',
      data: {
        cardId: newCard.cardId,
        ownerName: newCard.owner_name, // GANTI
        balance: newCard.balance
      }
    });

  } catch (error) {
    console.error('Public card registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mendaftarkan kartu'
    });
  }
};

module.exports = { registerCardPublic };