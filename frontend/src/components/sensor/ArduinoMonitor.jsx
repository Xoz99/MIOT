import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const ArduinoMonitor = () => {
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [rfidData, setRfidData] = useState(null);
  const [keypadData, setKeypadData] = useState(null);
  const [rfidHistory, setRfidHistory] = useState([]);
  const [keypadHistory, setKeypadHistory] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Check backend status
    axios.get('http://localhost:3001/api/status')
      .then(response => {
        setConnectionStatus(response.data.status === 'connected' ? 'Connected' : 'Disconnected');
      })
      .catch(error => {
        console.error('Error checking status:', error);
        setConnectionStatus('Error connecting to backend');
      });

    // Get initial data
    axios.get('http://localhost:3001/api/data')
      .then(response => {
        if (response.data.rfid) setRfidData(response.data.rfid);
        if (response.data.keypad) setKeypadData(response.data.keypad);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for RFID data
    socket.on('rfid-data', (data) => {
      setRfidData(data.id);
      setRfidHistory(prev => [...prev, { id: data.id, timestamp: new Date(data.timestamp) }].slice(-10));
    });

    // Listen for keypad data
    socket.on('keypad-data', (data) => {
      setKeypadData(data.input);
      setKeypadHistory(prev => [...prev, { input: data.input, timestamp: new Date(data.timestamp) }].slice(-10));
    });

    return () => {
      socket.off('rfid-data');
      socket.off('keypad-data');
    };
  }, [socket]);

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto my-8">
      <h1 className="text-2xl font-bold text-center mb-6">Arduino RFID & Keypad Monitor</h1>
      
      <div className="bg-gray-100 p-4 rounded-md mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Connection Status</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            connectionStatus === 'Connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {connectionStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RFID Card Section */}
        <div className="bg-blue-50 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-3">RFID Card</h2>
          <div className="bg-white p-4 rounded-md shadow-sm mb-4">
            <p className="text-gray-500 text-sm">Current Card ID:</p>
            <p className="text-xl font-mono">{rfidData || 'No card detected'}</p>
          </div>
          
          <h3 className="text-md font-medium mb-2">Recent Scans</h3>
          <div className="overflow-y-auto max-h-40">
            {rfidHistory.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {rfidHistory.map((item, index) => (
                  <li key={index} className="py-2">
                    <p className="font-mono">{item.id}</p>
                    <p className="text-xs text-gray-500">
                      {item.timestamp.toLocaleTimeString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No scan history</p>
            )}
          </div>
        </div>

        {/* Keypad Section */}
        <div className="bg-purple-50 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-3">Membrane Keypad</h2>
          <div className="bg-white p-4 rounded-md shadow-sm mb-4">
            <p className="text-gray-500 text-sm">Current Input:</p>
            <p className="text-xl font-mono">{keypadData || 'No input'}</p>
          </div>
          
          <h3 className="text-md font-medium mb-2">Recent Inputs</h3>
          <div className="overflow-y-auto max-h-40">
            {keypadHistory.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {keypadHistory.map((item, index) => (
                  <li key={index} className="py-2">
                    <p className="font-mono">{item.input}</p>
                    <p className="text-xs text-gray-500">
                      {item.timestamp.toLocaleTimeString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No input history</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArduinoMonitor;