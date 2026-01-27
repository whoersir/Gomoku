import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { RoomManager } from './managers/RoomManager';
import { HistoryManager } from './managers/HistoryManager';
import { PlayerManager } from './managers/PlayerManager';
import { SocketHandlers } from './socket/handlers';
import { supabaseService } from './services/supabaseService';
import { localMusicService } from './services/localMusicService';

// 用于避免重复打印音乐库加载日志
let musicListLogged = false;

// 获取音乐目录（与localMusicService中相同）
const getMusicDir = (): string => {
  const envDir = process.env.MUSIC_DIR;
  if (envDir && fs.existsSync(envDir)) {
    return envDir;
  }

  const windowsPath = 'F:\\Music';
  if (fs.existsSync(windowsPath)) {
    return windowsPath;
  }

  const userMusicDir = path.join(require('os').homedir(), 'Music');
  if (fs.existsSync(userMusicDir)) {
    return userMusicDir;
  }

  return windowsPath;
};

const app = express();
const httpServer = createServer(app);
// CORS 配置 - 开发环境允许所有来源，生产环境应设置 ALLOWED_ORIGINS 环境变量
const getAllowedOrigins = (): string | string[] => {
  const origins = process.env.ALLOWED_ORIGINS;
  if (origins) {
    return origins.split(',').map(o => o.trim());
  }
  // 开发环境默认允许所有来源
  return '*';
};

const corsOptions = {
  origin: getAllowedOrigins(),
  methods: ['GET', 'POST'],
  credentials: true,
};

const io = new SocketIOServer(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});

// 启用 CORS 中间件
app.use(cors(corsOptions));
app.use(express.json());

// Initialize managers
const roomManager = new RoomManager();
const historyManager = new HistoryManager('./data');
const playerManager = new PlayerManager('./data');
const socketHandlers = new SocketHandlers(roomManager, historyManager, playerManager);

// Initialize history
historyManager.initialize().catch(err => console.error('Failed to initialize history:', err));

// Initialize local music service (preload all music at startup)
localMusicService.initialize().catch(err => console.error('Failed to initialize local music service:', err));

// REST API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/rooms', (req, res) => {
  const rooms = roomManager.getRoomList();
  res.json(rooms);
});

app.get('/api/history', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
  const offset = parseInt(req.query.offset as string) || 0;
  const result = await historyManager.getRecords(limit, offset);
  res.json(result);
});

app.get('/api/history/player/:name', async (req, res) => {
  const playerName = req.params.name;
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
  const records = await historyManager.getRecordsByPlayer(playerName, limit);
  res.json(records);
});

app.get('/api/leaderboard', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
  
  try {
    // 优先从Supabase获取
    const supabaseLeaderboard = await supabaseService.getLeaderboard(limit);
    if (supabaseLeaderboard.length > 0) {
      // 转换字段名以兼容前端
      const transformed = supabaseLeaderboard.map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        totalGames: p.total_games,
        wins: p.wins,
        losses: p.losses,
        winRate: p.win_rate,
        lastPlayedAt: new Date(p.last_played_at).getTime()
      }));
      res.json(transformed);
      return;
    }
  } catch (err) {
    console.error('[API] Supabase leaderboard error:', err);
  }
  
  // 降级到本地
  const leaderboard = playerManager.getLeaderboard(limit);
  res.json(leaderboard);
});

// 获取对局历史（从Supabase）
app.get('/api/games', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  
  try {
    const games = await supabaseService.getGameHistory(limit, offset);
    res.json(games);
  } catch (err) {
    console.error('[API] Supabase games error:', err);
    res.json([]);
  }
});

// ========== 用户认证API ==========

