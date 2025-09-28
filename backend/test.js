const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDB() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Test query merchants
    const merchants = await prisma.merchant.findMany();
    console.log('📊 Merchants count:', merchants.length);
    
    // Test query rfid_cards
    const cards = await prisma.rfidCard.findMany();
    console.log('💳 RFID Cards count:', cards.length);
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();