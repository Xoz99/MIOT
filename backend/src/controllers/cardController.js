const { PrismaClient } = require("@prisma/client");
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const registerCard = async (req, res) => {
  const { cardId, pin, balance } = req.body;
  const merchantId = req.user.id;

  console.log("=== REGISTER CARD DEBUG ===");
  console.log("Request body:", req.body);
  console.log("Merchant ID from token:", merchantId);
  console.log("Data types:");
  console.log("- cardId:", typeof cardId, "value:", cardId);
  console.log("- pin:", typeof pin, "value:", pin);
  console.log("- balance:", typeof balance, "value:", balance);
  console.log("- merchantId:", typeof merchantId, "value:", merchantId);

  if (!cardId || !pin || balance === undefined) {
    return res.status(400).json({
      success: false,
      message: "Card ID, PIN, dan saldo awal harus diisi.",
    });
  }

  if (pin.length !== 6 || !/^\d+$/.test(pin)) {
    return res.status(400).json({
      success: false,
      message: "PIN harus terdiri dari 6 digit angka.",
    });
  }

  const cardIdString = String(cardId).trim();
  const balanceInt = parseInt(balance, 10);

  if (isNaN(balanceInt) || balanceInt < 0) {
    return res.status(400).json({
      success: false,
      message: "Saldo harus berupa angka positif.",
    });
  }

  try {
    const merchantExists = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchantExists) {
      console.error("Merchant not found:", merchantId);
      return res.status(404).json({
        success: false,
        message: "Merchant tidak ditemukan",
      });
    }

    console.log("Merchant verified:", merchantExists.storeName);

    const existingCard = await prisma.rfidCard.findUnique({
      where: { cardId: cardIdString },
    });

    if (existingCard) {
      console.log("Card already exists:", cardIdString);
      return res.status(400).json({
        success: false,
        message: "Kartu RFID dengan ID ini sudah terdaftar.",
      });
    }

    console.log("Hashing PIN...");
    const saltRounds = 10;
    const hashedPin = await bcrypt.hash(String(pin), saltRounds);
    console.log("PIN hashed successfully");

    const createData = {
      cardId: cardIdString,
      pin: hashedPin,
      balance: balanceInt,
      merchantId: merchantId,
      isActive: true,
    };

    const newCard = await prisma.rfidCard.create({
      data: createData,
      include: {
        merchant: {
          select: {
            id: true,
            storeName: true,
            ownerName: true,
          },
        },
      },
    });

    console.log("Card created successfully with ID:", newCard.id);

    res.status(201).json({
      success: true,
      message: "Kartu berhasil didaftarkan.",
      data: {
        id: newCard.id,
        cardId: newCard.cardId,
        balance: newCard.balance,
        isActive: newCard.isActive,
        merchantId: newCard.merchantId,
        merchant: newCard.merchant,
        createdAt: newCard.createdAt,
      },
    });
  } catch (error) {
    console.error("=== ERROR DETAILS ===");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);
    console.error("Error stack:", error.stack);
    console.error("=====================");

    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "Kartu dengan ID ini sudah terdaftar.",
      });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Merchant tidak valid (foreign key constraint).",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Data yang diperlukan tidak ditemukan.",
      });
    }

    res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? `Server error: ${error.message}`
          : "Terjadi kesalahan pada server.",
    });
  }
};

const getMerchantCards = async (req, res) => {
  const merchantId = req.user.id;

  try {
    console.log("=== GET MERCHANT CARDS ===");
    console.log("Merchant ID:", merchantId);

    const merchantExists = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, storeName: true, ownerName: true },
    });

    if (!merchantExists) {
      return res.status(404).json({
        success: false,
        message: "Merchant tidak ditemukan",
      });
    }

    console.log("Getting cards for merchant:", merchantExists.storeName);

    const cards = await prisma.rfidCard.findMany({
      where: { merchantId: merchantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        cardId: true,
        balance: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(
      `Found ${cards.length} cards for merchant ${merchantId} (${merchantExists.storeName})`
    );

    res.status(200).json({
      success: true,
      data: cards,
      merchant: merchantExists,
    });
  } catch (error) {
    console.error("Error saat mengambil data kartu:", error);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);

    res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? `Server error: ${error.message}`
          : "Terjadi kesalahan pada server.",
    });
  }
};

