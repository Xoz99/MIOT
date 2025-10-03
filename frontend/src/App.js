import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './pages/Dashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

const API_BASE_URL = 'http://192.168.1.44:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// FIXED INTERCEPTOR - Pilih token berdasarkan route
api.interceptors.request.use((config) => {
  const isAdminRoute = config.url?.includes('/admin');
  const token = isAdminRoute 
    ? localStorage.getItem('adminToken')
    : localStorage.getItem('authToken');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const App = () => {
  const [currentView, setCurrentView] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [storeInfo, setStoreInfo] = useState({
    name: 'Loading...',
    owner: 'Loading...',
    address: 'Loading...'
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const merchantToken = localStorage.getItem('authToken');
    const adminToken = localStorage.getItem('adminToken');

    if (window.location.pathname === '/admin' && adminToken) {
      fetchAdminProfile();
    } else if (merchantToken) {
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

  const fetchAdminProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      if (response.data.success) {
        const userData = response.data.data;
        
        if (userData.role === 'admin') {
          setAdminUser(userData);
          setIsAdmin(true);
        } else {
          localStorage.removeItem('adminToken');
          setError('Akses ditolak');
        }
      }
    } catch (error) {
      console.error('Admin profile fetch error:', error);
      localStorage.removeItem('adminToken');
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
        
        // Clear admin token jika ada
        localStorage.removeItem('adminToken');
        localStorage.setItem('authToken', token);
        
        setUser({
          id: merchant.id,
          email: merchant.email,
          storeName: merchant.storeName,
          ownerName: merchant.ownerName,
          role: merchant.role || 'merchant'
        });
        
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

  const handleAdminLogin = async (formData) => {
    if (!formData.email || !formData.password) {
      setError('Harap isi email dan password!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/admin/auth/login', {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        const { token, admin } = response.data.data;
        
        // Clear merchant token jika ada
        localStorage.removeItem('authToken');
        localStorage.setItem('adminToken', token);
        
        setAdminUser(admin);
        setIsAdmin(true);
        setError('');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError(error.response?.data?.message || 'Login admin gagal');
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
        
        localStorage.removeItem('adminToken');
        localStorage.setItem('authToken', token);
        
        setUser({
          id: merchant.id,
          email: merchant.email,
          storeName: merchant.storeName,
          ownerName: merchant.ownerName,
          role: merchant.role || 'merchant'
        });
        
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

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    setAdminUser(null);
    setIsAdmin(false);
    setError('');
  };

  // ADMIN ROUTE
  if (window.location.pathname === '/admin') {
    if (isAdmin && adminUser) {
      return (
        <AdminDashboard
          admin={adminUser}
          api={api}
          onLogout={handleAdminLogout}
        />
      );
    }

    return (
      <AdminLoginPage
        onAdminLogin={handleAdminLogin}
        loading={loading}
        error={error}
      />
    );
  }

  // MERCHANT ROUTES
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
        api={api}
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