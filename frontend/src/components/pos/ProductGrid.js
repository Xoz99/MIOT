import React from 'react';
import { Package } from 'lucide-react';

const ProductGrid = ({ products, addToCart, formatRupiah }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-slate-200/50">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <Package className="text-slate-600" size={24} />
        Pilih Produk
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.map(product => (
          <div 
            key={product.id}
            onClick={() => addToCart(product)}
            className="border border-slate-200 rounded-2xl p-5 hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100 hover:border-slate-300 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
          >
            <h3 className="font-bold text-slate-800 group-hover:text-slate-900">{product.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{product.category}</p>
            <p className="text-xl font-bold text-emerald-600 mt-3">{formatRupiah(product.price)}</p>
            <p className="text-xs text-slate-400 mt-2">Stok: {product.stock}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;