// 注册
app.post('/api/auth/register', async (req, res) => {
  const { name } = req.body;
  
  if (!name || typeof name !== 'string') {
    res.status(400).json({ success: false, error: '请提供昵称' });
    return;
  }

  const result = await supabaseService.registerPlayer(name);
  
  if (result.success) {
    res.json({
      success: true,
      player: {
        id: result.player?.id,
        name: result.player?.name,
        score: result.player?.score,
        totalGames: result.player?.total_games,
        wins: result.player?.wins,
        losses: result.player?.losses,
        draws: result.player?.draws,
      },
      isNewUser: result.isNewUser,
    });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  const { name } = req.body;
  
  if (!name || typeof name !== 'string') {
    res.status(400).json({ success: false, error: '请提供昵称' });
    return;
  }

  const result = await supabaseService.loginPlayer(name);
  
  if (result.success) {
    res.json({
      success: true,
      player: {
        id: result.player?.id,
        name: result.player?.name,
        score: result.player?.score,
        totalGames: result.player?.total_games,
        wins: result.player?.wins,
        losses: result.player?.losses,
        draws: result.player?.draws,
      },
    });
  } else {
    res.status(401).json({ success: false, error: result.error });
  }
});

// 检查昵称是否可用
app.get('/api/auth/check-name', async (req, res) => {
  const name = req.query.name as string;
  
  if (!name) {
    res.status(400).json({ available: false, error: '请提供昵称' });
    return;
  }

  const available = await supabaseService.checkNameAvailable(name);
  res.json({ available, name: name.trim() });
});

// 获取玩家信息
app.get('/api/player/:id', async (req, res) => {
  const playerId = req.params.id;
  
  const player = await supabaseService.getPlayerById(playerId);
  
  if (player) {
    res.json({
      id: player.id,
      name: player.name,
      score: player.score,
      totalGames: player.total_games,
      wins: player.wins,
      losses: player.losses,
      draws: player.draws,
      isRegistered: player.is_registered,
    });
  } else {
    res.status(404).json({ error: '玩家不存在' });
  }
});

// ========== 音乐搜索代理API ==========

// 本地音乐流 - 用于播放本地音乐文件
app.get('/api/music/stream', async (req, res) => {
  const { path: filePath } = req.query;

  if (!filePath || typeof filePath !== 'string') {
    res.status(400).send('Missing file path');
    return;
  }

  try {
    // 解码文件路径
    const decodedPath = decodeURIComponent(filePath);

    // 安全检查：确保路径在允许的目录内
    const musicDir = getMusicDir();
    const fs = require('fs');
    const path = require('path');

    if (!decodedPath.startsWith(musicDir)) {
      console.error('[API] Invalid file path:', decodedPath);
      res.status(403).send('Access denied');
      return;
    }

    // 检查文件是否存在
    if (!fs.existsSync(decodedPath)) {
      console.error('[API] File not found:', decodedPath);
      res.status(404).send('File not found');
      return;
    }

    // 获取文件扩展名并设置Content-Type
    const ext = path.extname(decodedPath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      '.mp3': 'audio/mpeg',
      '.flac': 'audio/flac',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg'
    };

    const contentType = contentTypes[ext] || 'audio/mpeg';
    res.setHeader('Content-Type', contentType);

    // 支持范围请求（用于进度条）
    const stat = fs.statSync(decodedPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });

      const stream = fs.createReadStream(decodedPath, { start, end });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      });

      const stream = fs.createReadStream(decodedPath);
      stream.pipe(res);
    }
  } catch (error) {
    console.error('[API] Music stream error:', error);
    if (!res.headersSent) {
      res.status(500).send('Internal server error');
    }
  }
});

// 本地音乐搜索
app.get('/api/music/local', async (req, res) => {
  const { keyword, limit = '999999' } = req.query;

  try {
    // 允许空关键词（返回所有音乐或前 N 首）
    const searchKeyword = keyword && typeof keyword === 'string' ? keyword : '';
    const results = await localMusicService.searchMusic(searchKeyword, parseInt(limit.toString()) || 999999);

    // 优化日志输出，只在搜索时有关键词时才详细打印
    if (searchKeyword) {
      console.log(`[API] 🔍 搜索音乐: "${searchKeyword}" - 找到 ${results.length} 首歌曲`);
    } else {
      // 空关键词只在第一次或音乐列表变化时打印（用静默标志控制）
      if (!musicListLogged) {
        console.log(`[API] 📚 加载音乐库: ${results.length} 首歌曲`);
        musicListLogged = true;
      }
    }

    // 确保返回数组
    res.json(Array.isArray(results) ? results : []);
  } catch (error) {
    console.error('[API] ❌ 音乐搜索错误:', error);
    // 返回空数组而不是错误，避免前端 JSON 解析失败
    res.json([]);
  }
});

// 刷新音乐缓存
app.post('/api/music/refresh', async (req, res) => {
  try {
    console.log('[API] 🔄 刷新音乐缓存...');
    localMusicService.refreshCache();
    const results = await localMusicService.searchMusic('', 999999);
    console.log(`[API] ✅ 音乐库已刷新: ${results.length} 首歌曲`);

    // 重置日志标志，允许下次加载时打印
    musicListLogged = false;

    res.json({
      success: true,
      count: results.length,
      message: `已刷新音乐库，共 ${results.length} 首歌曲`
    });
  } catch (error) {
    console.error('[API] ❌ 刷新音乐库失败:', error);
    res.status(500).json({
      success: false,
      error: '刷新音乐库失败'
    });
  }
});

// 获取音乐库状态
app.get('/api/music/status', (req, res) => {
  try {
    const status = localMusicService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('[API] Get music status error:', error);
    res.status(500).json({
      success: false,
      error: '获取音乐库状态失败'
    });
  }
});

// Socket.io events
io.on('connection', socket => {
  socketHandlers.handleConnection(socket, io);
});

// Periodic cleanup - ensure at least one room exists
setInterval(() => {
  roomManager.cleanupEmptyRooms();
  
  // 如果清理后没有房间，创建一个默认房间
  if (roomManager.getRoomCount() === 0) {
    const { roomId } = roomManager.createRoom('默认五子棋房间');
    console.log(`[Server] 清理后重新创建默认房间: ${roomId} (默认五子棋房间)`);
  }
}, 30000);

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Gomoku server running on port ${PORT}`);
  console.log(`[Server] Listening on all network interfaces (0.0.0.0)`);
  
  // 如果没有房间，创建一个默认房间
  if (roomManager.getRoomCount() === 0) {
    const { roomId } = roomManager.createRoom('默认五子棋房间');
    console.log(`[Server] 创建默认房间: ${roomId} (默认五子棋房间)`);
  }
});

export { app, io, roomManager, historyManager, playerManager };
