import React, { useState } from 'react';
import { Wallet, CreditCard, DollarSign, CheckCircle, AlertCircle, Wifi, WifiOff, User } from 'lucide-react';

const InStoreTopUp = ({ rfidConnected, api, onSuccess }) => {
  const [step, setStep] = useState('scan'); // 'scan', 'pin-verify', 'amount', 'payment', 'success'
  const [detectedCard, setDetectedCard] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [pin, setPin] = useState('');
  const [topUpAmount, setTopUpAmount] = useState(50000);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Step 1: Scan Card
  const startScanning = () => {
    if (!rfidConnected) {
      setError('RFID Reader belum terhubung!');
      return;
    }
    
    setIsScanning(true);
    setError('');
    
    // Simulate card detection - in real app, this comes from hardware
    setTimeout(() => {
      // Use demo cards
      const demoCards = ['RF001234', 'RF005678', 'RF009012'];
      const cardId = demoCards[Math.floor(Math.random() * demoCards.length)];
      
      setDetectedCard(cardId);
      setIsScanning(false);
      setStep('pin-verify');
    }, 2500);
  };

  // Step 2: Verify PIN
  const handlePinVerification = async (e) => {
    e.preventDefault();
    
    if (pin.length !== 6) {
      setError('PIN harus 6 digit');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/rfid/verify', {
        cardId: detectedCard,
        pin: pin
      });

      if (response.data.success) {
        setCardData(response.data.data);
        setStep('amount');
      } else {
        setError(response.data.message || 'PIN salah');
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      setError(error.response?.data?.message || 'Gagal memverifikasi PIN');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Process Top Up
  const handleTopUp = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/rfid/cards/${detectedCard}/topup`, {
        amount: parseInt(topUpAmount),
        pin: pin // Include PIN for security
      });

      if (response.data.success) {
        setCardData(prev => ({
          ...prev,
          balance: response.data.data.balance
        }));
        setStep('success');
        onSuccess && onSuccess({
          cardId: detectedCard,
          amount: parseInt(topUpAmount),
          newBalance: response.data.data.balance
        });
      } else {
        setError(response.data.message || 'Gagal melakukan top up');
      }
    } catch (error) {
      console.error('Top up error:', error);
      setError(error.response?.data?.message || 'Gagal melakukan top up');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('scan');
    setDetectedCard(null);
    setCardData(null);
    setPin('');
    setTopUpAmount(50000);
    setError('');
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-blue-200/50 w-full max-w-md">
        
        {/* Header */}
        <div className="p-6 border-b border-blue-200/50 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-3xl">
          <div className="text-center">
            <div className="bg-white/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Wallet className="text-white" size={36} />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Top Up E-Wallet
            </h1>
            <p className="text-blue-100 mt-2">Isi Saldo Kartu RFID</p>
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
            {['Scan', 'PIN', 'Jumlah', 'Bayar', 'Selesai'].map((stepName, index) => (
              <div key={stepName} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  ['scan', 'pin-verify', 'amount', 'payment', 'success'].indexOf(step) >= index
                    ? 'bg-blue-500 text-white'
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

          {/* Step 1: Scan Card */}
          {step === 'scan' && (
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Scan Kartu Customer</h3>
              
              {!isScanning ? (
                <>
                  <CreditCard size={64} className="text-blue-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-6">Customer tempelkan kartu RFID pada reader</p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
                    <p className="text-blue-800 text-sm">
                      <strong>Demo Cards:</strong> RF001234, RF005678, RF009012<br/>
                      <strong>PIN:</strong> 123456
                    </p>
                  </div>
                  
                  <button
                    onClick={startScanning}
                    disabled={!rfidConnected}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Mulai Scan Kartu
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
                  <p className="text-slate-600">Customer tempelkan kartu pada reader</p>
                  
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

          {/* Step 2: PIN Verification */}
          {step === 'pin-verify' && (
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
                <User size={20} />
                Verifikasi PIN Customer
              </h3>

              <form onSubmit={handlePinVerification} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Customer masukkan PIN (6 digit)
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-bold tracking-widest"
                    placeholder="••••••"
                    maxLength={6}
                    pattern="\d{6}"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Instruksi:</strong> Minta customer memasukkan PIN kartu mereka untuk melanjutkan proses top up.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('scan')}
                    disabled={loading}
                    className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-2xl hover:bg-slate-300 font-semibold disabled:opacity-50"
                  >
                    Scan Ulang
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-2xl hover:from-blue-600 hover:to-blue-700 font-semibold disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Verifikasi...
                      </div>
                    ) : (
                      'Verifikasi PIN'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Amount Selection */}
          {step === 'amount' && cardData && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <DollarSign size={20} />
                Pilih Jumlah Top Up
              </h3>

              {/* Current Balance */}
              <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                <div className="text-center">
                  <p className="text-slate-600 text-sm mb-1">Saldo Saat Ini</p>
                  <p className="text-3xl font-bold text-slate-800">{formatRupiah(cardData.balance)}</p>
                  {cardData.ownerName && (
                    <p className="text-slate-600 text-sm mt-2">{cardData.ownerName}</p>
                  )}
                </div>
              </div>

              {/* Amount Selection */}
              <div className="space-y-4 mb-6">
                <label className="block text-sm font-semibold text-slate-700">
                  Pilih Jumlah Top Up:
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  {[25000, 50000, 100000, 200000, 500000, 1000000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTopUpAmount(amount)}
                      className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                        topUpAmount === amount
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold">{formatRupiah(amount)}</div>
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Atau masukkan jumlah custom:
                  </label>
                  <input
                    type="number"
                    min="10000"
                    max="5000000"
                    step="5000"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Minimal Rp 10,000"
                  />
                </div>
              </div>

              {/* New Balance Preview */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Saldo setelah top up:</span>
                  <span className="font-bold text-xl text-green-800">
                    {formatRupiah(cardData.balance + topUpAmount)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('pin-verify')}
                  className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-2xl hover:bg-slate-300 font-semibold"
                >
                  Kembali
                </button>
                <button
                  onClick={() => setStep('payment')}
                  disabled={topUpAmount < 10000}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-2xl hover:from-blue-600 hover:to-blue-700 font-semibold disabled:opacity-50"
                >
                  Lanjut ke Pembayaran
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment Confirmation */}
          {step === 'payment' && cardData && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Wallet size={20} />
                Konfirmasi Pembayaran
              </h3>

              <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Kartu ID:</span>
                    <span className="font-mono">{detectedCard}</span>
                  </div>
                  {cardData.ownerName && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Pemilik:</span>
                      <span className="font-semibold">{cardData.ownerName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Saldo Saat Ini:</span>
                    <span className="font-semibold">{formatRupiah(cardData.balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Jumlah Top Up:</span>
                    <span className="font-bold text-blue-600">{formatRupiah(topUpAmount)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Saldo Baru:</span>
                      <span className="font-bold text-xl text-green-600">
                        {formatRupiah(cardData.balance + topUpAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <p className="text-amber-800 text-sm">
                  <strong>Instruksi:</strong> Customer membayar tunai sebesar{' '}
                  <strong>{formatRupiah(topUpAmount)}</strong> kepada kasir, kemudian klik "Proses Top Up".
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('amount')}
                  disabled={loading}
                  className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-2xl hover:bg-slate-300 font-semibold disabled:opacity-50"
                >
                  Ubah Jumlah
                </button>
                <button
                  onClick={handleTopUp}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-2xl hover:from-green-600 hover:to-green-700 font-semibold disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </div>
                  ) : (
                    'Proses Top Up'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && cardData && (
            <div className="text-center py-8">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Top Up Berhasil!</h3>
              
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
                <div className="space-y-3 text-green-800">
                  <div className="flex justify-between">
                    <span>Kartu:</span>
                    <span className="font-mono">{detectedCard}</span>
                  </div>
                  {cardData.ownerName && (
                    <div className="flex justify-between">
                      <span>Pemilik:</span>
                      <span className="font-semibold">{cardData.ownerName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Jumlah Top Up:</span>
                    <span className="font-bold">{formatRupiah(topUpAmount)}</span>
                  </div>
                  <div className="border-t border-green-200 pt-3">
                    <div className="flex justify-between text-lg">
                      <span>Saldo Baru:</span>
                      <span className="font-bold">{formatRupiah(cardData.balance)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-slate-600 mb-6">
                Saldo berhasil ditambahkan ke kartu E-Wallet!
              </p>
              
              <button
                onClick={resetForm}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Top Up Customer Lain
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InStoreTopUp;