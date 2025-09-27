const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fungsi untuk mendaftarkan kartu RFID baru
const registerCard = async (req, res) => {
  const { cardId, pin, balance } = req.body;
  const merchantId = req.user.id; // Diambil dari token JWT via middleware 'auth'

  // Validasi input
  if (!cardId || !pin || balance === undefined) {
    return res.status(400).json({ success: false, message: 'Card ID, PIN, dan saldo awal harus diisi.' });
  }
  if (pin.length !== 6 || !/^\d+$/.test(pin)) {
    return res.status(400).json({ success: false, message: 'PIN harus terdiri dari 6 digit angka.' });
  }

  try {
    // Cek apakah Card ID sudah terdaftar
    const existingCard = await prisma.rfidCard.findUnique({
      where: { cardId },
    });
    if (existingCard) {
      return res.status(400).json({ success: false, message: 'Kartu RFID dengan ID ini sudah terdaftar.' });
    }

    // Buat kartu baru di database
    const newCard = await prisma.rfidCard.create({
      data: {
        cardId,
        pin, // Di aplikasi produksi, PIN ini harus di-hash (misal: pakai bcrypt)
        balance: parseInt(balance, 10),
        merchantId,
      },
    });

    res.status(201).json({ success: true, message: 'Kartu berhasil didaftarkan.', data: newCard });

  } catch (error) {
    console.error("Error saat mendaftarkan kartu:", error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

// Fungsi untuk mendapatkan semua kartu milik merchant
const getMerchantCards = async (req, res) => {
  const merchantId = req.user.id;

  try {
    const cards = await prisma.rfidCard.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: cards });
  } catch (error) {
    console.error("Error saat mengambil data kartu:", error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

module.exports = {
  registerCard,
  getMerchantCards,
};