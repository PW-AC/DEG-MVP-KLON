#!/bin/bash

echo "🚀 Starting Backend Server..."

# Detect the actual path
if [ -d "/workspace" ]; then
    BASE_DIR="/workspace"
elif [ -d "/workspaces/DEG-MVP-KLON" ]; then
    BASE_DIR="/workspaces/DEG-MVP-KLON"
else
    BASE_DIR="$(pwd)"
fi

# Navigate to backend directory
cd "$BASE_DIR/backend"

# Check if virtual environment exists, if not create it
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
echo "📦 Installing/Checking dependencies..."
pip install -q fastapi uvicorn python-multipart python-jose passlib python-dotenv

# Start the server
echo "✅ Starting server on http://localhost:8000"
python server.py