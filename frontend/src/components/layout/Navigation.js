import React from 'react';
import { ShoppingCart, Package, TrendingUp, Settings, Wallet, Shield } from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab, userRole }) => {
  console.log('🔍 Navigation userRole:', userRole); // DEBUG

  const tabs = [
    { id: 'pos', label: 'Point of Sale', icon: ShoppingCart, roles: ['merchant', 'admin'] },
    { id: 'topup', label: 'Top-Up', icon: Wallet, roles: ['merchant', 'admin'] },
    { id: 'products', label: 'Kelola Produk', icon: Package, roles: ['merchant'] },
    { id: 'admin', label: 'Admin Panel', icon: Shield, roles: ['admin'] },
    { id: 'pemasukan', label: 'Pemasukan', icon: TrendingUp, roles: ['merchant'] },
    { id: 'settings', label: 'Pengaturan', icon: Settings, roles: ['merchant', 'admin'] }
  ];

  const visibleTabs = tabs.filter(tab => 
    tab.roles.includes(userRole || 'merchant')
  );

  console.log('👁️ Visible tabs:', visibleTabs.map(t => t.label)); // DEBUG

  return (
    <nav className="bg-white shadow-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;