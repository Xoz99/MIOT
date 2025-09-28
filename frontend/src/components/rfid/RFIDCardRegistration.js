import React, { useState, useEffect } from 'react';
import { CreditCard, Wifi, WifiOff, UserPlus, Shield, CheckCircle, AlertCircle } from 'lucide-react';

const RFIDCardRegistration = ({ rfidConnected, onCardRegistered, api }) => {
  const [step, setStep] = useState('scan'); // 'scan', 'form', 'success'
  const [detectedCard, setDetectedCard] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    ownerName: '',
    phone: '',
    initialBalance: 50000,
    pin: '',
    confirmPin: ''
  });

  const startScanning = () => {
    if (!rfidConnected) {
      setError('Hubungkan RFID Reader terlebih dahulu!');
      return;
    }
    
    setIsScanning(true);
    setError('');
    setDetectedCard(null);
    
    // Simulate RFID card detection
    setTimeout(() => {
      const cardId = 'RF' + Date.now().toString().slice(-6);
      setDetectedCard(cardId);
      setIsScanning(false);
      setStep('form');
    }, 3000);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (formData.pin !== formData.confirmPin) {
      setError('PIN dan konfirmasi PIN tidak sama');
      return;
    }
    
    if (formData.pin.length !== 6) {
      setError('PIN harus 6 digit');
      return;
    }
    
    if (!/^\d{6}$/.test(formData.pin)) {
      setError('PIN harus berupa angka 6 digit');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/rfid/register-card', {
        cardId: detectedCard,
        ownerName: formData.ownerName,
        phone: formData.phone,
        pin: formData.pin,
        initialBalance: parseInt(formData.initialBalance)
      });

      if (response.data.success) {
        setStep('success');
        onCardRegistered && onCardRegistered(response.data.data);
      } else {
        setError(response.data.message || 'Gagal mendaftarkan kartu');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Gagal mendaftarkan kartu RFID');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('scan');
    setDetectedCard(null);
    setIsScanning(false);
    setError('');
    setFormData({
      ownerName: '',
      phone: '',
      initialBalance: 50000,
      pin: '',
      confirmPin: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-blue-200/50 w-full max-w-md">
        
        {/* Header */}
        <div className="p-6 border-b border-blue-200/50">
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CreditCard className="text-white" size={36} />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Daftarkan Kartu RFID
            </h1>
            <p className="text-blue-700 mt-2">Sistem E-Wallet RFID</p>
          </div>
        </div>

        <div className="p-6">
          {/* RFID Status */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-6 ${
            rfidConnected 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {rfidConnected ? <Wifi size={18} className="text-green-600" /> : <WifiOff size={18} className="text-red-500" />}
            <span className={`font-medium ${rfidConnected ? 'text-green-800' : 'text-red-800'}`}>
              {rfidConnected ? 'RFID Reader Terhubung' : 'RFID Reader Tidak Terhubung'}
            </span>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Step 1: Card Scanning */}
          {step === 'scan' && (
            <div className="text-center">
              {!isScanning ? (
                <>
                  <div className="mb-6">
                    <CreditCard size={64} className="text-blue-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Scan Kartu RFID</h3>
                    <p className="text-slate-600">Tempelkan kartu RFID baru pada reader untuk memulai pendaftaran</p>
                  </div>
                  
                  <button
                    onClick={startScanning}
                    disabled={!rfidConnected}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard size={20} />
                      Mulai Scan Kartu
                    </div>
                  </button>
                </>
              ) : (
                <div className="py-8">
                  <div className="relative mb-6">
                    <CreditCard size={64} className="text-blue-400 mx-auto animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Mendeteksi Kartu...</h3>
                  <p className="text-slate-600">Tempelkan kartu RFID pada reader</p>
                  
                  <button
                    onClick={() => {
                      setIsScanning(false);
                      setError('');
                    }}
                    className="mt-4 text-slate-600 hover:text-slate-800 font-medium"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Registration Form */}
          {step === 'form' && (
            <div>
              {/* Detected Card Info */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={20} />
                  <div>
                    <p className="font-semibold text-green-800">Kartu Terdeteksi</p>
                    <p className="text-green-700 font-mono text-sm">{detectedCard}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nama Pemilik Kartu *
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Nama lengkap pemilik"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="08xxxxxxxxxx"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Saldo Awal (Rupiah)
                  </label>
                  <select
                    value={formData.initialBalance}
                    onChange={(e) => setFormData({...formData, initialBalance: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    disabled={loading}
                  >
                    <option value={25000}>Rp 25,000</option>
                    <option value={50000}>Rp 50,000</option>
                    <option value={100000}>Rp 100,000</option>
                    <option value={200000}>Rp 200,000</option>
                    <option value={500000}>Rp 500,000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    PIN Kartu (6 digit) *
                  </label>
                  <input
                    type="password"
                    value={formData.pin}
                    onChange={(e) => setFormData({...formData, pin: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Masukkan 6 digit PIN"
                    maxLength={6}
                    pattern="\d{6}"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Konfirmasi PIN *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPin}
                    onChange={(e) => setFormData({...formData, confirmPin: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Ulangi PIN"
                    maxLength={6}
                    pattern="\d{6}"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Security Info */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="text-amber-600 flex-shrink-0" size={20} />
                    <div className="text-amber-800 text-sm">
                      <p className="font-semibold mb-1">Keamanan PIN</p>
                      <ul className="text-xs space-y-1">
                        <li>• PIN harus 6 digit angka</li>
                        <li>• Jangan berikan PIN kepada orang lain</li>
                        <li>• PIN diperlukan untuk setiap transaksi</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={loading}
                    className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-2xl hover:bg-slate-300 font-semibold transition-all duration-200 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-2xl hover:from-blue-600 hover:to-blue-700 font-semibold transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Mendaftar...
                      </div>
                    ) : (
                      'Daftarkan Kartu'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Kartu Berhasil Didaftarkan!</h3>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
                <div className="text-green-800">
                  <p className="font-semibold">Kartu ID: {detectedCard}</p>
                  <p>Pemilik: {formData.ownerName}</p>
                  <p>Saldo: Rp {parseInt(formData.initialBalance).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={resetForm}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Daftarkan Kartu Lain
                </button>
                
                <p className="text-slate-600 text-sm">
                  Kartu RFID siap digunakan untuk transaksi
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RFIDCardRegistration;