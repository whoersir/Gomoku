@echo off
echo =====================================================
echo   五子棋前端 - 本地开发服务器
echo =====================================================
echo.

REM 检查 Node.js 是否可用
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未添加到 PATH
    echo.
    echo 尝试使用完整路径...
    echo.
    
    REM 使用完整路径
    set NODE_CMD="C:\Program Files\nodejs\node.exe"
    set NPM_CMD="C:\Program Files\nodejs\npm.cmd"
) else (
    echo ✅ Node.js 环境正常
    echo.
    set NODE_CMD=node
    set NPM_CMD=npm
)

REM 进入前端目录
cd /d "%~dp0frontend"

echo 📂 当前目录：
cd
echo.

REM 检查 node_modules 是否存在
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    echo 这可能需要几分钟...
    echo.
    call %NPM_CMD% install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
) else (
    echo ✅ node_modules 已存在
    echo.
)

echo 🚀 正在启动前端开发服务器...
echo.
echo    启动后请访问: http://localhost:5173
echo    后端使用: http://localhost:3000 (本地后端)
echo    按 Ctrl+C 停止服务
echo    等待 Vite 启动...
echo.

call %NPM_CMD% run dev

echo.
echo =====================================================
echo   服务器已停止
echo =====================================================
echo.
pause
