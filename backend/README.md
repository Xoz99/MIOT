# RFID E-Wallet Backend

Backend API untuk sistem pembayaran RFID E-Wallet dengan integrasi blockchain.

## Features

- 🔐 JWT Authentication
- 💳 RFID Payment Processing  
- 📦 Product Management
- 📊 Transaction History
- 🔌 Real-time WebSocket
- ⛓️ Blockchain Integration Ready
- ��️ Security Middleware
- 📱 RESTful API

## Quick Start

1. **Setup Database**
   ```bash
   createdb rfid_ewallet
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env dengan database credentials Anda
   ```

4. **Run Migrations**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register merchant
- `POST /api/auth/login` - Login merchant  
- `GET /api/auth/profile` - Get profile

### Products
- `GET /api/products` - Get products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### RFID Payment  
- `POST /api/rfid/verify` - Verify RFID card
- `POST /api/rfid/payment` - Process payment

### Transactions
- `GET /api/transactions` - Get transaction history

### Merchant
- `GET /api/merchant/dashboard` - Get dashboard stats

## Demo Credentials

- **Email**: demo@warung.com
- **Password**: password123  
- **RFID PIN**: 123456
- **Owner PIN**: 999999

## Tech Stack

- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT Authentication
- Socket.IO WebSocket
- bcryptjs Password Hashing
- Web3/Ethers Blockchain
