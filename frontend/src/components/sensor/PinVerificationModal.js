import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, EyeOff, Loader, AlertCircle, CheckCircle } from 'lucide-react';

const PinVerificationModal = ({ 
  cardId, 
  pinFromKeypad,
  totalAmount,
  onClose, 
  onSubmit,
  formatRupiah,
  loading = false
}) => {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardBalance, setCardBalance] = useState(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [cardInfo, setCardInfo] = useState(null);
  const [balanceChecked, setBalanceChecked] = useState(false);

  const API_BASE_URL = 'http://192.168.1.44:3001/api';

  useEffect(() => {
    if (pinFromKeypad && pinFromKeypad.length >= 1) {
      const cleanPin = pinFromKeypad.slice(0, 6);
      const pinArray = cleanPin.split('').concat(Array(6 - cleanPin.length).fill(''));
      setPin(pinArray);
      
      if (cleanPin.length === 6) {
        setTimeout(() => {
          handleSubmit(cleanPin);
        }, 300);
      }
    }
  }, [pinFromKeypad]);

  const verifyPinAndGetBalance = async (pinValue) => {
    if (!cardId) {
      throw new Error('Card ID tidak tersedia');
    }

    try {
      setIsVerifyingPin(true);

      const response = await fetch(`${API_BASE_URL}/cards/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId: cardId,
          pin: pinValue
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'PIN tidak valid');
      }

      setCardInfo(data.data);
      setCardBalance(data.data.balance);
      setBalanceChecked(true);

      return data.data;

    } catch (error) {
      setCardBalance(null);
      setCardInfo(null);
      setBalanceChecked(false);
      throw error;
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleManualPinChange = (e, index) => {
    const { value } = e.target;
    
    if (/^[0-9]$/.test(value) || value === '') {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      setError(null);

      if (value && index < 5) {
        const nextInput = e.target.nextElementSibling;
        if (nextInput) {
          nextInput.focus();
        }
      }

      const currentPin = [...newPin].join('');
      if (currentPin.length === 6 && /^\d{6}$/.test(currentPin)) {
        setTimeout(() => {
          verifyPinAndGetBalance(currentPin).catch(err => {
            setError(err.message);
          });
        }, 500);
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = e.target.previousElementSibling;
      if (prevInput) {
        prevInput.focus();
        const newPin = [...pin];
        newPin[index - 1] = '';
        setPin(newPin);
        
        setCardBalance(null);
        setBalanceChecked(false);
        setError(null);
      }
    }
    
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const numericOnly = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (numericOnly.length > 0) {
      const newPin = numericOnly.split('').concat(Array(6 - numericOnly.length).fill(''));
      setPin(newPin);
      setError(null);
      
      if (numericOnly.length === 6) {
        setTimeout(() => {
          verifyPinAndGetBalance(numericOnly).catch(err => {
            setError(err.message);
          });
        }, 300);
      }
    }
  };

  const handleSubmit = async (overridePin = null) => {
    if (isSubmitting) return;
    
    const finalPin = overridePin || pin.join('');

    if (finalPin.length !== 6) {
      setError("PIN harus 6 digit");
      return;
    }

    if (!/^\d+$/.test(finalPin)) {
      setError("PIN hanya boleh berisi angka");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let verifiedCardData = cardInfo;

      if (!cardBalance || !balanceChecked) {
        verifiedCardData = await verifyPinAndGetBalance(finalPin);
      }

      if (verifiedCardData.balance < totalAmount) {
        throw new Error(`Saldo tidak mencukupi. Saldo tersedia: ${formatCurrency(verifiedCardData.balance)}`);
      }
      
      await onSubmit(finalPin, verifiedCardData);

    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat memverifikasi PIN");
      
      // Auto-reset PIN saat error
      setPin(['', '', '', '', '', '']);
      setCardBalance(null);
      setCardInfo(null);
      setBalanceChecked(false);
      
      const firstInput = document.querySelector('.pin-input-0');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearPin = () => {
    setPin(['', '', '', '', '', '']);
    setError(null);
    setCardBalance(null);
    setCardInfo(null);
    setBalanceChecked(false);
    
    const firstInput = document.querySelector('.pin-input-0');
    if (firstInput) {
      firstInput.focus();
    }
  };

  const defaultFormatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrency = formatRupiah || defaultFormatRupiah;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-full">
              <ShieldCheck className="text-emerald-600" size={24}/>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Verifikasi PIN</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>
        
        <p className="text-slate-600 mb-6 text-center">
          Masukkan PIN 6 digit untuk melanjutkan pembayaran
        </p>
        
        <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="font-medium text-slate-500">Card ID:</span>
            <span className="font-mono text-slate-700 font-semibold">{cardId}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm mb-3">
            <span className="font-medium text-slate-500">Saldo Kartu:</span>
            {isVerifyingPin ? (
              <div className="flex items-center gap-1">
                <Loader className="animate-spin" size={12} />
                <span className="text-slate-400 text-xs">Mengecek...</span>
              </div>
            ) : cardBalance !== null ? (
              <span className="font-semibold text-emerald-600">
                {formatCurrency(cardBalance)}
              </span>
            ) : (
              <span className="text-slate-400 text-xs">Masukkan PIN untuk cek saldo</span>
            )}
          </div>

          {cardBalance !== null && (
            <div className="mb-3">
              {cardBalance >= totalAmount ? (
                <div className="flex items-center gap-2 text-green-600 text-xs">
                  <CheckCircle size={12} />
                  <span>Saldo mencukupi untuk pembayaran</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 text-xs">
                  <AlertCircle size={12} />
                  <span>Saldo tidak mencukupi!</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between items-center text-lg pt-3 border-t border-slate-200">
            <span className="font-medium text-slate-500">Total Bayar:</span>
            <span className="text-emerald-600 font-bold">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="font-semibold text-slate-700">PIN (6 digit)</label>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setShowPin(!showPin)} 
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                disabled={isSubmitting}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                <span className="text-xs">{showPin ? 'Hide' : 'Show'}</span>
              </button>
              <button
                type="button"
                onClick={clearPin}
                className="text-slate-500 hover:text-slate-800 text-xs"
                disabled={isSubmitting}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2 mb-4">
            {pin.map((digit, index) => (
              <input
                key={index}
                type={showPin ? 'text' : 'password'}
                value={digit}
                onChange={(e) => handleManualPinChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                maxLength="1"
                className={`pin-input-${index} w-full h-14 text-center text-2xl font-bold border-2 rounded-lg transition-all duration-200 ${
                  error 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : balanceChecked && cardBalance >= totalAmount
                    ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
                } focus:ring-2 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed`}
                autoFocus={index === 0}
                disabled={isSubmitting || loading}
                placeholder={showPin ? '' : '•'}
              />
            ))}
          </div>

          {pinFromKeypad && pinFromKeypad.length > 0 && (
  <div className="text-center mb-4">
    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      Input dari keypad hardware aktif
    </div>
  </div>
)}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={onClose} 
            className="w-full py-3 px-4 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || loading}
          >
            Batal
          </button>
          <button
            onClick={() => handleSubmit()}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              pin.join('').length !== 6 || isSubmitting || loading || (cardBalance !== null && cardBalance < totalAmount)
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
            disabled={pin.join('').length !== 6 || isSubmitting || loading || (cardBalance !== null && cardBalance < totalAmount)}
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin" size={16} />
                Memproses...
              </>
            ) : (
              'Konfirmasi Pembayaran'
            )}
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">
            {pinFromKeypad ? 
              'PIN otomatis terisi dari keypad hardware' : 
              'Gunakan keypad hardware atau ketik manual'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default PinVerificationModal;