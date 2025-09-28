import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  Plus, 
  Users, 
  Wallet,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Search,
  Phone,
  Calendar,
  TrendingUp,
  AlertCircle
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

const RFIDCardManagement = ({ api, user, onShowRegistration }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(50000);

  // Fetch registered cards
  const fetchCards = useCallback(async () => {
    if (!api || !user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/rfid/cards');
      
      if (response.data.success) {
        setCards(response.data.data);
        console.log('✅ Cards loaded:', response.data.data.length);
      }
    } catch (error) {
      console.error('❌ Fetch cards error:', error);
      setError(error.response?.data?.message || 'Gagal mengambil data kartu');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [api, user]);

  // Load cards on mount
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Toggle card status
  const toggleCardStatus = async (cardId, currentStatus) => {
    try {
      const response = await api.put(`/rfid/cards/${cardId}/status`, {
        isActive: !currentStatus
      });

      if (response.data.success) {
        // Update local state
        setCards(prevCards => 
          prevCards.map(card => 
            card.cardId === cardId 
              ? { ...card, isActive: !currentStatus }
              : card
          )
        );
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Gagal mengupdate status kartu');
    }
  };

  // Top up balance
  const handleTopUp = async () => {
    if (!selectedCard) return;
    
    try {
      const response = await api.post(`/rfid/cards/${selectedCard.cardId}/topup`, {
        amount: parseInt(topUpAmount)
      });

      if (response.data.success) {
        // Update local state
        setCards(prevCards => 
          prevCards.map(card => 
            card.cardId === selectedCard.cardId 
              ? { ...card, balance: response.data.data.balance }
              : card
          )
        );
        
        setShowTopUp(false);
        setSelectedCard(null);
        setTopUpAmount(50000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Gagal melakukan top up');
    }
  };

  // Filter cards based on search
  const filteredCards = cards.filter(card => 
    card.cardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (card.phone && card.phone.includes(searchTerm))
  );

  // Statistics
  const stats = {
    totalCards: cards.length,
    activeCards: cards.filter(card => card.isActive).length,
    totalBalance: cards.reduce((sum, card) => sum + card.balance, 0),
    totalTransactions: cards.reduce((sum, card) => sum + (card._count?.transactions || 0), 0)
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
      <div className="flex items-center gap-4">
        <div className={`bg-gradient-to-br from-${color}-100 to-${color}-200 p-3 rounded-xl`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
        <div>
          <p className="text-slate-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <CreditCard className="text-blue-600" size={32} />
            Manajemen Kartu RFID
          </h1>
          <p className="text-slate-600 mt-2">Kelola kartu RFID yang terdaftar</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onShowRegistration}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <Plus size={18} />
            Daftarkan Kartu
          </button>
          
          <button
            onClick={fetchCards}
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-2">
          <AlertCircle size={16} />
          <span className="font-medium">{error}</span>
          <button 
            onClick={() => setError('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Kartu"
          value={stats.totalCards}
          icon={CreditCard}
          color="blue"
        />
        <StatCard
          title="Kartu Aktif"
          value={stats.activeCards}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Total Saldo"
          value={formatRupiah(stats.totalBalance)}
          icon={Wallet}
          color="emerald"
        />
        <StatCard
          title="Total Transaksi"
          value={stats.totalTransactions}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Search and Cards List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/50">
        <div className="p-6 border-b border-slate-200/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-800">
              Daftar Kartu RFID ({filteredCards.length})
            </h2>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari kartu, nama, atau telepon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="flex items-center justify-center gap-3 text-slate-600">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              <span>Memuat kartu...</span>
            </div>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard size={48} className="mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600 font-medium">
              {cards.length === 0 ? 'Belum ada kartu terdaftar' : 'Tidak ada kartu yang sesuai pencarian'}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {cards.length === 0 ? 'Daftarkan kartu RFID pertama Anda' : 'Coba kata kunci yang berbeda'}
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCards.map((card) => (
                <div
                  key={card.cardId}
                  className={`bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border transition-all duration-200 hover:shadow-lg ${
                    card.isActive 
                      ? 'border-green-200 hover:border-green-300' 
                      : 'border-red-200 hover:border-red-300 opacity-75'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        card.isActive ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <CreditCard 
                          size={20} 
                          className={card.isActive ? 'text-green-600' : 'text-red-600'} 
                        />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-slate-800">{card.cardId}</p>
                        <p className={`text-xs font-medium ${
                          card.isActive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {card.isActive ? 'Aktif' : 'Nonaktif'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Toggle Status */}
                    <button
                      onClick={() => toggleCardStatus(card.cardId, card.isActive)}
                      className="p-1 rounded-lg hover:bg-slate-200 transition-colors"
                      title={card.isActive ? 'Nonaktifkan kartu' : 'Aktifkan kartu'}
                    >
                      {card.isActive ? (
                        <ToggleRight className="text-green-600" size={24} />
                      ) : (
                        <ToggleLeft className="text-red-600" size={24} />
                      )}
                    </button>
                  </div>

                  {/* Card Info */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-slate-600 text-sm">Pemilik</p>
                      <p className="font-semibold text-slate-800">{card.ownerName}</p>
                    </div>
                    
                    {card.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-500" />
                        <p className="text-slate-600 text-sm">{card.phone}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 text-sm">Saldo</p>
                        <p className="font-bold text-xl text-emerald-600">
                          {formatRupiah(card.balance)}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedCard(card);
                          setShowTopUp(true);
                        }}
                        disabled={!card.isActive}
                        className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Top Up
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(card.createdAt)}
                      </div>
                      <div>
                        {card._count?.transactions || 0} transaksi
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      {showTopUp && selectedCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">Top Up Saldo</h3>
              <p className="text-slate-600 mt-1">Kartu: {selectedCard.cardId}</p>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Saldo saat ini: <span className="font-bold text-emerald-600">{formatRupiah(selectedCard.balance)}</span>
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Jumlah Top Up
                </label>
                <select
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={25000}>Rp 25,000</option>
                  <option value={50000}>Rp 50,000</option>
                  <option value={100000}>Rp 100,000</option>
                  <option value={200000}>Rp 200,000</option>
                  <option value={500000}>Rp 500,000</option>
                </select>
                
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-blue-800 text-sm">
                    Saldo setelah top up: <span className="font-bold">
                      {formatRupiah(selectedCard.balance + parseInt(topUpAmount))}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTopUp(false);
                    setSelectedCard(null);
                  }}
                  className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleTopUp}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                >
                  Top Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFIDCardManagement;