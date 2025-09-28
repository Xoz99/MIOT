const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt"); // Optional: untuk hash PIN di production
const prisma = new PrismaClient();

// Fungsi untuk mendaftarkan kartu RFID baru
const registerCard = async (req, res) => {
  try {
    console.log("=== REGISTER CARD DEBUG ===");
    console.log("Request body:", req.body);
    console.log("User from token:", req.user);

    const { cardId, pin, balance } = req.body;
    const merchantId = req.user?.id; // Diambil dari token JWT via middleware 'auth'

    // 1. Validasi user authentication
    if (!merchantId) {
      console.error("No merchant ID in token");
      return res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
    }

    // 2. Validasi input yang lebih ketat
    if (!cardId || typeof cardId !== "string" || cardId.trim() === "") {
      console.error("Invalid cardId:", cardId);
      return res.status(400).json({
        success: false,
        message: "Card ID harus diisi dan berupa string yang valid.",
      });
    }

    if (!pin || typeof pin !== "string") {
      console.error("Invalid pin type:", typeof pin);
      return res.status(400).json({
        success: false,
        message: "PIN harus berupa string.",
      });
    }

    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      console.error("Invalid PIN format:", pin);
      return res.status(400).json({
        success: false,
        message: "PIN harus terdiri dari 6 digit angka.",
      });
    }

    if (balance === undefined || balance === null || balance === "") {
      console.error("Balance is undefined:", balance);
      return res.status(400).json({
        success: false,
        message: "Saldo awal harus diisi.",
      });
    }

    const balanceInt = parseInt(balance, 10);
    if (isNaN(balanceInt) || balanceInt < 0) {
      console.error("Invalid balance:", balance, "parsed:", balanceInt);
      return res.status(400).json({
        success: false,
        message: "Saldo harus berupa angka positif.",
      });
    }

    console.log("Validation passed. Checking merchant exists...");

    // 3. Verifikasi merchant exists (sesuaikan dengan model Merchant)
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

    console.log("Merchant exists:", merchantExists.storeName);
    console.log("Checking if card already registered...");

    // 4. Cek apakah Card ID sudah terdaftar
    const existingCard = await prisma.rfidCard.findUnique({
      where: { cardId: cardId.trim() },
    });

    if (existingCard) {
      console.log("Card already exists:", cardId.trim());
      return res.status(400).json({
        success: false,
        message: `Kartu RFID dengan ID ${cardId.trim()} sudah terdaftar.`,
      });
    }

    console.log("Card not exists. Creating new card...");

    // 5. Hash PIN untuk keamanan (recommended for production)
    // const hashedPin = await bcrypt.hash(pin, 10);

    // 6. Buat kartu baru di database
    const newCard = await prisma.rfidCard.create({
      data: {
        cardId: cardId.trim(),
        pin: pin, // Gunakan hashedPin di production
        balance: balanceInt,
        merchantId: merchantId,
        isActive: true,
      },
      // Include merchant info in response
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

    console.log("Card created successfully:", {
      id: newCard.id,
      cardId: newCard.cardId,
      balance: newCard.balance,
      merchantId: newCard.merchantId,
      merchantStore: newCard.merchant.storeName,
    });

    // 7. Response success
    res.status(201).json({
      success: true,
      message: "Kartu berhasil didaftarkan.",
      data: {
        id: newCard.id,
        cardId: newCard.cardId,
        balance: newCard.balance,
        isActive: newCard.isActive,
        merchantId: newCard.merchantId,
        createdAt: newCard.createdAt,
      },
    });
  } catch (error) {
    console.error("=== REGISTER CARD ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);

    // Prisma specific errors
    if (error.code) {
      console.error("Prisma error code:", error.code);
      console.error("Prisma meta:", error.meta);
    }

    console.error("Error stack:", error.stack);

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      console.error(
        "Unique constraint violation on field:",
        error.meta?.target
      );
      return res.status(400).json({
        success: false,
        message: "Kartu dengan ID ini sudah terdaftar (unique constraint).",
      });
    }

    if (error.code === "P2003") {
      console.error("Foreign key constraint violation:", error.meta);
      return res.status(400).json({
        success: false,
        message: "Merchant tidak valid (foreign key constraint).",
      });
    }

    if (error.code === "P2025") {
      console.error("Record not found:", error.meta);
      return res.status(404).json({
        success: false,
        message: "Data yang diperlukan tidak ditemukan.",
      });
    }

    // Database connection errors
    if (error.code === "P1001") {
      console.error("Cannot reach database server");
      return res.status(500).json({
        success: false,
        message: "Tidak dapat terhubung ke database.",
      });
    }

    if (error.code === "P1000") {
      console.error("Authentication failed against database server");
      return res.status(500).json({
        success: false,
        message: "Autentikasi database gagal.",
      });
    }

    console.error("================================");

    res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? `Server error: ${error.message}`
          : "Terjadi kesalahan pada server.",
      ...(process.env.NODE_ENV === "development" && {
        errorDetails: {
          code: error.code,
          message: error.message,
          type: error.constructor.name,
        },
      }),
    });
  }
};

// Fungsi untuk mendapatkan semua kartu milik merchant
const getMerchantCards = async (req, res) => {
  try {
    console.log("=== GET MERCHANT CARDS ===");
    console.log("Merchant ID:", req.user?.id);

    const merchantId = req.user?.id;

    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
    }

    // Verifikasi merchant exists
    const merchantExists = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchantExists) {
      return res.status(404).json({
        success: false,
        message: "Merchant tidak ditemukan",
      });
    }

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
        // Jangan include PIN untuk keamanan
      },
    });

    console.log(
      `Found ${cards.length} cards for merchant ${merchantId} (${merchantExists.storeName})`
    );

    res.status(200).json({
      success: true,
      data: cards,
    });
  } catch (error) {
    console.error("Error saat mengambil data kartu:", error);

    // Handle specific database errors
    if (error.code === "P1001") {
      return res.status(500).json({
        success: false,
        message: "Tidak dapat terhubung ke database.",
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

module.exports = {
  registerCard,
  getMerchantCards,
};
