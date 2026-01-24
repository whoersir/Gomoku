@echo off
echo =====================================================
echo   配置 Node.js 环境变量
echo =====================================================
echo.

echo 🔍 检查 Node.js 安装位置...
if exist "C:\Program Files\nodejs\node.exe" (
    echo ✅ Node.js 已安装在 C:\Program Files\nodejs\
    echo.
) else (
    echo ❌ 未找到 Node.js
    pause
    exit /b 1
)

echo ⚙️ 正在配置系统环境变量...
echo.

REM 使用 PowerShell 永久添加环境变量
powershell -Command "
$nodePath = 'C:\Program Files\nodejs'
$npmPath = 'C:\Program Files\nodejs\node_modules\npm\bin'
$currentPath = [Environment]::GetEnvironmentVariable('PATH', 'Machine')

$needsUpdate = $false
if ($currentPath -notlike '*nodejs*') {
    $needsUpdate = $true
}

if ($needsUpdate) {
    $newPath = $currentPath + ';' + $nodePath + ';' + $npmPath
    [Environment]::SetEnvironmentVariable('PATH', $newPath, 'Machine')
    Write-Host '✅ Node.js 环境变量已添加到系统 PATH'
    Write-Host ''
    Write-Host '⚠️  重要提示：'
    Write-Host '   请关闭此窗口并重新打开一个新的命令行窗口'
    Write-Host '   然后运行以下命令验证配置：'
    Write-Host ''
    Write-Host '   node --version'
    Write-Host '   npm --version'
} else {
    Write-Host '⚠️  Node.js 环境变量已存在'
}
"

echo.
echo =====================================================
echo   配置完成！
echo =====================================================
echo.
pause