const verifyPinAndGetBalance = async (req, res) => {
  const { cardId, pin } = req.body;

  console.log("=== VERIFY PIN REQUEST ===");
  console.log("Card ID:", cardId);
  console.log("PIN length:", pin?.length);

  if (!cardId || !pin) {
    return res.status(400).json({
      success: false,
      message: "Card ID dan PIN harus diisi."
    });
  }

  if (pin.length !== 6 || !/^\d+$/.test(pin)) {
    return res.status(400).json({
      success: false,
      message: "PIN harus terdiri dari 6 digit angka."
    });
  }

  try {
    const card = await prisma.rfidCard.findUnique({
      where: { cardId: String(cardId).trim() },
      include: {
        merchant: {
          select: {
            id: true,
            storeName: true,
            ownerName: true
          }
        }
      }
    });

    if (!card) {
      console.log("Card not found:", cardId);
      return res.status(404).json({
        success: false,
        message: "Kartu tidak ditemukan."
      });
    }

    if (!card.isActive) {
      console.log("Card is inactive:", cardId);
      return res.status(403).json({
        success: false,
        message: "Kartu tidak aktif. Hubungi admin."
      });
    }

    console.log("Verifying PIN for card:", cardId);
    const isPinValid = await bcrypt.compare(String(pin), card.pin);

    if (!isPinValid) {
      console.log("Invalid PIN for card:", cardId);
      return res.status(401).json({
        success: false,
        message: "PIN tidak valid."
      });
    }

    console.log("PIN verified successfully for card:", cardId);
    
    res.status(200).json({
      success: true,
      message: "PIN berhasil diverifikasi.",
      data: {
        id: card.id,
        cardId: card.cardId,
        balance: card.balance,
        isActive: card.isActive,
        merchantId: card.merchantId,
        merchant: card.merchant,
      }
    });

  } catch (error) {
    console.error("=== PIN VERIFICATION ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' 
        ? `Server error: ${error.message}` 
        : "Terjadi kesalahan pada server."
    });
  }
};

const testPinVerification = async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ message: 'Not found' });
  }

  const { cardId, pin } = req.body;

  try {
    const card = await prisma.rfidCard.findUnique({
      where: { cardId }
    });

    if (!card) {
      return res.json({ success: false, message: 'Card not found' });
    }

    const isValid = await bcrypt.compare(pin, card.pin);
    
    res.json({ 
      success: true, 
      message: 'PIN verification test completed',
      data: {
        cardId,
        pinMatch: isValid,
        cardActive: card.isActive
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== FUNCTION BARU UNTUK TOP-UP =====

const getCardInfo = async (req, res) => {
  const { cardId } = req.params;

  console.log("=== GET CARD INFO ===");
  console.log("Card ID:", cardId);

  try {
    const card = await prisma.rfidCard.findUnique({
      where: { cardId: String(cardId).trim() },
      select: {
        id: true,
        cardId: true,
        balance: true,
        isActive: true,
        createdAt: true,
        merchantId: true
      }
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Kartu tidak ditemukan'
      });
    }

    if (!card.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Kartu tidak aktif'
      });
    }

    res.json({
      success: true,
      data: card
    });
  } catch (error) {
    console.error('Get card info error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kartu'
    });
  }
};

const topUpCard = async (req, res) => {
  const { cardId, amount } = req.body;

  console.log("=== TOP-UP REQUEST ===");
  console.log("Card ID:", cardId);
  console.log("Amount:", amount);

  if (!cardId || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Card ID dan amount harus diisi'
    });
  }

  const topupAmount = parseInt(amount);

  if (isNaN(topupAmount) || topupAmount < 1000) {
    return res.status(400).json({
      success: false,
      message: 'Minimal top-up Rp 1.000'
    });
  }

  if (topupAmount > 10000000) {
    return res.status(400).json({
      success: false,
      message: 'Maksimal top-up Rp 10.000.000'
    });
  }

  try {
    const updatedCard = await prisma.rfidCard.update({
      where: { cardId: String(cardId).trim() },
      data: {
        balance: { increment: topupAmount }
      },
      select: {
        id: true,
        cardId: true,
        balance: true,
        isActive: true
      }
    });

    console.log("Top-up successful:", updatedCard.cardId);

    res.json({
      success: true,
      message: 'Top-up berhasil',
      data: updatedCard
    });
  } catch (error) {
    console.error('Top-up error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Kartu tidak ditemukan'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Gagal melakukan top-up'
    });
  }
};

module.exports = {
  registerCard,
  getMerchantCards,
  verifyPinAndGetBalance,
  testPinVerification,
  getCardInfo,      // EXPORT BARU
  topUpCard         // EXPORT BARU
};