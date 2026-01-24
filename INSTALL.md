# 🎮 五子棋对战平台 - 初学者安装指南

> 最简单的安装方式，3分钟开始游戏！

---

## ⚡ 快速开始（推荐）

### Windows 用户（最简单）

1. **双击运行** `start-simple.bat`
2. 等待自动安装和启动
3. 打开浏览器访问 `http://localhost:5173`

就这么简单！

---

## 📋 手动安装步骤

### 第1步：安装 Node.js

1. 访问 https://nodejs.org/
2. 下载并安装 LTS 版本
3. 重启电脑

### 第2步：安装游戏

在命令提示符（CMD）中运行：

```bash
npm install @whoersir/gomoku-server
npm install @whoersir/gomoku-client
```

### 第3步：启动游戏

**启动服务器**：
```bash
cd node_modules\@whoersir\gomoku-server
npm start
```

**启动客户端（新窗口）**：
```bash
cd node_modules\@whoersir\gomoku-client
npm run dev
```

打开浏览器：`http://localhost:5173`

---

## 📱 局域网多人游戏

1. 查找服务器 IP 地址（在服务器电脑上运行 `ipconfig`）
2. 其他设备访问：`http://服务器IP:5173`

---

## ❓ 遇到问题？

查看 **BEGINNER_GUIDE.md** 获取详细说明和常见问题解答。

---

## 📖 完整文档

- **使用指南**: [BEGINNER_GUIDE.md](BEGINNER_GUIDE.md)
- **项目文档**: [README.md](README.md)

---

**版本**: v1.0.2
**更新**: 2026-01-23
