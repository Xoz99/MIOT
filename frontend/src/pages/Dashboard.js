import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/layout/Header';
import Navigation from '../components/layout/Navigation';
import POSPage from './POSPage';
import ProductsPage from './ProductPage';
import SettingsPage from './SettingsPage';
import Pemasukan from './Pemasukan';
import OwnerPinProtection from '../components/auth/OwnerPinProtection';

const Dashboard = ({ storeInfo, setStoreInfo, onLogout, user, api }) => {
  // State untuk UI utama
  const [activeTab, setActiveTab] = useState('pos');
  const [rfidConnected, setRfidConnected] = useState(false);
  
  // State untuk proteksi PIN
  const [showOwnerPin, setShowOwnerPin] = useState(false);
  const [ownerAuthenticated, setOwnerAuthenticated] = useState(false);

  // State untuk Web Serial API
  const [serialPort, setSerialPort] = useState(null);
  const [rfidData, setRfidData] = useState({ uid: null, pin: null, timestamp: null });
  
  // State untuk produk & data
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState('');

  // State untuk keranjang belanja
  const [cart, setCart] = useState([]);

  // Refs untuk manajemen side-effect
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // --- LOGIKA WEB SERIAL API ---

  const processArduinoData = useCallback((data) => {
    const trimmedData = data.trim();
    console.log("Data Diterima dari Arduino:", trimmedData);

    if (trimmedData.startsWith("UID:")) {
      const uid = trimmedData.split(":")[1];
      console.log("New UID detected:", uid);
      
      // Set dengan timestamp untuk memaksa re-render
      setRfidData({ 
        uid: uid, 
        pin: null,
        timestamp: Date.now()
      });
    } else if (trimmedData.startsWith("PIN:")) {
      const pin = trimmedData.split(":")[1];
      console.log("PIN received:", pin);
      setRfidData(prev => ({ 
        ...prev, 
        pin: pin 
      }));
    } else {
      console.log("Data tidak dikenal diabaikan:", trimmedData);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    if (!serialPort) return;
    try {
      await serialPort.close();
      setSerialPort(null);
    } catch(err) {
      console.error("Gagal menutup port:", err);
    }
  }, [serialPort]);

  // useEffect untuk mengelola seluruh siklus hidup koneksi serial
  useEffect(() => {
    if (!serialPort) {
      setRfidConnected(false);
      return;
    }

    let reader;
    let keepReading = true;

    const readLoop = async () => {
      const textDecoder = new TextDecoderStream();
      try {
        serialPort.readable.pipeTo(textDecoder.writable);
        reader = textDecoder.readable.getReader();

        while (serialPort.readable && keepReading) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          const lines = value.split('\n');
          lines.forEach(line => {
            if (line.trim()) processArduinoData(line);
          });
        }
      } catch (error) {
        if (error.name !== 'DOMException') {
          console.error("Error saat membaca serial:", error);
        }
      }
    };

    readLoop();

    return () => {
      keepReading = false;
      if (reader) {
        reader.cancel().catch(() => {});
      }
      setRfidConnected(false);
    };
  }, [serialPort, processArduinoData]); 

  const handleConnect = useCallback(async () => {
    if (!('serial' in navigator)) {
      alert("Browser Anda tidak mendukung Web Serial API. Coba gunakan Google Chrome atau Edge.");
      return;
    }
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      setRfidConnected(true);
      setSerialPort(port);
    } catch (err) {
      console.error("Gagal memilih atau membuka port:", err);
    }
  }, []);
  
  // Clear RFID Data - PERBAIKAN
  const clearRfidData = useCallback(() => {
    console.log("Clearing RFID data...");
    setRfidData({ uid: null, pin: null, timestamp: null });
  }, []);

  // --- FUNGSI-FUNGSI APLIKASI LAINNYA ---

  const fetchProducts = useCallback(async () => {
    if (fetchingRef.current || !api || !user) return;
    
    fetchingRef.current = true;
    setLoadingProducts(true);
    setProductsError('');
    
    try {
      const response = await api.get('/products');
      if (!mountedRef.current) return;
      
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      if (!mountedRef.current) return;
      setProductsError(error.response?.data?.message || 'Gagal mengambil data produk');
    } finally {
      if (mountedRef.current) {
        setLoadingProducts(false);
      }
      fetchingRef.current = false;
    }
  }, [api, user]);

  useEffect(() => {
    mountedRef.current = true;
    if (user && api && products.length === 0 && !fetchingRef.current) {
      fetchProducts();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [user, api, fetchProducts, products.length]);

  const addToCart = useCallback((product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      
      if (existing) {
        const newQuantity = existing.quantity + 1;
        
        if (newQuantity > product.stock) {
          alert(`Stock tidak mencukupi!\n\nProduk: ${product.name}\nStock tersedia: ${product.stock}\nDi keranjang: ${existing.quantity}`);
          return prevCart;
        }
        
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        if (product.stock <= 0) {
          alert(`Stock habis!\n\nProduk: ${product.name}\nStock: 0`);
          return prevCart;
        }
        
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => {
      const cartItem = prevCart.find(item => item.id === productId);
      const product = products.find(p => p.id === productId);
      
      if (!cartItem || !product) return prevCart;
      
      if (newQuantity > product.stock) {
        alert(`Stock tidak mencukupi!\n\nProduk: ${product.name}\nStock tersedia: ${product.stock}\nYang diminta: ${newQuantity}`);
        return prevCart;
      }
      
      return prevCart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  }, [removeFromCart, products]);

  const addProduct = useCallback(async (productData) => {
    if (!api) return { success: false, error: 'API tidak tersedia' };
    
    setProductsError('');
    try {
      const response = await api.post('/products', {
        name: productData.name,
        price: parseInt(productData.price),
        stock: parseInt(productData.stock),
        category: productData.category || 'Lainnya'
      });

      if (response.data.success) {
        setProducts(prevProducts => [response.data.data, ...prevProducts]);
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Gagal menambahkan produk';
      setProductsError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [api]);

  const handlePaymentComplete = useCallback(() => {
    fetchProducts();
    setCart([]);
  }, [fetchProducts]);

  const handleTabChange = useCallback((tabId) => {
    if (tabId === 'pemasukan' && !ownerAuthenticated) {
      setShowOwnerPin(true);
      return;
    }
    setActiveTab(tabId);
  }, [ownerAuthenticated]);

  const handleOwnerPinSuccess = useCallback(() => {
    setOwnerAuthenticated(true);
    setActiveTab('pemasukan');
  }, []);

  const renderActiveTab = useCallback(() => {
    const commonProps = {
      loading: loadingProducts,
      error: productsError,
      api: api,
    };

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
            rfidData={rfidData}
            clearRfidData={clearRfidData}
            onPaymentComplete={handlePaymentComplete}
            {...commonProps}
          />
        );
      case 'products':
        return (
          <ProductsPage
            products={products}
            addProduct={addProduct}
            onRefresh={fetchProducts}
            {...commonProps}
          />
        );
      case 'pemasukan':
        return <Pemasukan storeInfo={storeInfo} user={user} {...commonProps} />;
      case 'settings':
        return (
          <SettingsPage 
            storeInfo={storeInfo} 
            setStoreInfo={setStoreInfo} 
            user={user} 
            rfidData={rfidData}
            {...commonProps}
          />
        );
      default:
        return null;
    }
  }, [
    activeTab, products, cart, addToCart, removeFromCart, updateQuantity,
    rfidConnected, rfidData, clearRfidData, handlePaymentComplete, api, 
    loadingProducts, productsError, addProduct, fetchProducts, storeInfo, 
    setStoreInfo, user
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header 
        storeInfo={storeInfo}
        rfidConnected={rfidConnected}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onLogout={onLogout}
      />
      
      <Navigation 
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      {productsError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{productsError}</p>
          </div>
        </div>
      )}

      {loadingProducts && products.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-slate-600">Memuat produk...</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveTab()}
      </main>

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