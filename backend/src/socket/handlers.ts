import { Socket } from 'socket.io';
import { RoomManager } from '../managers/RoomManager';
import { HistoryManager } from '../managers/HistoryManager';
import { PlayerManager } from '../managers/PlayerManager';
import { supabaseService } from '../services/supabaseService';
import { HistoryRecord, GameState } from '../types/game';

export class SocketHandlers {
  private roomManager: RoomManager;
  private historyManager: HistoryManager;
  private playerManager: PlayerManager;
  private playerNames: Map<string, string> = new Map();
  private spectatorNames: Map<string, string> = new Map(); // 观战者名称映射
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map(); // 速率限制
  private readonly RATE_LIMIT_MAX = 100; // 每分钟最大请求数
  private readonly RATE_LIMIT_WINDOW = 60000; // 1分钟窗口

  // 管理员账号列表，这些账号登录后自动成为管理员
  private readonly ADMIN_ACCOUNTS = ['admin', 'administrator', '王香归'];

  constructor(roomManager: RoomManager, historyManager: HistoryManager, playerManager: PlayerManager) {
    this.roomManager = roomManager;
    this.historyManager = historyManager;
    this.playerManager = playerManager;
  }

  // 为游戏状态附加玩家统计信息
  private async attachPlayerStats(gameState: GameState | null): Promise<GameState | null> {
    if (!gameState) return null;
    
    try {
      // 并行获取黑白双方的统计信息
      const [blackStats, whiteStats] = await Promise.all([
        gameState.players.black.name && gameState.players.black.name !== 'Waiting...'
          ? supabaseService.getPlayerStatsByName(gameState.players.black.name)
          : null,
        gameState.players.white.name && gameState.players.white.name !== 'Waiting...'
          ? supabaseService.getPlayerStatsByName(gameState.players.white.name)
          : null,
      ]);

      // 附加统计信息
      if (blackStats) {
        gameState.players.black.stats = blackStats;
      }
      if (whiteStats) {
        gameState.players.white.stats = whiteStats;
      }
    } catch (error) {
      console.error('[Socket] Failed to attach player stats:', error);
    }

    return gameState;
  }

  // 为房间信息附加玩家统计信息
  private async attachRoomInfoPlayerStats(roomInfo: any): Promise<any> {
    if (!roomInfo) return roomInfo;
    
    try {
      // 并行获取黑白双方的统计信息
      const [blackStats, whiteStats] = await Promise.all([
        roomInfo.blackPlayer?.name && roomInfo.blackPlayer.name !== 'Waiting...'
          ? supabaseService.getPlayerStatsByName(roomInfo.blackPlayer.name)
          : null,
        roomInfo.whitePlayer?.name && roomInfo.whitePlayer.name !== 'Waiting...'
          ? supabaseService.getPlayerStatsByName(roomInfo.whitePlayer.name)
          : null,
      ]);

      // 附加统计信息
      if (blackStats && roomInfo.blackPlayer) {
        roomInfo.blackPlayer.stats = blackStats;
      }
      if (whiteStats && roomInfo.whitePlayer) {
        roomInfo.whitePlayer.stats = whiteStats;
      }
    } catch (error) {
      console.error('[Socket] Failed to attach room info player stats:', error);
    }

    return roomInfo;
  }

  // 速率限制检查
  private checkRateLimit(socketId: string): boolean {
    const now = Date.now();
    const record = this.rateLimitMap.get(socketId);
    
    if (!record || now > record.resetTime) {
      this.rateLimitMap.set(socketId, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW });
      return true;
    }
    
    if (record.count >= this.RATE_LIMIT_MAX) {
      return false;
    }
    
