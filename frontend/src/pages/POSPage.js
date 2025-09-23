import React from 'react';
import ProductGrid from '../components/pos/ProductGrid';
import ShoppingCart from '../components/pos/ShoppingCart';
import RFIDPayment from '../components/pos/RFIDPayment';
import { formatRupiah } from '../utils/formatters';

const POSPage = ({ 
  products, 
  cart, 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  rfidConnected, 
  onPaymentComplete 
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Products Grid */}
      <div className="lg:col-span-2">
        <ProductGrid 
          products={products}
          addToCart={addToCart}
          formatRupiah={formatRupiah}
        />
      </div>

      {/* Cart & Payment */}
      <div className="space-y-8">
        <ShoppingCart
          cart={cart}
          removeFromCart={removeFromCart}
          updateQuantity={updateQuantity}
          formatRupiah={formatRupiah}
        />
        
        <RFIDPayment
          cart={cart}
          formatRupiah={formatRupiah}
          rfidConnected={rfidConnected}
          onPaymentComplete={onPaymentComplete}
        />
      </div>
    </div>
  );
};

export default POSPage;