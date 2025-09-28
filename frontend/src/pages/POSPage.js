import React, { useState, useEffect } from 'react';

// Asumsi komponen-komponen ini sudah ada
import ProductGrid from '../components/pos/ProductGrid';
import ShoppingCart from '../components/pos/ShoppingCart';
import RFIDPayment from '../components/pos/RFIDPayment';

// Impor Modal PIN Anda, pastikan path/nama file ini benar
import PinVerificationModal from '../components/sensor/PinVerificationModal'; 

// Asumsi Anda punya fungsi helper ini
import { formatRupiah } from '../utils/formatters';

const POSPage = ({ 
  products, 
  cart, 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  rfidConnected, 
  onPaymentComplete,
  api,
  loading,
  // ▼ Props baru yang diterima dari Dashboard.js ▼
  rfidData,
  clearRfidData
}) => {
  // State untuk mengontrol kapan modal verifikasi PIN muncul
  const [isPinModalOpen, setPinModalOpen] = useState(false);

  // useEffect ini akan "mengawasi" perubahan pada UID dari Arduino
  useEffect(() => {
    // Jika ada UID baru terdeteksi DAN keranjang belanja tidak kosong, buka modal PIN
    if (rfidData.uid && cart.length > 0) {
      setPinModalOpen(true);
    }
  }, [rfidData.uid, cart.length]);

  // Fungsi ini akan dipanggil dari dalam modal saat PIN di-submit
  const handleProcessPayment = async (pinFromInput) => {
    // Prioritaskan PIN dari keypad hardware jika ada, jika tidak, gunakan dari input manual di modal
    const finalPin = rfidData.pin || pinFromInput;

    if (!finalPin) {
      alert("PIN harus diisi!");
      return;
    }

    try {
      console.log(`Mengirim transaksi: Kartu=${rfidData.uid}, PIN=${finalPin}`);
      
      const response = await api.post('/rfid/payment', {
        cardId: rfidData.uid,
        pin: finalPin,
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity }))
      });

      if (response.data.success) {
        alert('Pembayaran Berhasil!');
        onPaymentComplete(); // Panggil fungsi dari Dashboard untuk clear cart & refresh
      }
    } catch (error) {
      // Tampilkan error dari backend
      alert(error.response?.data?.message || 'Transaksi Gagal!');
    } finally {
      setPinModalOpen(false); // Selalu tutup modal setelah submit
      clearRfidData();      // Reset data RFID di Dashboard untuk transaksi berikutnya
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Kolom Kiri: Daftar Produk */}
      <div className="lg:col-span-2">
        <ProductGrid 
          products={products}
          addToCart={addToCart}
          formatRupiah={formatRupiah}
          loading={loading}
        />
      </div>

      {/* Kolom Kanan: Keranjang & Pembayaran */}
      <div className="space-y-8">
        <ShoppingCart
          cart={cart}
          removeFromCart={removeFromCart}
          updateQuantity={updateQuantity}
          formatRupiah={formatRupiah}
        />
        
        <RFIDPayment
          cart={cart}
          formatRupiah={formatRupiah}
          rfidConnected={rfidConnected}
          // Logika pembayaran utama sekarang ditangani oleh modal
        />
      </div>

      {/* Modal PIN yang Muncul di Atas Segalanya */}
      {isPinModalOpen && (
        <PinVerificationModal 
          cardId={rfidData.uid}
          pinFromKeypad={rfidData.pin}
          totalAmount={cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
          onClose={() => {
            setPinModalOpen(false);
            clearRfidData(); // Batalkan transaksi jika modal ditutup
          }}
          onSubmit={handleProcessPayment}
          formatRupiah={formatRupiah}
        />
      )}
    </div>
  );
};

export default POSPage;