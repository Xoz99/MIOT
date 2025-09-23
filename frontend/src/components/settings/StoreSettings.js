import React, { useState } from 'react';
import { Settings } from 'lucide-react';

const StoreSettings = ({ storeInfo, setStoreInfo }) => {
  const [formData, setFormData] = useState(storeInfo);

  const handleSubmit = (e) => {
    e.preventDefault();
    setStoreInfo(formData);
    alert('Pengaturan berhasil disimpan!');
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-slate-200/50">
      <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
        <Settings className="text-slate-600" size={24} />
        Pengaturan Toko
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">Nama Toko</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">Nama Pemilik</label>
          <input
            type="text"
            value={formData.owner}
            onChange={(e) => handleChange('owner', e.target.value)}
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">Alamat Toko</label>
          <textarea
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 h-24 resize-none transition-all duration-200"
            required
          />
        </div>
        
        <button 
          type="submit"
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
};

export default StoreSettings;