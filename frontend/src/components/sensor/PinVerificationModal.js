import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'; // Menggunakan ikon untuk tampilan lebih baik

const PinVerificationModal = ({ 
  cardId, 
  pinFromKeypad, // Prop baru untuk menerima PIN dari hardware
  totalAmount,
  onClose, 
  onSubmit, // Mengganti onConfirm menjadi onSubmit agar konsisten
  formatRupiah 
}) => {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [showPin, setShowPin] = useState(false);

  // useEffect ini "mengawasi" pin yang datang dari keypad hardware
  useEffect(() => {
    if (pinFromKeypad) {
      // Jika ada pin dari hardware, langsung isi dan submit
      const pinArray = pinFromKeypad.split('').slice(0, 6);
      setPin(pinArray.concat(Array(6 - pinArray.length).fill('')));
      
      // Jika PIN sudah 6 digit dari keypad, otomatis submit
      if (pinArray.length === 6) {
        setTimeout(() => {
          handleSubmit(pinFromKeypad);
        }, 300); // Beri jeda sedikit agar pengguna bisa lihat PIN terisi
      }
    }
  }, [pinFromKeypad]); // Hanya berjalan saat pin dari hardware berubah

  // Fungsi untuk menangani input dari keyboard PC (jika diperlukan)
  const handleManualPinChange = (e, index) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value) || value === '') {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);

      // Pindah fokus ke input berikutnya jika angka dimasukkan
      if (value && index < 5) {
        e.target.nextElementSibling.focus();
      }
    }
  };

  const handleSubmit = (overridePin = null) => {
    const finalPin = overridePin || pin.join('');
    if (finalPin.length === 6) {
      onSubmit(finalPin); // Panggil fungsi dari POSPage
    } else {
      alert("PIN harus 6 digit.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-500" size={28}/>
            <h2 className="text-2xl font-bold text-slate-800">Verifikasi PIN</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
        
        <p className="text-slate-600 mb-6">Masukkan PIN 6 digit untuk melanjutkan pembayaran.</p>
        
        <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-slate-500">Card ID:</span>
            <span className="font-mono text-slate-700 font-semibold">{cardId}</span>
          </div>
          <div className="flex justify-between items-center mt-2 text-lg">
            <span className="font-medium text-slate-500">Total:</span>
            <span className="text-emerald-600 font-bold">{formatRupiah(totalAmount)}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <label className="font-semibold text-slate-700">PIN (6 digit)</label>
          <button onClick={() => setShowPin(!showPin)} className="text-slate-500 hover:text-slate-800">
            {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="grid grid-cols-6 gap-3 mb-8">
          {pin.map((digit, index) => (
             <input
                key={index}
                type={showPin ? 'text' : 'password'}
                value={digit}
                onChange={(e) => handleManualPinChange(e, index)}
                maxLength="1"
                className="w-full h-14 text-center text-2xl font-bold border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                // Auto-focus input pertama saat modal muncul
                autoFocus={index === 0}
             />
          ))}
        </div>
        
        <div className="flex space-x-4">
          <button onClick={onClose} className="w-full py-3 px-4 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition">
            Batal
          </button>
          <button
            onClick={() => handleSubmit()}
            className="w-full py-3 px-4 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
            disabled={pin.join('').length !== 6}
          >
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinVerificationModal;