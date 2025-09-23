import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

const RegisterForm = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    address: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(formData);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-emerald-200/50 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sparkles className="text-white" size={36} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
            Daftar Merchant
          </h1>
          <p className="text-emerald-700 mt-2 font-medium">Bergabung dengan platform kami</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nama Toko"
            value={formData.storeName}
            onChange={(e) => handleChange('storeName', e.target.value)}
            className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 placeholder-emerald-600"
            required
          />
          <input
            type="text"
            placeholder="Nama Pemilik"
            value={formData.ownerName}
            onChange={(e) => handleChange('ownerName', e.target.value)}
            className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 placeholder-emerald-600"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 placeholder-emerald-600"
            required
          />
          <input
            type="tel"
            placeholder="Nomor Telepon"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 placeholder-emerald-600"
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 placeholder-emerald-600"
            required
          />
          <textarea
            placeholder="Alamat Toko (Opsional)"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 h-20 resize-none transition-all duration-200 placeholder-emerald-600"
          />
          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            Buat Akun Merchant
          </button>
        </form>

        <div className="text-center mt-6">
          <span className="text-emerald-700">Sudah memiliki akun? </span>
          <button 
            onClick={onSwitchToLogin}
            className="text-emerald-800 hover:text-emerald-900 font-semibold hover:underline transition-colors"
          >
            Masuk di sini
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;