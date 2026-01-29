@echo off
chcp 65001 > nul
echo ========================================
echo Starting Release Environment (NPM)
echo ========================================
echo.

REM Check if backend dependencies are installed
if not exist "backend\node_modules" (
  echo Installing backend dependencies...
  cd backend
  call npm install
  cd ..
)

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
  echo Installing frontend dependencies...
  cd frontend
  call npm install
  cd ..
)

echo.
echo Starting application...
echo ========================================
echo.

REM Start backend with release environment
echo Starting backend server... (port 3001)
start "Gomoku Backend Release" cmd /k "cd backend && set PORT=3001 && set NODE_ENV=production && set ENABLE_STARTUP_SYNC=true && npm run dev"

REM Start frontend with release environment (using release config)
echo Starting frontend server... (port 5174)
timeout /t 3 /nobreak
start "Gomoku Frontend Release" cmd /k "cd frontend && set VITE_BACKEND_URL=http://localhost:3001 && set VITE_ENABLE_CONSOLE=false && npm run dev:release"

echo.
echo ========================================
echo Application started!
echo ========================================
echo Frontend: http://localhost:5174
echo Backend:  http://localhost:3001
echo.
echo Note: This is the release environment with:
echo   - Startup music sync enabled
echo   - Console logs disabled
echo   - Production settings
echo   - Release config file (port 5174)
echo.
echo Press Ctrl+C in the server windows to stop
echo ========================================
pause
