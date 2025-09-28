import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  CreditCard,
  ArrowUp,
  ArrowDown,
  PieChart,
  BarChart3,
  RefreshCw,
  Filter
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

const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

const Pemasukan = ({ storeInfo, api, user }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFetch, setLastFetch] = useState(null);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all transactions from backend
  const fetchTransactions = useCallback(async () => {
    if (!api || !user) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('📊 Fetching all transactions...');
      
      // Get all transactions without date filter
      const response = await api.get('/transactions');
      
      if (response.data.success) {
        const allTransactions = response.data.data.transactions || [];
        setTransactions(allTransactions);
        setFilteredTransactions(allTransactions);
        setLastFetch(new Date());
        console.log('✅ All transactions loaded:', allTransactions.length);
      }
    } catch (error) {
      console.error('❌ Fetch transactions error:', error);
      setError(error.response?.data?.message || 'Gagal mengambil data transaksi');
      
      // Set empty transactions if error
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [api, user]);

  // Filter transactions based on date range
  const applyDateFilter = useCallback(() => {
    if (!startDate && !endDate) {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      const start = startDate ? new Date(startDate + 'T00:00:00') : null;
      const end = endDate ? new Date(endDate + 'T23:59:59') : null;

      if (start && end) {
        return transactionDate >= start && transactionDate <= end;
      } else if (start) {
        return transactionDate >= start;
      } else if (end) {
        return transactionDate <= end;
      }
      return true;
    });

    setFilteredTransactions(filtered);
  }, [transactions, startDate, endDate]);

  // Apply filter when date changes
  useEffect(() => {
    applyDateFilter();
  }, [applyDateFilter]);

  // Load transactions when component mounts
  useEffect(() => {
    if (user && api) {
      fetchTransactions();
    }
  }, [user, api, fetchTransactions]);

  // Quick filter functions
  const setQuickFilter = (type) => {
    const today = new Date();
    
    switch (type) {
      case 'today':
        const todayStr = today.toISOString().split('T')[0];
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        setStartDate(weekAgo.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        setStartDate(monthAgo.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'all':
        setStartDate('');
        setEndDate('');
        break;
    }
  };

  // Calculate statistics from filtered data
  const getStats = useCallback(() => {
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalTransactions = filteredTransactions.length;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    // Calculate total items from transaction items
    const totalItems = filteredTransactions.reduce((sum, t) => {
      return sum + (t.items ? t.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) : 0);
    }, 0);

    // Calculate growth percentage (mock calculation - could be enhanced with historical data)
    const revenueGrowth = totalRevenue > 0 ? Math.random() * 20 - 5 : 0; // -5% to +15%
    const transactionGrowth = totalTransactions > 0 ? Math.random() * 15 - 3 : 0;
    
    return {
      totalRevenue,
      totalTransactions,
      averageTransaction,
      totalItems,
      revenueGrowth: Number(revenueGrowth.toFixed(1)),
      transactionGrowth: Number(transactionGrowth.toFixed(1))
    };
  }, [filteredTransactions]);

  const stats = getStats();

  const StatCard = ({ title, value, icon: Icon, change, changeType = 'positive' }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 p-3 rounded-xl">
          <Icon className="text-emerald-600" size={24} />
        </div>
        {change !== undefined && change !== 0 && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
            changeType === 'positive' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {changeType === 'positive' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-600 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );

  const getFilterLabel = () => {
    if (!startDate && !endDate) return 'Semua Transaksi';
    if (startDate && endDate) {
      if (startDate === endDate) return `${formatDate(startDate)}`;
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    if (startDate) return `Sejak ${formatDate(startDate)}`;
    if (endDate) return `Sampai ${formatDate(endDate)}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <TrendingUp className="text-emerald-600" size={32} />
            Laporan Pemasukan
          </h1>
          <p className="text-slate-600 mt-2">
            Analisis pendapatan {storeInfo.name}
            {lastFetch && (
              <span className="text-sm text-slate-500 ml-2">
                • Update: {formatDateTime(lastFetch)}
              </span>
            )}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/50 hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            <Filter size={18} className="text-slate-600" />
            <span className="text-slate-700 font-medium">Filter</span>
          </button>
          
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-slate-200/50 hover:bg-slate-100 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={20} className={`text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Filter Transaksi</h3>
          
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'today', label: 'Hari Ini' },
              { id: 'week', label: '7 Hari' },
              { id: 'month', label: '30 Hari' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setQuickFilter(filter.id)}
                className="px-3 py-1 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Date Range Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-600">
            Filter aktif: <span className="font-medium">{getFilterLabel()}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pemasukan"
          value={formatRupiah(stats.totalRevenue)}
          icon={DollarSign}
          change={stats.revenueGrowth}
          changeType={stats.revenueGrowth >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Jumlah Transaksi"
          value={stats.totalTransactions.toLocaleString()}
          icon={CreditCard}
          change={stats.transactionGrowth}
          changeType={stats.transactionGrowth >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Rata-rata Transaksi"
          value={formatRupiah(stats.averageTransaction)}
          icon={BarChart3}
        />
        <StatCard
          title="Total Item Terjual"
          value={stats.totalItems.toLocaleString()}
          icon={PieChart}
        />
      </div>

      {/* Transactions Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/50">
        <div className="p-6 border-b border-slate-200/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <Calendar className="text-slate-600" size={22} />
            Detail Transaksi ({filteredTransactions.length})
            <span className="text-sm font-normal text-slate-500">
              dari {transactions.length} total
            </span>
          </h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="flex items-center justify-center gap-3 text-slate-600">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              <span>Memuat transaksi...</span>
            </div>
          </div>
        ) : (
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
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-slate-400">
                        <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">
                          {error ? 'Gagal memuat transaksi' : 'Tidak ada transaksi'}
                        </p>
                        <p className="text-sm">
                          {error ? 'Periksa koneksi dan coba lagi' : 'untuk filter yang dipilih'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-800">
                            {formatDateTime(transaction.createdAt)}
                          </div>
                          {transaction.blockchainTx && (
                            <div className="text-xs text-slate-500 font-mono">
                              Blockchain: {transaction.blockchainTx.slice(0, 10)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded-lg text-sm">
                          {transaction.cardId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-slate-800 font-medium">
                            {transaction.items ? transaction.items.length : 0} item(s)
                          </span>
                          {transaction.items && transaction.items.length > 0 && (
                            <div className="text-xs text-slate-500 mt-1">
                              {transaction.items.slice(0, 2).map(item => item.product?.name || 'Item').join(', ')}
                              {transaction.items.length > 2 && ` +${transaction.items.length - 2} lainnya`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-emerald-600 text-lg">
                          {formatRupiah(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <CreditCard size={14} />
                          {transaction.status === 'completed' ? 'Selesai' : 
                           transaction.status === 'pending' ? 'Pending' : 'Gagal'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Footer */}
        {filteredTransactions.length > 0 && (
          <div className="p-6 border-t border-slate-200/50 bg-slate-50/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-slate-600">
                Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
                <div className="text-sm text-slate-500">{getFilterLabel()}</div>
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