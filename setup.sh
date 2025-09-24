#!/bin/bash

echo "🔧 DEG-MVP Setup Script"
echo "======================"

# Detect the actual path (workspace vs workspaces)
if [ -d "/workspace" ]; then
    BASE_DIR="/workspace"
elif [ -d "/workspaces/DEG-MVP-KLON" ]; then
    BASE_DIR="/workspaces/DEG-MVP-KLON"
else
    BASE_DIR="$(pwd)"
fi

echo "📁 Using base directory: $BASE_DIR"

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd "$BASE_DIR/backend"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate and install dependencies
source venv/bin/activate
echo "Installing Python dependencies..."
pip install -q fastapi uvicorn python-multipart python-jose passlib python-dotenv
echo "✅ Backend setup complete!"

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."
cd "$BASE_DIR/frontend"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    yarn install
else
    echo "✅ Node modules already installed"
fi
echo "✅ Frontend setup complete!"

echo ""
echo "======================"
echo "✅ Setup Complete!"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd $BASE_DIR/backend"
echo "  source venv/bin/activate"
echo "  python server.py"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd $BASE_DIR/frontend"
echo "  yarn start"
echo ""