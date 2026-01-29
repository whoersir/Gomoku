# 环境配置说明

本项目支持两个环境：`dev`（开发环境）和 `release`（发布环境）。

## 环境对比

| 配置项 | Dev 环境 | Release 环境 |
|--------|---------|-------------|
| 前端端口 | 5173 | 5174 |
| 后端端口 | 3000 | 3001 |
| 容器名称 | gomoku-backend<br/>gomoku-frontend | gomoku-backend-release<br/>gomoku-frontend-release |
| 启动时音乐同步 | 禁用 | 启用 |
| 控制台日志 | 启用 | 禁用 |
| CORS | 允许所有来源 | 限制允许的来源 |

## Dev 环境（开发环境）

### 特点
- 适合日常开发和调试
- 端口：前端 5173，后端 3000
- 启用控制台日志，方便调试
- 禁用启动时音乐同步，避免启动时间长

### 启动方式

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
./start.sh
```

或手动启动：
```bash
docker-compose up --build
```

### 访问地址
- 前端：http://localhost:5173
- 后端 API：http://localhost:3000

### 配置文件
- 前端环境变量：`frontend/.env`
- 后端环境变量：`backend/.env`

## Release 环境（发布环境）

### 特点
- 适合演示和生产部署
- 端口：前端 5174，后端 3001（避免与 dev 环境冲突）
- 禁用控制台日志，提升性能
- 启用启动时音乐同步，确保数据库最新

### 启动方式

**Windows:**
```bash
start-release.bat
```

**Linux/Mac:**
```bash
chmod +x start-release.sh
./start-release.sh
```

或手动启动：
```bash
docker-compose -f docker-compose.release.yml up --build
```

### 访问地址
- 前端：http://localhost:5174
- 后端 API：http://localhost:3001

### 配置文件
- 前端环境变量：`frontend/.env.release`
- 后端环境变量：`backend/.env.release`

## 同时运行两个环境

由于端口不同，你可以同时运行 dev 和 release 环境：

```bash
# 终端 1: 启动 dev 环境
start.bat

# 终端 2: 启动 release 环境
start-release.bat
```

## 环境变量说明

### 后端环境变量

| 变量名 | 说明 | Dev 默认值 | Release 默认值 |
|--------|------|-----------|---------------|
| PORT | 后端端口 | 3000 | 3000 |
| MUSIC_DIR | 音乐文件目录 | F:\\Music | /app/Music |
| DISABLE_LOCAL_MUSIC | 是否禁用本地音乐 | false | false |
| SUPABASE_URL | Supabase URL | - | 与 dev 相同 |
| SUPABASE_KEY | Supabase 密钥 | - | 与 dev 相同 |
| ENABLE_STARTUP_SYNC | 启动时同步音乐库 | false | true |
| ENABLE_FILE_WATCHER | 文件监听器 | false | false |
| ALLOWED_ORIGINS | 允许的 CORS 来源 | * | 限制的列表 |

### 前端环境变量

| 变量名 | 说明 | Dev 默认值 | Release 默认值 |
|--------|------|-----------|---------------|
| VITE_BACKEND_URL | 后端 API 地址 | http://10.75.31.37:3000 | http://localhost:3001 |
| VITE_ENABLE_CONSOLE | 是否启用控制台日志 | 未设置 | false |

## 停止环境

### 停止 dev 环境
```bash
docker-compose down
```

### 停止 release 环境
```bash
docker-compose -f docker-compose.release.yml down
```

### 停止所有环境
```bash
docker-compose down
docker-compose -f docker-compose.release.yml down
```

## 查看日志

### 查看 dev 环境日志
```bash
docker-compose logs -f
```

### 查看 release 环境日志
```bash
docker-compose -f docker-compose.release.yml logs -f
```

### 查看特定服务日志
```bash
# dev 环境
docker-compose logs -f backend
docker-compose logs -f frontend

# release 环境
docker-compose -f docker-compose.release.yml logs -f backend
docker-compose -f docker-compose.release.yml logs -f frontend
```

## 常见问题

### 1. 端口冲突

如果遇到端口冲突，可以修改 `docker-compose.yml` 或 `docker-compose.release.yml` 中的端口映射：

```yaml
ports:
  - "新端口:容器内端口"
```

### 2. 数据库同步失败

在 release 环境中，如果遇到数据库同步失败，可以：

1. 检查 Supabase 连接是否正常
2. 查看 `ENABLE_STARTUP_SYNC` 设置
3. 查看后端日志获取详细错误信息

### 3. 前端无法连接后端

检查：

1. 后端服务是否正常运行：`docker-compose -f docker-compose.release.yml ps`
2. `VITE_BACKEND_URL` 配置是否正确
3. CORS 配置是否允许前端来源

## 清理环境

如果需要完全清理 Docker 资源：

```bash
# 停止并删除容器、网络
docker-compose down -v
docker-compose -f docker-compose.release.yml down -v

# 删除镜像（可选）
docker rmi gomoku-backend gomoku-frontend
docker rmi gomoku-backend-release gomoku-frontend-release
```

## 注意事项

1. **数据持久化**：两个环境共享 `./data` 目录，如果需要独立的数据目录，可以在各自的 compose 文件中配置不同的卷挂载
2. **音乐文件**：确保音乐文件路径在不同环境中的可访问性
3. **环境变量**：修改环境变量后需要重新构建容器：`docker-compose -f docker-compose.release.yml up --build`
4. **日志级别**：release 环境禁用控制台日志以提升性能，如需调试可以临时启用
