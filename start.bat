@echo off
chcp 65001 > nul
echo 🎮 五子棋局域网对战游戏 - 启动脚本
echo ======================================

REM Check if backend dependencies are installed
if not exist "backend\node_modules" (
  echo 📦 安装后端依赖...
  cd backend
  call npm install
  cd ..
)

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
  echo 📦 安装前端依赖...
  cd frontend
  call npm install
  cd ..
)

echo.
echo 🚀 启动应用...
echo ======================================
echo.

REM Start backend
echo 启动后端服务器... (端口 3000)
start "Gomoku Backend" cmd /k "cd backend && npm run dev"

REM Start frontend
echo 启动前端服务器... (端口 5173)
timeout /t 3 /nobreak
start "Gomoku Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ 应用已启动！
echo ======================================
echo 🌐 前端: http://localhost:5173
echo 🔧 后端: http://localhost:3000
echo.
echo 💡 本机运行：
echo    1. 打开浏览器访问 http://localhost:5173
echo    2. 输入 localhost:3000 连接服务器
echo.
echo 💡 同局域网其他设备运行：
echo    1. 打开浏览器访问 http://{本机IP}:5173
echo    2. 输入 {本机IP}:3000 连接服务器
echo.
echo 按 Ctrl+C 停止服务
echo ======================================
pause
