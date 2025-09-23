import React, { useState, useRef, useEffect } from 'react';
import { Shield, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';

const OwnerPinProtection = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title = "Akses Owner", 
  description = "Masukkan PIN Owner untuk melanjutkan" 
}) => {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState(0);
  const inputRefs = useRef([]);

  const OWNER_PIN = '999999'; // PIN khusus owner - bisa dari env/config
  const MAX_ATTEMPTS = 3;
  const BLOCK_DURATION = 300; // 5 menit dalam detik

  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (isBlocked && blockTime > 0) {
      timer = setInterval(() => {
        setBlockTime(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            setAttempts(0);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBlocked, blockTime]);

  const handlePinChange = (index, value) => {
    if (isBlocked) return;
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
    if (isBlocked) return;
    
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && pin.every(digit => digit)) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isBlocked) return;
    
    const pinValue = pin.join('');
    if (pinValue.length !== 6) {
      setError('PIN harus 6 digit');
      return;
    }

    if (pinValue === OWNER_PIN) {
      // Success
      onSuccess();
      handleClose();
    } else {
      // Failed attempt
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsBlocked(true);
        setBlockTime(BLOCK_DURATION);
        setError(`Terlalu banyak percobaan salah. Diblokir untuk ${Math.floor(BLOCK_DURATION / 60)} menit.`);
      } else {
        setError(`PIN Owner salah. Sisa percobaan: ${MAX_ATTEMPTS - newAttempts}`);
      }
      
      setPin(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleClose = () => {
    setPin(['', '', '', '', '', '']);
    setError('');
    setShowPin(false);
    onClose();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-red-100 to-red-200 p-3 rounded-xl">
                <Shield className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
                <p className="text-sm text-slate-600">{description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Security Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
              <div className="text-amber-800 text-sm">
                <p className="font-semibold">Area Terbatas</p>
                <p>Hanya pemilik toko yang diizinkan mengakses halaman ini</p>
              </div>
            </div>
          </div>

          {/* PIN Input */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <label className="font-semibold text-slate-800">PIN Owner (6 digit)</label>
              <button
                onClick={() => setShowPin(!showPin)}
                disabled={isBlocked}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm disabled:opacity-50"
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
                  disabled={isBlocked}
                  className={`w-full h-14 text-center text-xl font-bold border rounded-xl transition-all duration-200 ${
                    isBlocked 
                      ? 'bg-red-50 border-red-200 cursor-not-allowed' 
                      : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  }`}
                  maxLength={1}
                />
              ))}
            </div>

            {error && (
              <div className={`mt-4 p-3 rounded-lg ${
                isBlocked 
                  ? 'bg-red-100 border border-red-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
                {isBlocked && (
                  <div className="mt-2 text-red-700 text-sm">
                    <p>Waktu tersisa: <span className="font-bold">{formatTime(blockTime)}</span></p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Demo PIN Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Lock size={16} className="text-blue-600" />
              <div className="text-blue-800 text-sm">
                <p className="font-semibold">Demo PIN Owner: 999999</p>
                <p>Maksimal {MAX_ATTEMPTS} percobaan salah</p>
              </div>
            </div>
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
              onClick={handleSubmit}
              disabled={pin.some(digit => !digit) || isBlocked}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-2xl hover:from-red-600 hover:to-red-700 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBlocked ? `Diblokir (${formatTime(blockTime)})` : 'Masuk'}
            </button>
          </div>

          {/* Attempts indicator */}
          {attempts > 0 && !isBlocked && (
            <div className="mt-4 flex justify-center">
              <div className="flex gap-1">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index < attempts ? 'bg-red-500' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerPinProtection;