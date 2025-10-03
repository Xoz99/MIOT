import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Store, CreditCard, ArrowLeft, Wifi, WifiOff } from 'lucide-react';

const RegisterForm = ({ onRegister, onSwitchToLogin, loading, error, api }) => {
  const [registrationType, setRegistrationType] = useState(null);
  
  const [merchantData, setMerchantData] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    address: ''
  });

  const [cardData, setCardData] = useState({
    cardId: '',
    ownerName: '',
    initialBalance: '',
    pin: ''
  });

  const [cardSuccess, setCardSuccess] = useState(false);
  const [cardError, setCardError] = useState('');
  const [cardLoading, setCardLoading] = useState(false);

  // RFID State
  const [rfidConnected, setRfidConnected] = useState(false);
  const [serialPort, setSerialPort] = useState(null);
  const [rfidData, setRfidData] = useState({ uid: null, timestamp: null });

  // Process Arduino Data
  const processArduinoData = useCallback((data) => {
    const trimmedData = data.trim();
    console.log("RFID Data:", trimmedData);

    if (trimmedData.startsWith("UID:")) {
      const uid = trimmedData.split(":")[1];
      console.log("Card detected:", uid);
      setRfidData({ uid, timestamp: Date.now() });
    }
  }, []);

  // Auto-fill card ID dari RFID
  useEffect(() => {
    if (rfidData?.uid && registrationType === 'card') {
      setCardData(prev => ({ ...prev, cardId: rfidData.uid }));
    }
  }, [rfidData, registrationType]);

  // Serial Port Reader
  useEffect(() => {
    if (!serialPort) {
      setRfidConnected(false);
      return;
    }

    let reader;
    let keepReading = true;

    const readLoop = async () => {
      const textDecoder = new TextDecoderStream();
      try {
        serialPort.readable.pipeTo(textDecoder.writable);
        reader = textDecoder.readable.getReader();

        while (serialPort.readable && keepReading) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const lines = value.split('\n');
          lines.forEach(line => {
            if (line.trim()) processArduinoData(line);
          });
        }
      } catch (error) {
        if (error.name !== 'DOMException') {
          console.error("Serial read error:", error);
        }
      }
    };

    readLoop();

    return () => {
      keepReading = false;
      if (reader) {
        reader.cancel().catch(() => {});
      }
      setRfidConnected(false);
    };
  }, [serialPort, processArduinoData]);

  // Connect RFID
  const handleConnectRFID = async () => {
    if (!('serial' in navigator)) {
      alert("Browser tidak mendukung Web Serial API. Gunakan Chrome atau Edge.");
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      setSerialPort(port);
      setRfidConnected(true);
      alert("RFID sensor berhasil terhubung!");
    } catch (err) {
      console.error("Connect error:", err);
      alert("Gagal menghubungkan RFID sensor");
    }
  };

  // Disconnect RFID
  const handleDisconnectRFID = async () => {
    if (!serialPort) return;
    try {
      await serialPort.close();
      setSerialPort(null);
      setRfidConnected(false);
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  };

  const handleMerchantSubmit = (e) => {
    e.preventDefault();
    onRegister(merchantData);
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    setCardError('');
    setCardLoading(true);
    
    try {
      if (cardData.pin.length !== 6) {
        setCardError('PIN harus 6 digit');
        setCardLoading(false);
        return;
      }

      const response = await api.post('/public/cards/register', {
        cardId: cardData.cardId.trim(),
        ownerName: cardData.ownerName,
        pin: cardData.pin,
        balance: parseInt(cardData.initialBalance) || 0
      });

      if (response.data.success) {
        setCardSuccess(true);
        setCardData({ cardId: '', ownerName: '', initialBalance: '', pin: '' });
        setRfidData({ uid: null, timestamp: null });
        
        setTimeout(() => {
          setCardSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Card registration error:', error);
      setCardError(error.response?.data?.message || 'Gagal mendaftarkan kartu');
    } finally {
      setCardLoading(false);
    }
  };

  // Selection Screen
  if (!registrationType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Pilih Jenis Registrasi</h1>
            <p className="text-slate-600 text-lg">Daftar sebagai merchant atau daftarkan kartu RFID baru</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setRegistrationType('merchant')}
              className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border-2 border-emerald-200 hover:border-emerald-400 transition-all duration-300 hover:shadow-2xl hover:scale-105 group"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <Store className="text-white" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Daftar Toko</h2>
              <p className="text-slate-600">Daftarkan toko/warung Anda sebagai merchant untuk menerima pembayaran RFID</p>
            </button>

            <button
              onClick={() => setRegistrationType('card')}
              className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-2xl hover:scale-105 group"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <CreditCard className="text-white" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Daftar Kartu</h2>
              <p className="text-slate-600">Daftarkan kartu RFID baru untuk pengguna dengan saldo awal dan PIN</p>
            </button>
          </div>

          <div className="text-center mt-8">
            <span className="text-slate-600">Sudah memiliki akun merchant? </span>
            <button 
              onClick={onSwitchToLogin}
              className="text-slate-800 hover:text-slate-900 font-semibold hover:underline transition-colors"
            >
              Masuk di sini
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Merchant Registration Form (sama seperti sebelumnya, tidak berubah)
  if (registrationType === 'merchant') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-emerald-200/50 w-full max-w-md">
          <button
            onClick={() => setRegistrationType(null)}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            Kembali
          </button>

          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Store className="text-white" size={36} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              Daftar Merchant
            </h1>
            <p className="text-emerald-700 mt-2 font-medium">Bergabung dengan platform kami</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleMerchantSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nama Toko"
              value={merchantData.storeName}
              onChange={(e) => setMerchantData({...merchantData, storeName: e.target.value})}
              className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-emerald-600 disabled:opacity-50"
              required
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Nama Pemilik"
              value={merchantData.ownerName}
              onChange={(e) => setMerchantData({...merchantData, ownerName: e.target.value})}
              className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-emerald-600 disabled:opacity-50"
              required
              disabled={loading}
            />
            <input
              type="email"
              placeholder="Email"
              value={merchantData.email}
              onChange={(e) => setMerchantData({...merchantData, email: e.target.value})}
              className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-emerald-600 disabled:opacity-50"
              required
              disabled={loading}
            />
            <input
              type="tel"
              placeholder="Nomor Telepon"
              value={merchantData.phone}
              onChange={(e) => setMerchantData({...merchantData, phone: e.target.value})}
              className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-emerald-600 disabled:opacity-50"
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              value={merchantData.password}
              onChange={(e) => setMerchantData({...merchantData, password: e.target.value})}
              className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-emerald-600 disabled:opacity-50"
              required
              disabled={loading}
            />
            <textarea
              placeholder="Alamat Toko (Opsional)"
              value={merchantData.address}
              onChange={(e) => setMerchantData({...merchantData, address: e.target.value})}
              className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 h-20 resize-none transition-all placeholder-emerald-600 disabled:opacity-50"
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </div>
              ) : (
                'Buat Akun Merchant'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Card Registration Form
  if (registrationType === 'card') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-blue-200/50 w-full max-w-md">
          <button
            onClick={() => {
              setRegistrationType(null);
              if (serialPort) handleDisconnectRFID();
            }}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            Kembali
          </button>

          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CreditCard className="text-white" size={36} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Daftar Kartu RFID
            </h1>
            <p className="text-blue-700 mt-2 font-medium">Registrasi kartu baru dengan sensor</p>
          </div>

          {/* RFID Connection Button */}
          <div className="mb-6">
            {rfidConnected ? (
              <button
                onClick={handleDisconnectRFID}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-2xl font-semibold transition-colors"
              >
                <WifiOff size={20} />
                Putuskan Koneksi RFID
              </button>
            ) : (
              <button
                onClick={handleConnectRFID}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-semibold transition-colors shadow-lg"
              >
                <Wifi size={20} />
                Hubungkan RFID Sensor
              </button>
            )}
          </div>

          {cardSuccess && (
            <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-2xl mb-6">
              <p className="text-sm font-bold text-center">Kartu berhasil didaftarkan!</p>
            </div>
          )}

          {cardError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
              <p className="text-sm font-medium">{cardError}</p>
            </div>
          )}

          <form onSubmit={handleCardSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-blue-700 mb-2">
                Card ID / UID {rfidConnected && <span className="text-green-600">(Sensor Aktif)</span>}
              </label>
              <input
                type="text"
                placeholder={rfidConnected ? "Tempelkan kartu ke sensor..." : "Hubungkan sensor dulu"}
                value={cardData.cardId}
                className="w-full px-4 py-3 bg-blue-50/50 border-2 border-blue-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-blue-400 font-mono text-lg font-bold"
                required
                readOnly
                disabled={!rfidConnected}
              />
              <p className="text-xs text-blue-600 mt-1 font-medium">
                {cardData.cardId ? '✓ Kartu terdeteksi' : '○ Menunggu kartu...'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-blue-700 mb-2">
                Nama Pemilik
              </label>
              <input
                type="text"
                placeholder="Nama lengkap pemilik kartu"
                value={cardData.ownerName}
                onChange={(e) => setCardData({...cardData, ownerName: e.target.value})}
                className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-blue-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-blue-700 mb-2">
                Saldo Awal (Rp)
              </label>
              <input
                type="number"
                placeholder="50000"
                value={cardData.initialBalance}
                onChange={(e) => setCardData({...cardData, initialBalance: e.target.value})}
                className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-blue-400"
                min="0"
                step="1000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-blue-700 mb-2">
                PIN (6 digit)
              </label>
              <input
                type="password"
                placeholder="123456"
                value={cardData.pin}
                onChange={(e) => setCardData({...cardData, pin: e.target.value})}
                className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-blue-400 font-mono text-center text-2xl tracking-widest"
                maxLength="6"
                pattern="[0-9]{6}"
                required
              />
              <p className="text-xs text-blue-600 mt-1 font-medium">
                PIN harus 6 digit angka
              </p>
            </div>

            <button 
              type="submit"
              disabled={!cardData.cardId || cardLoading || !rfidConnected}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl hover:from-blue-600 hover:to-blue-700 font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {cardLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Mendaftarkan...
                </div>
              ) : (
                'Daftarkan Kartu'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }
};

export default RegisterForm;