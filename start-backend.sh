#!/bin/bash

echo "🚀 Starting Backend Server..."

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Navigate to backend directory
cd "$SCRIPT_DIR/backend"

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