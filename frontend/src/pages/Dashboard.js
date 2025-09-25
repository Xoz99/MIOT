import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/layout/Header';
import Navigation from '../components/layout/Navigation';
import POSPage from './POSPage';
import ProductsPage from './ProductPage';
import SettingsPage from './SettingsPage';
import Pemasukan from './Pemasukan';
import OwnerPinProtection from '../components/auth/OwnerPinProtection';

const Dashboard = ({ storeInfo, setStoreInfo, onLogout, user, api }) => {
  const [activeTab, setActiveTab] = useState('pos');
  const [rfidConnected, setRfidConnected] = useState(false);
  
  // PIN Protection states
  const [showOwnerPin, setShowOwnerPin] = useState(false);
  const [ownerAuthenticated, setOwnerAuthenticated] = useState(false);
  
  // Products state with API - START WITH EMPTY ARRAY
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState('');

  // Cart state
  const [cart, setCart] = useState([]);

  // Prevent multiple API calls with refs
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // Memoized fetchProducts to avoid recreating function
  const fetchProducts = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchingRef.current || !api || !user) return;
    
    console.log('🔄 Fetching products for user:', user.id);
    fetchingRef.current = true;
    setLoadingProducts(true);
    setProductsError('');
    
    try {
      const response = await api.get('/products');
      
      // Check if component is still mounted
      if (!mountedRef.current) return;
      
      if (response.data.success) {
        setProducts(response.data.data);
        console.log('✅ Products loaded:', response.data.data.length);
      }
    } catch (error) {
      if (!mountedRef.current) return;
      
      console.error('❌ Fetch products error:', error);
      setProductsError(error.response?.data?.message || 'Gagal mengambil data produk');
    } finally {
      if (mountedRef.current) {
        setLoadingProducts(false);
      }
      fetchingRef.current = false;
    }
  }, [api, user]);

  // Load products only once when component mounts and user/api are available
  useEffect(() => {
    mountedRef.current = true;
    
    if (user && api && products.length === 0 && !fetchingRef.current) {
      console.log('🚀 Initial products fetch for dashboard');
      fetchProducts();
    }

    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, [user, api, fetchProducts, products.length]);

  // Cart functions
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
    if (newQuantity === 0) {
      removeFromCart(productId);
    } else {
      setCart(prevCart => prevCart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  }, [removeFromCart]);

  // Add product function with optimized refresh
  const addProduct = useCallback(async (productData) => {
    if (!api) return { success: false, error: 'API tidak tersedia' };
    
    setProductsError('');
    try {
      console.log('➕ Adding new product:', productData.name);
      
      const response = await api.post('/products', {
        name: productData.name,
        price: parseInt(productData.price),
        stock: parseInt(productData.stock),
        category: productData.category || 'Lainnya'
      });

      if (response.data.success) {
        console.log('✅ Product added successfully:', response.data.data);
        
        // Add the new product to existing state instead of full refresh
        setProducts(prevProducts => [response.data.data, ...prevProducts]);
        
        return { success: true };
      }
    } catch (error) {
      console.error('❌ Add product error:', error);
      const errorMessage = error.response?.data?.message || 'Gagal menambahkan produk';
      setProductsError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [api]);

  // Handle payment complete with stock update
  const handlePaymentComplete = useCallback(async (paymentResult) => {
    if (paymentResult.success && cart.length > 0) {
      console.log('💳 Payment completed, updating product stock');
      
      // Update product stock locally first for immediate UI update
      setProducts(prevProducts => 
        prevProducts.map(product => {
          const cartItem = cart.find(item => item.id === product.id);
          if (cartItem) {
            return {
              ...product,
              stock: Math.max(0, product.stock - cartItem.quantity)
            };
          }
          return product;
        })
      );
      
      // Clear cart
      setCart([]);
      
      // Optional: Refresh products from server to sync with backend
      // setTimeout(() => fetchProducts(), 1000);
    }
  }, [cart]);

  // Handle tab navigation with PIN protection
  const handleTabChange = useCallback((tabId) => {
    if (tabId === 'pemasukan') {
      if (!ownerAuthenticated) {
        setShowOwnerPin(true);
        return;
      }
    }
    setActiveTab(tabId);
  }, [ownerAuthenticated]);

  // Handle successful PIN authentication
  const handleOwnerPinSuccess = useCallback(() => {
    setOwnerAuthenticated(true);
    setActiveTab('pemasukan');
  }, []);

  // Memoized render functions to prevent unnecessary re-renders
  const renderActiveTab = useCallback(() => {
    const commonProps = {
      loading: loadingProducts,
      error: productsError
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
            onPaymentComplete={handlePaymentComplete}
            api={api}
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
        return (
          <Pemasukan 
            storeInfo={storeInfo}
            api={api}
            user={user}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            storeInfo={storeInfo}
            setStoreInfo={setStoreInfo}
            user={user}
            api={api}
          />
        );
      default:
        return null;
    }
  }, [
    activeTab, products, cart, addToCart, removeFromCart, updateQuantity,
    rfidConnected, handlePaymentComplete, api, loadingProducts, productsError,
    addProduct, fetchProducts, storeInfo, setStoreInfo, user
  ]);

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
        setActiveTab={handleTabChange}
      />

      {/* Global Error Display */}
      {productsError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between">
            <span>{productsError}</span>
            <button 
              onClick={() => setProductsError('')}
              className="text-red-500 hover:text-red-700 ml-4 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Loading State for Initial Load */}
      {loadingProducts && products.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-slate-200/50">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                <span>Memuat dashboard...</span>
              </div>
            </div>
          </div>
        </div>
      )}

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