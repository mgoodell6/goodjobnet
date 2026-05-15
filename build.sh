#!/usr/bin/env bash
# Exit on error
set -o errexit

# Build the frontend React app
echo "Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# Install backend Python dependencies
echo "Installing Backend Dependencies..."
cd backend
pip install -r requirements.txt
