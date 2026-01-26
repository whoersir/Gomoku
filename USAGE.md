# 独属于自己的娱乐小屋 - 使用指南

## 📋 快速开始

### 系统要求
- Node.js 16+
- npm 8+
- 支持的浏览器：Chrome、Firefox、Safari、Edge

### 一键启动

#### Windows
```bash
# 直接双击运行
start.bat

# 或者在命令行运行
.\start.bat
```

#### macOS/Linux
```bash
# 运行启动脚本
chmod +x start.sh
./start.sh
```

### 手动启动

#### 1. 启动后端服务器
```bash
cd backend
npm install      # 首次运行需要安装依赖
npm run dev      # 开发模式
# 或
npm run build && npm start  # 生产模式
```

后端将在 `http://localhost:3000` 运行

#### 2. 启动前端应用
```bash
cd frontend
npm install      # 首次运行需要安装依赖
npm run dev      # 开发模式
```

前端将在 `http://localhost:5173` 运行

## 🎮 游戏玩法

### 本地游戏（同一台电脑）
1. 打开浏览器访问 `http://localhost:5173`
2. 在连接对话框输入：
   - 服务器地址：`localhost`
   - 端口号：`3000`
3. 点击"连接服务器"

### 局域网游戏（同一网络的多台设备）

#### 第一步：获取服务器地址
1. 在运行后端的电脑上打开命令行
2. 运行命令查看IP地址：
   - **Windows**: `ipconfig` (查找 IPv4 Address)
   - **macOS/Linux**: `ifconfig` (查找 inet)
3. 记下局域网IP地址，例如：`192.168.1.100`

#### 第二步：其他设备连接
1. 确保设备在同一局域网内
2. 打开浏览器访问 `http://{服务器IP}:5173`
   - 例如：`http://192.168.1.100:5173`
3. 在连接对话框输入：
   - 服务器地址：`192.168.1.100`
   - 端口号：`3000`
4. 点击"连接服务器"

### 游戏流程

1. **创建或加入房间**
   - 输入昵称
   - 选择创建新房间或加入现有房间
   - 等待第二个玩家加入（系统自动分配黑白棋）

2. **游戏对战**
   - 黑棋先手
   - 点击棋盘空白位置落子
   - 轮流下棋直到一方获胜或平局

3. **游戏结束**
   - 五子连珠判定为胜利
   - 棋盘满且无法胜利判定为平局
   - 可以返回房间列表开始新游戏

4. **聊天功能**
   - 游戏过程中可以在右侧聊天区域与对手交流
   - 输入消息后按 Enter 或点击发送按钮

## 🔧 API 文档

### REST API

#### 获取房间列表
```
GET /api/rooms
响应: [
  {
    roomId: "abc123",
    status: "waiting|playing|finished",
    playerCount: 1|2,
    blackPlayer: {id, name},
    whitePlayer: {id, name},
    createdAt: timestamp
  }
]
```

#### 获取对战历史
```
GET /api/history?limit=100&offset=0
响应: {
  total: number,
  records: [
    {
      roomId: string,
      blackPlayer: {id, name},
      whitePlayer: {id, name},
      winner: 1|2|"draw",
      moveCount: number,
      createdAt: timestamp,
      finishedAt: timestamp,
      duration: number
    }
  ]
}
```

#### 按玩家查询历史
```
GET /api/history/player/{playerName}?limit=100
响应: [...相同的对战历史记录]
```

### Socket.io 事件

#### 客户端发送事件
- `createRoom` - 创建新房间
- `joinRoom` - 加入房间
- `move` - 落子
- `chat` - 发送聊天消息
- `getRoomList` - 获取房间列表
- `getHistory` - 获取对战历史

#### 服务器推送事件
- `gameStateUpdate` - 游戏状态更新
- `newMessage` - 新聊天消息
- `playerJoined` - 玩家加入
- `playerLeft` - 玩家离开
- `roomListUpdate` - 房间列表更新
- `gameFinished` - 游戏结束

## ⚙️ 配置说明

### 后端配置
- **监听地址**：0.0.0.0（所有网卡）
- **默认端口**：3000（可通过 PORT 环境变量修改）
- **棋盘大小**：15x15
- **获胜条件**：五子连珠
- **数据存储**：./data/history.json（JSON Lines 格式）

### 前端配置
- **监听地址**：0.0.0.0（所有网卡）
- **默认端口**：5173
- **自动重连**：支持（最多5次）
- **重连延迟**：1-5秒

## 🛠️ 故障排查

### 无法连接服务器
1. 确认后端服务已启动（看到日志输出）
2. 检查服务器地址和端口是否正确
3. 检查防火墙是否允许3000端口通过
4. 尝试刷新浏览器

### 页面无法打开
1. 确认前端服务已启动
2. 检查是否使用了正确的端口5173
3. 尝试打开 http://localhost:5173 测试

### 棋局无法同步
1. 刷新浏览器重新连接
2. 检查网络延迟
3. 查看浏览器控制台（F12）是否有错误提示

### 对战历史未保存
1. 检查 ./data 目录权限
2. 确认磁盘有足够空间
3. 查看 history.json 文件是否存在

## 📊 项目结构

```
gomoku-lan-game/
├── backend/
│   ├── src/
│   │   ├── game/              # 游戏引擎（棋盘、胜负判定、房间）
│   │   ├── managers/          # 管理器（房间、历史记录）
│   │   ├── socket/            # Socket事件处理
│   │   ├── types/             # TypeScript类型定义
│   │   └── server.ts          # Express服务器入口
│   └── data/                  # 对战历史数据
├── frontend/
│   ├── src/
│   │   ├── components/        # React组件
│   │   ├── services/          # Socket客户端
│   │   ├── hooks/             # React Hooks
│   │   ├── types/             # TypeScript类型定义
│   │   └── App.tsx            # 主应用
│   └── public/
├── start.sh                   # Linux/macOS启动脚本
├── start.bat                  # Windows启动脚本
└── USAGE.md                   # 本文档
```

## 🎯 特色功能

✅ **实时对战** - Socket.io驱动的毫秒级同步
✅ **聊天系统** - 游戏中实时沟通
✅ **房间管理** - 支持多个并发游戏房间
✅ **历史记录** - 完整的对战数据持久化
✅ **现代UI** - 深色主题 + 优雅动画
✅ **局域网支持** - 开箱即用的本地网络游戏
✅ **跨平台** - Windows/macOS/Linux通用

## 📝 开发模式

### 后端开发
```bash
cd backend
npm run dev   # 使用ts-node自动重载
```

### 前端开发
```bash
cd frontend
npm run dev   # 使用Vite热模块替换
```

### 生产构建
```bash
# 后端
cd backend && npm run build
node dist/server.js

# 前端
cd frontend && npm run build
npx serve dist
```

## 📄 许可证

MIT License

---

**需要帮助？** 查看项目文件中的注释或提交问题反馈。
