import React, { useState } from 'react';
import { CreditCard, User, Wallet, Shield, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';

const CustomerRFIDRegistration = ({ rfidConnected, api, onSuccess }) => {
  const [step, setStep] = useState('customer-info'); // 'customer-info', 'scan', 'pin-setup', 'payment', 'success'
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    initialBalance: 50000
  });
  const [detectedCard, setDetectedCard] = useState(null);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Customer Information
  const handleCustomerInfoSubmit = (e) => {
    e.preventDefault();
    if (!customerData.name.trim()) {
      setError('Nama harus diisi');
      return;
    }
    setError('');
    setStep('scan');
  };

  // Step 2: Scan RFID Card
  const startScanning = () => {
    if (!rfidConnected) {
      setError('RFID Reader belum terhubung!');
      return;
    }
    
    setIsScanning(true);
    setError('');
    
    // Simulate card detection
    setTimeout(() => {
      const cardId = 'RF' + Date.now().toString().slice(-6);
      setDetectedCard(cardId);
      setIsScanning(false);
      setStep('pin-setup');
    }, 3000);
  };

  // Step 3: PIN Setup
  const handlePinSetup = (e) => {
    e.preventDefault();
    
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError('PIN harus 6 digit angka');
      return;
    }
    
    if (pin !== confirmPin) {
      setError('PIN dan konfirmasi PIN tidak sama');
      return;
    }
    
    setError('');
    setStep('payment');
  };

  // Step 4: Payment & Registration
  const handleFinalRegistration = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/rfid/register-card', {
        cardId: detectedCard,
        ownerName: customerData.name,
        phone: customerData.phone,
        pin: pin,
        initialBalance: parseInt(customerData.initialBalance)
      });

      if (response.data.success) {
        setStep('success');
        onSuccess && onSuccess(response.data.data);
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
    setStep('customer-info');
    setCustomerData({ name: '', phone: '', initialBalance: 50000 });
    setDetectedCard(null);
    setPin('');
    setConfirmPin('');
    setError('');
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-200/50 w-full max-w-md">
        
        {/* Header */}
        <div className="p-6 border-b border-emerald-200/50 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-t-3xl">
          <div className="text-center">
            <div className="bg-white/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CreditCard className="text-white" size={36} />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Daftar Kartu E-Wallet
            </h1>
            <p className="text-emerald-100 mt-2">Sistem Pembayaran RFID</p>
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
            <span className={`font-medium text-sm ${rfidConnected ? 'text-green-800' : 'text-red-800'}`}>
              {rfidConnected ? 'Reader Siap' : 'Reader Tidak Terhubung'}
            </span>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-between mb-6">
            {['Info', 'Scan', 'PIN', 'Bayar', 'Selesai'].map((stepName, index) => (
              <div key={stepName} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  ['customer-info', 'scan', 'pin-setup', 'payment', 'success'].indexOf(step) >= index
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {index + 1}
                </div>
                <span className="text-xs text-slate-600 mt-1">{stepName}</span>
              </div>
            ))}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Step 1: Customer Information */}
          {step === 'customer-info' && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User size={20} />
                Informasi Customer
              </h3>
              
              <form onSubmit={handleCustomerInfoSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Nama lengkap customer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Saldo Awal
                  </label>
                  <select
                    value={customerData.initialBalance}
                    onChange={(e) => setCustomerData({...customerData, initialBalance: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value={25000}>Rp 25,000</option>
                    <option value={50000}>Rp 50,000</option>
                    <option value={100000}>Rp 100,000</option>
                    <option value={200000}>Rp 200,000</option>
                    <option value={500000}>Rp 500,000</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-2xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200"
                >
                  Lanjut ke Scan Kartu
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Card Scanning */}
          {step === 'scan' && (
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Scan Kartu RFID</h3>
              
              {!isScanning ? (
                <>
                  <CreditCard size={64} className="text-emerald-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-6">Tempelkan kartu RFID kosong pada reader</p>
                  
                  <button
                    onClick={startScanning}
                    disabled={!rfidConnected}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Mulai Scan Kartu
                  </button>
                </>
              ) : (
                <div className="py-8">
                  <div className="relative mb-6">
                    <CreditCard size={64} className="text-emerald-400 mx-auto animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Mendeteksi Kartu...</h3>
                  <p className="text-slate-600">Tempelkan kartu pada reader</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: PIN Setup */}
          {step === 'pin-setup' && (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={20} />
                  <div>
                    <p className="font-semibold text-green-800">Kartu Terdeteksi</p>
                    <p className="text-green-700 font-mono text-sm">{detectedCard}</p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Shield size={20} />
                Set PIN Keamanan
              </h3>

              <form onSubmit={handlePinSetup} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    PIN Baru (6 digit) *
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center text-xl font-bold tracking-widest"
                    placeholder="••••••"
                    maxLength={6}
                    pattern="\d{6}"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Konfirmasi PIN *
                  </label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center text-xl font-bold tracking-widest"
                    placeholder="••••••"
                    maxLength={6}
                    pattern="\d{6}"
                    required
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="text-blue-800 text-sm">
                    <p className="font-semibold mb-2">Keamanan PIN:</p>
                    <ul className="text-xs space-y-1">
                      <li>• PIN harus 6 digit angka</li>
                      <li>• Jangan berikan PIN kepada orang lain</li>
                      <li>• PIN diperlukan untuk setiap transaksi</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('scan')}
                    className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-2xl hover:bg-slate-300 font-semibold"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 font-semibold"
                  >
                    Lanjut
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 'payment' && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Wallet size={20} />
                Pembayaran
              </h3>

              <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Nama:</span>
                    <span className="font-semibold">{customerData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Kartu ID:</span>
                    <span className="font-mono">{detectedCard}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Saldo Awal:</span>
                    <span className="font-bold text-emerald-600">
                      Rp {parseInt(customerData.initialBalance).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Bayar:</span>
                      <span className="text-emerald-600">
                        Rp {parseInt(customerData.initialBalance).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <p className="text-amber-800 text-sm">
                  <strong>Instruksi:</strong> Customer membayar tunai kepada kasir sebesar total di atas, 
                  kemudian klik "Proses Pendaftaran" untuk menyelesaikan.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('pin-setup')}
                  disabled={loading}
                  className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-2xl hover:bg-slate-300 font-semibold disabled:opacity-50"
                >
                  Kembali
                </button>
                <button
                  onClick={handleFinalRegistration}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 font-semibold disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </div>
                  ) : (
                    'Proses Pendaftaran'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Pendaftaran Berhasil!</h3>
              
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
                <div className="text-green-800 space-y-2">
                  <p><strong>Nama:</strong> {customerData.name}</p>
                  <p><strong>Kartu ID:</strong> {detectedCard}</p>
                  <p><strong>Saldo:</strong> Rp {parseInt(customerData.initialBalance).toLocaleString()}</p>
                </div>
              </div>
              
              <p className="text-slate-600 mb-6">
                Kartu E-Wallet siap digunakan untuk transaksi!
              </p>
              
              <button
                onClick={resetForm}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Daftar Customer Baru
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerRFIDRegistration;