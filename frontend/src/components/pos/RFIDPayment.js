import React, { useState } from 'react';
import { CreditCard, Search, Check, X, Wifi, WifiOff } from 'lucide-react';
import PinInput from './PinInput';
import PaymentSuccessPopup from './PaymentSuccessPopup';

const RFIDPayment = ({ 
  cart, 
  formatRupiah, 
  rfidConnected, 
  onPaymentComplete 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [showPinInput, setShowPinInput] = useState(false);
  const [detectedCard, setDetectedCard] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);


  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const initiateRFIDPayment = async () => {
    if (!rfidConnected) {
      alert('Hubungkan RFID Reader terlebih dahulu!');
      return;
    }

    if (cart.length === 0) {
      alert('Keranjang masih kosong!');
      return;
    }

    setIsProcessing(true);
    
    // Simulate RFID card detection
    setTimeout(() => {
      const cardId = 'RF' + Math.random().toString().slice(2, 8);
      setDetectedCard(cardId);
      setIsProcessing(false);
      setShowPinInput(true);
    }, 2000);
  };

  const processPaymentWithPin = async (pin) => {
    setShowPinInput(false);
    setIsProcessing(true);

    // Simulate payment processing with PIN verification
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate after PIN
      
      if (success) {
        const result = {
          success: true,
          amount: getTotalAmount(),
          cardId: detectedCard,
          timestamp: new Date().toLocaleTimeString(),
          pin: pin.replace(/./g, '*') // Mask PIN for display
        };
        setPaymentResult(result);
        setShowSuccessPopup(true);
        onPaymentComplete(result);
      } else {
        setPaymentResult({
          success: false,
          error: 'Pembayaran ditolak oleh sistem'
        });
      }
      
      setIsProcessing(false);
      setDetectedCard(null);
      
      // Clear result after 6 seconds
      setTimeout(() => {
        setPaymentResult(null);
      }, 6000);
    }, 2000);
  };

  const handlePinCancel = () => {
    setShowPinInput(false);
    setDetectedCard(null);
    setIsProcessing(false);
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-slate-200/50">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <CreditCard className="text-slate-600" size={22} />
          Pembayaran RFID
        </h2>

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
        
        {!isProcessing && !paymentResult && (
          <button
            onClick={initiateRFIDPayment}
            disabled={cart.length === 0 || !rfidConnected}
            className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${
              cart.length === 0 || !rfidConnected
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
              <p className="text-blue-800 font-semibold">Kartu terdeteksi!</p>
              <p className="text-blue-600 text-sm mt-1">Silakan masukkan PIN untuk melanjutkan</p>
            </div>
          </div>
        )}


        {/* Payment Info */}
        {cart.length > 0 && (
          <div className="mt-6 p-4 bg-slate-50 rounded-2xl">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Total yang akan dibayar:</span>
              <span className="font-bold text-xl text-slate-800">{formatRupiah(getTotalAmount())}</span>
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