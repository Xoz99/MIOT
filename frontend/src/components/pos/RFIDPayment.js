import React from 'react';
import { CreditCard, Wifi, WifiOff, Loader, X } from 'lucide-react';

const RFIDPayment = ({ 
  cart, 
  formatRupiah, 
  rfidConnected, 
  onPaymentComplete,
  isWaitingForCard,
  onCancelWaiting
}) => {
  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
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
        {rfidConnected ? (
          <Wifi size={18} className="text-emerald-600" />
        ) : (
          <WifiOff size={18} className="text-slate-500" />
        )}
        <span className={`font-medium ${rfidConnected ? 'text-emerald-800' : 'text-slate-600'}`}>
          {rfidConnected ? 'Reader siap menerima kartu' : 'Reader tidak terhubung'}
        </span>
      </div>

      {/* Waiting for Card State */}
      {isWaitingForCard && (
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader className="animate-spin text-blue-600" size={20} />
              <div>
                <p className="font-semibold text-blue-800">Menunggu kartu RFID...</p>
                <p className="text-sm text-blue-600">Tempelkan kartu pada reader</p>
              </div>
            </div>
            <button
              onClick={onCancelWaiting}
              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition-colors"
              title="Batalkan"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
      
      {/* Payment Button */}
      {!isWaitingForCard && (
        <button
          onClick={onPaymentComplete}
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

      {/* Payment Info */}
      {cart.length > 0 && (
        <div className="mt-6 p-4 bg-slate-50 rounded-2xl">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Total yang akan dibayar:</span>
            <span className="font-bold text-xl text-slate-800">
              {formatRupiah(getTotalAmount())}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFIDPayment;