import React from 'react';
import { Package, Edit, Trash2, AlertCircle } from 'lucide-react';

const ProductList = ({ products, formatRupiah, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-slate-200/50">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <Package className="text-slate-600" size={24} />
          Daftar Produk
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-slate-600">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            <span>Memuat produk...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-slate-200/50">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <Package className="text-slate-600" size={24} />
        Daftar Produk ({products.length})
      </h2>
      
      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-slate-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="text-slate-400" size={32} />
          </div>
          <h3 className="font-semibold text-slate-700 text-lg mb-2">Belum ada produk</h3>
          <p className="text-slate-500">Mulai dengan menambahkan produk pertama Anda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map(product => (
            <div key={product.id} className="group relative bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-all duration-200 hover:border-slate-300">
              {/* Main Content */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg group-hover:text-slate-900 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-slate-600 font-medium">{product.category}</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      product.stock > 10 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : product.stock > 0 
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {product.stock > 0 ? `${product.stock} tersedia` : 'Stok habis'}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-xl text-emerald-600 group-hover:text-emerald-700 transition-colors">
                    {formatRupiah(product.price)}
                  </p>
                  <p className="text-slate-500 font-medium text-sm">
                    ID: {product.id}
                  </p>
                </div>
              </div>

              {/* Low Stock Warning */}
              {product.stock > 0 && product.stock <= 5 && (
                <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle size={14} />
                  <span className="font-medium">Stok hampir habis</span>
                </div>
              )}

              {/* Action Buttons (Optional - for future implementation) */}
              {(onEdit || onDelete) && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(product)}
                        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-xl transition-colors duration-200"
                        title="Edit produk"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(product.id)}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors duration-200"
                        title="Hapus produk"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Created Date (if available) */}
              {product.createdAt && (
                <div className="mt-3 text-xs text-slate-400">
                  Ditambahkan: {new Date(product.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {products.length > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-800">{products.length}</p>
            <p className="text-sm text-slate-600">Total Produk</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {products.reduce((sum, p) => sum + p.stock, 0)}
            </p>
            <p className="text-sm text-slate-600">Total Stok</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {products.filter(p => p.stock <= 5).length}
            </p>
            <p className="text-sm text-slate-600">Stok Rendah</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;