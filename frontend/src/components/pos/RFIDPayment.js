// buat succes payments
import React, { useState } from 'react';
import { CreditCard, Search, Check, X, Wifi, WifiOff } from 'lucide-react';
import PinInput from './PinInput';
import PaymentSuccessPopup from './PaymentSuccessPopup';

const RFIDPayment = ({ 
  cart, 
  formatRupiah, 
  rfidConnected, 
  onPaymentComplete,
  api 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [showPinInput, setShowPinInput] = useState(false);
  const [detectedCard, setDetectedCard] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [error, setError] = useState('');

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const initiateRFIDPayment = async () => {
    if (!rfidConnected) {
      setError('Hubungkan RFID Reader terlebih dahulu!');
      return;
    }

    if (cart.length === 0) {
      setError('Keranjang masih kosong!');
      return;
    }

    if (!api) {
      setError('Koneksi API tidak tersedia!');
      return;
    }

    setError('');
    setIsProcessing(true);
    setTimeout(() => {
      const demoCards = ['RF001234', 'RF005678', 'RF009012'];
      const cardId = demoCards[Math.floor(Math.random() * demoCards.length)];
      
      setDetectedCard(cardId);
      setIsProcessing(false);
      setShowPinInput(true);
    }, 2000);
  };

  const processPaymentWithPin = async (pin) => {
    setShowPinInput(false);
    setIsProcessing(true);
    setError('');

    try {
      console.log('🔄 Processing payment with API...');

      // First verify the card and PIN
      const verifyResponse = await api.post('/rfid/verify', {
        cardId: detectedCard,
        pin: pin
      });

      if (!verifyResponse.data.success) {
        throw new Error(verifyResponse.data.message || 'Gagal memverifikasi kartu');
      }

      console.log('✅ Card verified, processing payment...');

      // Prepare items for backend
      const items = cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      // Process payment
      const paymentResponse = await api.post('/rfid/payment', {
        cardId: detectedCard,
        pin: pin,
        amount: getTotalAmount(),
        items: items
      });

      if (paymentResponse.data.success) {
        const result = {
          success: true,
          amount: getTotalAmount(),
          cardId: detectedCard,
          timestamp: new Date().toLocaleTimeString(),
          transactionId: paymentResponse.data.data.id,
          remainingBalance: verifyResponse.data.data.balance - getTotalAmount()
        };

        console.log('✅ Payment successful:', result);

        setPaymentResult(result);
        setShowSuccessPopup(true);
        
        // Notify parent component to update UI (clear cart, refresh products, etc.)
        onPaymentComplete(result);
      } else {
        throw new Error(paymentResponse.data.message || 'Pembayaran ditolak');
      }
      
    } catch (error) {
      console.error('❌ Payment error:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Gagal memproses pembayaran';
      
      setPaymentResult({
        success: false,
        error: errorMessage
      });
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setDetectedCard(null);
      
      // Clear result after 6 seconds
      setTimeout(() => {
        setPaymentResult(null);
        setError('');
      }, 6000);
    }
  };

  const handlePinCancel = () => {
    setShowPinInput(false);
    setDetectedCard(null);
    setIsProcessing(false);
    setError('');
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-slate-200/50">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <CreditCard className="text-slate-600" size={22} />
          Pembayaran RFID
        </h2>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* RFID Status Indicator */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-6 ${
          rfidConnected 
            ? 'bg-emerald-50 border border-emerald-200' 
            : 'bg-slate-100 border border-slate-300'
        }`}>
          {rfidConnected ? <Wifi size={18} className="text-emerald-600" /> : <WifiOff size={18} className="text-slate-500" />}
          <span className={`font-medium ${rfidConnected ? 'text-emerald-800' : 'text-slate-600'}`}>
            {rfidConnected ? 'Reader siap menerima kartu' : 'Reader tidak terhubung'}
          </span>
        </div>

        {/* Demo Card Info */}
        {rfidConnected && !isProcessing && !paymentResult && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-800 font-medium text-sm">Demo Cards:</p>
            <p className="text-blue-600 text-xs mt-1">
              RF001234, RF005678, RF009012 (PIN: 123456)
            </p>
          </div>
        )}
        
        {!isProcessing && !paymentResult && (
          <button
            onClick={initiateRFIDPayment}
            disabled={cart.length === 0 || !rfidConnected || !api}
            className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${
              cart.length === 0 || !rfidConnected || !api
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            <CreditCard size={24} />
            Bayar dengan RFID
          </button>
        )}

        {isProcessing && !showPinInput && (
          <div className="text-center py-10">
            <div className="relative">
              <Search size={64} className="text-slate-400 mx-auto mb-6 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
              </div>
            </div>
            <p className="text-slate-700 font-semibold text-lg">Mendeteksi kartu RFID...</p>
            <p className="text-slate-500 mt-2">Tempelkan kartu pada reader</p>
          </div>
        )}

        {isProcessing && showPinInput && (
          <div className="text-center py-8">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-blue-800 font-semibold">Kartu terdeteksi: {detectedCard}</p>
              <p className="text-blue-600 text-sm mt-1">Silakan masukkan PIN untuk melanjutkan</p>
            </div>
          </div>
        )}

        {isProcessing && !showPinInput && detectedCard && (
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-3 text-emerald-600 mb-4">
              <div className="w-6 h-6 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin"></div>
              <span className="font-medium">Memproses pembayaran...</span>
            </div>
            <p className="text-slate-600 text-sm">Mohon tunggu sebentar</p>
          </div>
        )}

        {/* Payment Result */}
        {paymentResult && !showSuccessPopup && (
          <div className={`text-center py-8 ${paymentResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
            <div className="mb-4">
              {paymentResult.success ? (
                <Check size={64} className="mx-auto text-emerald-500" />
              ) : (
                <X size={64} className="mx-auto text-red-500" />
              )}
            </div>
            <p className="font-bold text-lg">
              {paymentResult.success ? 'Pembayaran Berhasil!' : 'Pembayaran Gagal'}
            </p>
            {paymentResult.success && (
              <div className="mt-2 text-slate-600">
                <p className="text-sm">Kartu: {paymentResult.cardId}</p>
                <p className="font-semibold">{formatRupiah(paymentResult.amount)}</p>
              </div>
            )}
            {!paymentResult.success && (
              <p className="text-red-600 text-sm mt-2">{paymentResult.error}</p>
            )}
          </div>
        )}

        {/* Payment Info */}
        {cart.length > 0 && !paymentResult && (
          <div className="mt-6 p-4 bg-slate-50 rounded-2xl">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Total yang akan dibayar:</span>
              <span className="font-bold text-xl text-slate-800">{formatRupiah(getTotalAmount())}</span>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {cart.length} item • {cart.reduce((sum, item) => sum + item.quantity, 0)} produk
            </div>
          </div>
        )}
      </div>

      {/* PIN Input Modal */}
      <PinInput
        isOpen={showPinInput}
        onClose={handlePinCancel}
        onConfirm={processPaymentWithPin}
        cardId={detectedCard}
        amount={getTotalAmount()}
        formatRupiah={formatRupiah}
        isProcessing={isProcessing}
      />

      {/* Payment Success Popup */}
      <PaymentSuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => {
          setShowSuccessPopup(false);
          setPaymentResult(null);
        }}
        paymentData={paymentResult}
        formatRupiah={formatRupiah}
      />
    </>
  );
};

export default RFIDPayment;