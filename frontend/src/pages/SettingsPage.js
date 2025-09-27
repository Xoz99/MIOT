import React from 'react';
import StoreSettings from '../components/settings/StoreSettings';
import CardManagement from '../components/settings/CardManagement'; // <-- 1. Import diperbaiki

// 2. Terima props baru: api dan rfidData
const SettingsPage = ({ storeInfo, setStoreInfo, api, rfidData, user }) => {
  return (
    // Kita gunakan space-y-8 agar ada jarak antara dua komponen
    <div className="space-y-8">
      {/* 3. Tampilkan komponen StoreSettings, teruskan props yang relevan */}
      <StoreSettings 
        storeInfo={storeInfo} 
        setStoreInfo={setStoreInfo} 
        api={api} 
      />
      
      {/* 4. Tampilkan komponen CardManagement dan teruskan props yang relevan */}
      <CardManagement 
        api={api} 
        rfidData={rfidData} 
      />
    </div>
  );
};

export default SettingsPage;