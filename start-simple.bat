@echo off
chcp 65001 >nul
echo.
echo ============================================
echo   五子棋局域网对战平台 - 快速启动
echo ============================================
echo.

:: 检查 Node.js 是否安装
echo [1/4] 检查 Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 Node.js
    echo.
    echo 请先安装 Node.js:
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载并安装 LTS 版本
    echo 3. 重启电脑后重新运行此脚本
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js 已安装 (版本: %NODE_VERSION%)
echo.

:: 检查是否已安装包
echo [2/4] 检查已安装的包...
if not exist "node_modules\@whoersir\gomoku-server" (
    echo 📦 游戏服务器未安装，正在安装...
    call npm install @whoersir/gomoku-server
    if %errorlevel% neq 0 (
        echo ❌ 安装服务器失败
        pause
        exit /b 1
    )
) else (
    echo ✅ 游戏服务器已安装
)

if not exist "node_modules\@whoersir\gomoku-client" (
    echo 📦 游戏客户端未安装，正在安装...
    call npm install @whoersir/gomoku-client
    if %errorlevel% neq 0 (
        echo ❌ 安装客户端失败
        pause
        exit /b 1
    )
) else (
    echo ✅ 游戏客户端已安装
)
echo.

:: 创建服务器配置文件
echo [3/4] 配置服务器...
if not exist "node_modules\@whoersir\gomoku-server\.env" (
    echo 📝 创建配置文件...
    (
        echo PORT=3000
        echo ADMIN_PASSWORD=admin123
        echo NODE_ENV=development
        echo ALLOWED_ORIGINS=*
    ) > "node_modules\@whoersir\gomoku-server\.env"
    echo ✅ 配置文件已创建
) else (
    echo ✅ 配置文件已存在
)
echo.

:: 获取本机 IP 地址
echo [4/4] 获取网络信息...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=*" %%b in ("%%a") do set LOCAL_IP=%%b
)
echo ✅ 本机 IP 地址: %LOCAL_IP%
echo.

:: 启动服务器
echo ============================================
echo   正在启动服务...
echo ============================================
echo.
echo 🚀 启动游戏服务器...
echo.
echo 提示:
echo   - 服务器启动后，请打开浏览器访问:
echo     http://localhost:5173
echo.
echo   - 局域网内的其他设备访问:
echo     http://%LOCAL_IP%:5173
echo.
echo   - 按任意键开始启动...
echo.

pause >nul

:: 创建启动日志
set LOG_FILE=startup.log
echo [%date% %time%] 开始启动服务 > %LOG_FILE%
echo [%date% %time%] Node.js 版本: %NODE_VERSION% >> %LOG_FILE%
echo [%date% %time%] 本机 IP: %LOCAL_IP% >> %LOG_FILE%

:: 启动服务器（后台）
start "五子棋-游戏服务器" cmd /k "cd /d "%~dp0node_modules\@whoersir\gomoku-server" && npm start"

echo [%date% %time%] 游戏服务器已启动 >> %LOG_FILE%

:: 等待服务器启动
timeout /t 3 /nobreak >nul

:: 启动客户端
echo 🎮 启动游戏客户端...
start "" http://localhost:5173

:: 在新窗口启动客户端开发服务器
timeout /t 2 /nobreak >nul
start "五子棋-游戏客户端" cmd /k "cd /d "%~dp0node_modules\@whoersir\gomoku-client" && npm run dev"

echo [%date% %time%] 游戏客户端已启动 >> %LOG_FILE%

echo.
echo ============================================
echo   ✅ 服务启动成功！
echo ============================================
echo.
echo 📌 重要信息:
echo.
echo   🖥️  服务器地址: http://localhost:3000
echo   🎮 客户端地址: http://localhost:5173
echo   📱 局域网访问: http://%LOCAL_IP%:5173
echo.
echo ⚠️  注意:
echo   - 请勿关闭"五子棋-游戏服务器"窗口
echo   - 可以关闭"五子棋-游戏客户端"窗口
echo   - 要停止所有服务，请关闭所有打开的窗口
echo.
echo 📖 查看完整使用指南: BEGINNER_GUIDE.md
echo.
echo 按任意键关闭此窗口...
pause >nul
