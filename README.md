# MIOT

**MIOT** X PayEasy.  

## Installation

Clone repo ini:

```bash
git clone git@github.com:Xoz99/MIOT.git
cd frontend
```
## Install dependencies (Tailwind + PostCSS):
```bash
npm install -D @tailwindcss/postcss
```
## run
```bash
npm start 
```

# Setup Database RFID E-Wallet

Panduan lengkap setup database backend RFID E-Wallet dari nol sampai GUI database management untuk Windows.

## Daftar Isi
- [Prerequisites](#prerequisites)
- [Instalasi PostgreSQL](#instalasi-postgresql)
- [Pembuatan Database](#pembuatan-database)
- [Setup Backend Project](#setup-backend-project)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Setup Prisma Schema](#setup-prisma-schema)
- [Migrasi Database & Seeding](#migrasi-database--seeding)
- [Setup GUI DBeaver](#setup-gui-dbeaver)
- [Testing & Verifikasi](#testing--verifikasi)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Windows 10/11
- Node.js (v16 atau lebih tinggi) dan npm
- Git Bash atau Command Prompt
- Koneksi Internet

---

## Instalasi PostgreSQL

### Download dan Install PostgreSQL

1. **Download PostgreSQL**:
   - Buka browser dan kunjungi: https://www.postgresql.org/download/windows/
   - Klik "Download the installer" 
   - Pilih versi terbaru (contoh: PostgreSQL 15.x)

2. **Install PostgreSQL**:
   - Jalankan file installer yang sudah didownload
   - Ikuti wizard instalasi:
     - Pilih direktori instalasi (default: `C:\Program Files\PostgreSQL\15`)
     - Pilih komponen: centang semua (PostgreSQL Server, pgAdmin 4, Stack Builder, Command Line Tools)
     - Pilih direktori data (default: `C:\Program Files\PostgreSQL\15\data`)
     - **Set password untuk superuser `postgres`** (CATAT PASSWORD INI!)
     - Port: 5432 (default)
     - Locale: Indonesian, Indonesia atau Default locale
   - Klik "Next" dan "Install"

3. **Verifikasi Instalasi**:
   - Buka Command Prompt atau PowerShell
   - Jalankan: `psql --version`
   - Jika muncul error "command not found", tambahkan ke PATH:
     - Buka System Properties > Environment Variables
     - Edit PATH, tambahkan: `C:\Program Files\PostgreSQL\15\bin`

### Setup PostgreSQL User

```cmd
:: Masuk ke PostgreSQL sebagai superuser (akan diminta password)
psql -U postgres

:: Di dalam PostgreSQL prompt, buat user baru:
CREATE USER nama_user_anda WITH CREATEDB SUPERUSER PASSWORD 'password_anda';

:: Keluar dari PostgreSQL
\q
```

> **Catatan**: 
> - Ganti `nama_user_anda` dengan username Windows Anda (cek dengan `echo %USERNAME%`)
> - Ganti `password_anda` dengan password yang mudah diingat untuk development

---

## Pembuatan Database

```cmd
:: Buat database dengan user yang sudah dibuat
createdb -U nama_user_anda -h localhost rfid_ewallet

:: Test koneksi ke database
psql -U nama_user_anda -h localhost -d rfid_ewallet

:: Di dalam PostgreSQL prompt:
:: List database untuk verifikasi
\l

:: Keluar
\q
```

---

## Setup Backend Project

### Buat Struktur Project

```cmd
:: Buat direktori project
mkdir rfid-ewallet-backend
cd rfid-ewallet-backend

:: Initialize npm project
npm init -y
```

### Install Dependencies

```cmd
:: Dependencies production
npm install express prisma @prisma/client bcryptjs jsonwebtoken cors helmet express-rate-limit dotenv socket.io multer joi

:: Development dependencies
npm install -D nodemon
```

### Buat Struktur Folder

```cmd
:: Buat struktur folder backend
mkdir src\controllers src\middleware src\routes src\services src\websocket src\config src\utils
mkdir prisma

:: Buat file utama (Windows)
type nul > src\app.js
type nul > src\server.js
type nul > prisma\schema.prisma
type nul > prisma\seed.js
type nul > .env
type nul > README.md
```

---

## Konfigurasi Environment

### Buat File .env

Buat file `.env` dan isi dengan:

```env
# Konfigurasi Database
DATABASE_URL="postgresql://nama_user_anda:password_anda@localhost:5432/rfid_ewallet"

# Konfigurasi Server
PORT=3001
NODE_ENV=development

# Konfigurasi JWT
JWT_SECRET=kunci-rahasia-jwt-anda-ganti-ini-untuk-produksi
JWT_EXPIRE=30d

# Konfigurasi Aplikasi
CLIENT_URL=http://localhost:3000
OWNER_PIN=999999
MAX_REQUESTS_PER_HOUR=1000
RFID_TIMEOUT=30000
MAX_TRANSACTION_AMOUNT=1000000
```

> **Penting**: 
> - Ganti `nama_user_anda` dengan username yang sudah dibuat di PostgreSQL
> - Ganti `password_anda` dengan password yang sudah diset

### Verifikasi Environment Variables

```cmd
:: Cek isi file .env (Windows)
type .env

:: Atau buka dengan notepad
notepad .env
```

---

## Setup Prisma Schema

### Buat Database Schema

Buka file `prisma\schema.prisma` dan isi dengan:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Merchant {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  storeName String
  ownerName String
  phone     String?
  address   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  products     Product[]
  transactions Transaction[]
  
  @@map("merchants")
}

model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Int      // Dalam sen rupiah (contoh: 15000 = Rp 150.00)
  stock       Int      @default(0)
  category    String?
  description String?
  image       String?
  isActive    Boolean  @default(true)
  merchantId  Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  merchant         Merchant           @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  transactionItems TransactionItem[]
  
  @@map("products")
}

model RfidCard {
  id        Int      @id @default(autoincrement())
  cardId    String   @unique
  pin       String   // PIN yang di-hash
  balance   Int      @default(0) // Dalam sen rupiah
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  transactions Transaction[]
  
  @@map("rfid_cards")
}

model Transaction {
  id         Int      @id @default(autoincrement())
  cardId     String
  merchantId Int
  amount     Int      // Total amount dalam sen rupiah
  status     String   @default("completed") // pending, completed, failed
  createdAt  DateTime @default(now())
  
  // Relations
  card     RfidCard @relation(fields: [cardId], references: [cardId])
  merchant Merchant @relation(fields: [merchantId], references: [id])
  items    TransactionItem[]
  
  @@map("transactions")
}

model TransactionItem {
  id            Int @id @default(autoincrement())
  transactionId Int
  productId     Int
  quantity      Int
  price         Int // Harga saat pembelian dalam sen rupiah
  
  // Relations
  transaction Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  product     Product     @relation(fields: [productId], references: [id])
  
  @@map("transaction_items")
}
```

### Update package.json Scripts

Buka file `package.json` dan ganti dengan:

```json
{
  "name": "rfid-ewallet-backend",
  "version": "1.0.0",
  "description": "Backend API for RFID E-Wallet System",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "node prisma/seed.js",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "db:status": "prisma migrate status"
  },
  "dependencies": {
    "express": "^4.18.2",
    "prisma": "^5.22.0",
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "dotenv": "^16.3.1",
    "socket.io": "^4.7.4",
    "multer": "^1.4.5-lts.1",
    "joi": "^17.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## Migrasi Database & Seeding

### Buat Demo Data Seed

Buka file `prisma\seed.js` dan isi dengan:

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Mulai seeding database...');

  // Buat demo merchant
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

  console.log('✅ Demo merchant berhasil dibuat');

  // Buat demo products
  const productsData = [
    { name: 'Nasi Gudeg Special', price: 1800000, stock: 45, category: 'Makanan' },
    { name: 'Es Kopi Susu', price: 1200000, stock: 80, category: 'Minuman' },
    { name: 'Ayam Geprek', price: 1500000, stock: 30, category: 'Makanan' },
    { name: 'Es Teh Manis', price: 500000, stock: 100, category: 'Minuman' },
    { name: 'Sate Ayam', price: 2000000, stock: 25, category: 'Makanan' },
    { name: 'Jus Jeruk', price: 800000, stock: 60, category: 'Minuman' }
  ];

  for (const productData of productsData) {
    await prisma.product.create({
      data: {
        ...productData,
        merchantId: merchant.id
      }
    });
  }

  console.log('✅ Demo products berhasil dibuat');

  // Buat demo RFID cards
  const cardsData = [
    { cardId: 'RFID001234', pin: '123456', balance: 10000000 }, // Rp 100,000
    { cardId: 'RFID005678', pin: '654321', balance: 5000000 },  // Rp 50,000
    { cardId: 'RFID009999', pin: '999999', balance: 20000000 }  // Rp 200,000
  ];

  for (const cardData of cardsData) {
    await prisma.rfidCard.create({
      data: {
        cardId: cardData.cardId,
        pin: await bcrypt.hash(cardData.pin, 10),
        balance: cardData.balance,
        isActive: true
      }
    });
  }

  console.log('✅ Demo RFID cards berhasil dibuat');
  console.log('\n🎉 Database berhasil di-seed!');
  console.log('\n📋 Demo Credentials:');
  console.log('👤 Merchant: demo@warung.com / password123');
  console.log('💳 RFID Cards: RFID001234, RFID005678, RFID009999');
  console.log('🔢 PINs: 123456, 654321, 999999');
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Jalankan Database Setup

```cmd
:: Generate Prisma client
npx prisma generate

:: Jalankan database migration
npm run db:migrate
REM Ketika diminta nama migration, ketik: "initial_setup"

:: Seed database dengan demo data
npm run db:seed
```

### Verifikasi Database Setup

```cmd
:: Connect ke database dan verifikasi tables
psql -U nama_user_anda -h localhost -d rfid_ewallet

:: Di dalam PostgreSQL prompt:
:: List semua tables
\dt

:: Cek demo data
SELECT * FROM merchants;
SELECT count(*) FROM products;
SELECT count(*) FROM rfid_cards;

:: Keluar dari database
\q
```

---

## Setup GUI DBeaver

### Download dan Install DBeaver

1. **Download DBeaver Community Edition**:
   - Buka browser dan kunjungi: **https://dbeaver.io/download/**
   - Klik **"Windows (installer)"** untuk download file `.exe`
   - Ukuran file sekitar 100MB

2. **Install DBeaver**:
   - Jalankan file installer yang sudah didownload
   - Ikuti wizard instalasi (Next > Next > Install)
   - Launch DBeaver setelah instalasi selesai

### Buat Database Connection

1. **Buat Connection Baru**:
   - Buka DBeaver
   - Klik **"New Database Connection"** (ikon + di toolbar)
   - Pilih **"PostgreSQL"** dari daftar database

2. **Konfigurasi Connection**:
   - **Host**: `localhost`
   - **Port**: `5432`
   - **Database**: `rfid_ewallet`
   - **Username**: `nama_user_anda` (sesuai yang dibuat di PostgreSQL)
   - **Password**: `password_anda` (sesuai yang diset)

3. **Test dan Simpan**:
   - Klik **"Test Connection"** untuk verifikasi
   - Jika berhasil, klik **"Finish"** untuk menyimpan connection

### Navigasi Struktur Database

Setelah terhubung, expand tree structure di sebelah kiri:

```
rfid_ewallet
└── Schemas
    └── public
        └── Tables
            ├── merchants          (1 record)
            ├── products           (6 records)
            ├── rfid_cards         (3 records)
            ├── transactions       (0 records)
            ├── transaction_items  (0 records)
            └── _prisma_migrations (1+ records)
```

---

## Testing & Verifikasi

### Sample Database Queries

Klik kanan pada database → **"SQL Editor"** → **"New SQL Script"**, lalu jalankan queries ini:

```sql
-- Lihat demo merchant
SELECT * FROM merchants;

-- Lihat products dengan harga dalam rupiah
SELECT 
    name,
    price / 100 as price_rupiah,
    stock,
    category
FROM products
ORDER BY category, name;

-- Lihat RFID cards dengan balance dalam rupiah
SELECT 
    card_id,
    balance / 100 as balance_rupiah,
    is_active,
    created_at
FROM rfid_cards;

-- Relasi Merchant-Product
SELECT 
    m.store_name,
    COUNT(p.id) as total_products,
    SUM(p.stock) as total_stock
FROM merchants m
LEFT JOIN products p ON m.id = p.merchant_id
GROUP BY m.id, m.store_name;

-- Cek struktur database
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('merchants', 'products', 'rfid_cards')
ORDER BY table_name, ordinal_position;
```

### Opsional: Buat Test Server

Buka file `src\server.js` dan isi dengan:

```javascript
const express = require('express');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'RFID E-Wallet Backend sedang berjalan',
    timestamp: new Date().toISOString(),
    database: 'Connected'
  });
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        merchant: {
          select: {
            storeName: true,
            ownerName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({ 
      success: true, 
      data: products,
      count: products.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get merchant info
app.get('/api/merchant/:id', async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        products: true,
        _count: {
          select: {
            products: true,
            transactions: true
          }
        }
      }
    });
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant tidak ditemukan'
      });
    }
    
    res.json({ success: true, data: merchant });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RFID E-Wallet Backend berjalan di http://localhost:${PORT}`);
  console.log(`📊 Database: Connected ke rfid_ewallet`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
```

### Test Server

```cmd
:: Jalankan server
npm run dev

:: Test endpoints (di Command Prompt baru):
:: Install curl jika belum ada, atau gunakan browser
curl http://localhost:3001/health
curl http://localhost:3001/api/products
curl http://localhost:3001/api/merchant/1
```

---

## Troubleshooting

### Masalah Connection Database Umum

#### Error: "role 'postgres' does not exist"
```cmd
REM Solusi: Gunakan username yang sudah dibuat
REM Update file .env:
DATABASE_URL="postgresql://nama_user_anda:password_anda@localhost:5432/rfid_ewallet"
```

#### Error: "database 'rfid_ewallet' does not exist"
```cmd
REM Buat database baru
createdb -U nama_user_anda -h localhost rfid_ewallet

REM Atau buat ulang jika rusak
dropdb -U nama_user_anda -h localhost rfid_ewallet
createdb -U nama_user_anda -h localhost rfid_ewallet
```

#### Error: "password authentication failed"
```cmd
REM Cek username dan password di .env
REM Atau reset password user:
psql -U postgres
ALTER USER nama_user_anda PASSWORD 'password_baru';
\q
```

### Masalah DBeaver Connection

#### Tables tidak terlihat di DBeaver
1. Klik kanan pada folder **"Tables"** → **Refresh**
2. Atau disconnect dan reconnect ke database
3. Pastikan terhubung ke database `rfid_ewallet`, bukan `postgres`

#### Connection timeout atau ditolak
1. Cek PostgreSQL service berjalan: Services → PostgreSQL
2. Start jika stopped: `net start postgresql-x64-15`
3. Verifikasi port 5432 tersedia: `netstat -an | findstr 5432`

### Masalah Migration

#### Error: "Migration gagal"
```cmd
REM Reset dan coba lagi
npm run db:reset
npm run db:migrate
npm run db:seed
```

#### Error: "Prisma client not generated"
```cmd
REM Generate ulang Prisma client
npx prisma generate
```

### Masalah Seed Data

#### Error: "Unique constraint violation"
```cmd
REM Hapus data existing dan seed ulang
npm run db:reset
npm run db:migrate
npm run db:seed
```

---

## Tools Tambahan

### Prisma Studio (Web GUI)
Alternative ke DBeaver untuk database management:

```cmd
REM Launch Prisma Studio
npm run db:studio

REM Buka di browser: http://localhost:5555
```

### Backup & Restore Database

```cmd
REM Backup database
pg_dump -U nama_user_anda -h localhost rfid_ewallet > backup.sql

REM Restore database
psql -U nama_user_anda -h localhost rfid_ewallet < backup.sql
```

---

## Langkah Selanjutnya

Setelah setup selesai, Anda bisa:

1. **Develop Backend API**: Buat REST endpoints untuk authentication, products, dan RFID payments
2. **Integrasi Frontend**: Connect React/Vue frontend untuk consume API
3. **Integrasi Hardware**: Connect RFID readers via Bluetooth/Serial
4. **Testing**: Tulis integration tests untuk database operations
5. **Production Deployment**: Deploy ke cloud services dengan managed PostgreSQL

---

## Struktur Project

Setelah setup, struktur project Anda:

```
rfid-ewallet-backend/
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   └── migrations/
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── config/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── .env
├── package.json
└── README.md
```

---

## Demo Credentials

Gunakan credentials ini untuk testing aplikasi:

| Type | Value |
|------|-------|
| **Email** | demo@warung.com |
| **Password** | password123 |
| **RFID Cards** | RFID001234, RFID005678, RFID009999 |
| **PINs** | 123456, 654321, 999999 |
| **Balances** | Rp 100,000, Rp 50,000, Rp 200,000 |

---

## Support

Jika mengalami masalah:

1. Cek bagian [Troubleshooting](#troubleshooting)
2. Verifikasi instalasi PostgreSQL: `psql --version`
3. Cek koneksi database: `psql -U nama_user_anda -h localhost -d rfid_ewallet`
4. Pastikan semua environment variables benar
5. Review server logs untuk error messages

---

## License

Project ini menggunakan MIT License - lihat file LICENSE untuk detail.