    record.count++;
    return true;
  }

  // XSS防护 - 清理用户输入
  private sanitizeInput(input: string, maxLength: number = 100): string {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>\"'&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[char] || char;
      });
  }

  async handleConnection(socket: Socket, io: any): Promise<void> {
    console.log(`[Socket] Player connected: ${socket.id}`);

    socket.on('createRoom', (data, callback) => {
      this.handleCreateRoom(socket, data, io, callback);
    });

    socket.on('joinRoom', (data, callback) => {
      this.handleJoinRoom(socket, data, io, callback);
    });

    socket.on('watchRoom', (data, callback) => {
      this.handleWatchRoom(socket, data, io, callback);
    });

    socket.on('move', (data, callback) => {
      this.handleMove(socket, data, io, callback);
    });

    socket.on('chat', (data, callback) => {
      this.handleChat(socket, data, io, callback);
    });

    socket.on('closeRoom', (data, callback) => {
      this.handleCloseRoom(socket, data, io, callback);
    });

    socket.on('getRoomList', (data, callback) => {
      // Handle both cases: with or without data parameter
      const actualCallback = typeof data === 'function' ? data : callback;
      this.handleGetRoomList(actualCallback);
    });

    socket.on('getHistory', (data, callback) => {
      // Handle both cases: with or without data parameter
      let actualData = {};
      let actualCallback = callback;

      if (typeof data === 'function') {
        actualCallback = data;
      } else if (typeof data === 'object') {
        actualData = data;
      }

      this.handleGetHistory(actualData, actualCallback);
    });

    socket.on('getLeaderboard', (data, callback) => {
      // Handle both cases: with or without data parameter
      const actualCallback = typeof data === 'function' ? data : callback;
      this.handleGetLeaderboard(actualCallback);
    });

    socket.on('restartGame', (data, callback) => {
      this.handleRestartGame(socket, data, io, callback);
    });

    socket.on('switchToSpectator', (data, callback) => {
      this.handleSwitchToSpectator(socket, data, io, callback);
    });

    socket.on('leaveRoom', (_data, callback) => {
      this.handleLeaveRoom(socket, io, callback);
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket, io);
    });
  }

  private async handleCreateRoom(socket: Socket, data: { playerName: string; roomName: string }, io: any, callback: any): Promise<void> {
    // 速率限制检查
    if (!this.checkRateLimit(socket.id)) {
      callback({ success: false, message: 'Rate limit exceeded. Please wait a moment.' });
      return;
    }

    // 输入验证和清理
    const playerName = this.sanitizeInput(data.playerName, 20);
    const roomName = this.sanitizeInput(data.roomName, 30);

    if (!playerName || playerName.length < 1) {
      callback({ success: false, message: 'Invalid player name' });
      return;
    }

    if (!roomName || roomName.length < 1) {
      callback({ success: false, message: 'Invalid room name' });
      return;
    }

    console.log(`[Socket] Creating room "${roomName}" for player: ${playerName} (${socket.id})`);

    // Register or update player in PlayerManager
    this.playerManager.getOrCreatePlayer(socket.id, playerName);
    
    // 同步到Supabase
    supabaseService.getOrCreatePlayer(socket.id, playerName).catch(err => {
      console.error('[Socket] Failed to sync player to Supabase:', err);
    });

    const { roomId, room } = this.roomManager.createRoom(roomName);
    console.log(`[Socket] Created room: ${roomId} with name: ${roomName}`);

    const result = room.addPlayer(socket.id, playerName, socket, undefined);
    if (result.success) {
      this.playerNames.set(socket.id, playerName);
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.playerName = playerName;
      socket.data.playerColor = result.color;

      // 获取并附加玩家统计信息
      let roomInfo = room.getRoomInfo();
      roomInfo = await this.attachRoomInfoPlayerStats(roomInfo);
      
      io.to(roomId).emit('roomInfo', roomInfo);
      io.emit('roomListUpdate', this.roomManager.getRoomList());

      console.log(`[Socket] Room ${roomId} created successfully with player ${playerName} (color: ${result.color})`);
      callback({ success: true, roomId, color: result.color });
    } else {
      console.error(`[Socket] Failed to add player to room: ${result.message}`);
      callback({ success: false, message: result.message });
    }
  }

  private async handleJoinRoom(socket: Socket, data: { roomId: string; playerName: string; preferredColor?: 'black' | 'white' }, io: any, callback: any): Promise<void> {
    // 速率限制检查
    if (!this.checkRateLimit(socket.id)) {
      callback({ success: false, message: 'Rate limit exceeded. Please wait a moment.' });
      return;
    }

    // 输入验证和清理
    const roomId = data.roomId;
    const playerName = this.sanitizeInput(data.playerName, 20);
    const preferredColor = data.preferredColor;

    if (!playerName || playerName.length < 1) {
      callback({ success: false, message: 'Invalid player name' });
      return;
    }

    const room = this.roomManager.getRoom(roomId);

    if (!room) {
      callback({ success: false, message: 'Room not found' });
      return;
    }

    // Register or update player in PlayerManager
    this.playerManager.getOrCreatePlayer(socket.id, playerName);
    
    // 同步到Supabase
    supabaseService.getOrCreatePlayer(socket.id, playerName).catch(err => {
      console.error('[Socket] Failed to sync player to Supabase:', err);
    });

    const result = room.addPlayer(socket.id, playerName, socket, preferredColor);
    if (result.success) {
      this.playerNames.set(socket.id, playerName);
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.playerName = playerName;
      socket.data.playerColor = result.color;

      // Get game state - might be null if waiting for second player
      let gameState = room.getGameState();
      let roomInfo = room.getRoomInfo();

      console.log(`[handleJoinRoom] Player ${playerName} joined room ${roomId}, color: ${result.color}`);
      console.log(`[handleJoinRoom] gameState after addPlayer:`, gameState);
      console.log(`[handleJoinRoom] roomInfo:`, roomInfo);

      // 第二个玩家加入后，gameState 会被创建。需要立即广播给房间内所有玩家
      if (gameState) {
        // 附加玩家统计信息
        gameState = await this.attachPlayerStats(gameState);
        console.log(`[handleJoinRoom] Game started! Emitting gameStateUpdate to entire room with status: ${gameState?.status}`);
        io.to(roomId).emit('gameStateUpdate', gameState);
      }

      // 发送 playerJoined 事件
      io.to(roomId).emit('playerJoined', {
        playerId: socket.id,
        playerName,
        color: result.color,
      });
      console.log(`[handleJoinRoom] Emitted playerJoined to room ${roomId}`);

      // 发送 roomInfo 事件（附加玩家统计信息）
      roomInfo = await this.attachRoomInfoPlayerStats(roomInfo);
      io.to(roomId).emit('roomInfo', roomInfo);
      console.log(`[handleJoinRoom] Emitted roomInfo to room ${roomId}`, roomInfo);

      io.emit('roomListUpdate', this.roomManager.getRoomList());

      // Return gameState even if null - client will receive roomInfo and playerJoined events
      // to render the UI properly
      callback({
        success: true,
        roomId,
        color: result.color,
        gameState: gameState || {
          roomId,
          board: Array(15).fill(null).map(() => Array(15).fill(0)),
          currentPlayer: 1,
          status: 'waiting',
          moves: [],
          players: {
            black: { 
              id: roomInfo.blackPlayer?.id || '', 
              name: roomInfo.blackPlayer?.name || 'Player 1',
              stats: (roomInfo.blackPlayer as any)?.stats
            },
            white: { 
              id: roomInfo.whitePlayer?.id || '', 
              name: roomInfo.whitePlayer?.name || 'Waiting...',
              stats: (roomInfo.whitePlayer as any)?.stats
            }
          },
          spectators: [],
          createdAt: Date.now()
        }
      });
    } else {
      callback({ success: false, message: result.message });
    }
  }

  private async handleWatchRoom(socket: Socket, data: { roomId: string; spectatorName: string }, io: any, callback: any): Promise<void> {
    // 速率限制检查
    if (!this.checkRateLimit(socket.id)) {
      callback({ success: false, message: 'Rate limit exceeded. Please wait a moment.' });
      return;
    }

    // 输入验证和清理
    const roomId = data.roomId;
    const spectatorName = this.sanitizeInput(data.spectatorName, 20);

    const room = this.roomManager.getRoom(roomId);

    if (!room) {
      callback({ success: false, message: 'Room not found' });
      return;
    }

    const result = room.addSpectator(socket.id, spectatorName || `Spectator-${socket.id.slice(0, 4)}`, socket);
    if (result.success) {
      this.spectatorNames.set(socket.id, spectatorName);
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.spectatorName = spectatorName;
      socket.data.isSpectator = true;

      // 获取当前游戏状态发送给观战者
      let gameState = room.getGameState();
      const roomInfo = room.getRoomInfo();

      console.log(`[handleWatchRoom] Spectator ${spectatorName} started watching room ${roomId}`);
      console.log(`[handleWatchRoom] gameState:`, gameState);

      // 发送当前游戏状态给观战者
      if (gameState) {
        // 附加玩家统计信息
        gameState = await this.attachPlayerStats(gameState);
        console.log(`[handleWatchRoom] Emitting gameStateUpdate to spectator:`, gameState);
        socket.emit('gameStateUpdate', gameState);
      } else {
        // 如果游戏还未开始，发送等待状态
        const waitingState = {
          roomId,
          roomName: roomInfo.roomName || '',
          board: Array(15).fill(null).map(() => Array(15).fill(0)),
          currentPlayer: 1,
          status: 'waiting',
          moves: [],
          players: {
            black: roomInfo.blackPlayer || { id: '', name: 'Player 1' },
            white: roomInfo.whitePlayer || { id: '', name: 'Waiting...' }
          },
          spectators: [],
          createdAt: Date.now()
        };
        console.log(`[handleWatchRoom] Emitting waiting gameStateUpdate to spectator:`, waitingState);
        socket.emit('gameStateUpdate', waitingState);
      }

      // 发送房间信息
      io.to(roomId).emit('roomInfo', roomInfo);
      console.log(`[handleWatchRoom] Emitted roomInfo to room ${roomId}`);

      // 广播更新房间列表
      io.emit('roomListUpdate', this.roomManager.getRoomList());

      callback({
        success: true,
        roomId,
        isSpectator: true,
        gameState: gameState || {
          roomId,
          roomName: roomInfo.roomName || '',
          board: Array(15).fill(null).map(() => Array(15).fill(0)),
          currentPlayer: 1,
          status: 'waiting',
          moves: [],
          players: {
            black: { id: '', name: roomInfo.blackPlayer?.name || 'Player 1' },
            white: { id: '', name: roomInfo.whitePlayer?.name || 'Waiting...' }
          },
          createdAt: Date.now()
        }
      });
    } else {
      callback({ success: false, message: result.message });
    }
  }

  private async handleMove(socket: Socket, data: { roomId: string; x: number; y: number }, io: any, callback: any): Promise<void> {
    // 速率限制检查
    if (!this.checkRateLimit(socket.id)) {
      callback({ success: false, message: 'Rate limit exceeded. Please wait a moment.' });
      return;
    }

    const { roomId, x, y } = data;

    // 坐标验证
    if (typeof x !== 'number' || typeof y !== 'number' || 
        x < 0 || x >= 15 || y < 0 || y >= 15 ||
        !Number.isInteger(x) || !Number.isInteger(y)) {
      callback({ success: false, message: 'Invalid coordinates' });
      return;
    }

    const room = this.roomManager.getRoom(roomId);

    if (!room) {
      callback({ success: false, message: 'Room not found' });
      return;
    }

    console.log(`[handleMove] socket.id: ${socket.id}, playerColor: ${socket.data.playerColor}, attempting move at (${x}, ${y})`);
    const moveResult = room.makeMove(socket.id, x, y);
    console.log(`[handleMove] moveResult:`, moveResult);
    
    if (moveResult.success) {
      let gameState = moveResult.gameState!;
      // 附加玩家统计信息
      gameState = (await this.attachPlayerStats(gameState))!;
      io.to(roomId).emit('gameStateUpdate', gameState);
      io.to(roomId).emit('moveMade', {
        x,
        y,
        player: socket.data.playerColor,
        timestamp: Date.now(),
      });

      if (gameState.status === 'finished') {
        this.handleGameFinished(roomId, gameState, room, io);
      }

      callback({ success: true });
    } else {
      console.log(`[handleMove] Move failed for socket ${socket.id}: ${moveResult.message}`);
      callback({ success: false, message: moveResult.message });
    }
  }

  private handleChat(socket: Socket, data: { roomId: string; message: string }, io: any, callback: any): void {
    // 速率限制检查
    if (!this.checkRateLimit(socket.id)) {
      callback({ success: false, message: 'Rate limit exceeded. Please wait a moment.' });
      return;
    }

    const roomId = data.roomId;
    // 清理聊天消息，防止XSS
    const message = this.sanitizeInput(data.message, 500);

    if (!message || message.length < 1) {
      callback({ success: false, message: 'Message cannot be empty' });
      return;
    }

    const room = this.roomManager.getRoom(roomId);

    if (!room) {
      callback({ success: false, message: 'Room not found' });
      return;
    }

    const playerName = socket.data.playerName || 'Anonymous';
    const chatMessage = room.addMessage(socket.id, playerName, message);
    io.to(roomId).emit('newMessage', chatMessage);
    callback({ success: true });
  }

  private handleGetRoomList(callback: any): void {
    const roomList = this.roomManager.getRoomList();
    if (typeof callback === 'function') {
      callback(roomList);
    } else {
      console.warn('[Socket] handleGetRoomList: callback is not a function', typeof callback);
    }
  }

  private async handleGetHistory(data: { limit?: number; offset?: number }, callback: any): Promise<void> {
    if (typeof callback !== 'function') {
      console.warn('[Socket] handleGetHistory: callback is not a function', typeof callback);
      return;
    }

    const { limit = 100, offset = 0 } = data || {};
    const result = await this.historyManager.getRecords(limit, offset);
    callback(result);
  }

  private async handleGetLeaderboard(callback: any): Promise<void> {
    if (typeof callback !== 'function') {
      console.warn('[Socket] handleGetLeaderboard: callback is not a function', typeof callback);
      return;
    }

    try {
      // 优先从Supabase获取排行榜
      const supabaseLeaderboard = await supabaseService.getLeaderboard(10);
      if (supabaseLeaderboard.length > 0) {
        console.log(`[Socket] Sending Supabase leaderboard with ${supabaseLeaderboard.length} players`);
        callback(supabaseLeaderboard);
        return;
      }
    } catch (err) {
      console.error('[Socket] Failed to get Supabase leaderboard, fallback to local:', err);
    }

    // 降级到本地排行榜
    const leaderboard = this.playerManager.getLeaderboard(10);
    console.log(`[Socket] Sending local leaderboard with ${leaderboard.length} players`);
    callback(leaderboard);
  }

  private async handleGameFinished(roomId: string, gameState: any, _room: any, io: any): Promise<void> {
    io.to(roomId).emit('gameFinished', {
      winner: gameState.winner,
      moveCount: gameState.moves.length,
    });

    const historyRecord: HistoryRecord = {
      roomId,
      blackPlayer: gameState.players.black,
      whitePlayer: gameState.players.white,
      winner: gameState.winner,
      moveCount: gameState.moves.length,
      createdAt: gameState.createdAt,
      finishedAt: gameState.finishedAt!,
      duration: gameState.finishedAt! - gameState.createdAt,
    };

    await this.historyManager.saveRecord(historyRecord);

    // 保存到Supabase
    try {
      await supabaseService.saveGameRecord({
        roomId,
        roomName: gameState.roomName,
        blackPlayer: gameState.players.black,
        whitePlayer: gameState.players.white,
        winner: gameState.winner,
        moves: gameState.moves,
        createdAt: gameState.createdAt,
        finishedAt: gameState.finishedAt,
      });

      // 更新玩家积分到Supabase
      const isDraw = gameState.winner === 'draw';
      if (isDraw) {
        await supabaseService.updatePlayerGameResult(gameState.players.black.id, false, true);
        await supabaseService.updatePlayerGameResult(gameState.players.white.id, false, true);
      } else if (gameState.winner) {
        const winnerId = gameState.winner === 1 ? gameState.players.black.id : gameState.players.white.id;
        const loserId = gameState.winner === 1 ? gameState.players.white.id : gameState.players.black.id;
        await supabaseService.updatePlayerGameResult(winnerId, true, false);
        await supabaseService.updatePlayerGameResult(loserId, false, false);
      }
    } catch (err) {
      console.error('[Socket] Failed to save game to Supabase:', err);
    }

    // Record game result in PlayerManager (本地备份)
    if (gameState.winner && gameState.winner !== 'draw') {
      const winnerId = gameState.winner === 1 ? gameState.players.black.id : gameState.players.white.id;
      const loserId = gameState.winner === 1 ? gameState.players.white.id : gameState.players.black.id;
      this.playerManager.recordGameResult(winnerId, loserId);
    }
  }

  private handleCloseRoom(socket: Socket, data: { roomId: string }, io: any, callback: any): void {
    try {
      const { roomId } = data;
      console.log(`[handleCloseRoom] Received closeRoom request - roomId: ${roomId}, socket.id: ${socket.id}`);

      const room = this.roomManager.getRoom(roomId);
      if (!room) {
        console.log(`[handleCloseRoom] Room ${roomId} not found`);
        callback({ success: false, message: 'Room not found' });
        return;
      }

      // Check if the player is the room owner (black player who created the room) or admin
      const socketPlayerId = socket.id;
      const blackPlayer = room.getRoomInfo().blackPlayer;
      const playerName = socket.data.playerName;
      const isAdmin = playerName && this.ADMIN_ACCOUNTS.includes(playerName.toLowerCase());

      console.log(`[handleCloseRoom] Permission check - socketPlayerId: ${socketPlayerId}, blackPlayer.id: ${blackPlayer?.id}, isAdmin: ${isAdmin}, playerName: ${playerName}`);

      // Allow if room owner OR admin
      if (blackPlayer?.id === socketPlayerId || isAdmin) {
        console.log(`[Socket] Closing room ${roomId} by ${isAdmin ? 'admin' : 'owner'} ${socket.id}`);

        // Notify all players in the room that it's being closed
        io.to(roomId).emit('roomClosed', {
          roomId,
          reason: isAdmin ? 'Room closed by admin' : 'Room closed by owner',
        });

        // Remove the room
        this.roomManager.removeRoom(roomId);

        // Update room list for all clients
        io.emit('roomListUpdate', this.roomManager.getRoomList());

        console.log(`[handleCloseRoom] Room ${roomId} closed successfully, calling callback`);
        callback({ success: true, message: 'Room closed successfully' });
      } else {
        console.log(`[handleCloseRoom] Permission denied - not room owner or admin`);
        callback({ success: false, message: 'Only the room owner or admin can close the room' });
      }
    } catch (error) {
      console.error(`[handleCloseRoom] Error closing room:`, error);
      callback({ success: false, message: 'Internal server error' });
    }
  }

  private async handleRestartGame(socket: Socket, data: { roomId: string }, io: any, callback: any): Promise<void> {
    const { roomId } = data;
    const room = this.roomManager.getRoom(roomId);

    if (!room) {
      callback({ success: false, message: 'Room not found' });
      return;
    }

    console.log(`[Socket] Restarting game in room ${roomId} by ${socket.id}`);

    // Reset the game state
    let newGameState = room.restartGame();
    
    // 附加玩家统计信息
    newGameState = (await this.attachPlayerStats(newGameState))!;

    // Broadcast the new game state to all players and spectators in the room
    io.to(roomId).emit('gameStateUpdate', newGameState);
    io.to(roomId).emit('roomInfo', room.getRoomInfo());
    io.emit('roomListUpdate', this.roomManager.getRoomList());

    console.log(`[Socket] Game restarted in room ${roomId}`);
    callback({ success: true, gameState: newGameState });
  }

  private async handleSwitchToSpectator(socket: Socket, data: { roomId: string; playerName: string }, io: any, callback: any): Promise<void> {
    const { roomId, playerName } = data;
    const room = this.roomManager.getRoom(roomId);

    if (!room) {
      callback({ success: false, message: 'Room not found' });
      return;
    }

    const playerColor = socket.data.playerColor;

    if (!playerColor) {
      callback({ success: false, message: 'You are not a player in this room' });
      return;
    }

    console.log(`[Socket] Player ${socket.id} switching to spectator in room ${roomId}`);

    // Remove player from the room
    room.removePlayer(socket.id);
    this.playerNames.delete(socket.id);

    // Clear any existing spectator data for this socket (fix for bug 1)
    this.spectatorNames.delete(socket.id);
    room.removeSpectator(socket.id);

    // Add as spectator
    const spectatorName = playerName || `Spectator-${socket.id.slice(0, 4)}`;
    room.addSpectator(socket.id, spectatorName, socket);
    this.spectatorNames.set(socket.id, spectatorName);

    // Update socket data
    socket.data.playerColor = null;
    socket.data.isSpectator = true;

    // Get updated game state
    let gameState = room.getGameState();
    const roomInfo = room.getRoomInfo();

    // 如果没有游戏状态（只有一个玩家），创建一个等待状态
    if (!gameState) {
      gameState = {
        roomId,
        roomName: roomInfo.roomName || '',
        board: Array(15).fill(null).map(() => Array(15).fill(0)),
        currentPlayer: 1,
        status: 'waiting',
        moves: [],
        players: {
          black: roomInfo.blackPlayer || { id: '', name: 'Waiting...' },
          white: roomInfo.whitePlayer || { id: '', name: 'Waiting...' }
        },
        spectators: roomInfo.spectators || [],
        createdAt: Date.now()
      };
    }
    
    // 附加玩家统计信息
    gameState = (await this.attachPlayerStats(gameState))!;

    // Notify all in the room
    io.to(roomId).emit('playerLeft', {
      playerId: socket.id,
      playerName: spectatorName,
    });
    io.to(roomId).emit('gameStateUpdate', gameState);
    io.to(roomId).emit('roomInfo', roomInfo);
    io.emit('roomListUpdate', this.roomManager.getRoomList());

    console.log(`[Socket] Player switched to spectator in room ${roomId}`);
    callback({ success: true, gameState });
  }

  private handleLeaveRoom(socket: Socket, io: any, callback: any): void {
    const roomId = socket.data.roomId;
    const isSpectator = socket.data.isSpectator;

    if (roomId) {
      const room = this.roomManager.getRoom(roomId);
      if (room) {
        if (isSpectator) {
          // 观战者离开
          room.removeSpectator(socket.id);
          this.spectatorNames.delete(socket.id);
          io.to(roomId).emit('roomInfo', room.getRoomInfo());
        } else {
          // 玩家离开
          const playerName = socket.data.playerName;
          const playerColor = socket.data.playerColor;
          
          room.removePlayer(socket.id);

          // 检查房间状态
          if (room.getPlayerCount() === 1) {
            room.restartGame();
            const gameState = room.getGameState();
            if (gameState) {
              io.to(roomId).emit('gameStateUpdate', gameState);
            }
          }

          // 不再自动关闭房间，玩家退出后房间保持开放
          // 房间只能通过closeRoom接口显式关闭
          if (room.getPlayerCount() > 0) {
            // 房间还有其他玩家，发送玩家离开事件
            io.to(roomId).emit('playerLeft', {
              playerId: socket.id,
              playerName,
              playerColor,
            });

            const roomInfo = room.getRoomInfo();
            io.to(roomId).emit('roomInfo', roomInfo);

            const gameState = room.getGameState();
            if (gameState) {
              io.to(roomId).emit('gameStateUpdate', gameState);
            }
          } else {
            // 房间已空，但保持开放
            console.log(`[Socket] Room ${roomId} is now empty but remains open`);
            // 更新房间信息，让列表反映空房间状态
            const roomInfo = room.getRoomInfo();
            io.to(roomId).emit('roomInfo', roomInfo);
          }

          this.playerNames.delete(socket.id);
        }
      }
    }

    // 清除socket的房间数据
    socket.data.roomId = null;
    socket.data.playerName = null;
    socket.data.playerColor = null;
    socket.data.isSpectator = null;

    console.log(`[Socket] Player left room: ${socket.id}`);
    
    if (callback) {
      callback({ success: true });
    }
    
    // 广播房间列表更新
    io.emit('roomListUpdate', this.roomManager.getRoomList());
  }

  private handleDisconnect(socket: Socket, io: any): void {
    const roomId = socket.data.roomId;
    const isSpectator = socket.data.isSpectator;

    if (roomId) {
      const room = this.roomManager.getRoom(roomId);
      if (room) {
        if (isSpectator) {
          // 观战者断开连接
          room.removeSpectator(socket.id);
          console.log(`[Socket] Spectator disconnected: ${socket.id}`);
          this.spectatorNames.delete(socket.id);
          
          // 发送更新的房间信息
          io.to(roomId).emit('roomInfo', room.getRoomInfo());
        } else {
          // 玩家断开连接
          const playerName = socket.data.playerName;
          const playerColor = socket.data.playerColor;
          
          room.removePlayer(socket.id);

          // 检查房间状态，如果只剩下一个玩家，重置游戏状态为等待（修复bug 2）
          if (room.getPlayerCount() === 1) {
            // 重置游戏状态
            room.restartGame();
            // 发送重置后的游戏状态
            const gameState = room.getGameState();
            if (gameState) {
              io.to(roomId).emit('gameStateUpdate', gameState);
            } else {
              // 如果没有游戏状态，发送等待状态
              const roomInfo = room.getRoomInfo();
              io.to(roomId).emit('gameStateUpdate', {
                roomId,
                roomName: roomInfo.roomName || '',
                board: Array(15).fill(null).map(() => Array(15).fill(0)),
                currentPlayer: 1,
                status: 'waiting',
                moves: [],
                players: {
                  black: roomInfo.blackPlayer || { id: '', name: 'Waiting...' },
                  white: roomInfo.whitePlayer || { id: '', name: 'Waiting...' }
                },
                spectators: roomInfo.spectators || [],
                createdAt: Date.now()
              });
            }
          }

          // 不再自动关闭房间，即使所有玩家退出，房间也保持开放
          // 房间只能通过closeRoom接口显式关闭

          if (room.getPlayerCount() === 0) {
            console.log(`[Socket] Room ${roomId} is now empty but remains open`);
            // 广播空的房间信息
            const roomInfo = room.getRoomInfo();
            io.to(roomId).emit('roomInfo', roomInfo);
            io.emit('roomListUpdate', this.roomManager.getRoomList());
          } else {
            // 发送玩家离开事件
            io.to(roomId).emit('playerLeft', {
              playerId: socket.id,
              playerName,
              playerColor, // 添加玩家颜色信息
            });

            // 发送更新的房间信息
            const roomInfo = room.getRoomInfo();
            io.to(roomId).emit('roomInfo', roomInfo);
            
            // 发送更新的游戏状态 - 重要：这会清空离开玩家的信息
            const gameState = room.getGameState();
            if (gameState) {
              io.to(roomId).emit('gameStateUpdate', gameState);
            } else {
              // 游戏引擎被清除，发送等待状态
              io.to(roomId).emit('gameStateUpdate', {
                roomId,
                roomName: roomInfo.roomName || '',
                board: Array(15).fill(null).map(() => Array(15).fill(0)),
                currentPlayer: 1,
                status: 'waiting',
                moves: [],
                players: {
                  black: roomInfo.blackPlayer || { id: '', name: 'Waiting...' },
                  white: roomInfo.whitePlayer || { id: '', name: 'Waiting...' }
                },
                spectators: roomInfo.spectators || [],
                createdAt: Date.now()
              });
            }
            
            io.emit('roomListUpdate', this.roomManager.getRoomList());
          }
          this.playerNames.delete(socket.id);
        }
      }
    }

    // 清除socket的房间数据，防止后续请求时还显示旧房间信息
    socket.data.roomId = null;
    socket.data.playerName = null;
    socket.data.playerColor = null;
    socket.data.isSpectator = null;

    console.log(`[Socket] Player disconnected: ${socket.id}`);
  }
}
