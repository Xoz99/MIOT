#!/usr/bin/env python3
"""
RFID Bridge - Menghubungkan Arduino RFID dengan Backend API
Compatible dengan format Arduino: UID:xxx, PIN:xxx, SYSTEM READY, PIN_CLEARED
"""

import serial
import requests
import asyncio
import websockets
import json
import time
import logging
import os
from threading import Thread
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("rfid_bridge.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("RFIDBridge")

class RFIDBridge:
    def __init__(self):
        # Serial Configuration
        self.serial_port = os.getenv('SERIAL_PORT', 'COM4')
        self.baud_rate = int(os.getenv('BAUD_RATE', '9600'))
        self.serial_conn = None
        
        # API Configuration
        self.api_base_url = os.getenv('API_BASE_URL', 'http://localhost:3001/api')
        self.api_token = os.getenv('API_TOKEN', '')
        
        # WebSocket Configuration
        self.ws_port = int(os.getenv('WS_PORT', '8765'))
        self.connected_clients = set()
        
        # State Management
        self.current_card_id = None
        self.transaction_state = "idle"  # idle, waiting_pin, processing
        self.session_data = {}
        
    async def start_websocket_server(self):
        """Start WebSocket server untuk real-time communication dengan frontend"""
        async def handle_client(websocket, path):
            logger.info(f"New WebSocket client connected: {websocket.remote_address}")
            self.connected_clients.add(websocket)
            try:
                await websocket.wait_closed()
            finally:
                self.connected_clients.remove(websocket)
                logger.info(f"WebSocket client disconnected: {websocket.remote_address}")
        
        server = await websockets.serve(handle_client, "localhost", self.ws_port)
        logger.info(f"WebSocket server started on ws://localhost:{self.ws_port}")
        return server
    
    async def broadcast_to_clients(self, message):
        """Broadcast message ke semua connected WebSocket clients"""
        if self.connected_clients:
            disconnected = set()
            for client in self.connected_clients:
                try:
                    await client.send(json.dumps(message))
                except websockets.exceptions.ConnectionClosed:
                    disconnected.add(client)
            
            # Remove disconnected clients
            self.connected_clients -= disconnected
    
    def connect_serial(self):
        """Connect ke Arduino via serial"""
        try:
            self.serial_conn = serial.Serial(
                port=self.serial_port,
                baudrate=self.baud_rate,
                timeout=1
            )
            logger.info(f"Connected to Arduino on {self.serial_port}")
            return True
        except serial.SerialException as e:
            logger.error(f"Failed to connect to Arduino: {e}")
            return False
    
    def send_api_request(self, endpoint, method='GET', data=None):
        """Send request ke backend API"""
        url = f"{self.api_base_url}{endpoint}"
        headers = {
            'Content-Type': 'application/json'
        }
        
        if self.api_token:
            headers['Authorization'] = f"Bearer {self.api_token}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=data)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=data)
            
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            return {"success": False, "message": str(e)}
    
    async def handle_card_scan(self, card_id):
        """Handle ketika kartu RFID di-scan"""
        logger.info(f"Card scanned: {card_id}")
        
        self.current_card_id = card_id
        self.transaction_state = "waiting_pin"
        
        # Broadcast ke frontend
        await self.broadcast_to_clients({
            "type": "card_scanned",
            "cardId": card_id,
            "timestamp": time.time()
        })
        
        # Optional: Verify card exists in database
        card_info = self.send_api_request(f"/rfid/verify", 'POST', {
            "cardId": card_id,
            "pin": "000000"  # Dummy PIN untuk check card existence
        })
        
        if card_info.get("success"):
            await self.broadcast_to_clients({
                "type": "card_verified",
                "cardId": card_id,
                "cardData": card_info.get("data", {})
            })
        else:
            await self.broadcast_to_clients({
                "type": "card_error",
                "cardId": card_id,
                "message": "Kartu tidak terdaftar"
            })
    
    async def handle_pin_input(self, pin):
        """Handle ketika PIN dimasukkan"""
        logger.info(f"PIN entered: {'*' * len(pin)}")
        
        if not self.current_card_id:
            logger.warning("PIN entered but no card scanned")
            return
        
        self.transaction_state = "processing"
        
        # Broadcast PIN received
        await self.broadcast_to_clients({
            "type": "pin_entered",
            "cardId": self.current_card_id,
            "pinLength": len(pin)
        })
        
        # Verify card + PIN with backend
        verification_result = self.send_api_request("/rfid/verify", 'POST', {
            "cardId": self.current_card_id,
            "pin": pin
        })
        
        if verification_result.get("success"):
            logger.info("Card and PIN verified successfully")
            await self.broadcast_to_clients({
                "type": "verification_success",
                "cardId": self.current_card_id,
                "cardData": verification_result.get("data", {})
            })
            
            # Store session data untuk payment processing
            self.session_data = {
                "cardId": self.current_card_id,
                "pin": pin,
                "cardData": verification_result.get("data", {}),
                "verified_at": time.time()
            }
            
        else:
            logger.warning("Card/PIN verification failed")
            await self.broadcast_to_clients({
                "type": "verification_failed",
                "cardId": self.current_card_id,
                "message": verification_result.get("message", "PIN salah")
            })
        
        # Reset state
        self.transaction_state = "idle"
        self.current_card_id = None
    
    async def handle_pin_cleared(self):
        """Handle ketika PIN dihapus dengan tombol *"""
        logger.info("PIN cleared")
        await self.broadcast_to_clients({
            "type": "pin_cleared",
            "cardId": self.current_card_id
        })
    
    async def process_payment(self, amount, description="POS Payment"):
        """Process payment menggunakan session data"""
        if not self.session_data:
            return {"success": False, "message": "No verified session"}
        
        # Check session timeout (5 minutes)
        if time.time() - self.session_data.get("verified_at", 0) > 300:
            self.session_data = {}
            return {"success": False, "message": "Session expired"}
        
        payment_data = {
            "cardId": self.session_data["cardId"],
            "pin": self.session_data["pin"],
            "amount": amount,
            "description": description
        }
        
        payment_result = self.send_api_request("/rfid/payment", 'POST', payment_data)
        
        # Broadcast payment result
        await self.broadcast_to_clients({
            "type": "payment_processed",
            "success": payment_result.get("success", False),
            "data": payment_result.get("data", {}),
            "message": payment_result.get("message", "")
        })
        
        # Clear session after payment
        if payment_result.get("success"):
            self.session_data = {}
        
        return payment_result
    
    def read_serial_loop(self):
        """Main loop untuk membaca data dari Arduino"""
        logger.info("Starting serial read loop")
        
        while True:
            if self.serial_conn and self.serial_conn.in_waiting > 0:
                try:
                    line = self.serial_conn.readline().decode('utf-8').strip()
                    
                    if line:
                        asyncio.run_coroutine_threadsafe(
                            self.process_arduino_message(line),
                            self.loop
                        )
                        
                except UnicodeDecodeError:
                    logger.warning("Failed to decode serial message")
                except Exception as e:
                    logger.error(f"Error reading serial: {e}")
            
            time.sleep(0.1)
    
    async def process_arduino_message(self, message):
        """Process message dari Arduino"""
        logger.info(f"Arduino message: {message}")
        
        if message == "SYSTEM READY":
            await self.broadcast_to_clients({
                "type": "arduino_ready",
                "message": "Arduino system ready"
            })
            
        elif message.startswith("UID:"):
            card_id = message[4:]  # Remove "UID:" prefix
            await self.handle_card_scan(card_id)
            
        elif message.startswith("PIN:"):
            pin = message[4:]  # Remove "PIN:" prefix
            await self.handle_pin_input(pin)
            
        elif message == "PIN_CLEARED":
            await self.handle_pin_cleared()
        
        else:
            logger.warning(f"Unknown Arduino message: {message}")
    
    async def main(self):
        """Main coroutine"""
        self.loop = asyncio.get_event_loop()
        
        # Start WebSocket server
        ws_server = await self.start_websocket_server()
        
        # Connect to Arduino
        if not self.connect_serial():
            logger.error("Failed to connect to Arduino")
            return
        
        # Start serial reading thread
        serial_thread = Thread(target=self.read_serial_loop, daemon=True)
        serial_thread.start()
        
        logger.info("RFID Bridge is running...")
        logger.info("- Arduino serial communication: Active")
        logger.info("- WebSocket server: Active")
        logger.info("- API backend integration: Ready")
        
        try:
            # Keep the server running
            await ws_server.wait_closed()
        except KeyboardInterrupt:
            logger.info("Shutting down...")
        finally:
            if self.serial_conn:
                self.serial_conn.close()

if __name__ == "__main__":
    # Create .env file example
    env_example = """
# Serial Configuration
SERIAL_PORT=COM4
BAUD_RATE=9600

# API Configuration  
API_BASE_URL=http://localhost:3001/api
API_TOKEN=your_jwt_token_here

# WebSocket Configuration
WS_PORT=8765
"""
    
    if not os.path.exists('.env'):
        with open('.env', 'w') as f:
            f.write(env_example)
        print("Created .env file. Please configure your settings.")
    
    # Run the bridge
    bridge = RFIDBridge()
    asyncio.run(bridge.main())