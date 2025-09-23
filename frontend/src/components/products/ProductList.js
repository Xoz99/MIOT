import React from 'react';
import { Package } from 'lucide-react';

const ProductList = ({ products, formatRupiah }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-slate-200/50">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <Package className="text-slate-600" size={24} />
        Daftar Produk ({products.length})
      </h2>
      <div className="space-y-4">
        {products.map(product => (
          <div key={product.id} className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-2xl hover:shadow-md transition-all duration-200">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{product.name}</h3>
              <p className="text-slate-600 font-medium">{product.category}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl text-emerald-600">{formatRupiah(product.price)}</p>
              <p className="text-slate-500 font-medium">Stok: {product.stock}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;