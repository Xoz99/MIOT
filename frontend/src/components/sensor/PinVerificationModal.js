import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, EyeOff, Loader, AlertCircle, CheckCircle, Wifi } from 'lucide-react';

const PinVerificationModal = ({ 
  cardId, 
  pinFromKeypad, // PIN dari hardware keypad (optional)
  totalAmount,
  onClose, 
  onSubmit, // Callback untuk submit PIN
  formatRupiah,
  loading = false // Props untuk loading state
}) => {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ===== TAMBAHAN UNTUK MEMBACA SALDO RFID =====
  const [cardBalance, setCardBalance] = useState(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [cardInfo, setCardInfo] = useState(null);
  const [balanceChecked, setBalanceChecked] = useState(false);

  // API Configuration
  const API_BASE_URL = 'http://localhost:3001/api';

  // useEffect untuk handle PIN dari hardware keypad
  useEffect(() => {
    if (pinFromKeypad && pinFromKeypad.length >= 4) {
      console.log('PIN from keypad received:', pinFromKeypad);
      
      // Pastikan PIN maksimal 6 digit
      const cleanPin = pinFromKeypad.slice(0, 6);
      const pinArray = cleanPin.split('').concat(Array(6 - cleanPin.length).fill(''));
      setPin(pinArray);
      
      // Auto submit jika PIN sudah 6 digit
      if (cleanPin.length === 6) {
        console.log('Auto-submitting 6-digit PIN from keypad');
        setTimeout(() => {
          handleSubmit(cleanPin);
        }, 300);
      }
    }
  }, [pinFromKeypad]);

  // ===== FUNGSI BARU: VERIFY PIN DAN AMBIL SALDO =====
  const verifyPinAndGetBalance = async (pinValue) => {
    if (!cardId) {
      throw new Error('Card ID tidak tersedia');
    }

    try {
      setIsVerifyingPin(true);
      console.log('Verifying PIN for card:', cardId);

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
      console.log('PIN verification response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'PIN tidak valid');
      }

      // Set card info dan balance
      setCardInfo(data.data);
      setCardBalance(data.data.balance);
      setBalanceChecked(true);

      console.log('PIN verified successfully, balance:', data.data.balance);
      return data.data;

    } catch (error) {
      console.error('PIN verification error:', error);
      setCardBalance(null);
      setCardInfo(null);
      setBalanceChecked(false);
      throw error;
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // ===== FUNGSI BARU: CEK BALANCE SAJA (TANPA VERIFY PIN) =====
  const checkCardBalance = async () => {
    if (!cardId) return;

    try {
      // Ini bisa digunakan jika ada endpoint untuk check balance tanpa PIN
      // Atau jika RFID hardware bisa langsung baca balance
      console.log('Checking balance for card:', cardId);
      
      // Placeholder - implementasi tergantung hardware/backend
      // const response = await fetch(`${API_BASE_URL}/cards/info/${cardId}`);
      // const data = await response.json();
      // if (response.ok) {
      //   setCardInfo(data.data);
      // }
      
    } catch (error) {
      console.error('Error checking card balance:', error);
    }
  };

  // Handle input manual dari keyboard
  const handleManualPinChange = (e, index) => {
    const { value } = e.target;
    
    // Hanya terima angka 0-9 atau empty string
    if (/^[0-9]$/.test(value) || value === '') {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      setError(null); // Clear error saat user mulai input

      // Auto focus ke input berikutnya
      if (value && index < 5) {
        const nextInput = e.target.nextElementSibling;
        if (nextInput) {
          nextInput.focus();
        }
      }

      // ===== TAMBAHAN: AUTO VERIFY PIN SAAT LENGKAP =====
      const currentPin = [...newPin].join('');
      if (currentPin.length === 6 && /^\d{6}$/.test(currentPin)) {
        // Auto verify PIN saat user selesai input
        setTimeout(() => {
          verifyPinAndGetBalance(currentPin).catch(err => {
            setError(err.message);
          });
        }, 500); // Delay 500ms untuk UX
      }
    }
  };

  // Handle keydown untuk navigasi
  const handleKeyDown = (e, index) => {
    // Backspace: hapus current dan focus ke previous
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = e.target.previousElementSibling;
      if (prevInput) {
        prevInput.focus();
        const newPin = [...pin];
        newPin[index - 1] = '';
        setPin(newPin);
        
        // Reset balance check saat PIN berubah
        setCardBalance(null);
        setBalanceChecked(false);
        setError(null);
      }
    }
    
    // Enter: submit jika PIN sudah lengkap
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Handle paste - untuk copy-paste PIN
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const numericOnly = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (numericOnly.length > 0) {
      const newPin = numericOnly.split('').concat(Array(6 - numericOnly.length).fill(''));
      setPin(newPin);
      setError(null);
      
      // Auto verify jika PIN paste lengkap 6 digit
      if (numericOnly.length === 6) {
        setTimeout(() => {
          verifyPinAndGetBalance(numericOnly).catch(err => {
            setError(err.message);
          });
        }, 300);
      }
    }
  };

  // Submit PIN - SUDAH DIPERBAIKI
  const handleSubmit = async (overridePin = null) => {
    if (isSubmitting) return; // Prevent double submit
    
    const finalPin = overridePin || pin.join('');
    
    console.log('PIN submission attempt:', {
      finalPin: finalPin.replace(/./g, '*'), // Log masked PIN
      length: finalPin.length,
      cardId,
      totalAmount,
      hasBalance: !!cardBalance
    });

    // Validasi PIN
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

      // Jika belum verify PIN atau belum ada balance, verify dulu
      if (!cardBalance || !balanceChecked) {
        console.log('Verifying PIN before payment...');
        verifiedCardData = await verifyPinAndGetBalance(finalPin);
      }

      // Cek apakah saldo cukup
      if (verifiedCardData.balance < totalAmount) {
        throw new Error(`Saldo tidak mencukupi. Saldo tersedia: ${formatCurrency(verifiedCardData.balance)}`);
      }

      console.log('PIN verified, processing payment...');
      
      // Panggil callback dari parent component dengan data lengkap
      await onSubmit(finalPin, verifiedCardData);

    } catch (err) {
      console.error('PIN submission error:', err);
      setError(err.message || "Terjadi kesalahan saat memverifikasi PIN");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear PIN
  const clearPin = () => {
    setPin(['', '', '', '', '', '']);
    setError(null);
    setCardBalance(null);
    setCardInfo(null);
    setBalanceChecked(false);
    
    // Focus ke input pertama
    const firstInput = document.querySelector('.pin-input-0');
    if (firstInput) {
      firstInput.focus();
    }
  };

  // Format rupiah jika tidak di-provide
  const defaultFormatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrency = formatRupiah || defaultFormatRupiah;

  // ===== TAMBAHAN: CEK BALANCE SAAT MODAL DIBUKA =====
  useEffect(() => {
    if (cardId) {
      checkCardBalance();
    }
  }, [cardId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
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
        
        {/* Transaction Info - DIPERBAIKI DENGAN BALANCE INFO */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="font-medium text-slate-500">Card ID:</span>
            <span className="font-mono text-slate-700 font-semibold">{cardId}</span>
          </div>
          
          {/* BALANCE INFO */}
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

          {/* BALANCE SUFFICIENCY INDICATOR */}
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
        
        {/* PIN Input Section */}
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

          {/* PIN Input Grid */}
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

          {/* PIN from Keypad indicator */}
          {pinFromKeypad && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                PIN dari keypad hardware
              </div>
            </div>
          )}

          {/* PIN Verification Status */}
          {isVerifyingPin && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm">
                <Loader className="animate-spin" size={14} />
                Memverifikasi PIN dan mengambil saldo...
              </div>
            </div>
          )}

          {/* Success indicator */}
          {balanceChecked && cardBalance !== null && !error && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                <CheckCircle size={14} />
                PIN valid, saldo berhasil dimuat
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
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
            ) : isVerifyingPin ? (
              <>
                <Loader className="animate-spin" size={16} />
                Memverifikasi...
              </>
            ) : (
              'Konfirmasi Pembayaran'
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">
            {pinFromKeypad ? 
              'PIN otomatis terisi dari keypad hardware' : 
              'Gunakan keypad hardware atau ketik manual'
            }
          </p>
          {balanceChecked && (
            <p className="text-xs text-emerald-600 mt-1">
              Saldo berhasil diverifikasi dari server
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PinVerificationModal;