# Release 环境启动指南

## 快速开始

### 方法 1: 使用诊断脚本（推荐首次使用）

双击运行 `diagnose-release.bat`，它会检查：
- Docker 是否安装
- Docker Compose 是否可用
- 配置文件是否存在
- Docker 服务是否运行

### 方法 2: 使用简化启动脚本

双击运行 `start-release-docker.bat`（无错误检测，最简单）

### 方法 3: 使用完整启动脚本

双击运行 `start-release.bat`（包含错误检查）

### 方法 4: 手动启动（最可靠）

打开命令提示符或 PowerShell，执行：

```bash
cd 你的项目路径
docker-compose -f docker-compose.release.yml up --build
```

## 访问地址

启动成功后，在浏览器中打开：
- **前端**: http://localhost:5174
- **后端 API**: http://localhost:3001

## 常见问题

### 1. 双击 bat 文件没反应

**可能原因**：
- Docker Desktop 未安装
- Docker Desktop 未启动
- 文件关联问题

**解决方法**：
1. 先运行 `diagnose-release.bat` 查看具体错误
2. 使用方法 4（手动启动）
3. 以管理员身份运行 bat 文件

### 2. 提示 "Docker is not installed"

**解决方法**：
1. 下载安装 Docker Desktop: https://www.docker.com/products/docker-desktop
2. 安装后启动 Docker Desktop
3. 等待 Docker 完全启动（任务栏有 Docker 图标）

### 3. 提示 "Docker service is not running"

**解决方法**：
1. 启动 Docker Desktop
2. 等待 Docker 服务完全启动
3. 重新运行启动脚本

### 4. 端口被占用

**错误信息**：`port is already allocated`

**解决方法**：
```bash
# 查找占用端口的进程
netstat -ano | findstr :3001
netstat -ano | findstr :5174

# 或者停止可能占用端口的容器
docker-compose -f docker-compose.release.yml down
```

### 5. 端口 3001 或 5174 被其他程序占用

**解决方法**：修改 `docker-compose.release.yml` 中的端口映射

```yaml
# 将 3001:3000 改为其他端口，如 3002:3000
ports:
  - "3002:3000"  # 修改这里
```

## 停止服务

### 方法 1: 使用快捷键
在运行启动脚本的窗口中按 `Ctrl+C`

### 方法 2: 手动停止
```bash
docker-compose -f docker-compose.release.yml down
```

### 方法 3: 停止所有 Docker 容器
```bash
docker stop $(docker ps -q)
```

## 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.release.yml logs -f

# 只查看后端日志
docker-compose -f docker-compose.release.yml logs -f backend

# 只查看前端日志
docker-compose -f docker-compose.release.yml logs -f frontend
```

## 重新构建

如果修改了代码或配置：

```bash
# 停止并删除旧容器
docker-compose -f docker-compose.release.yml down

# 重新构建并启动
docker-compose -f docker-compose.release.yml up --build
```

## 清理环境

如果需要完全清理：

```bash
# 停止并删除容器、网络
docker-compose -f docker-compose.release.yml down -v

# 删除镜像
docker rmi gomoku-backend-release gomoku-frontend-release

# 清理未使用的 Docker 资源
docker system prune -a
```

## 与 Dev 环境同时运行

由于端口不同，可以同时运行：

```bash
# 终端 1: 启动 Dev 环境
start.bat

# 终端 2: 启动 Release 环境
start-release.bat
```

端口映射：
| 环境 | 前端端口 | 后端端口 |
|------|---------|---------|
| Dev | 5173 | 3000 |
| Release | 5174 | 3001 |

## 配置文件说明

- `docker-compose.release.yml` - Docker Compose 配置
- `backend/.env.release` - 后端环境变量
- `frontend/.env.release` - 前端环境变量

修改环境变量后需要重新构建容器：
```bash
docker-compose -f docker-compose.release.yml up --build
```

## 需要帮助？

1. 先运行 `diagnose-release.bat` 进行诊断
2. 查看本文档的"常见问题"部分
3. 查看 `ENVIRONMENT_SETUP.md` 获取更详细的配置说明
4. 查看 Docker 日志获取错误信息

## PowerShell 用户

如果你使用 PowerShell，可以创建一个启动脚本 `start-release.ps1`：

```powershell
Write-Host "Starting Release Environment..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3001"
Write-Host "Frontend: http://localhost:5174"
docker-compose -f docker-compose.release.yml up --build
```

使用方法：
```powershell
# 首次使用需要允许脚本执行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 启动
.\start-release.ps1
```
