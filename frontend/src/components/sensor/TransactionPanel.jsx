import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const TransactionPanel = () => {
  const [rfidData, setRfidData] = useState(null);
  const [keypadData, setKeypadData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionType, setTransactionType] = useState('masuk');
  const [socket, setSocket] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Get recent RFID readings
    axios.get('http://localhost:3001/api/rfid')
      .then(response => {
        if (response.data.length > 0) {
          setRfidData(response.data[0].card_id);
        }
      })
      .catch(error => {
        console.error('Error fetching RFID data:', error);
      });

    // Get recent keypad inputs
    axios.get('http://localhost:3001/api/keypad')
      .then(response => {
        if (response.data.length > 0) {
          setKeypadData(response.data[0].input_value);
        }
      })
      .catch(error => {
        console.error('Error fetching keypad data:', error);
      });

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for new RFID data
    socket.on('rfid-data', (data) => {
      setRfidData(data.id);
      setMessage({ type: 'info', text: 'Kartu RFID terdeteksi' });
      setTimeout(() => setMessage(null), 3000);
    });

    // Listen for new keypad data
    socket.on('keypad-data', (data) => {
      setKeypadData(data.input);
      setMessage({ type: 'info', text: 'Input keypad diterima' });
      setTimeout(() => setMessage(null), 3000);
    });

    // Listen for new transactions
    socket.on('new-transaction', (data) => {
      setTransactions(prev => [data, ...prev].slice(0, 10));
    });

    return () => {
      socket.off('rfid-data');
      socket.off('keypad-data');
      socket.off('new-transaction');
    };
  }, [socket]);

  const handleTransaction = () => {
    if (!rfidData && !keypadData) {
      setMessage({ type: 'error', text: 'Diperlukan kartu RFID atau input keypad' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setProcessing(true);
    
    axios.post('http://localhost:3001/api/transaction', {
      rfid_id: rfidData,
      keypad_code: keypadData,
      transaction_type: transactionType
    })
      .then(response => {
        setMessage({ 
          type: 'success', 
          text: `Transaksi ${transactionType} berhasil` 
        });
        setTimeout(() => setMessage(null), 3000);
      })
      .catch(error => {
        console.error('Error processing transaction:', error);
        setMessage({ 
          type: 'error', 
          text: 'Gagal memproses transaksi' 
        });
        setTimeout(() => setMessage(null), 3000);
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Transaksi</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'error' ? 'bg-red-100 text-red-700' : 
          message.type === 'success' ? 'bg-green-100 text-green-700' : 
          'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Kartu RFID</h3>
          <p className="font-mono bg-gray-100 p-2 rounded">
            {rfidData || 'Belum ada kartu terdeteksi'}
          </p>
        </div>
        
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Input Keypad</h3>
          <p className="font-mono bg-gray-100 p-2 rounded">
            {keypadData || 'Belum ada input keypad'}
          </p>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block mb-2 font-medium">Jenis Transaksi</label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="transactionType"
              value="masuk"
              checked={transactionType === 'masuk'}
              onChange={() => setTransactionType('masuk')}
            />
            <span className="ml-2">Masuk</span>
          </label>
          
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="transactionType"
              value="keluar"
              checked={transactionType === 'keluar'}
              onChange={() => setTransactionType('keluar')}
            />
            <span className="ml-2">Keluar</span>
          </label>
        </div>
      </div>
      
      <button
        className={`w-full py-2 px-4 rounded-md font-medium ${
          processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        onClick={handleTransaction}
        disabled={processing}
      >
        {processing ? 'Memproses...' : 'Proses Transaksi'}
      </button>
      
      <div className="mt-8">
        <h3 className="font-medium mb-3">Riwayat Transaksi Terbaru</h3>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFID/Keypad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.transaction_type === 'masuk' ? 'Masuk' : 'Keluar'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {transaction.rfid_id || transaction.keypad_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Belum ada transaksi</p>
        )}
      </div>
    </div>
  );
};

export default TransactionPanel;