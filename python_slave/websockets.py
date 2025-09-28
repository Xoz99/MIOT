import serial
import requests
import time
import json
from datetime import datetime

class RFIDBridge:
    def __init__(self):
        # Configuration - sesuaikan dengan sistem Anda
        self.SERIAL_PORT = 'COM5'  # Mac: cek dengan ls /dev/tty.*
        self.BAUD_RATE = 9600
        self.BACKEND_URL = "http://localhost:3001/api"
        
        # State management
        self.serial_conn = None
        self.current_card = None
        self.verified_session = None
        self.is_running = False
        
    def connect_serial(self):
        """Connect ke Arduino"""
        try:
            self.serial_conn = serial.Serial(
                port=self.SERIAL_PORT,
                baudrate=self.BAUD_RATE,
                timeout=1
            )
            print(f"✅ Arduino connected on {self.SERIAL_PORT}")
            return True
        except serial.SerialException as e:
            print(f"❌ Arduino connection failed: {e}")
            print("💡 Available ports:")
            import serial.tools.list_ports
            for port in serial.tools.list_ports.comports():
                print(f"   {port.device} - {port.description}")
            return False
    
    def test_backend(self):
        """Test koneksi backend"""
        try:
            response = requests.get(f"{self.BACKEND_URL}/rfid/test", timeout=5)
            if response.status_code == 200:
                print("✅ Backend API connected")
                return True
            else:
                print(f"⚠️ Backend responded with {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Backend connection failed: {e}")
            return False
    
    def send_to_backend(self, endpoint, data=None, method="GET"):
        """Send request ke backend"""
        try:
            url = f"{self.BACKEND_URL}{endpoint}"
            headers = {"Content-Type": "application/json"}
            
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=10)
            
            print(f"🌐 API Call: {method} {endpoint}")
            print(f"📊 Response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                result = response.json()
                return result
            else:
                print(f"❌ API Error: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Network error: {e}")
            return None
    
    def handle_card_scan(self, card_id):
        """Handle ketika kartu RFID di-scan"""
        print(f"\n🏷️ CARD DETECTED: {card_id}")
        print(f"⏳ Waiting for PIN input...")
        
        self.current_card = card_id
        self.verified_session = None
        
    def handle_pin_input(self, pin):
        """Handle ketika PIN dimasukkan"""
        print(f"\n🔑 PIN ENTERED: {'*' * len(pin)}")
        
        if not self.current_card:
            print("⚠️ No card scanned! Please scan card first.")
            return
        
        print(f"🔍 Verifying card {self.current_card}...")
        
        # Gunakan dev endpoint yang tidak perlu auth
        verify_result = self.send_to_backend("/rfid/test/verify", {
            "cardId": self.current_card,
            "pin": pin
        }, "POST")
        
        if verify_result and verify_result.get("success"):
            card_data = verify_result.get("data", {})
            print(f"✅ VERIFICATION SUCCESS!")
            print(f"👤 Owner: {card_data.get('ownerName', 'N/A')}")
            print(f"💰 Balance: Rp {card_data.get('balance', 0):,}")
            
            # Store verified session
            self.verified_session = {
                "cardId": self.current_card,
                "pin": pin,
                "balance": card_data.get("balance", 0),
                "ownerName": card_data.get("ownerName", "N/A"),
                "verified_at": time.time()
            }
            
            # Demo payment jika saldo cukup
            demo_amount = 5000
            if card_data.get("balance", 0) >= demo_amount:
                print(f"\n💳 Processing demo payment (Rp {demo_amount:,})...")
                self.process_demo_payment(demo_amount)
            else:
                print(f"⚠️ Balance too low for demo payment (need Rp {demo_amount:,})")
                
        else:
            error_msg = verify_result.get("message", "Unknown error") if verify_result else "Network error"
            print(f"❌ VERIFICATION FAILED: {error_msg}")
            
        print(f"🔄 Ready for next transaction\n")
        self.current_card = None
    
    def process_demo_payment(self, amount):
        """Process demo payment"""
        if not self.verified_session:
            print("❌ No verified session")
            return
            
        print(f"💸 Processing payment: Rp {amount:,}")
        
        # Call payment endpoint (dev version tanpa auth)
        payment_result = self.send_to_backend("/rfid/test/payment", {
            "cardId": self.verified_session["cardId"],
            "pin": self.verified_session["pin"],
            "amount": amount,
            "items": []  # Empty items untuk demo
        }, "POST")
        
        if payment_result and payment_result.get("success"):
            payment_data = payment_result.get("data", {})
            print(f"✅ PAYMENT SUCCESS!")
            print(f"🧾 Transaction ID: {payment_data.get('transactionId', 'N/A')}")
            print(f"💰 New Balance: Rp {payment_data.get('newBalance', 0):,}")
            
        else:
            error_msg = payment_result.get("message", "Unknown error") if payment_result else "Network error"
            print(f"❌ PAYMENT FAILED: {error_msg}")
            
        self.verified_session = None
    
    def handle_pin_cleared(self):
        """Handle PIN cleared"""
        print(f"🧹 PIN CLEARED")
        if self.current_card:
            print(f"📝 Card {self.current_card} still active - enter PIN again")
    
    def serial_listener(self):
        """Main loop untuk Arduino"""
        print(f"👂 Listening for Arduino on {self.SERIAL_PORT}...")
        print("=" * 60)
        print("📖 Instructions:")
        print("   1. Tap RFID card → Arduino sends UID:xxxxx")
        print("   2. Enter PIN + press # → Arduino sends PIN:xxxxx")
        print("   3. System verifies and processes demo payment")
        print("   4. Press * to clear PIN, Ctrl+C to exit")
        print("=" * 60)
        
        while self.is_running:
            if self.serial_conn and self.serial_conn.in_waiting > 0:
                try:
                    line = self.serial_conn.readline().decode('utf-8').strip()
                    
                    if line:
                        timestamp = datetime.now().strftime("%H:%M:%S")
                        print(f"[{timestamp}] Arduino: {line}")
                        
                        if line == "SYSTEM READY":
                            print("🤖 Arduino system ready!")
                            
                        elif line.startswith("UID:"):
                            card_id = line[4:]
                            self.handle_card_scan(card_id)
                            
                        elif line.startswith("PIN:"):
                            pin = line[4:]
                            self.handle_pin_input(pin)
                            
                        elif line == "PIN_CLEARED":
                            self.handle_pin_cleared()
                            
                        else:
                            print(f"📝 Unknown: {line}")
                            
                except UnicodeDecodeError:
                    print("⚠️ Failed to decode Arduino message")
                except Exception as e:
                    print(f"❌ Serial error: {e}")
            
            time.sleep(0.1)
    
    def run(self):
        """Main function"""
        print("🚀 RFID Bridge Starting...")
        print("=" * 60)
        
        if not self.test_backend():
            print("❌ Backend not available")
            print("💡 Start backend: cd backend && npm run dev")
            return False
        
        if not self.connect_serial():
            print("❌ Arduino not connected")
            return False
        
        print("✅ All systems ready!")
        self.is_running = True
        
        try:
            self.serial_listener()
        except KeyboardInterrupt:
            print("\n🛑 Shutting down...")
        finally:
            self.is_running = False
            if self.serial_conn:
                self.serial_conn.close()
            print("👋 Bridge stopped!")

def quick_test():
    """Test backend tanpa Arduino"""
    print("🧪 Quick Backend Test")
    print("=" * 30)
    
    bridge = RFIDBridge()
    
    if not bridge.test_backend():
        return
    
    print("\n📝 Testing dev endpoints...")
    
    # Test verify
    verify_result = bridge.send_to_backend("/rfid/test/verify", {
        "cardId": "RF001234",
        "pin": "123456"
    }, "POST")
    
    if verify_result:
        if verify_result.get("success"):
            print("✅ Verify test PASSED")
            balance = verify_result['data']['balance']
            print(f"💰 Balance: Rp {balance:,}")
            
            # Test payment jika ada saldo
            if balance >= 1000:
                print("\n💳 Testing payment...")
                payment_result = bridge.send_to_backend("/rfid/test/payment", {
                    "cardId": "RF001234",
                    "pin": "123456",
                    "amount": 1000
                }, "POST")
                
                if payment_result and payment_result.get("success"):
                    print("✅ Payment test PASSED")
                    new_balance = payment_result['data']['newBalance']
                    print(f"💰 New balance: Rp {new_balance:,}")
                else:
                    print("❌ Payment test failed")
            
        else:
            print(f"ℹ️ Verify response: {verify_result['message']}")
    
    print("\n✅ Test completed!")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        quick_test()
    else:
        bridge = RFIDBridge()
        bridge.run()