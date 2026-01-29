# Release 环境 NPM 启动指南

## 快速开始

### Windows 用户
双击运行 `start-release-npm.bat`

### Linux/Mac 用户
```bash
chmod +x start-release-npm.sh
./start-release-npm.sh
```

## 访问地址

启动成功后：
- **前端**: http://localhost:5174
- **后端 API**: http://localhost:3001

## 环境对比

| 配置项 | Dev 环境 | Release 环境 |
|--------|---------|-------------|
| 启动脚本 | start.bat | start-release-npm.bat |
| 前端端口 | 5173 | 5174 |
| 后端端口 | 3000 | 3001 |
| 启动时音乐同步 | 禁用 | ✅ 启用 |
| 控制台日志 | ✅ 启用 | 禁用 |
| NODE_ENV | 未设置 | production |

## 同时运行两个环境

由于端口不同，可以同时运行 Dev 和 Release 环境：

### Windows
```bash
# 终端 1: 启动 Dev 环境
start.bat

# 终端 2: 启动 Release 环境
start-release-npm.bat
```

### Linux/Mac
```bash
# 终端 1: 启动 Dev 环境
./start.sh

# 终端 2: 启动 Release 环境
./start-release-npm.sh
```

端口访问：
| 环境 | 前端地址 | 后端地址 |
|------|-----------|---------|
| Dev | http://localhost:5173 | http://localhost:3000 |
| Release | http://localhost:5174 | http://localhost:3001 |

## 停止服务

### 方式 1: 关闭窗口
直接关闭对应的命令提示符/终端窗口

### 方式 2: 使用 Ctrl+C
在运行服务的窗口中按 `Ctrl+C`

### 方式 3: 查找并终止进程
```bash
# Windows
tasklist | findstr node
taskkill /F /IM node.exe

# Linux/Mac
ps aux | grep node
killall node
```

## 配置说明

### Release 环境的环境变量

#### 后端环境变量（在 start-release-npm.bat 中设置）：
- `PORT=3001` - 后端端口
- `NODE_ENV=production` - 生产环境模式
- `ENABLE_STARTUP_SYNC=true` - 启用启动时音乐同步
- 其他配置从 `backend/.env` 文件读取

#### 前端环境变量（在 start-release-npm.bat 中设置）：
- `VITE_BACKEND_URL=http://localhost:3001` - 后端 API 地址
- `VITE_ENABLE_CONSOLE=false` - 禁用控制台日志

### 修改配置

#### 修改端口
编辑 `start-release-npm.bat`：

```bat
# 修改后端端口
set PORT=3001  <- 改为你想要的端口

# 修改前端端口（需要在 vite.config.ts 中修改）
set VITE_BACKEND_URL=http://localhost:3001
```

#### 修改前端端口
编辑 `frontend/vite.config.ts`，修改 `server.port`：

```typescript
export default defineConfig({
  server: {
    port: 5174,  // 修改为你想要的端口
  },
  // ...
});
```

## 故障排除

### 问题 1: 端口被占用

**错误信息**：
```
Error: listen EADDRINUSE: address already in use :::3001
```

**解决方法**：
```bash
# Windows: 查找占用端口的进程
netstat -ano | findstr :3001

# 停止占用端口的进程
taskkill /F /PID <进程ID>

# 或者修改 start-release-npm.bat 中的端口号
```

### 问题 2: 后端启动失败

**检查项**：
1. 确认 Node.js 已安装：`node --version`
2. 确认后端依赖已安装：检查 `backend/node_modules` 目录
3. 查看后端窗口的错误信息
4. 检查 Supabase 连接配置是否正确

### 问题 3: 前端无法连接后端

**检查项**：
1. 确认后端是否正常运行（访问 http://localhost:3001/api/health）
2. 检查前端环境变量 `VITE_BACKEND_URL` 是否正确
3. 查看浏览器控制台的错误信息
4. 确认后端 CORS 配置允许前端来源

### 问题 4: 音乐库同步失败

**检查项**：
1. 查看后端窗口的日志，了解具体错误
2. 确认 Supabase 连接正常
3. 检查音乐文件路径配置
4. 查看数据库表结构是否正确

### 问题 5: 热重载不工作

**原因**：某些环境下热重载可能不稳定

**解决方法**：重启开发服务器

## 手动启动

如果脚本无法工作，可以手动启动：

### 启动后端
```bash
cd backend
set PORT=3001
set NODE_ENV=production
set ENABLE_STARTUP_SYNC=true
npm run dev
```

### 启动前端
```bash
cd frontend
set VITE_BACKEND_URL=http://localhost:3001
set VITE_ENABLE_CONSOLE=false
npm run dev
```

## 开发与 Release 环境的区别

### Dev 环境（start.bat）
- 用于日常开发和调试
- 启用所有日志输出
- 禁用启动时音乐同步（启动更快）
- 使用默认配置

### Release 环境（start-release-npm.bat）
- 用于演示和测试生产配置
- 禁用控制台日志（提升性能）
- 启用启动时音乐同步（数据库最新）
- 使用生产环境设置

## 日志说明

### 后端日志
后端日志在运行后端的窗口中显示，包括：
- 服务器启动信息
- API 请求日志
- 音乐库同步状态
- 错误和警告信息

### 前端日志
Release 环境下，控制台日志被禁用。如需调试，可以：

**临时启用日志**：
```bash
# 在启动前端时设置
set VITE_ENABLE_CONSOLE=true
npm run dev
```

**或修改 start-release-npm.bat**：
```bat
set VITE_ENABLE_CONSOLE=true  # 改为 true
```

## 性能优化

Release 环境已包含的性能优化：
1. **禁用控制台日志** - 减少 CPU 使用
2. **生产环境模式** - Node.js 优化
3. **启动时音乐同步** - 避免运行时同步

## 常用命令

### 查看运行的进程
```bash
# Windows
tasklist | findstr node

# Linux/Mac
ps aux | grep node
```

### 停止所有 Node 进程
```bash
# Windows
taskkill /F /IM node.exe

# Linux/Mac
killall node
```

### 查看端口占用
```bash
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :5174

# Linux/Mac
lsof -i :3001
lsof -i :5174
```

## 需要帮助？

1. 查看本文档的"故障排除"部分
2. 查看 `ENVIRONMENT_SETUP.md` 了解环境配置
3. 查看 `RELEASE_STARTUP_GUIDE.md` 了解 Docker 环境
4. 检查后端和前端的错误日志

## 下一步

- 启动成功后，在浏览器访问 http://localhost:5174
- 测试音乐播放功能
- 验证数据库同步是否正常
- 检查性能和用户体验
