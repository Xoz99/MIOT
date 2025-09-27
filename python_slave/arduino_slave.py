#!/usr/bin/env python3
import serial
import time
import psycopg2
from datetime import datetime
import os
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("arduino_slave.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ArduinoSlave")

# Communication protocol constants
CMD_READY = 0x01
CMD_RFID_DATA = 0x02
CMD_KEYPAD_DATA = 0x03
CMD_ACK = 0x04

# PostgreSQL connection parameters
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'rfid_ewallet')
DB_USER = os.getenv('DB_USER', 'andrianadiwahyono')
DB_PASSWORD = os.getenv('DB_PASSWORD', '123')

class ArduinoSlave:
    def __init__(self, port='COM4', baud_rate=9600):
        self.port = port
        self.baud_rate = baud_rate
        self.serial = None
        self.db_conn = None
        self.db_cursor = None
        
    def connect_to_arduino(self):
        """Connect to Arduino via serial port"""
        try:
            self.serial = serial.Serial(self.port, self.baud_rate, timeout=1)
            logger.info(f"Connected to Arduino on {self.port}")
            return True
        except serial.SerialException as e:
            logger.error(f"Failed to connect to Arduino: {e}")
            return False
            
    def connect_to_database(self):
        """Connect to PostgreSQL database"""
        try:
            self.db_conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD
            )
            self.db_cursor = self.db_conn.cursor()
            logger.info("Connected to PostgreSQL database")
            self._create_tables_if_not_exist()
            return True
        except psycopg2.Error as e:
            logger.error(f"Failed to connect to database: {e}")
            return False
            
    def _create_tables_if_not_exist(self):
        """Create necessary tables if they don't exist"""
        try:
            # Create RFID table
            self.db_cursor.execute("""
                CREATE TABLE IF NOT EXISTS rfid_readings (
                    id SERIAL PRIMARY KEY,
                    card_id VARCHAR(50) NOT NULL,
                    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create keypad table
            self.db_cursor.execute("""
                CREATE TABLE IF NOT EXISTS keypad_inputs (
                    id SERIAL PRIMARY KEY,
                    input_value VARCHAR(50) NOT NULL,
                    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            self.db_conn.commit()
            logger.info("Database tables created or already exist")
        except psycopg2.Error as e:
            logger.error(f"Error creating tables: {e}")
            self.db_conn.rollback()
            
    def handshake_with_arduino(self):
        """Perform initial handshake with Arduino"""
        if not self.serial:
            logger.error("Serial connection not established")
            return False
            
        # Wait for ready signal from Arduino
        logger.info("Waiting for Arduino ready signal...")
        while True:
            if self.serial.in_waiting > 0:
                cmd = ord(self.serial.read())
                if cmd == CMD_READY:
                    # Send acknowledgment
                    self.serial.write(bytes([CMD_ACK]))
                    logger.info("Handshake successful")
                    return True
            time.sleep(0.1)
            
    def send_acknowledgment(self):
        """Send acknowledgment to Arduino"""
        self.serial.write(bytes([CMD_ACK]))
        
    def read_rfid_data(self):
        """Read RFID data from Arduino"""
        # Read data length
        data_length = ord(self.serial.read())
        
        # Read data
        data = ""
        for _ in range(data_length):
            data += chr(ord(self.serial.read()))
            
        logger.info(f"Received RFID data: {data}")
        return data
        
    def read_keypad_data(self):
        """Read keypad data from Arduino"""
        # Read data length
        data_length = ord(self.serial.read())
        
        # Read data
        data = ""
        for _ in range(data_length):
            data += chr(ord(self.serial.read()))
            
        logger.info(f"Received keypad data: {data}")
        return data
        
    def store_rfid_data(self, card_id):
        """Store RFID data in database"""
        try:
            self.db_cursor.execute(
                "INSERT INTO rfid_readings (card_id) VALUES (%s) RETURNING id",
                (card_id,)
            )
            record_id = self.db_cursor.fetchone()[0]
            self.db_conn.commit()
            logger.info(f"Stored RFID data with ID: {record_id}")
            return record_id
        except psycopg2.Error as e:
            logger.error(f"Error storing RFID data: {e}")
            self.db_conn.rollback()
            return None
            
    def store_keypad_data(self, input_value):
        """Store keypad data in database"""
        try:
            self.db_cursor.execute(
                "INSERT INTO keypad_inputs (input_value) VALUES (%s) RETURNING id",
                (input_value,)
            )
            record_id = self.db_cursor.fetchone()[0]
            self.db_conn.commit()
            logger.info(f"Stored keypad data with ID: {record_id}")
            return record_id
        except psycopg2.Error as e:
            logger.error(f"Error storing keypad data: {e}")
            self.db_conn.rollback()
            return None
            
    def run(self):
        """Main loop to process Arduino commands"""
        if not self.serial or not self.db_conn:
            logger.error("Serial or database connection not established")
            return
            
        logger.info("Starting main processing loop")
        try:
            while True:
                if self.serial.in_waiting > 0:
                    cmd = ord(self.serial.read())
                    
                    if cmd == CMD_RFID_DATA:
                        # Process RFID data
                        rfid_data = self.read_rfid_data()
                        self.store_rfid_data(rfid_data)
                        self.send_acknowledgment()
                        
                    elif cmd == CMD_KEYPAD_DATA:
                        # Process keypad data
                        keypad_data = self.read_keypad_data()
                        self.store_keypad_data(keypad_data)
                        self.send_acknowledgment()
                        
                    elif cmd == CMD_READY:
                        # Respond to ready signal
                        self.send_acknowledgment()
                        
                time.sleep(0.01)  # Small delay to prevent CPU hogging
                
        except KeyboardInterrupt:
            logger.info("Program terminated by user")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
        finally:
            # Clean up
            if self.serial and self.serial.is_open:
                self.serial.close()
                logger.info("Serial connection closed")
                
            if self.db_conn:
                self.db_cursor.close()
                self.db_conn.close()
                logger.info("Database connection closed")

if __name__ == "__main__":
    # Create and run Arduino slave
    slave = ArduinoSlave()
    
    # Connect to Arduino
    if not slave.connect_to_arduino():
        logger.error("Failed to connect to Arduino. Exiting.")
        exit(1)
        
    # Connect to database
    if not slave.connect_to_database():
        logger.error("Failed to connect to database. Exiting.")
        exit(1)
        
    # Perform handshake with Arduino
    if not slave.handshake_with_arduino():
        logger.error("Failed to handshake with Arduino. Exiting.")
        exit(1)
        
    # Run main loop
    slave.run()