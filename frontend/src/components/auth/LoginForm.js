import React, { useState } from 'react';
import { Store } from 'lucide-react';

const LoginForm = ({ onLogin, onSwitchToRegister, loading, error }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-slate-200/50 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Store className="text-white" size={36} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
            E-Wallet RFID
          </h1>
          <p className="text-slate-600 mt-2 font-medium">Merchant Dashboard</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 placeholder-slate-500 disabled:opacity-50"
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 placeholder-slate-500 disabled:opacity-50"
            required
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-4 rounded-2xl hover:from-slate-700 hover:to-slate-800 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Memproses...
              </div>
            ) : (
              'Masuk ke Dashboard'
            )}
          </button>
        </form>



        <div className="text-center mt-8">
          <span className="text-slate-600">Belum memiliki akun? </span>
          <button 
            onClick={onSwitchToRegister}
            disabled={loading}
            className="text-slate-700 hover:text-slate-900 font-semibold hover:underline transition-colors disabled:opacity-50"
          >
            Daftar Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;