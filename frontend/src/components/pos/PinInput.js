import React, { useState, useRef, useEffect } from 'react';
import { Lock, Eye, EyeOff, X } from 'lucide-react';

const PinInput = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  cardId, 
  amount, 
  formatRupiah,
  isProcessing 
}) => {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isOpen]);

  const handlePinChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && pin.every(digit => digit)) {
      handleConfirm();
    }
  };

  const handleConfirm = () => {
    const pinValue = pin.join('');
    if (pinValue.length !== 6) {
      setError('PIN harus 6 digit');
      return;
    }

    if (pinValue === '123456' || pinValue === '000000') {
      onConfirm(pinValue);
    } else {
      setError('PIN salah, coba lagi');
      setPin(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleClose = () => {
    setPin(['', '', '', '', '', '']);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-xl">
                <Lock className="text-slate-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Verifikasi PIN</h3>
                <p className="text-sm text-slate-600">Masukkan PIN kartu RFID</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Transaction Info */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600 font-medium">Card ID:</span>
              <span className="font-mono font-semibold text-slate-800">{cardId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Total:</span>
              <span className="font-bold text-emerald-600 text-xl">{formatRupiah(amount)}</span>
            </div>
          </div>

          {/* PIN Input */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <label className="font-semibold text-slate-800">PIN (6 digit)</label>
              <button
                onClick={() => setShowPin(!showPin)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm"
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPin ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            
            <div className="grid grid-cols-6 gap-3">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type={showPin ? 'text' : 'password'}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-full h-14 text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200"
                  maxLength={1}
                />
              ))}
            </div>

            {error && (
              <p className="text-red-600 text-sm mt-3 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
          </div>

          {/* Demo PIN Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <p className="text-blue-800 text-sm">
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-2xl hover:bg-slate-300 font-semibold transition-all duration-200"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={pin.some(digit => !digit) || isProcessing}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Memproses...' : 'Konfirmasi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinInput;