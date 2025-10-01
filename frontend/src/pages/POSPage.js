import React, { useState, useEffect, useRef } from 'react';
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
  
  // Ref untuk tracking data RFID sebelumnya
  const previousRfidData = useRef({ uid: null, pin: null, timestamp: null });

  // useEffect untuk deteksi kartu RFID - DIPERBAIKI DENGAN DETEKSI PERUBAHAN
  useEffect(() => {
    console.log("📡 RFID State Check:", {
      isWaitingForCard,
      hasUID: !!rfidData.uid,
      uid: rfidData.uid,
      pin: rfidData.pin,
      timestamp: rfidData.timestamp,
      cartLength: cart.length,
      previousUID: previousRfidData.current.uid,
      previousTimestamp: previousRfidData.current.timestamp
    });

    // Deteksi apakah ini data RFID yang BARU (berbeda dari sebelumnya)
    const isNewData = 
      rfidData.uid && 
      rfidData.timestamp &&
      (rfidData.uid !== previousRfidData.current.uid || 
       rfidData.timestamp !== previousRfidData.current.timestamp);

    // Kondisi untuk membuka modal:
    // 1. Sedang menunggu kartu
    // 2. Ada data RFID baru
    // 3. Keranjang tidak kosong
    if (isWaitingForCard && isNewData && cart.length > 0) {
      console.log("✅ Card detected! Opening PIN modal...");
      console.log("📌 Captured PIN from keypad:", rfidData.pin);
      
      // Update reference data
      previousRfidData.current = {
        uid: rfidData.uid,
        pin: rfidData.pin,
        timestamp: rfidData.timestamp
      };
      
      // Simpan data kartu yang terdeteksi
      setCapturedCardData({
        uid: rfidData.uid,
        pin: rfidData.pin || '', // Pastikan PIN tersimpan
        timestamp: rfidData.timestamp
      });
      
      setIsWaitingForCard(false);
      setPinModalOpen(true);
    }
  }, [rfidData.uid, rfidData.pin, rfidData.timestamp, isWaitingForCard, cart.length]);

  // Function dipanggil saat user KLIK tombol "Bayar dengan RFID"
  const handleInitiatePayment = () => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong!');
      return;
    }

    if (!rfidConnected) {
      alert('Hubungkan RFID Reader terlebih dahulu!');
      return;
    }

    console.log("🔵 Initiating payment, waiting for card...");
    
    // PENTING: Clear data RFID lama dulu
    clearRfidData();
    
    // Reset reference
    previousRfidData.current = { uid: null, pin: null, timestamp: null };
    
    // Kemudian set waiting
    setIsWaitingForCard(true);
    alert('Silakan tempelkan kartu RFID pada reader dan masukkan PIN...');
  };

  // Function untuk cancel waiting
  const handleCancelWaiting = () => {
    console.log("❌ Payment cancelled by user");
    setIsWaitingForCard(false);
    clearRfidData();
    previousRfidData.current = { uid: null, pin: null, timestamp: null };
  };

  // Function dipanggil dari modal saat PIN di-submit
  const handleProcessPayment = async (pinFromInput, verifiedCardData) => {
    // Prioritas: PIN dari keypad, jika tidak ada gunakan input manual
    const finalPin = capturedCardData?.pin || pinFromInput;
    
    console.log("🔐 PIN Processing:", {
      pinFromKeypad: capturedCardData?.pin,
      pinFromInput: pinFromInput,
      finalPin: finalPin
    });
    
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
      console.log('💳 Processing payment:', {
        cardId: capturedCardData.uid,
        pin: finalPin,
        amount: totalAmount,
        items: cart.length
      });

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
        console.log("✅ Payment successful!");
        alert(`Pembayaran Berhasil!\n\nSaldo Lama: ${formatRupiah(response.data.data.oldBalance)}\nSaldo Baru: ${formatRupiah(response.data.data.newBalance)}`);
        onPaymentComplete();
      }
    } catch (error) {
      console.error('❌ Payment error:', error.response?.data);
      alert(error.response?.data?.message || 'Transaksi Gagal!');
    } finally {
      setPinModalOpen(false);
      setCapturedCardData(null);
      clearRfidData();
      previousRfidData.current = { uid: null, pin: null, timestamp: null };
    }
  };

  const handleCloseModal = () => {
    console.log("🚪 Closing PIN modal");
    setPinModalOpen(false);
    setCapturedCardData(null);
    clearRfidData();
    previousRfidData.current = { uid: null, pin: null, timestamp: null };
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
          onPaymentComplete={handleInitiatePayment}
          isWaitingForCard={isWaitingForCard}
          onCancelWaiting={handleCancelWaiting}
        />
      </div>

      {/* Modal PIN - GUNAKAN KEY UNTUK FORCE RE-RENDER */}
      {isPinModalOpen && capturedCardData && (
        <PinVerificationModal
          key={`${capturedCardData.uid}-${capturedCardData.timestamp}`} // PENTING: Unique key
          cardId={capturedCardData.uid}
          pinFromKeypad={capturedCardData.pin} // Pass PIN dari keypad
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

// import React, { useState, useEffect } from 'react';
// import ProductGrid from '../components/pos/ProductGrid';
// import ShoppingCart from '../components/pos/ShoppingCart';
// import RFIDPayment from '../components/pos/RFIDPayment';
// import PinVerificationModal from '../components/sensor/PinVerificationModal';
// import { formatRupiah } from '../utils/formatters';

// const POSPage = ({
//   products,
//   cart,
//   addToCart,
//   removeFromCart,
//   updateQuantity,
//   rfidConnected,
//   onPaymentComplete,
//   api,
//   loading,
//   rfidData,
//   clearRfidData
// }) => {
//   const [isPinModalOpen, setPinModalOpen] = useState(false);
//   const [isWaitingForCard, setIsWaitingForCard] = useState(false);
//   const [capturedCardData, setCapturedCardData] = useState(null);

//   // useEffect untuk deteksi kartu RFID - DIPERBAIKI
//   useEffect(() => {
//     console.log("📡 RFID State Check:", {
//       isWaitingForCard,
//       hasUID: !!rfidData.uid,
//       uid: rfidData.uid,
//       timestamp: rfidData.timestamp,
//       cartLength: cart.length
//     });

//     // Kondisi untuk membuka modal:
//     // 1. Sedang menunggu kartu
//     // 2. Ada UID baru dengan timestamp
//     // 3. Keranjang tidak kosong
//     if (isWaitingForCard && rfidData.uid && rfidData.timestamp && cart.length > 0) {
//       console.log("✅ Card detected! Opening PIN modal...");
      
//       // Simpan data kartu yang terdeteksi
//       setCapturedCardData({
//         uid: rfidData.uid,
//         pin: rfidData.pin,
//         timestamp: rfidData.timestamp
//       });
      
//       setIsWaitingForCard(false);
//       setPinModalOpen(true);
//     }
//   }, [rfidData.uid, rfidData.timestamp, isWaitingForCard, cart.length, rfidData.pin]);

//   // Function dipanggil saat user KLIK tombol "Bayar dengan RFID"
//   const handleInitiatePayment = () => {
//     if (cart.length === 0) {
//       alert('Keranjang masih kosong!');
//       return;
//     }

//     if (!rfidConnected) {
//       alert('Hubungkan RFID Reader terlebih dahulu!');
//       return;
//     }

//     console.log("🔵 Initiating payment, waiting for card...");
    
//     // PENTING: Clear data RFID lama dulu
//     clearRfidData();
    
//     // Kemudian set waiting
//     setIsWaitingForCard(true);
//     alert('Silakan tempelkan kartu RFID pada reader...');
//   };

//   // Function untuk cancel waiting
//   const handleCancelWaiting = () => {
//     console.log("❌ Payment cancelled by user");
//     setIsWaitingForCard(false);
//     clearRfidData();
//   };

//   // Function dipanggil dari modal saat PIN di-submit
//   const handleProcessPayment = async (pinFromInput, verifiedCardData) => {
//     const finalPin = capturedCardData?.pin || pinFromInput;
    
//     if (!finalPin) {
//       alert("PIN harus diisi!");
//       return;
//     }

//     const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

//     if (verifiedCardData && verifiedCardData.balance < totalAmount) {
//       alert(`Saldo tidak mencukupi!\nSaldo: ${formatRupiah(verifiedCardData.balance)}\nTotal: ${formatRupiah(totalAmount)}`);
//       return;
//     }

//     try {
//       console.log('💳 Processing payment:', {
//         cardId: capturedCardData.uid,
//         amount: totalAmount,
//         items: cart.length
//       });

//       const response = await api.post('/rfid/payment', {
//         cardId: capturedCardData.uid,
//         pin: finalPin,
//         amount: totalAmount,
//         items: cart.map(item => ({
//           productId: item.id,
//           quantity: item.quantity,
//           price: item.price,
//           name: item.name
//         }))
//       });

//       if (response.data.success) {
//         console.log("✅ Payment successful!");
//         alert(`Pembayaran Berhasil!\n\nSaldo Lama: ${formatRupiah(response.data.data.oldBalance)}\nSaldo Baru: ${formatRupiah(response.data.data.newBalance)}`);
//         onPaymentComplete();
//       }
//     } catch (error) {
//       console.error('❌ Payment error:', error.response?.data);
//       alert(error.response?.data?.message || 'Transaksi Gagal!');
//     } finally {
//       setPinModalOpen(false);
//       setCapturedCardData(null);
//       clearRfidData();
//     }
//   };

//   const handleCloseModal = () => {
//     console.log("🚪 Closing PIN modal");
//     setPinModalOpen(false);
//     setCapturedCardData(null);
//     clearRfidData();
//   };

//   return (
//     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//       {/* Kolom Kiri: Daftar Produk */}
//       <div className="lg:col-span-2">
//         <ProductGrid
//           products={products}
//           addToCart={addToCart}
//           formatRupiah={formatRupiah}
//           loading={loading}
//         />
//       </div>

//       {/* Kolom Kanan: Keranjang & Pembayaran */}
//       <div className="space-y-8">
//         <ShoppingCart
//           cart={cart}
//           removeFromCart={removeFromCart}
//           updateQuantity={updateQuantity}
//           formatRupiah={formatRupiah}
//         />
        
//         <RFIDPayment
//           cart={cart}
//           formatRupiah={formatRupiah}
//           rfidConnected={rfidConnected}
//           onPaymentComplete={handleInitiatePayment}
//           isWaitingForCard={isWaitingForCard}
//           onCancelWaiting={handleCancelWaiting}
//         />
//       </div>

//       {/* Modal PIN - GUNAKAN KEY UNTUK FORCE RE-RENDER */}
//       {isPinModalOpen && capturedCardData && (
//         <PinVerificationModal
//           key={capturedCardData.timestamp} // PENTING: Force new instance
//           cardId={capturedCardData.uid}
//           pinFromKeypad={capturedCardData.pin}
//           totalAmount={cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
//           onClose={handleCloseModal}
//           onSubmit={handleProcessPayment}
//           formatRupiah={formatRupiah}
//         />
//       )}
//     </div>
//   );
// };

// export default POSPage;