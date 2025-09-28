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
  const [rfidData, setRfidData] = useState({ uid: null, pin: null });
  
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
      setRfidData({ uid: uid, pin: null }); // Selalu reset state saat kartu baru di-scan
    } else if (trimmedData.startsWith("PIN:")) {
      const pin = trimmedData.split(":")[1];
      setRfidData(prev => ({ ...prev, pin: pin }));
    } else {
      console.log("Data tidak dikenal diabaikan:", trimmedData);
    }
  }, []);

 const handleDisconnect = useCallback(async () => {
    if (!serialPort) return;
    try {
        // Menutup port akan menyebabkan error di readLoop,
        // yang kemudian akan memicu cleanup di useEffect.
        await serialPort.close();
        setSerialPort(null); // Set port menjadi null untuk finalisasi state
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
        // Peringatan: readableStreamClosed tidak digunakan, tapi ini cara standar untuk setup
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
        // Error DOMException wajar terjadi saat port ditutup secara paksa
        if (error.name !== 'DOMException') {
            console.error("Error saat membaca serial:", error);
        }
      }
    };

    readLoop();

    // Fungsi cleanup: Ini adalah bagian terpenting
    return () => {
      keepReading = false;
      if (reader) {
        reader.cancel().catch(() => {}); // Cancel reader, abaikan error jika ada
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
      setSerialPort(port); // Set port di sini untuk memicu useEffect
    } catch (err) {
      console.error("Gagal memilih atau membuka port:", err);
    }
  }, []);
  
  // --- AKHIR DARI LOGIKA WEB SERIAL API ---


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
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
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
    } else {
      setCart(prevCart => prevCart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  }, [removeFromCart]);

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
    // Implementasi setelah pembayaran berhasil
    // Mungkin refresh produk dan membersihkan keranjang
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
            clearRfidData={() => setRfidData({ uid: null, pin: null })}
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
        return <SettingsPage 
                  storeInfo={storeInfo} 
                  setStoreInfo={setStoreInfo} 
                  user={user} 
                  {...commonProps}
                  rfidData={rfidData} // <-- TAMBAHKAN PROP INI
                />;
      default:
        return null;
    }
  }, [
    activeTab, products, cart, addToCart, removeFromCart, updateQuantity,
    rfidConnected, rfidData, handlePaymentComplete, api, loadingProducts, productsError,
    addProduct, fetchProducts, storeInfo, setStoreInfo, user
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
          {/* ... (Error Display JSX) ... */}
        </div>
      )}

      {loadingProducts && products.length === 0 && (
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* ... (Loading State JSX) ... */}
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