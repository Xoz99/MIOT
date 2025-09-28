#include <SPI.h>
#include <MFRC522.h>
#include <Keypad.h>

// --- Konfigurasi RFID ---
#define SS_PIN 10
#define RST_PIN 9
MFRC522 rfid(SS_PIN, RST_PIN);

// --- Konfigurasi Keypad ---
const byte ROWS = 4;
const byte COLS = 4;
char keys[ROWS][COLS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};
// PASTIKAN pin ini sesuai dengan koneksi fisik Anda!
// 8 pin berurutan dari 2-9
byte rowPins[ROWS] = {5, 4, 3, 2}; // Pin 5, 4, 3, 2 untuk baris
byte colPins[COLS] = {9, 8, 7, 6}; // Pin 9, 8, 7, 6 untuk kolom
Keypad customKeypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// --- Variabel untuk State Machine ---
enum State { WAITING_FOR_CARD, WAITING_FOR_PIN };
State currentState = WAITING_FOR_CARD;
String currentPin = "";

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("SYSTEM READY"); // Kirim sinyal bahwa sistem siap
}

void loop() {
  // STATE 1: Menunggu Kartu RFID di-scan
  if (currentState == WAITING_FOR_CARD) {
    if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
      String cardUid = "";
      for (byte i = 0; i < rfid.uid.size; i++) {
        cardUid += String(rfid.uid.uidByte[i], HEX);
      }
      cardUid.toUpperCase();
      
      // Kirim UID ke browser dengan prefix "UID:"
      Serial.print("UID:");
      Serial.println(cardUid);

      rfid.PICC_HaltA();
      rfid.PCD_StopCrypto1();
      
      // Ubah state ke menunggu PIN setelah kartu terdeteksi
      currentState = WAITING_FOR_PIN;
    }
  } 
  // STATE 2: Menunggu Input PIN dari Keypad
  else if (currentState == WAITING_FOR_PIN) {
    char key = customKeypad.getKey();

    if (key) {
      if (key == '#') { // Tombol '#' untuk konfirmasi/kirim PIN
        if (currentPin.length() > 0) {
          // Kirim PIN ke browser dengan prefix "PIN:"
          Serial.print("PIN:");
          Serial.println(currentPin);
          currentPin = ""; // Reset PIN untuk transaksi berikutnya
          // Kembali ke state awal untuk menunggu kartu berikutnya
          currentState = WAITING_FOR_CARD; 
        }
      } else if (key == '*') { // Tombol '*' untuk menghapus PIN yang sedang diketik
        currentPin = "";
        Serial.println("PIN_CLEARED"); // Kirim sinyal ke web jika perlu
      } else if (isDigit(key)) { // Hanya tambahkan jika itu adalah angka
        currentPin += key;
      }
    }
  }
}