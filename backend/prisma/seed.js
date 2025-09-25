const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create demo merchant
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const merchant = await prisma.merchant.create({
    data: {
      email: 'demo@warung.com',
      password: hashedPassword,
      storeName: 'Warung Demo',
      ownerName: 'Pak Demo',
      phone: '081234567890',
      address: 'Jl. Demo No. 123'
    }
  });

  // Create demo products
  await prisma.product.createMany({
    data: [
      { name: 'Nasi Gudeg Special', price: 18000, stock: 45, category: 'Makanan', merchantId: merchant.id },
      { name: 'Es Kopi Susu', price: 12000, stock: 80, category: 'Minuman', merchantId: merchant.id },
      { name: 'Keripik Singkong', price: 8000, stock: 25, category: 'Snack', merchantId: merchant.id },
      { name: 'Ayam Geprek', price: 22000, stock: 30, category: 'Makanan', merchantId: merchant.id },
      { name: 'Thai Tea', price: 10000, stock: 60, category: 'Minuman', merchantId: merchant.id },
      { name: 'Martabak Mini', price: 15000, stock: 20, category: 'Snack', merchantId: merchant.id }
    ]
  });

  // Create demo RFID cards
  const cardPin = await bcrypt.hash('123456', 12);
  
  await prisma.rfidCard.createMany({
    data: [
      { cardId: 'RF001234', pin: cardPin, balance: 100000, merchantId: merchant.id },
      { cardId: 'RF005678', pin: cardPin, balance: 50000, merchantId: merchant.id },
      { cardId: 'RF009012', pin: cardPin, balance: 75000, merchantId: merchant.id }
    ]
  });

  console.log('✅ Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
