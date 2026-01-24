@echo off
echo =====================================================
echo   五子棋局域网对战平台 - 自动启动脚本
echo =====================================================
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js
    echo.
    echo 正在为您安装 Node.js...
    echo.
    
    REM 下载Node.js安装程序
    echo 正在下载 Node.js v20 LTS...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi' -OutFile '%TEMP%\nodejs.msi'"
    
    if %errorlevel% neq 0 (
        echo ❌ 下载失败，请手动访问 https://nodejs.org/ 下载并安装 Node.js
        echo 安装完成后重新运行此脚本
        pause
        exit /b 1
    )
    
    echo 下载完成，正在安装 Node.js...
    echo.
    
    REM 安装Node.js
    start /wait msiexec /i "%TEMP%\nodejs.msi" /quiet /norestart
    
    if %errorlevel% neq 0 (
        echo ❌ Node.js 安装失败
        pause
        exit /b 1
    )
    
    echo ✅ Node.js 安装成功！
    echo.
    
    REM 清理安装文件
    del "%TEMP%\nodejs.msi"
    
    REM 刷新环境变量
    echo 正在刷新环境变量...
    set "PATH=%PATH%;C:\Program Files\nodejs\""
    
    echo 请重新打开命令行窗口并运行此脚本
    pause
    exit /b 0
)

echo ✅ Node.js 已安装
node --version
npm --version
echo.

REM 进入前端目录
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo 📦 正在安装前端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 前端依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 前端依赖安装完成
    echo.
) else (
    echo ✅ 前端依赖已存在
)

REM 启动前端开发服务器
echo 🚀 正在启动前端开发服务器...
echo    启动后请访问: http://localhost:5173
echo    按 Ctrl+C 停止服务
echo.
start "前端服务器" cmd /k "npm run dev"

REM 进入后端目录
cd /d "%~dp0backend"

if not exist "node_modules" (
    echo 📦 正在安装后端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 后端依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 后端依赖安装完成
    echo.
) else (
    echo ✅ 后端依赖已存在
)

REM 启动后端服务器
echo 🚀 正在启动后端服务器...
echo    后端服务运行在: http://localhost:3000
echo    按 Ctrl+C 停止服务
echo.
call npm run dev

pause