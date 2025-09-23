import React from 'react';
import { Store, Wifi, WifiOff, LogOut } from 'lucide-react';

const Header = ({ storeInfo, rfidConnected, setRfidConnected, onLogout }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
              <Store className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{storeInfo.name}</h1>
              <p className="text-slate-600 font-medium">{storeInfo.owner}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-medium shadow-md ${
              rfidConnected 
                ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300' 
                : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-300'
            }`}>
              {rfidConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
              <span>{rfidConnected ? 'RFID Terhubung' : 'RFID Terputus'}</span>
            </div>
            
            <button 
              onClick={() => setRfidConnected(!rfidConnected)}
              className={`px-6 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                rfidConnected 
                  ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white hover:from-slate-600 hover:to-slate-700'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
              }`}
            >
              {rfidConnected ? 'Putuskan' : 'Hubungkan'}
            </button>
            
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium transition-colors px-4 py-2 rounded-2xl hover:bg-slate-100"
            >
              <LogOut size={20} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;