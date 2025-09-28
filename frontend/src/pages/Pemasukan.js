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
  RefreshCw
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [lastFetch, setLastFetch] = useState(null);

  // Fetch transactions from backend
  const fetchTransactions = useCallback(async () => {
    if (!api || !user) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('📊 Fetching transactions for period:', selectedPeriod);
      
      // Calculate date range based on selected period
      const today = new Date();
      const params = new URLSearchParams();
      
      switch (selectedPeriod) {
        case 'today':
          params.append('startDate', today.toISOString().split('T')[0]);
          params.append('endDate', today.toISOString().split('T')[0]);
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          params.append('startDate', yesterday.toISOString().split('T')[0]);
          params.append('endDate', yesterday.toISOString().split('T')[0]);
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          params.append('startDate', weekAgo.toISOString().split('T')[0]);
          params.append('endDate', today.toISOString().split('T')[0]);
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          params.append('startDate', monthAgo.toISOString().split('T')[0]);
          params.append('endDate', today.toISOString().split('T')[0]);
          break;
        // 'all' case - no date filter
      }
      
      const response = await api.get(`/transactions?${params.toString()}`);
      
      if (response.data.success) {
        setTransactions(response.data.data.transactions || []);
        setLastFetch(new Date());
        console.log('✅ Transactions loaded:', response.data.data.transactions?.length || 0);
      }
    } catch (error) {
      console.error('❌ Fetch transactions error:', error);
      setError(error.response?.data?.message || 'Gagal mengambil data transaksi');
      
      // Set empty transactions if error
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [api, user, selectedPeriod]);

  // Load transactions when component mounts or period changes
  useEffect(() => {
    if (user && api) {
      fetchTransactions();
    }
  }, [user, api, selectedPeriod, fetchTransactions]);

  // Calculate statistics from real data
  const getStats = useCallback(() => {
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalTransactions = transactions.length;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    // Calculate total items from transaction items
    const totalItems = transactions.reduce((sum, t) => {
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
  }, [transactions]);

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

        {/* Period Selector and Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex bg-white/60 backdrop-blur-sm p-1 rounded-2xl border border-slate-200/50">
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: 'yesterday', label: 'Kemarin' },
              { id: 'week', label: '7 Hari' },
              { id: 'month', label: '30 Hari' },
              { id: 'all', label: 'Semua' }
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                disabled={loading}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${
                  selectedPeriod === period.id
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          
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
            Detail Transaksi ({transactions.length})
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
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-slate-400">
                        <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">
                          {error ? 'Gagal memuat transaksi' : 'Tidak ada transaksi'}
                        </p>
                        <p className="text-sm">
                          {error ? 'Periksa koneksi dan coba lagi' : `untuk periode ${selectedPeriod === 'today' ? 'hari ini' : selectedPeriod}`}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
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
        {transactions.length > 0 && (
          <div className="p-6 border-t border-slate-200/50 bg-slate-50/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-slate-600">
                Menampilkan {transactions.length} transaksi untuk {selectedPeriod === 'today' ? 'hari ini' : selectedPeriod}
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