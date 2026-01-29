#!/bin/bash

echo "========================================"
echo "Starting Release Environment (NPM)"
echo "========================================"
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
  echo "Installing backend dependencies..."
  cd backend
  npm install
  cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd frontend
  npm install
  cd ..
fi

echo ""
echo "Starting application..."
echo "========================================"
echo ""

# Start backend with release environment
echo "Starting backend server... (port 3001)"
PORT=3001 NODE_ENV=production ENABLE_STARTUP_SYNC=true npm run dev &
BACKEND_PID=$!

# Start frontend with release environment (using release config)
echo "Starting frontend server... (port 5174)"
sleep 3
VITE_BACKEND_URL=http://localhost:3001 VITE_ENABLE_CONSOLE=false npm run dev:release &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Application started!"
echo "========================================"
echo "Frontend: http://localhost:5174"
echo "Backend:  http://localhost:3001"
echo ""
echo "Note: This is the release environment with:"
echo "  - Startup music sync enabled"
echo "  - Console logs disabled"
echo "  - Production settings"
echo "  - Release config file (port 5174)"
echo ""
echo "Press Ctrl+C to stop"
echo "========================================"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
