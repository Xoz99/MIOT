import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './pages/Dashboard';
import './index.css';

// Backend API configuration
const API_BASE_URL = 'http://192.168.1.44:3001/api';

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

const App = () => {
  const [currentView, setCurrentView] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  
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
        
        // Save token to localStorage
        localStorage.setItem('authToken', token);
        
        // Update states
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
        
        // Save token to localStorage
        localStorage.setItem('authToken', token);
        
        // Update states
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
    // Clear token and user data
    localStorage.removeItem('authToken');
    setUser(null);
    setIsLoggedIn(false);
    setCurrentView('login');
    setError('');
    
    // Reset store info
    setStoreInfo({
      name: 'Warung Modern',
      owner: 'Pemilik Toko',
      address: 'Alamat belum diset'
    });
  };

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
      />
    );
  }

  return (
    <Dashboard
      storeInfo={storeInfo}
      setStoreInfo={setStoreInfo}
      onLogout={handleLogout}
      user={user}
      api={api}
    />
  );
};

export default App;