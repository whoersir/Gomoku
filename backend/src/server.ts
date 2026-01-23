import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { RoomManager } from './managers/RoomManager';
import { HistoryManager } from './managers/HistoryManager';
import { PlayerManager } from './managers/PlayerManager';
import { SocketHandlers } from './socket/handlers';
import { supabaseService } from './services/supabaseService';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// 启用 CORS 中间件（允许所有来源）
app.use(cors());
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
