import React, { useState, useEffect } from 'react';
import { Check, X, Printer, Share, CreditCard } from 'lucide-react';

const PaymentSuccessPopup = ({ 
  isOpen, 
  onClose, 
  paymentData,
  formatRupiah 
}) => {
  const [countdown, setCountdown] = useState(6);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
      setCountdown(6);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, onClose]);

  const handleClose = () => {
    setShowAnimation(false);
    setTimeout(() => onClose(), 200);
  };

  const handlePrint = () => {
    // Simulate print functionality
    alert('Fitur cetak receipt akan segera tersedia!');
  };

  const handleShare = () => {
    // Simulate share functionality
    if (navigator.share) {
      navigator.share({
        title: 'Payment Receipt',
        text: `Pembayaran berhasil sebesar ${formatRupiah(paymentData?.amount)}`,
        url: window.location.href
      });
    } else {
      alert('Fitur share akan segera tersedia!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300 ${
      showAnimation ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`bg-white rounded-3xl shadow-2xl border border-emerald-200 w-full max-w-md transform transition-all duration-500 ${
        showAnimation ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-t-3xl">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          
          {/* Success Animation */}
          <div className="text-center mb-4">
            <div className={`mx-auto mb-4 w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center transform transition-all duration-700 ${
              showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-45'
            }`}>
              <Check size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-800">Pembayaran Berhasil!</h2>
            <p className="text-emerald-600 text-sm mt-1">Transaksi telah diproses</p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="p-6">
          <div className="bg-slate-50 rounded-2xl p-5 mb-6 space-y-4">
            {/* Amount */}
            <div className="text-center border-b border-slate-200 pb-4">
              <p className="text-slate-600 text-sm mb-1">Total Pembayaran</p>
              <p className="text-3xl font-bold text-slate-800">{formatRupiah(paymentData?.amount)}</p>
            </div>

            {/* Transaction Details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Card ID:</span>
                <span className="font-mono font-semibold text-slate-800 bg-slate-200 px-2 py-1 rounded">
                  {paymentData?.cardId}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">PIN:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {paymentData?.pin}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Waktu:</span>
                <span className="font-semibold text-slate-800">
                  {paymentData?.timestamp}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Metode:</span>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <CreditCard size={14} />
                  RFID Card
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-200 text-slate-700 rounded-2xl hover:bg-slate-300 font-semibold transition-colors"
            >
              <Printer size={18} />
              Cetak
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 font-semibold transition-colors"
            >
              <Share size={18} />
              Bagikan
            </button>
          </div>

          {/* Auto Close Indicator */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-600">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
              Menutup otomatis dalam {countdown} detik
            </div>
          </div>
        </div>

        {/* Bottom Decoration */}
        <div className="h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 rounded-b-3xl"></div>
      </div>
    </div>
  );
};

export default PaymentSuccessPopup;