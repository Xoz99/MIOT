import React from 'react';
import StoreSettings from '../components/settings/StoreSettings';

const SettingsPage = ({ storeInfo, setStoreInfo }) => {
  return (
    <div className="max-w-2xl">
      <StoreSettings storeInfo={storeInfo} setStoreInfo={setStoreInfo} />
    </div>
  );
};

export default SettingsPage;