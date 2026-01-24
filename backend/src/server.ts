import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { RoomManager } from './managers/RoomManager';
import { HistoryManager } from './managers/HistoryManager';
import { PlayerManager } from './managers/PlayerManager';
import { SocketHandlers } from './socket/handlers';
import { supabaseService } from './services/supabaseService';
import { localMusicService } from './services/localMusicService';

const app = express();
const httpServer = createServer(app);
// CORS 配置 - 生产环境应设置 ALLOWED_ORIGINS 环境变量
const getAllowedOrigins = (): string | string[] => {
  const origins = process.env.ALLOWED_ORIGINS;
  if (origins) {
    return origins.split(',').map(o => o.trim());
  }
  // 开发环境默认允许所有来源
  return process.env.NODE_ENV === 'production' ? [] : '*';
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

// 代理 Netease 音乐搜索
app.get('/api/music/netease', async (req, res) => {
  const { keyword, limit = '10' } = req.query;
  
  if (!keyword || typeof keyword !== 'string') {
    res.status(400).json({ error: '请提供搜索关键词' });
    return;
  }

  try {
    const params = new URLSearchParams({
      s: keyword,
      limit: limit.toString(),
      type: '1',
      offset: '0',
    });

    const response = await fetch(
      `https://music.163.com/api/search/get?${params.toString()}`,
      {
        headers: {
          'Referer': 'https://music.163.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[API] Netease search error:', error);
    res.status(500).json({ error: 'Failed to search Netease' });
  }
});

// 代理 QQ 音乐搜索
app.get('/api/music/qq', async (req, res) => {
  const { keyword, limit = '10' } = req.query;
  
  if (!keyword || typeof keyword !== 'string') {
    res.status(400).json({ error: '请提供搜索关键词' });
    return;
  }

  try {
    const params = new URLSearchParams({
      w: keyword,
      p: '1',
      n: limit.toString(),
      type: '0',
    });

    const response = await fetch(
      `https://u.y.qq.com/cgi-bin/musicu.fcg?${params.toString()}`,
      {
        headers: {
          'Referer': 'https://y.qq.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[API] QQ search error:', error);
    res.status(500).json({ error: 'Failed to search QQ Music' });
  }
});

// 本地音乐搜索
app.get('/api/music/local', async (req, res) => {
  const { keyword, limit = '10' } = req.query;
  
  if (!keyword || typeof keyword !== 'string') {
    res.status(400).json({ error: '请提供搜索关键词' });
    return;
  }

  try {
    const results = await localMusicService.searchMusic(keyword, parseInt(limit.toString()) || 10);
    res.json(results);
  } catch (error) {
    console.error('[API] Local music search error:', error);
    res.status(500).json({ error: 'Failed to search local music' });
  }
});

// 本地音乐文件流
app.get('/api/music/stream/:encodedPath', (req, res) => {
  try {
    const { encodedPath } = req.params;
    const stream = localMusicService.getFileStream(encodedPath);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    stream.pipe(res);
  } catch (error) {
    console.error('[API] Stream error:', error);
    res.status(404).json({ error: 'File not found or access denied' });
  }
});

// Socket.io events
io.on('connection', socket => {
  socketHandlers.handleConnection(socket, io);
});

// Periodic cleanup
setInterval(() => {
  roomManager.cleanupEmptyRooms();
}, 30000);

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Gomoku server running on port ${PORT}`);
  console.log(`[Server] Listening on all network interfaces (0.0.0.0)`);
});

export { app, io, roomManager, historyManager, playerManager };
