import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const ProductForm = ({ addProduct }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock) {
      alert('Lengkapi semua field!');
      return;
    }
    addProduct(formData);
    setFormData({ name: '', price: '', stock: '', category: '' });
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-slate-200/50">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <Plus className="text-slate-600" size={24} />
        Tambah Produk
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          placeholder="Nama Produk"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200"
          required
        />
        <input
          type="number"
          placeholder="Harga (Rp)"
          value={formData.price}
          onChange={(e) => handleChange('price', e.target.value)}
          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200"
          required
        />
        <input
          type="number"
          placeholder="Jumlah Stok"
          value={formData.stock}
          onChange={(e) => handleChange('stock', e.target.value)}
          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200"
          required
        />
        <select
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200"
        >
          <option value="">Pilih Kategori</option>
          <option value="Makanan">Makanan</option>
          <option value="Minuman">Minuman</option>
          <option value="Snack">Snack</option>
          <option value="Lainnya">Lainnya</option>
        </select>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          Tambah Produk Baru
        </button>
      </form>
    </div>
  );
};

export default ProductForm;