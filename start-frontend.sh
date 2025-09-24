#!/bin/bash

echo "🚀 Starting Frontend Server..."

# Detect the actual path
if [ -d "/workspace" ]; then
    BASE_DIR="/workspace"
elif [ -d "/workspaces/DEG-MVP-KLON" ]; then
    BASE_DIR="/workspaces/DEG-MVP-KLON"
else
    BASE_DIR="$(pwd)"
fi

# Navigate to frontend directory
cd "$BASE_DIR/frontend"

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install
else
    echo "✅ Dependencies already installed"
fi

# Start the development server
echo "✅ Starting development server on http://localhost:3000"
yarn start