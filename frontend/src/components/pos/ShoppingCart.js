import React from 'react';
import { ShoppingCart as CartIcon, Plus, Minus, Trash2 } from 'lucide-react';

const ShoppingCart = ({ cart, removeFromCart, updateQuantity, formatRupiah }) => {
  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-slate-200/50">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <CartIcon className="text-slate-600" size={22} />
        Keranjang Belanja
      </h2>
      
      {cart.length === 0 ? (
        <div className="text-center py-12">
          <CartIcon className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-medium">Keranjang masih kosong</p>
          <p className="text-slate-400 text-sm mt-1">Pilih produk untuk memulai</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-200">
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800">{item.name}</h4>
                <p className="text-sm text-slate-600">{formatRupiah(item.price)}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center font-semibold text-slate-800">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="w-8 h-8 rounded-xl bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors ml-2"
                >
                  <Trash2 size={14} className="text-red-600" />
                </button>
              </div>
            </div>
          ))}
          
          <div className="border-t border-slate-200 pt-4 mt-6">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 text-lg">Total Pembayaran:</span>
              <span className="font-bold text-2xl text-emerald-600">{formatRupiah(getTotalAmount())}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;