import React, { useState } from 'react';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './pages/Dashboard';
import './index.css';

const App = () => {
  const [currentView, setCurrentView] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [storeInfo, setStoreInfo] = useState({
    name: 'Warung Yono',
    owner: 'Pemilik Toko',
    address: 'Jl. Buah Batu No. 88'
  });

  const handleLogin = (formData) => {
    if (!formData.email || !formData.password) {
      alert('Harap isi email dan password!');
      return;
    }
    
    setIsLoggedIn(true);
    setCurrentView('dashboard');
  };

  const handleRegister = (formData) => {
    if (!formData.storeName || !formData.ownerName || !formData.email || !formData.password) {
      alert('Harap lengkapi semua field yang wajib!');
      return;
    }
    
    setStoreInfo({
      name: formData.storeName,
      owner: formData.ownerName,
      address: formData.address || 'Alamat belum diset'
    });
    
    setIsLoggedIn(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('login');
  };

  if (currentView === 'login') {
    return (
      <LoginForm 
        onLogin={handleLogin}
        onSwitchToRegister={() => setCurrentView('register')}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <RegisterForm 
        onRegister={handleRegister}
        onSwitchToLogin={() => setCurrentView('login')}
      />
    );
  }

  return (
    <Dashboard 
      storeInfo={storeInfo}
      setStoreInfo={setStoreInfo}
      onLogout={handleLogout}
    />
  );
};

export default App;