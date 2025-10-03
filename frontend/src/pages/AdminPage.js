import React, { useState, useEffect } from 'react';
import { Search, Shield, Lock, Unlock, Eye, Clock, AlertCircle, CheckCircle, TrendingUp, Users, CreditCard } from 'lucide-react';

const AdminPage = ({ api, formatRupiah }) => {
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, blocked

  useEffect(() => {
    fetchAllCards();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAllCards = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/cards');
      if (response.data.success) {
        setCards(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
      alert(error.response?.data?.message || 'Gagal memuat data kartu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCardHistory = async (cardId) => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/cards/${cardId}/history`);
      if (response.data.success) {
        setTransactions(response.data.data);
        setShowHistory(true);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      alert('Gagal memuat riwayat transaksi');
    } finally {
      setLoading(false);
    }
  };

  const toggleCardStatus = async (cardId, currentStatus) => {
    const action = currentStatus ? 'memblokir' : 'mengaktifkan';
    if (!window.confirm(`Apakah Anda yakin ingin ${action} kartu ini?`)) {
      return;
    }

    try {
      const response = await api.patch(`/admin/cards/${cardId}/toggle-status`);
      if (response.data.success) {
        fetchAllCards();
        fetchStats();
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert(error.response?.data?.message || 'Gagal mengubah status kartu');
    }
  };

  const filteredCards = cards
    .filter(card => {
        const matchSearch = card.cardId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.owner_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchFilter = filterStatus === 'all' ? true :
                         filterStatus === 'active' ? card.isActive :
                         !card.isActive;
      
      return matchSearch && matchFilter;
    });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Shield className="text-red-600" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Admin Panel</h1>
              <p className="text-slate-600">Manajemen & Monitoring Kartu RFID</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="text-blue-600" size={24} />
              </div>
              <p className="text-blue-700 text-sm font-medium mb-1">Total Kartu</p>
              <p className="text-3xl font-bold text-blue-800">{stats.totalCards}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl border-2 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <p className="text-green-700 text-sm font-medium mb-1">Kartu Aktif</p>
              <p className="text-3xl font-bold text-green-800">{stats.activeCards}</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-2xl border-2 border-red-200">
              <div className="flex items-center justify-between mb-2">
                <Lock className="text-red-600" size={24} />
              </div>
              <p className="text-red-700 text-sm font-medium mb-1">Kartu Diblokir</p>
              <p className="text-3xl font-bold text-red-800">{stats.blockedCards}</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-2xl border-2 border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="text-emerald-600" size={24} />
              </div>
              <p className="text-emerald-700 text-sm font-medium mb-1">Total Saldo</p>
              <p className="text-2xl font-bold text-emerald-800">{formatRupiah(stats.totalBalance)}</p>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Card ID atau Merchant..."
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-6 py-3 border-2 border-slate-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none bg-white"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="blocked">Diblokir</option>
          </select>
        </div>

        {/* Cards Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-red-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600">Memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border-2 border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Card ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Pemilik Kartu</th>                  <th className="text-right py-4 px-6 font-semibold text-slate-700">Saldo</th>
                  <th className="text-center py-4 px-6 font-semibold text-slate-700">Status</th>
                  <th className="text-center py-4 px-6 font-semibold text-slate-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.map((card) => (
                  <tr key={card.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-slate-800">{card.cardId}</span>
                    </td>
                    <td className="py-4 px-6">
  <div>
    <p className="font-semibold text-slate-800">
      {card.owner_name || 'Belum diisi'}
    </p>
  </div>
</td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-bold text-lg text-emerald-600">
                        {formatRupiah(card.balance)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {card.isActive ? (
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          <CheckCircle size={16} />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                          <AlertCircle size={16} />
                          Diblokir
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedCard(card);
                            fetchCardHistory(card.cardId);
                          }}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                          title="Lihat Riwayat"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          onClick={() => toggleCardStatus(card.cardId, card.isActive)}
                          className={`p-2 rounded-lg transition-colors ${
                            card.isActive
                              ? 'bg-red-100 hover:bg-red-200 text-red-700'
                              : 'bg-green-100 hover:bg-green-200 text-green-700'
                          }`}
                          title={card.isActive ? 'Blokir Kartu' : 'Aktifkan Kartu'}
                        >
                          {card.isActive ? <Lock size={20} /> : <Unlock size={20} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCards.length === 0 && (
              <div className="text-center py-16">
                <Users className="mx-auto mb-4 text-slate-400" size={64} />
                <p className="text-slate-500 text-lg">Tidak ada kartu ditemukan</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction History Modal */}
      {showHistory && selectedCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h2>
                  <div className="flex items-center gap-3 mt-2">
  <span className="font-mono font-bold text-blue-600">{selectedCard.cardId}</span>
  <span className="text-slate-500">•</span>
  <span className="text-slate-600">{selectedCard.owner_name || 'Pemilik'}</span>
</div>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-slate-500 hover:text-slate-700 text-3xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              {transactions.length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="mx-auto mb-4 text-slate-400" size={64} />
                  <p className="text-slate-500 text-lg">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${
                            tx.type === 'PAYMENT' 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {tx.type === 'PAYMENT' ? 'Pembayaran' : 'Top-Up'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            tx.type === 'PAYMENT' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {tx.type === 'PAYMENT' ? '-' : '+'} {formatRupiah(tx.amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-slate-600 mt-2">
                        <span>{new Date(tx.createdAt).toLocaleString('id-ID')}</span>
                        <span className="font-medium">Status: {tx.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;