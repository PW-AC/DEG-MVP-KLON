#!/bin/bash

echo "🚀 Starting DEG-MVP Application..."
echo "=================================="

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to kill processes on exit
cleanup() {
    echo -e "\n🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Start Backend
echo "📦 Starting Backend Server..."
(
    cd "$SCRIPT_DIR/backend"
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -q fastapi uvicorn python-multipart python-jose passlib python-dotenv
    python server.py
) &
BACKEND_PID=$!
echo "✅ Backend started with PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 3

# Start Frontend
echo "📦 Starting Frontend Server..."
(
    cd "$SCRIPT_DIR/frontend"
    if [ ! -d "node_modules" ]; then
        yarn install
    fi
    yarn start
) &
FRONTEND_PID=$!
echo "✅ Frontend started with PID: $FRONTEND_PID"

echo "=================================="
echo "✅ Application is starting up!"
echo "📌 Backend:  http://localhost:8000"
echo "📌 Frontend: http://localhost:3000"
echo "=================================="
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait