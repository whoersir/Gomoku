# 音乐数据库设置指南

本文档介绍如何设置和测试新的音乐数据库功能。

## 📋 概述

新架构采用**混合方案**：
- 元数据存储在 Supabase 数据库（快速查询）
- 音乐文件直接流式传输（无需上传）
- 文件系统变化自动同步到数据库（实时更新）

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 创建数据库表

登录 [Supabase Dashboard](https://supabase.com/dashboard)，进入 SQL Editor，执行以下文件：

```bash
backend/supabase/music_tables.sql
```

### 3. 启动后端服务

```bash
cd backend
npm run dev
```

服务器启动时会自动执行音乐库同步。

## 🔍 验证功能

### 检查同步状态

```bash
curl http://localhost:3000/api/music/status
```

预期响应：
```json
{
  "database": {
    "totalTracks": 100,
    "lastSyncTime": "2024-01-01T00:00:00.000Z"
  },
  "local": {
    "musicDir": "F:\\Music",
    "cacheSize": 100,
    "lastCacheTime": 1234567890,
    "cacheExpired": false
  }
}
```

### 测试 API 端点

#### 1. 获取所有音乐
```bash
curl http://localhost:3000/api/music/all?limit=10&sortBy=title
```

#### 2. 搜索音乐
```bash
curl http://localhost:3000/api/music/local?keyword=周杰伦&limit=10
```

#### 3. 手动刷新音乐库
```bash
curl -X POST http://localhost:3000/api/music/refresh
```

预期响应：
```json
{
  "success": true,
  "count": 100,
  "message": "已同步音乐库，共 100 首歌曲 (新增 10, 更新 5, 删除 2)",
  "data": [...],
  "syncResult": {
    "added": 10,
    "updated": 5,
    "deleted": 2,
    "errors": [],
    "duration": 1234
  }
}
```

## 📊 数据库表结构

### music_tracks
存储音乐文件元数据

```sql
CREATE TABLE music_tracks (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  title TEXT,
  artist TEXT,
  album TEXT,
  duration INTEGER,
  has_cover BOOLEAN DEFAULT FALSE,
  file_hash TEXT,
  file_size INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### user_play_history
存储用户播放历史

```sql
CREATE TABLE user_play_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  track_id TEXT NOT NULL REFERENCES music_tracks(id),
  played_at TIMESTAMP,
  play_duration INTEGER,
  completed BOOLEAN DEFAULT FALSE
);
```

### user_favorites
存储用户收藏列表

```sql
CREATE TABLE user_favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  track_id TEXT NOT NULL REFERENCES music_tracks(id),
  created_at TIMESTAMP,
  UNIQUE(user_id, track_id)
);
```

## 🔄 自动同步机制

### 文件监听器
服务器启动后，文件监听器会自动启动，监听音乐目录变化：
- **新增文件**：自动提取元数据并插入数据库
- **修改文件**：重新计算哈希并更新数据库
- **删除文件**：从数据库中删除对应记录

### 防抖机制
为避免短时间内多次触发，文件变化使用 1 秒防抖。

## 🎵 前端集成

前端无需修改，API 完全兼容：

```typescript
// 搜索音乐
const response = await fetch('/api/music/local?keyword=周杰伦&limit=10');
const tracks = await response.json();

// 获取所有音乐
const response = await fetch('/api/music/all?limit=999999&sortBy=title');
const tracks = await response.json();

// 播放音乐（流式传输）
const audio = new Audio();
audio.src = `/api/music/stream?path=${encodeURIComponent(filePath)}`;
audio.play();
```

## 🛠️ 故障排查

### 问题：音乐目录不存在
```bash
[LocalMusic] ⚠️  音乐目录不存在: F:\Music
```

**解决方案**：设置环境变量或移动音乐文件
```bash
# Windows
set MUSIC_DIR=C:\Users\YourName\Music

# Linux/Mac
export MUSIC_DIR=/path/to/your/music
```

### 问题：同步失败
```bash
[MusicSync] ❌ 批量插入失败: ...
```

**解决方案**：
1. 检查 Supabase 连接配置
2. 确认数据库表已创建
3. 查看服务器日志了解详细错误

### 问题：文件监听器未启动
```bash
[FileWatcher] 监听器已在运行
```

**解决方案**：这是正常提示，表示监听器已在运行。

## 📝 SQL 查询示例

### 获取最常播放的曲目
```sql
SELECT t.*, COUNT(h.id) as play_count
FROM music_tracks t
LEFT JOIN user_play_history h ON t.id = h.track_id
GROUP BY t.id
ORDER BY play_count DESC, t.title
LIMIT 20;
```

### 获取用户播放历史
```sql
SELECT h.*, t.title, t.artist, t.album
FROM user_play_history h
JOIN music_tracks t ON h.track_id = t.id
WHERE h.user_id = 'user_socket_id'
ORDER BY h.played_at DESC
LIMIT 20;
```

### 获取用户收藏列表
```sql
SELECT f.*, t.title, t.artist, t.album
FROM user_favorites f
JOIN music_tracks t ON f.track_id = t.id
WHERE f.user_id = 'user_socket_id'
ORDER BY f.created_at DESC;
```

## 🎯 下一步优化

1. **封面图片优化**：实现封面图片 API，返回缩略图
2. **歌词支持**：集成歌词显示功能
3. **播放历史**：实现前端播放历史记录
4. **收藏功能**：实现用户收藏列表
5. **搜索优化**：添加全文搜索和高级筛选

## 📞 支持

如有问题，请查看服务器日志或联系开发团队。
