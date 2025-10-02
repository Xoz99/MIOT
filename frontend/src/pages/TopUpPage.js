import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, Plus, Check, Loader, ArrowLeft } from 'lucide-react';

const TopUpPage = ({ api, formatRupiah, rfidData, clearRfidData, rfidConnected }) => {
  const [step, setStep] = useState('SCAN'); // SCAN, INPUT, CONFIRM, SUCCESS
  const [cardData, setCardData] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Quick amounts
  const quickAmounts = [10000, 20000, 50000, 100000, 200000, 500000];

  // Detect card scan
  useEffect(() => {
    if (step === 'SCAN' && rfidData?.uid) {
      fetchCardBalance(rfidData.uid);
    }
  }, [rfidData?.uid, step]);

  const fetchCardBalance = async (cardId) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get(`/cards/info/${cardId}`);
      
      if (response.data.success) {
        setCardData(response.data.data);
        setStep('INPUT');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengambil data kartu');
      setTimeout(() => {
        setError('');
        clearRfidData();
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseInt(topupAmount);
    
    if (!amount || amount < 1000) {
      setError('Minimal top-up Rp 1.000');
      return;
    }

    if (amount > 10000000) {
      setError('Maksimal top-up Rp 10.000.000');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/cards/topup', {
        cardId: cardData.cardId,
        amount: amount
      });

      if (response.data.success) {
        setCardData(response.data.data);
        setStep('SUCCESS');
        
        setTimeout(() => {
          handleReset();
        }, 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal melakukan top-up');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('SCAN');
    setCardData(null);
    setTopupAmount('');
    setError('');
    clearRfidData();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-100 p-3 rounded-full">
            <Wallet className="text-blue-600" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Top-Up Saldo</h1>
            <p className="text-slate-600">Isi ulang saldo kartu RFID</p>
          </div>
        </div>

        {/* STEP 1: SCAN CARD */}
        {step === 'SCAN' && (
          <div className="text-center py-12">
            {rfidConnected ? (
              <>
                <div className="relative inline-block mb-6">
                  <CreditCard className="text-blue-500 animate-pulse" size={80} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  Tempelkan Kartu RFID
                </h2>
                <p className="text-slate-600">
                  Dekatkan kartu ke reader untuk memulai top-up
                </p>
                {loading && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Loader className="animate-spin text-blue-500" size={20} />
                    <span className="text-blue-600">Memuat data kartu...</span>
                  </div>
                )}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                <p className="text-red-700 font-semibold">
                  RFID Reader tidak terhubung
                </p>
                <p className="text-red-600 text-sm mt-2">
                  Hubungkan reader terlebih dahulu dari header
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: INPUT AMOUNT */}
        {step === 'INPUT' && cardData && (
          <div>
            {/* Card Info */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-blue-100 text-sm">Card ID</p>
                  <p className="font-mono font-bold text-lg">{cardData.cardId}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-blue-100 hover:text-white"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Saldo Saat Ini</p>
                <p className="text-3xl font-bold">{formatRupiah(cardData.balance)}</p>
              </div>
            </div>

            {/* Input Amount */}
            <div className="mb-6">
              <label className="block text-slate-700 font-semibold mb-3">
                Nominal Top-Up
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                  Rp
                </span>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTopupAmount(amount.toString())}
                  className="py-3 bg-slate-100 hover:bg-blue-100 border-2 border-slate-200 hover:border-blue-300 rounded-xl font-semibold text-slate-700 hover:text-blue-700 transition-colors"
                >
                  {formatRupiah(amount)}
                </button>
              ))}
            </div>

            {/* Preview New Balance */}
            {topupAmount && parseInt(topupAmount) >= 1000 && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-green-700 font-medium">Saldo Setelah Top-Up:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatRupiah(cardData.balance + parseInt(topupAmount))}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => setStep('CONFIRM')}
                disabled={!topupAmount || parseInt(topupAmount) < 1000 || loading}
                className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRM */}
        {step === 'CONFIRM' && cardData && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
              Konfirmasi Top-Up
            </h2>

            <div className="bg-slate-50 rounded-2xl p-6 mb-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600">Card ID:</span>
                <span className="font-mono font-bold">{cardData.cardId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Saldo Sekarang:</span>
                <span className="font-bold">{formatRupiah(cardData.balance)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-blue-600 font-semibold">Nominal Top-Up:</span>
                <span className="font-bold text-blue-600">{formatRupiah(parseInt(topupAmount))}</span>
              </div>
              <div className="border-t-2 border-slate-200 pt-4">
                <div className="flex justify-between text-xl">
                  <span className="text-green-600 font-semibold">Saldo Baru:</span>
                  <span className="font-bold text-green-600">
                    {formatRupiah(cardData.balance + parseInt(topupAmount))}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('INPUT')}
                disabled={loading}
                className="flex-1 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={handleTopUp}
                disabled={loading}
                className="flex-1 py-4 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Konfirmasi Top-Up
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'SUCCESS' && cardData && (
          <div className="text-center py-12">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="text-green-600" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Top-Up Berhasil!
            </h2>
            <p className="text-slate-600 mb-6">
              Saldo telah ditambahkan ke kartu
            </p>

            <div className="bg-slate-50 rounded-2xl p-6 max-w-sm mx-auto">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Nominal Top-Up:</span>
                  <span className="font-bold text-green-600">{formatRupiah(parseInt(topupAmount))}</span>
                </div>
                <div className="border-t-2 border-slate-200 pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-slate-700 font-semibold">Saldo Baru:</span>
                    <span className="font-bold text-green-600">{formatRupiah(cardData.balance)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="mt-6 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
            >
              Top-Up Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopUpPage;