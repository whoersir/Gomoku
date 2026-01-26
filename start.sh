#!/bin/bash

echo "🎮 独属于自己的娱乐小屋 - 启动脚本"
echo "======================================"

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
  echo "📦 安装后端依赖..."
  cd backend
  npm install
  cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 安装前端依赖..."
  cd frontend
  npm install
  cd ..
fi

echo ""
echo "🚀 启动应用..."
echo "======================================"
echo ""

# Start backend
echo "启动后端服务器... (端口 3000)"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "启动前端服务器... (端口 5173)"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 应用已启动！"
echo "======================================"
echo "🌐 前端: http://localhost:5173"
echo "🔧 后端: http://localhost:3000"
echo ""
echo "💡 本机运行："
echo "   1. 打开浏览器访问 http://localhost:5173"
echo "   2. 输入 localhost:3000 连接服务器"
echo ""
echo "💡 同局域网其他设备运行："
echo "   1. 打开浏览器访问 http://{本机IP}:5173"
echo "   2. 输入 {本机IP}:3000 连接服务器"
echo ""
echo "按 Ctrl+C 停止服务"
echo "======================================"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
