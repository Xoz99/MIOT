import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import PinVerificationModal from './PinVerificationModal';

const PaymentPanel = ({ totalAmount = 'Rp 50.000' }) => {
  const [rfidData, setRfidData] = useState(null);
  const [isReaderConnected, setIsReaderConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Check initial reader status
    axios.get('http://localhost:3001/api/status')
      .then(response => {
        setIsReaderConnected(response.data.connected);
      })
      .catch(error => {
        console.error('Error fetching reader status:', error);
        setIsReaderConnected(false);
      });

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for reader status updates
    socket.on('reader-status', (data) => {
      setIsReaderConnected(data.connected);
    });

    // Listen for RFID data
    socket.on('rfid-data', (data) => {
      setRfidData(data.id);
      setIsVerifying(true);
      setMessage({ type: 'info', text: 'Mendeteksi kartu RFID...' });
      
      // Open PIN verification modal
      setTimeout(() => {
        setIsPinModalOpen(true);
        setMessage(null);
      }, 1000);
    });

    return () => {
      socket.off('reader-status');
      socket.off('rfid-data');
    };
  }, [socket]);

  const handlePinConfirm = (pin) => {
    setIsProcessing(true);
    
    // Process payment with PIN verification
    axios.post('http://localhost:3001/api/transaction', {
      rfid_id: rfidData,
      pin: pin,
      amount: totalAmount.replace(/[^0-9]/g, '') // Extract numeric value
    })
      .then(response => {
        setMessage({ type: 'success', text: 'Pembayaran berhasil!' });
        setIsPinModalOpen(false);
        setIsVerifying(false);
        
        // Reset after successful payment
        setTimeout(() => {
          setRfidData(null);
          setMessage(null);
          setIsProcessing(false);
        }, 3000);
      })
      .catch(error => {
        console.error('Error processing payment:', error);
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.error || 'Gagal memproses pembayaran' 
        });
        setIsPinModalOpen(false);
        
        // Allow retry after error
        setTimeout(() => {
          setIsProcessing(false);
          setIsVerifying(false);
        }, 3000);
      });
  };

  const handlePinModalClose = () => {
    setIsPinModalOpen(false);
    setIsVerifying(false);
    setRfidData(null);
    setMessage(null);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Pembayaran RFID</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'error' ? 'bg-red-100 text-red-700' : 
          message.type === 'success' ? 'bg-green-100 text-green-700' : 
          'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className={`p-4 rounded-md mb-6 flex items-center ${
        isReaderConnected ? 'bg-green-100' : 'bg-yellow-100'
      }`}>
        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
          isReaderConnected ? 'bg-green-500' : 'bg-yellow-500'
        }`}></span>
        <span>
          {isReaderConnected 
            ? 'Reader siap menerima kartu' 
            : 'Reader tidak terhubung'}
        </span>
      </div>
      
      {isVerifying ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Mendeteksi kartu RFID...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          {isReaderConnected ? (
            <>
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">Tempelkan kartu pada reader</p>
              <p className="text-sm text-gray-500">Total: {totalAmount}</p>
            </>
          ) : (
            <p className="text-yellow-600">Menunggu reader terhubung...</p>
          )}
        </div>
      )}
      
      <PinVerificationModal
        isOpen={isPinModalOpen}
        cardId={rfidData || ''}
        totalAmount={totalAmount}
        onClose={handlePinModalClose}
        onConfirm={handlePinConfirm}
      />
    </div>
  );
};

export default PaymentPanel;