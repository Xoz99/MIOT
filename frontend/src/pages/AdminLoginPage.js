import React, { useState } from 'react';
import { Shield, Lock, Mail } from 'lucide-react';

const AdminLoginPage = ({ onAdminLogin, loading, error }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdminLogin(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-slate-100 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-red-200/50 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-red-600 to-red-700 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shield className="text-white" size={36} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent">
            Admin Portal
          </h1>
          <p className="text-slate-600 mt-2 font-medium">Management Dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="email"
              placeholder="Admin Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 placeholder-slate-500 disabled:opacity-50"
              required
              disabled={loading}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 placeholder-slate-500 disabled:opacity-50"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl hover:from-red-700 hover:to-red-800 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Memproses...
              </div>
            ) : (
              'Login Admin'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;