import React, { useState, useEffect } from 'react';
import ProductGrid from '../components/pos/ProductGrid';
import ShoppingCart from '../components/pos/ShoppingCart';
import RFIDPayment from '../components/pos/RFIDPayment';
import PinVerificationModal from '../components/sensor/PinVerificationModal';
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
  rfidData,
  clearRfidData
}) => {
  const [isPinModalOpen, setPinModalOpen] = useState(false);
  const [isWaitingForCard, setIsWaitingForCard] = useState(false);
  const [capturedCardData, setCapturedCardData] = useState(null);

  useEffect(() => {
    if (isWaitingForCard && rfidData.uid && rfidData.timestamp && cart.length > 0) {
      setCapturedCardData({
        uid: rfidData.uid,
        timestamp: rfidData.timestamp
      });
      
      setIsWaitingForCard(false);
      setPinModalOpen(true);
    }
  }, [rfidData.uid, rfidData.timestamp, isWaitingForCard, cart.length]);

  const handleInitiatePayment = () => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong!');
      return;
    }

    if (!rfidConnected) {
      alert('Hubungkan RFID Reader terlebih dahulu!');
      return;
    }

    // PENTING: Clear RFID data lama sebelum mulai transaksi baru
    clearRfidData();
    
    setIsWaitingForCard(true);
    alert('Silakan tempelkan kartu RFID pada reader...');
  };

  const handleCancelWaiting = () => {
    setIsWaitingForCard(false);
    clearRfidData();
  };

  const handleProcessPayment = async (pinFromInput, verifiedCardData) => {
    const finalPin = rfidData.pin || pinFromInput;
    
    if (!finalPin) {
      alert("PIN harus diisi!");
      return;
    }

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (verifiedCardData && verifiedCardData.balance < totalAmount) {
      alert(`Saldo tidak mencukupi!\nSaldo: ${formatRupiah(verifiedCardData.balance)}\nTotal: ${formatRupiah(totalAmount)}`);
      return;
    }

    try {
      const response = await api.post('/rfid/payment', {
        cardId: capturedCardData.uid,
        pin: finalPin,
        amount: totalAmount,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        }))
      });

      if (response.data.success) {
        alert(`Pembayaran Berhasil!\n\nSaldo Lama: ${formatRupiah(response.data.data.oldBalance)}\nSaldo Baru: ${formatRupiah(response.data.data.newBalance)}`);
        onPaymentComplete();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Transaksi Gagal!');
    } finally {
      // Cleanup - always execute whether success or error
      setPinModalOpen(false);
      setCapturedCardData(null);
      clearRfidData();
    }
  };

  const handleCloseModal = () => {
    setPinModalOpen(false);
    setCapturedCardData(null);
    clearRfidData();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <ProductGrid
          products={products}
          addToCart={addToCart}
          formatRupiah={formatRupiah}
          loading={loading}
        />
      </div>

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
          onPaymentComplete={handleInitiatePayment}
          isWaitingForCard={isWaitingForCard}
          onCancelWaiting={handleCancelWaiting}
        />
      </div>

      {isPinModalOpen && capturedCardData && (
        <PinVerificationModal
          key={capturedCardData.timestamp}
          cardId={capturedCardData.uid}
          pinFromKeypad={rfidData.pin}
          totalAmount={cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
          onClose={handleCloseModal}
          onSubmit={handleProcessPayment}
          formatRupiah={formatRupiah}
        />
      )}
    </div>
  );
};

export default POSPage;