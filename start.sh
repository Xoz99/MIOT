
echo "Starting RFID System..."
ROOT_DIR=$(pwd)
cleanup() {
    echo "Stopping all services..."
    pkill -f "npm run dev"
    pkill -f "npm start" 
    pkill -f "python websockets.py"
    exit
}

trap cleanup SIGINT
echo "Starting backend..."
cd "$ROOT_DIR/backend" && npm run dev &
sleep 5
echo "Starting Python bridge..."
cd "$ROOT_DIR/python_slave" && python websockets.py &
echo "Starting frontend..."
cd "$ROOT_DIR/frontend" && npm start &

echo "All services started!"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop all services"

wait