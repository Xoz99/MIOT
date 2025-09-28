import React, { useState } from 'react';
import { Store, CreditCard, ArrowRight } from 'lucide-react';

const RegisterForm = ({ onRegister, onSwitchToLogin, loading, error, onShowCustomerRegistration, onShowInStoreTopUp }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  // Store Registration Form
  const [storeFormData, setStoreFormData] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    address: ''
  });

  const handleStoreSubmit = (e) => {
    e.preventDefault();
    onRegister(storeFormData);
  };

  const handleStoreChange = (field, value) => {
    setStoreFormData({ ...storeFormData, [field]: value });
  };

  // Main Options View
  if (!selectedOption) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-slate-200/50 w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Store className="text-white" size={36} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              E-Wallet RFID
            </h1>
            <p className="text-slate-600 mt-2 font-medium">Pilih jenis pendaftaran</p>
          </div>

          <div className="space-y-4">
            {/* Register Store Option */}
            <button
              onClick={() => setSelectedOption('store')}
              className="w-full p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-3xl hover:from-emerald-100 hover:to-emerald-150 transition-all duration-300 hover:shadow-lg group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Store className="text-white" size={28} />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold text-emerald-800 mb-1">
                    Daftar Toko / Merchant
                  </h3>
                  <p className="text-emerald-700 text-sm">
                    Daftarkan toko Anda untuk menerima pembayaran RFID
                  </p>
                </div>
                <ArrowRight className="text-emerald-600 group-hover:translate-x-1 transition-transform" size={20} />
              </div>
            </button>

            {/* Register RFID Card Options */}
            <div className="space-y-3">
              <button
                onClick={() => onShowCustomerRegistration && onShowCustomerRegistration()}
                className="w-full p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-3xl hover:from-blue-100 hover:to-blue-150 transition-all duration-300 hover:shadow-lg group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <CreditCard className="text-white" size={28} />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-bold text-blue-800 mb-1">
                      Daftar Kartu RFID Baru
                    </h3>
                    <p className="text-blue-700 text-sm">
                      Buat kartu E-Wallet RFID untuk customer baru
                    </p>
                  </div>
                  <ArrowRight className="text-blue-600 group-hover:translate-x-1 transition-transform" size={20} />
                </div>
              </button>

              <button
                onClick={() => onShowInStoreTopUp && onShowInStoreTopUp()}
                className="w-full p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-3xl hover:from-purple-100 hover:to-purple-150 transition-all duration-300 hover:shadow-lg group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <CreditCard className="text-white" size={28} />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-bold text-purple-800 mb-1">
                      Top Up Kartu RFID
                    </h3>
                    <p className="text-purple-700 text-sm">
                      Isi saldo kartu E-Wallet customer di toko
                    </p>
                  </div>
                  <ArrowRight className="text-purple-600 group-hover:translate-x-1 transition-transform" size={20} />
                </div>
              </button>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center mt-8 pt-6 border-t border-slate-200">
            <span className="text-slate-600">Sudah memiliki akun toko? </span>
            <button 
              onClick={onSwitchToLogin}
              className="text-slate-700 hover:text-slate-900 font-semibold hover:underline transition-colors"
            >
              Masuk di sini
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Store Registration Form
  if (selectedOption === 'store') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-emerald-200/50 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Store className="text-white" size={36} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              Daftar Merchant
            </h1>
            <p className="text-emerald-700 mt-2 font-medium">Bergabung dengan platform kami</p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => setSelectedOption(null)}
            disabled={loading}
            className="mb-6 text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-2 disabled:opacity-50"
          >
            ← Kembali ke pilihan
          </button>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleStoreSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nama Toko"
              value={storeFormData.storeName}
              onChange={(e) => handleStoreChange('storeName', e.target.value)}
              className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 placeholder-emerald-600 disabled:opacity-50"
              required
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Nama Pemilik"
              value={storeFormData.ownerName}
              onChange={(e) => handleStoreChange('ownerName', e.target.value)}
              className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 placeholder-emerald-600 disabled:opacity-50"
              required
              disabled={loading}
            />
            <input
              type="email"
              placeholder="Email"
              value={storeFormData.email}
              onChange={(e) => handleStoreChange('email', e.target.value)}
              className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 placeholder-emerald-600 disabled:opacity-50"
              required
              disabled={loading}
            />
            <input
              type="tel"
              placeholder="Nomor Telepon"
              value={storeFormData.phone}
              onChange={(e) => handleStoreChange('phone', e.target.value)}
              className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 placeholder-emerald-600 disabled:opacity-50"
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              value={storeFormData.password}
              onChange={(e) => handleStoreChange('password', e.target.value)}
              className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 placeholder-emerald-600 disabled:opacity-50"
              required
              disabled={loading}
            />
            <textarea
              placeholder="Alamat Toko (Opsional)"
              value={storeFormData.address}
              onChange={(e) => handleStoreChange('address', e.target.value)}
              className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 h-20 resize-none transition-all duration-200 placeholder-emerald-600 disabled:opacity-50"
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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

          <div className="text-center mt-6">
            <span className="text-emerald-700">Sudah memiliki akun? </span>
            <button 
              onClick={onSwitchToLogin}
              disabled={loading}
              className="text-emerald-800 hover:text-emerald-900 font-semibold hover:underline transition-colors disabled:opacity-50"
            >
              Masuk di sini
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RegisterForm;