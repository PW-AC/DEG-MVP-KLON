#!/bin/bash

echo "🚀 Starting Frontend Server..."

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Navigate to frontend directory
cd "$SCRIPT_DIR/frontend"

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