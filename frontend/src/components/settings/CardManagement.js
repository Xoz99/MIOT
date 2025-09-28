import React, { useState, useEffect, useCallback } from "react";
import { formatRupiah } from "../../utils/formatters";
import { CreditCard, PlusCircle } from "lucide-react";

const CardManagement = ({ api, rfidData }) => {
  const [cards, setCards] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [newCardId, setNewCardId] = useState("");
  const [newCardPin, setNewCardPin] = useState("");
  const [newCardBalance, setNewCardBalance] = useState("");

  const fetchCards = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    try {
      const response = await api.get("/cards");
      if (response.data.success) {
        setCards(response.data.data);
      }
    } catch (err) {
      setError("Gagal mengambil data kartu.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    if (rfidData && rfidData.uid) {
      const isRegistered = cards.some((card) => card.cardId === rfidData.uid);
      if (!isRegistered) {
        setNewCardId(rfidData.uid);
        alert(
          `Kartu baru terdeteksi: ${rfidData.uid}. Siap untuk didaftarkan.`
        );
      } else {
        alert(`Kartu ${rfidData.uid} sudah terdaftar.`);
      }
    }
  }, [rfidData, cards]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validasi frontend
    if (!newCardId.trim()) {
      setError("Card ID harus diisi");
      return;
    }

    if (!newCardPin.trim() || newCardPin.length !== 6) {
      setError("PIN harus 6 digit");
      return;
    }

    const balanceNum = parseFloat(newCardBalance || "0");
    if (isNaN(balanceNum) || balanceNum < 0) {
      setError("Saldo harus berupa angka positif");
      return;
    }

    try {
      // Ambil token dari localStorage atau context
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");

      if (!token) {
        setError("Anda harus login terlebih dahulu");
        return;
      }

      // Buat request dengan Authorization header
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const response = await api.post(
        "/cards/register",
        {
          cardId: newCardId,
          pin: newCardPin,
          balance: newCardBalance || "0",
        },
        config
      );

      if (response.data.success) {
        alert("Kartu berhasil didaftarkan!");
        setNewCardId("");
        setNewCardPin("");
        setNewCardBalance("");
        fetchCards();
      }
    } catch (err) {
      console.error("Error details:", err.response?.data);
      if (err.response?.status === 401) {
        setError("Sesi login telah berakhir. Silakan login kembali.");
      } else {
        setError(err.response?.data?.message || "Gagal mendaftarkan kartu.");
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Bagian Form Registrasi Kartu */}
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-slate-200/50">
        <div className="flex items-center gap-4 mb-6">
          <PlusCircle className="text-emerald-500" size={32} />
          <h2 className="text-2xl font-bold text-slate-800">
            Daftarkan Kartu RFID Baru
          </h2>
        </div>

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <form
          onSubmit={handleRegisterSubmit}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center"
        >
          <input
            type="text"
            placeholder="Scan Kartu untuk ID"
            value={newCardId}
            onChange={(e) => setNewCardId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl"
            required
            readOnly
          />
          <input
            type="password"
            placeholder="Buat 6 Digit PIN"
            value={newCardPin}
            onChange={(e) => setNewCardPin(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl"
            maxLength={6}
            required
          />
          <input
            type="number"
            placeholder="Saldo Awal (Rp)"
            value={newCardBalance}
            onChange={(e) => setNewCardBalance(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl"
            required
          />
          <button
            type="submit"
            className="w-full bg-emerald-500 text-white py-3 rounded-2xl font-semibold hover:bg-emerald-600"
          >
            Daftarkan
          </button>
        </form>
      </div>

      {/* Bagian Daftar Kartu Terdaftar */}
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-slate-200/50">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Daftar Kartu Terdaftar
        </h2>
        {loading ? (
          <p>Memuat...</p>
        ) : (
          <div className="space-y-4">
            {cards.length === 0 ? (
              <p className="text-slate-500">Belum ada kartu yang terdaftar.</p>
            ) : (
              cards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200"
                >
                  <div className="flex items-center gap-4">
                    <CreditCard className="text-slate-500" />
                    <div>
                      <p className="font-bold font-mono text-slate-700">
                        {card.cardId}
                      </p>
                      <p className="text-sm text-slate-500">
                        Status: {card.isActive ? "Aktif" : "Nonaktif"}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-emerald-600">
                    {formatRupiah(card.balance)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardManagement;
