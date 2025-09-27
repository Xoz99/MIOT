import serial
import time
import websocket
import threading
import json

# --- KONFIGURASI ---
# Ganti dengan port serial Arduino Anda (cek di Device Manager atau Arduino IDE)
SERIAL_PORT = 'COM5' 
BAUD_RATE = 9600
# URL ini harus menunjuk ke server Node.js Anda yang menjalankan WebSocket Server
WEBSOCKET_URL = "ws://localhost:3000" 

def on_message(ws, message):
    print(f"Diterima dari server: {message}")

def on_error(ws, error):
    print(f"Error WebSocket: {error}")

def on_close(ws, close_status_code, close_msg):
    print("### Koneksi WebSocket ditutup ###")

def on_open(ws):
    print("### Koneksi WebSocket dibuka ###")
    
    # Fungsi ini akan berjalan di thread terpisah untuk terus mendengarkan Arduino
    def serial_listener():
        try:
            # Hubungkan ke port serial
            ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
            print(f"Mendengarkan di port serial {SERIAL_PORT}...")
            
            while ws.sock and ws.sock.connected:
                if ser.in_waiting > 0:
                    # Baca satu baris data dari Arduino
                    line = ser.readline().decode('utf-8').strip()
                    
                    # Cek apakah ada data dan parsing (misal: "UID:1A2B3C4D" atau "PIN:1234")
                    if line and ":" in line:
                        parts = line.split(":", 1)
                        msg_type = parts[0].lower()
                        msg_data = parts[1]
                        
                        # Buat payload JSON untuk dikirim ke frontend
                        payload = json.dumps({"type": msg_type, "data": msg_data})
                        print(f"Mengirim ke frontend: {payload}")
                        ws.send(payload)

                time.sleep(0.1)
        except serial.SerialException as e:
            print(f"Error koneksi serial: {e}")
            ws.close()
        except Exception as e:
            print(f"Error tak terduga di thread serial: {e}")
            ws.close()
            
    # Mulai thread listener
    threading.Thread(target=serial_listener).start()

if __name__ == "__main__":
    # Inisialisasi koneksi WebSocket
    ws = websocket.WebSocketApp(WEBSOCKET_URL,
                              on_open=on_open,
                              on_message=on_message,
                              on_error=on_error,
                              on_close=on_close)
    # Jalankan koneksi WebSocket selamanya
    ws.run_forever()