import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const ConnectionStatus = () => {
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Check initial connection status
    axios.get('http://localhost:3001/api/status')
      .then(response => {
        setConnected(response.data.connected);
      })
      .catch(error => {
        console.error('Error checking status:', error);
        setConnected(false);
      });

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for reader status updates
    socket.on('reader-status', (data) => {
      setConnected(data.connected);
    });

    return () => {
      socket.off('reader-status');
    };
  }, [socket]);

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Status Pembaca</h2>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`font-medium ${connected ? 'text-green-600' : 'text-red-600'}`}>
            {connected ? 'Reader terhubung' : 'Reader tidak terhubung'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;