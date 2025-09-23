import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  CreditCard,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  PieChart,
  BarChart3
} from 'lucide-react';

const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));
};

const Pemasukan = ({ storeInfo }) => {
  // Sample data - nanti bisa dari backend
  const [transactions] = useState([
    { id: 1, date: '2024-09-23', amount: 125000, type: 'RFID', cardId: 'RF123456', items: 3, time: '14:30' },
    { id: 2, date: '2024-09-23', amount: 75000, type: 'RFID', cardId: 'RF789012', items: 2, time: '13:15' },
    { id: 3, date: '2024-09-23', amount: 50000, type: 'RFID', cardId: 'RF345678', items: 1, time: '12:45' },
    { id: 4, date: '2024-09-22', amount: 180000, type: 'RFID', cardId: 'RF901234', items: 5, time: '16:20' },
    { id: 5, date: '2024-09-22', amount: 95000, type: 'RFID', cardId: 'RF567890', items: 2, time: '15:30' },
    { id: 6, date: '2024-09-21', amount: 220000, type: 'RFID', cardId: 'RF234567', items: 7, time: '17:00' },
  ]);

  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Calculate statistics
  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let filteredTransactions = [];
    
    switch (selectedPeriod) {
      case 'today':
        filteredTransactions = transactions.filter(t => t.date === today);
        break;
      case 'yesterday':
        filteredTransactions = transactions.filter(t => t.date === yesterday);
        break;
      case 'week':
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        filteredTransactions = transactions.filter(t => t.date >= weekAgo);
        break;
      default:
        filteredTransactions = transactions;
    }

    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalTransactions = filteredTransactions.length;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const totalItems = filteredTransactions.reduce((sum, t) => sum + t.items, 0);

    return {
      totalRevenue,
      totalTransactions,
      averageTransaction,
      totalItems,
      transactions: filteredTransactions
    };
  };

  const stats = getStats();

  const StatCard = ({ title, value, icon: Icon, change, changeType = 'positive' }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 p-3 rounded-xl">
          <Icon className="text-emerald-600" size={24} />
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
            changeType === 'positive' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {changeType === 'positive' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {change}%
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-600 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <TrendingUp className="text-emerald-600" size={32} />
            Laporan Pemasukan
          </h1>
          <p className="text-slate-600 mt-2">Analisis pendapatan {storeInfo.name}</p>
        </div>

        {/* Period Selector */}
        <div className="flex bg-white/60 backdrop-blur-sm p-1 rounded-2xl border border-slate-200/50">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'yesterday', label: 'Kemarin' },
            { id: 'week', label: '7 Hari' },
            { id: 'all', label: 'Semua' }
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                selectedPeriod === period.id
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pemasukan"
          value={formatRupiah(stats.totalRevenue)}
          icon={DollarSign}
          change={12.5}
        />
        <StatCard
          title="Jumlah Transaksi"
          value={stats.totalTransactions.toLocaleString()}
          icon={CreditCard}
          change={8.2}
        />
        <StatCard
          title="Rata-rata Transaksi"
          value={formatRupiah(stats.averageTransaction)}
          icon={BarChart3}
          change={5.7}
        />
        <StatCard
          title="Total Item Terjual"
          value={stats.totalItems.toLocaleString()}
          icon={PieChart}
          change={15.3}
        />
      </div>

      {/* Transactions Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/50">
        <div className="p-6 border-b border-slate-200/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <Calendar className="text-slate-600" size={22} />
            Detail Transaksi ({stats.transactions.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Tanggal & Waktu
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Card ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Metode
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {stats.transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-slate-400">
                      <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Tidak ada transaksi</p>
                      <p className="text-sm">untuk periode yang dipilih</p>
                    </div>
                  </td>
                </tr>
              ) : (
                stats.transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-800">
                          {formatDate(transaction.date)}
                        </div>
                        <div className="text-sm text-slate-600">
                          {transaction.time}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded-lg text-sm">
                        {transaction.cardId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-800 font-medium">
                        {transaction.items} item{transaction.items > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-emerald-600 text-lg">
                        {formatRupiah(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <CreditCard size={14} />
                        {transaction.type}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        {stats.transactions.length > 0 && (
          <div className="p-6 border-t border-slate-200/50 bg-slate-50/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-slate-600">
                Menampilkan {stats.transactions.length} transaksi
              </div>
              <div className="flex items-center gap-6">
                <div className="text-slate-700">
                  <span className="text-sm">Total: </span>
                  <span className="font-bold text-xl text-emerald-600">
                    {formatRupiah(stats.totalRevenue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pemasukan;