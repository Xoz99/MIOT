import React from 'react';
import { ShoppingCart, Package, Settings, TrendingUp } from 'lucide-react'; // Tambah TrendingUp

const Navigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'pos', name: 'Point of Sale', icon: ShoppingCart },
    { id: 'products', name: 'Kelola Produk', icon: Package },
    { id: 'pemasukan', name: 'Pemasukan', icon: TrendingUp }, // Tab baru
    { id: 'settings', name: 'Pengaturan', icon: Settings }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav className="flex space-x-2 mt-8 bg-white/60 backdrop-blur-sm p-2 rounded-2xl border border-slate-200/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg transform scale-105'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
          >
            <tab.icon size={18} />
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Navigation;