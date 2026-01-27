# 独属于自己的娱乐小屋

<div align="center">

![Version](https://img.shields.io/badge/version-v1.4.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-stable-success)

**一个功能完整的娱乐小屋，支持实时对战、观战、聊天等功能**

[在线演示](#) · [功能特性](#-功能特性) · [快速开始](#-快速开始) · [文档](#-文档)

</div>

---

## 🎯 快速导航

<details>
<summary><b>🚀 没有开发经验？点这里快速开始</b></summary>

### 最简单的安装方式（推荐）

**Windows 用户（3分钟开始游戏）：**
1. 双击运行 `start.bat`
2. 等待自动完成安装
3. 打开浏览器访问 `http://localhost:5173`

**详细安装指南：**
- 📖 [INSTALL.md](INSTALL.md) - 一页式快速安装指南
- 📚 [BEGINNER_GUIDE.md](BEGINNER_GUIDE.md) - 完整的新手使用教程（60页）

**快速安装命令：**
```bash
npm install @whoersir/gomoku-server
npm install @whoersir/gomoku-client
```

</details>

---

## 📋 项目简介

独属于自己的娱乐小屋是一个基于 WebSocket 的实时在线对弈系统，支持多玩家同时在线、房间创建、观战模式、实时聊天等功能。项目采用前后端分离架构，后端使用 Node.js + Socket.IO，前端使用 React + TypeScript + Tailwind CSS 构建。

### ✨ 核心特性

- 🎮 **实时对战**: 基于 WebSocket 的低延迟对战系统
- 🏠 **房间系统**: 支持创建/加入房间，自定义房间名称
- 👁️ **观战模式**: 允许其他玩家观看对局过程
- 💬 **实时聊天**: 房间内支持文字聊天互动
- 🔄 **重连机制**: 断线后可重新连接房间继续对局
- 📜 **对局历史**: 保存对局记录，支持复盘
- 🔒 **安全防护**: 输入验证、XSS防护、速率限制、CORS控制
- 📱 **响应式设计**: 支持桌面端和移动端访问

---

## 🛠️ 技术栈

### 后端
- **运行环境**: Node.js (v18+)
- **开发语言**: TypeScript
- **Web 框架**: Express
- **WebSocket**: Socket.IO
- **数据库**: SQLite (可选 Supabase 云数据库)

### 前端
- **开发框架**: React 18
- **开发语言**: TypeScript
- **构建工具**: Vite
- **状态管理**: React Hooks + Context
- **样式方案**: Tailwind CSS
- **图标库**: Lucide React

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装步骤

#### 1. 克隆仓库

```bash
git clone https://github.com/whoersir/Gomoku.git
cd Gomoku
```

#### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

#### 3. 配置环境变量

```bash
# 在 backend 目录下创建 .env 文件
cd backend
cp .env.example .env

# 编辑 .env 文件，配置以下变量
NODE_ENV=development
ADMIN_PASSWORD=your_secure_password
ALLOWED_ORIGINS=http://localhost:5173
PORT=3000
```

> **⚠️ 生产环境安全提示**: 生产环境必须设置强密码和限制允许的来源

#### 4. 启动项目

**Windows 用户:**
```bash
# 双击运行
start.bat
```

**Linux/Mac 用户:**
```bash
# 在项目根目录执行
chmod +x start.sh
./start.sh
```

**手动启动:**
```bash
# 终端 1: 启动后端
cd backend
npm run dev

# 终端 2: 启动前端
cd frontend
npm run dev
```

#### 5. 访问应用

打开浏览器访问: [http://localhost:5173](http://localhost:5173)

---

## 📦 通过 NPM 安装使用（推荐给没有开发经验的用户）

### 一键安装

**最简单的方式：直接安装已发布的包**

```bash
# 安装游戏服务器
npm install @whoersir/gomoku-server

# 安装游戏客户端
npm install @whoersir/gomoku-client
```

### 快速启动

**Windows 用户：双击运行 `start.bat`（自动完成所有步骤）**

**手动启动：**

```bash
# 启动服务器
cd node_modules/@whoersir/gomoku-server
npm start

# 新窗口启动客户端
cd node_modules/@whoersir/gomoku-client
npm run dev
```

### 详细文档

如果遇到问题或需要详细说明，请查看：
- [INSTALL.md](INSTALL.md) - 快速安装指南（3步）
- [BEGINNER_GUIDE.md](BEGINNER_GUIDE.md) - 完整新手教程（60页）

---

## 📖 使用说明

### 创建房间
1. 输入玩家昵称
2. 输入房间名称
3. 点击"创建房间"按钮
4. 等待对手加入

### 加入房间
1. 输入玩家昵称
2. 选择或输入房间ID
3. 点击"加入房间"按钮

### 开始游戏
- 当房内有2名玩家时自动开始
- 黑方先行，双方轮流落子
- 率先连成五子者获胜

### 观战模式
1. 在房间列表选择"观战"
2. 输入观战者名称
3. 选择房间开始观战

---

## 🔒 安全配置

### 环境变量说明

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `NODE_ENV` | 运行环境 (development/production) | development | 否 |
| `ADMIN_PASSWORD` | 管理员密码 | admin123 | 是 |
| `ALLOWED_ORIGINS` | 允许的CORS来源（逗号分隔） | * | 是 |
| `PORT` | 服务端口 | 3000 | 否 |
| `SUPABASE_URL` | Supabase数据库URL（可选） | - | 否 |
| `SUPABASE_KEY` | Supabase密钥（可选） | - | 否 |

### 生产环境配置示例

```bash
NODE_ENV=production
ADMIN_PASSWORD=your_very_secure_password_here
ALLOWED_ORIGINS=https://your-domain.com
PORT=3000
```

### 安全特性

- ✅ 输入验证和清理（XSS防护）
- ✅ 请求速率限制（100次/分钟）
- ✅ CORS源限制
- ✅ 环境变量配置（无硬编码密码）
- ✅ 坐标范围验证

---

## 📁 项目结构

```
Gomoku/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── server.ts       # 服务器入口
│   │   ├── socket/         # Socket.IO相关
│   │   │   ├── handlers.ts # 事件处理器
│   │   │   └── types.ts    # 类型定义
│   │   ├── managers/       # 管理器
│   │   │   ├── RoomManager.ts
│   │   │   ├── PlayerManager.ts
│   │   │   └── HistoryManager.ts
│   │   └── models/         # 数据模型
│   │       └── Room.ts
│   ├── .env.example        # 环境变量示例
│   └── package.json
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── App.tsx        # 主应用组件
│   │   ├── components/    # React组件
│   │   ├── hooks/         # 自定义Hooks
│   │   ├── services/      # 服务层
│   │   └── types/         # 类型定义
│   └── package.json
├── CHANGELOG.md           # 版本更新日志
├── SECURITY_AUDIT.md      # 安全审计报告
├── INSTALL.md            # 快速安装指南
├── BEGINNER_GUIDE.md     # 新手完整教程
├── start.bat             # Windows启动脚本
└── README.md            # 项目说明文档
```

---

## 🔄 版本历史

### [v1.4.1] - 2026-01-28 (TypeScript Fixes and Cleanup)

**问题修复:**
- 🐛 解决 TypeScript 编译错误
- 🐛 清理冗余文件和无用代码
- 🐛 优化编译配置和类型定义

**改进:**
- 🚀 更新 .gitignore 以忽略编译生成的 JavaScript 文件
- 🚀 代码结构优化和整理

### [v1.4.0] - 2026-01-27 (Music Player Refactor)

**新功能:**
- 🎵 重构音乐播放器，支持本地音乐文件播放
- 🎵 新增本地音乐文件上传和管理功能
- 🎵 改进音乐播放器用户界面和交互体验

**改进:**
- 🚀 优化音乐播放器性能和稳定性
- 🚀 增强音频文件格式支持

### [v1.3.2] - 2026-01-26 (UI Enhancement)

**新功能:**
- ✨ 添加修改昵称功能
- ✨ 优化 UI 样式和布局

**改进:**
- 🚀 改进用户界面交互体验
- 🚀 优化颜色选择和视觉设计

### [v1.3.1] - 2026-01-26 (UI Optimization)

**改进:**
- 🚀 优化界面布局和棋子颜色选择逻辑
- 🚀 改进游戏棋盘视觉效果
- 🚀 增强用户界面响应性

### [v1.3.0] - 2026-01-25 (Admin System Refactor)

**重构:**
- 🔧 重构管理员权限系统
- 🔧 取消独立登录按钮，改为基于账号名称自动识别管理员权限
- 🔧 简化 Socket 通信，移除密码参数传递

**改进:**
- 🚀 优化 UI 布局和按钮样式
- 🚀 添加预定义管理员账号列表：admin, administrator, 王香归

### [v1.2.0] - 2026-01-25 (Admin System Refactor)

**重构:**
- 🔧 重构管理员权限系统（同 v1.3.0）

### [v1.1.0] - 2026-01-25 (Admin System Refactor)

**重构:**
- 🔧 重构管理员权限系统（同 v1.3.0）

### [v1.0.3] - 2026-01-24 (Bug Fix Release)

**问题修复:**
- 🐛 Socket连接优化，修复连接失败后的重试机制
- 🐛 添加3次自动重试，提高连接成功率
- 🐛 优化房间列表获取的错误处理
- 🐛 清理未使用的在线音乐服务和代码

**改进:**
- 🚀 改进错误日志和用户反馈
- 🚀 移除不必要的依赖

### [v1.0.2] - 2026-01-23 (Package Release)

**新功能:**
- 📦 发布 NPM 包到 GitHub Packages
- 🚀 添加一键启动脚本（`start-simple.bat`）
- 📚 创建新手友好文档（`INSTALL.md`, `BEGINNER_GUIDE.md`）
- ✨ 简化安装流程，支持直接通过 NPM 安装

**改进:**
- 📖 添加详细的初学者使用指南（60页教程）
- 🎯 优化快速开始流程
- 📱 改进局域网多人游戏配置说明
- ❓ 添加 15+ 常见问题解答

**NPM 包:**
- 后端包: `@whoersir/gomoku-server@1.0.2`
- 前端包: `@whoersir/gomoku-client@1.0.2`

### [v1.0.1] - 2026-01-23 (Security Release)

**安全修复:**
- 🔒 硬编码密码改为环境变量配置
- 🔒 添加XSS防护和输入验证
- 🔒 CORS支持环境变量限制
- 🔒 添加请求速率限制（100次/分钟）

### [v1.0.0] - 2026-01-23 (Initial Release)

**功能特性:**
- ✅ 基础对战功能
- ✅ 房间系统
- ✅ 观战模式
- ✅ 实时聊天
- ✅ 对局历史记录

[查看完整更新日志](CHANGELOG.md)

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 📦 NPM 包

本项目已发布到 GitHub Packages，可以通过 npm 直接安装：

| 包名 | 版本 | 描述 | 安装命令 |
|------|------|------|----------|
| `@whoersir/gomoku-server` | 1.4.1 | 游戏服务器 | `npm install @whoersir/gomoku-server` |
| `@whoersir/gomoku-client` | 1.4.1 | 游戏客户端 | `npm install @whoersir/gomoku-client` |

**GitHub Packages:**
- [后端包](https://github.com/whoersir/Gomoku/pkgs/npm/%40whoersir%2Fgomoku-server)
- [前端包](https://github.com/whoersir/Gomoku/pkgs/npm/%40whoersir%2Fgomoku-client)

---

## 📞 联系方式

- **作者**: whoersir
- **项目链接**: [https://github.com/whoersir/Gomoku](https://github.com/whoersir/Gomoku)

---

## ⭐ Star History

如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！

<div align="center">

**感谢使用独属于自己的娱乐小屋！**

Made with ❤️ by whoersir

</div>
