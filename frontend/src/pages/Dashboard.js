import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Navigation from '../components/layout/Navigation';
import POSPage from './POSPage';
import ProductsPage from './ProductPage';
import SettingsPage from './SettingsPage';
import Pemasukan from './Pemasukan';
import OwnerPinProtection from '../components/auth/OwnerPinProtection';

const Dashboard = ({ storeInfo, setStoreInfo, onLogout }) => {
  const [activeTab, setActiveTab] = useState('pos');
  const [rfidConnected, setRfidConnected] = useState(false);
  
  // PIN Protection states
  const [showOwnerPin, setShowOwnerPin] = useState(false);
  const [ownerAuthenticated, setOwnerAuthenticated] = useState(false);
  
  // Products state
  const [products, setProducts] = useState([
    { id: 1, name: 'Nasi Gudeg Special', price: 18000, stock: 45, category: 'Makanan' },
    { id: 2, name: 'Es Kopi Susu', price: 12000, stock: 80, category: 'Minuman' },
    { id: 3, name: 'Keripik Singkong', price: 8000, stock: 25, category: 'Snack' },
    { id: 4, name: 'Ayam Geprek', price: 22000, stock: 30, category: 'Makanan' },
    { id: 5, name: 'Thai Tea', price: 10000, stock: 60, category: 'Minuman' },
    { id: 6, name: 'Martabak Mini', price: 15000, stock: 20, category: 'Snack' },
  ]);

  // Cart state
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const addProduct = (productData) => {
    const newProduct = {
      id: Date.now(),
      name: productData.name,
      price: parseInt(productData.price),
      stock: parseInt(productData.stock),
      category: productData.category || 'Lainnya'
    };
    setProducts([...products, newProduct]);
  };

  const handlePaymentComplete = (paymentResult) => {
    if (paymentResult.success) {
      setCart([]);
    }
  };

  // Handle tab navigation with PIN protection
  const handleTabChange = (tabId) => {
    if (tabId === 'pemasukan') {
      if (!ownerAuthenticated) {
        setShowOwnerPin(true);
        return;
      }
    }
    setActiveTab(tabId);
  };

  // Handle successful PIN authentication
  const handleOwnerPinSuccess = () => {
    setOwnerAuthenticated(true);
    setActiveTab('pemasukan');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'pos':
        return (
          <POSPage
            products={products}
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantity}
            rfidConnected={rfidConnected}
            onPaymentComplete={handlePaymentComplete}
          />
        );
      case 'products':
        return (
          <ProductsPage
            products={products}
            addProduct={addProduct}
          />
        );
      case 'pemasukan':
        return (
          <Pemasukan 
            storeInfo={storeInfo}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            storeInfo={storeInfo}
            setStoreInfo={setStoreInfo}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header 
        storeInfo={storeInfo}
        rfidConnected={rfidConnected}
        setRfidConnected={setRfidConnected}
        onLogout={onLogout}
      />
      
      <Navigation 
        activeTab={activeTab}
        setActiveTab={handleTabChange} // Updated to use handleTabChange
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveTab()}
      </main>

      {/* Owner PIN Protection Modal */}
      <OwnerPinProtection
        isOpen={showOwnerPin}
        onClose={() => setShowOwnerPin(false)}
        onSuccess={handleOwnerPinSuccess}
        title="Akses Laporan Pemasukan"
        description="Masukkan PIN Owner untuk melihat laporan keuangan"
      />
    </div>
  );
};

export default Dashboard;