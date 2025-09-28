import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './pages/Dashboard';
import RFIDCardRegistration from './components/rfid/RFIDCardRegistration';
import RFIDCardManagement from './components/rfid/RFIDCardManagement';
import CustomerRFIDRegistration from './components/rfid/CustomerRFIDRegistration';
import InStoreTopUp from './components/rfid/InStoreTopUp';
import './index.css';

// Backend API configuration
const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

const App = () => {
  // Enhanced state management untuk RFID system
  const [currentView, setCurrentView] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  
  // RFID Connection state - bisa diatur dari settings nanti
  const [rfidConnected, setRfidConnected] = useState(true);
  
  const [storeInfo, setStoreInfo] = useState({
    name: 'Loading...',
    owner: 'Loading...',
    address: 'Loading...'
  });

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchProfile();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        setStoreInfo({
          name: userData.storeName,
          owner: userData.ownerName,
          address: userData.address || 'Alamat belum diset'
        });
        setIsLoggedIn(true);
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      localStorage.removeItem('authToken');
    }
  };

  const handleLogin = async (formData) => {
    if (!formData.email || !formData.password) {
      setError('Harap isi email dan password!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        const { token, merchant } = response.data.data;
        
        localStorage.setItem('authToken', token);
        
        setUser(merchant);
        setStoreInfo({
          name: merchant.storeName,
          owner: merchant.ownerName,
          address: merchant.address || 'Alamat belum diset'
        });
        setIsLoggedIn(true);
        setCurrentView('dashboard');
        setError('');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login gagal. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (formData) => {
    if (!formData.storeName || !formData.ownerName || !formData.email || !formData.password) {
      setError('Harap lengkapi semua field yang wajib!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', {
        storeName: formData.storeName,
        ownerName: formData.ownerName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address
      });

      if (response.data.success) {
        const { token, merchant } = response.data.data;
        
        localStorage.setItem('authToken', token);
        
        setUser(merchant);
        setStoreInfo({
          name: merchant.storeName,
          owner: merchant.ownerName,
          address: formData.address || 'Alamat belum diset'
        });
        setIsLoggedIn(true);
        setCurrentView('dashboard');
        setError('');
      }
    } catch (error) {
      console.error('Register error:', error);
      setError(error.response?.data?.message || 'Registrasi gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setIsLoggedIn(false);
    setCurrentView('login');
    setError('');
    
    setStoreInfo({
      name: 'Warung Modern',
      owner: 'Pemilik Toko',
      address: 'Alamat belum diset'
    });
  };

  // All Navigation functions
  const showCardRegistration = () => {
    setCurrentView('card-registration');
    setError('');
  };

  const showCardManagement = () => {
    setCurrentView('card-management');
    setError('');
  };

  const showDashboard = () => {
    setCurrentView('dashboard');
    setError('');
  };

  // NEW: Customer RFID functions
  const showCustomerRegistration = () => {
    setCurrentView('customer-registration');
    setError('');
  };

  const showInStoreTopUp = () => {
    setCurrentView('in-store-topup');
    setError('');
  };

  // Handle successful operations
  const handleCardRegistered = (cardData) => {
    console.log('Card registered:', cardData);
    setCurrentView('card-management');
  };

  const handleSuccess = (data) => {
    console.log('Operation successful:', data);
    // Bisa redirect ke halaman yang sesuai atau show success message
  };

  // Render berdasarkan currentView
  if (currentView === 'login') {
    return (
      <LoginForm
        onLogin={handleLogin}
        onSwitchToRegister={() => setCurrentView('register')}
        loading={loading}
        error={error}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <RegisterForm
        onRegister={handleRegister}
        onSwitchToLogin={() => setCurrentView('login')}
        loading={loading}
        error={error}
        // INI YANG KURANG - props untuk navigation
        onShowCustomerRegistration={showCustomerRegistration}
        onShowInStoreTopUp={showInStoreTopUp}
      />
    );
  }

  // NEW: Customer Registration Page
  if (currentView === 'customer-registration') {
    return (
      <div>
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setCurrentView('register')}
            className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/50 hover:bg-slate-100 transition-colors flex items-center gap-2 text-slate-700 font-medium shadow-lg"
          >
            ← Kembali ke Register
          </button>
        </div>
        
        <CustomerRFIDRegistration 
          rfidConnected={rfidConnected}
          api={api}
          onSuccess={(data) => {
            console.log('Customer registration success:', data);
            setCurrentView('register');
          }}
        />
      </div>
    );
  }

  // NEW: In-Store Top Up Page
  if (currentView === 'in-store-topup') {
    return (
      <div>
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setCurrentView('register')}
            className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/50 hover:bg-slate-100 transition-colors flex items-center gap-2 text-slate-700 font-medium shadow-lg"
          >
            ← Kembali ke Register
          </button>
        </div>
        
        <InStoreTopUp 
          rfidConnected={rfidConnected}
          api={api}
          onSuccess={(data) => {
            console.log('Top up success:', data);
            setCurrentView('register');
          }}
        />
      </div>
    );
  }

  // RFID Card Registration Page (untuk merchant)
  if (currentView === 'card-registration') {
    return (
      <div>
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={showDashboard}
            className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/50 hover:bg-slate-100 transition-colors flex items-center gap-2 text-slate-700 font-medium shadow-lg"
          >
            ← Kembali ke Dashboard
          </button>
        </div>
        
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-600 transition-colors shadow-lg"
          >
            Logout
          </button>
        </div>
        
        <RFIDCardRegistration 
          rfidConnected={rfidConnected}
          onCardRegistered={handleCardRegistered}
          api={api}
        />
      </div>
    );
  }

  // RFID Card Management Page
  if (currentView === 'card-management') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={showDashboard}
              className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/50 hover:bg-slate-100 transition-colors flex items-center gap-2 text-slate-700 font-medium shadow-lg"
            >
              ← Kembali ke Dashboard
            </button>
            
            <div className="flex items-center gap-3">
              <span className="text-slate-600 text-sm">
                {storeInfo.name} | {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          
          <RFIDCardManagement 
            api={api}
            user={user}
            onShowRegistration={showCardRegistration}
          />
        </div>
      </div>
    );
  }

  // Default Dashboard
  return (
    <Dashboard
      storeInfo={storeInfo}
      setStoreInfo={setStoreInfo}
      onLogout={handleLogout}
      user={user}
      api={api}
      onShowCardRegistration={showCardRegistration}
      onShowCardManagement={showCardManagement}
      rfidConnected={rfidConnected}
      setRfidConnected={setRfidConnected}
    />
  );
};

export default App;