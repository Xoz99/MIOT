import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const ProductForm = ({ addProduct, loading, error }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock) {
      return;
    }
    addProduct(formData);
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
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          placeholder="Nama Produk"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 disabled:opacity-50"
          required
          disabled={loading}
        />
        <input
          type="number"
          placeholder="Harga (Rp)"
          value={formData.price}
          onChange={(e) => handleChange('price', e.target.value)}
          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 disabled:opacity-50"
          required
          min="0"
          disabled={loading}
        />
        <input
          type="number"
          placeholder="Jumlah Stok"
          value={formData.stock}
          onChange={(e) => handleChange('stock', e.target.value)}
          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 disabled:opacity-50"
          required
          min="0"
          disabled={loading}
        />
        <select
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 disabled:opacity-50"
          disabled={loading}
        >
          <option value="">Pilih Kategori</option>
          <option value="Makanan">Makanan</option>
          <option value="Minuman">Minuman</option>
          <option value="Snack">Snack</option>
          <option value="Dessert">Dessert</option>
          <option value="Lainnya">Lainnya</option>
        </select>
        <button
          type="submit"
          disabled={loading || !formData.name || !formData.price || !formData.stock}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Menyimpan...
            </div>
          ) : (
            'Tambah Produk Baru'
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
        <p className="text-blue-800 text-sm">
          <strong>Tips:</strong> Pastikan nama produk unik dan harga sesuai dengan yang dijual di toko.
        </p>
      </div>
    </div>
  );
};

export default ProductForm;