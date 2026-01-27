import { Socket } from 'socket.io';
import { BaseHandler } from './BaseHandler';
import { log } from '../utils/logger';

/**
 * 观战相关操作的处理器
 */
export class SpectatorHandler extends BaseHandler {
  /**
   * 处理观战房间请求
   */
  async handleWatchRoom(
    socket: Socket,
    data: { roomId: string; spectatorName: string },
    io: any,
    callback: any
  ): Promise<void> {
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

    const result = room.addSpectator(
      socket.id,
      spectatorName || `Spectator-${socket.id.slice(0, 4)}`,
      socket
    );
    if (result.success) {
      this.setSpectatorName(socket.id, spectatorName);
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.spectatorName = spectatorName;
      socket.data.isSpectator = true;

      // 获取当前游戏状态发送给观战者
      let gameState = room.getGameState();
      const roomInfo = room.getRoomInfo();

      log.info(`[handleWatchRoom] Spectator ${spectatorName} started watching room ${roomId}`);
      log.info(`[handleWatchRoom] gameState:`, gameState);

      // 发送当前游戏状态给观战者
      if (gameState) {
        // 附加玩家统计信息
        gameState = await this.attachPlayerStats(gameState);
        log.info(`[handleWatchRoom] Emitting gameStateUpdate to spectator:`, gameState);
        socket.emit('gameStateUpdate', gameState);
      } else {
        // 如果游戏还未开始，发送等待状态
        const waitingState = {
          roomId,
          roomName: roomInfo.roomName || '',
          board: Array(15)
            .fill(null)
            .map(() => Array(15).fill(0)),
          currentPlayer: 1,
          status: 'waiting',
          moves: [],
          players: {
            black: roomInfo.blackPlayer || { id: '', name: 'Player 1' },
            white: roomInfo.whitePlayer || { id: '', name: 'Waiting...' },
          },
          spectators: [],
          createdAt: Date.now(),
        };
        log.info(
          `[handleWatchRoom] Emitting waiting gameStateUpdate to spectator:`,
          waitingState
        );
        socket.emit('gameStateUpdate', waitingState);
      }

      // 发送房间信息
      io.to(roomId).emit('roomInfo', roomInfo);
      log.info(`[handleWatchRoom] Emitted roomInfo to room ${roomId}`);

      // 广播更新房间列表
      io.emit('roomListUpdate', this.roomManager.getRoomList());

      callback({
        success: true,
        roomId,
        isSpectator: true,
        gameState: gameState || {
          roomId,
          roomName: roomInfo.roomName || '',
          board: Array(15)
            .fill(null)
            .map(() => Array(15).fill(0)),
          currentPlayer: 1,
          status: 'waiting',
          moves: [],
          players: {
            black: { id: '', name: roomInfo.blackPlayer?.name || 'Player 1' },
            white: { id: '', name: roomInfo.whitePlayer?.name || 'Waiting...' },
          },
          createdAt: Date.now(),
        },
      });
    } else {
      callback({ success: false, message: result.message });
    }
  }

  /**
   * 处理切换为观战者请求
   */
  async handleSwitchToSpectator(
    socket: Socket,
    data: { roomId: string; playerName: string },
    io: any,
    callback: any
  ): Promise<void> {
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

    log.info(`[Socket] Player ${socket.id} switching to spectator in room ${roomId}`);

    // Remove player from the room
    room.removePlayer(socket.id);
    this.deletePlayerName(socket.id);

    // Clear any existing spectator data for this socket (fix for bug 1)
    this.deleteSpectatorName(socket.id);
    room.removeSpectator(socket.id);

    // Add as spectator
    const spectatorName = playerName || `Spectator-${socket.id.slice(0, 4)}`;
    room.addSpectator(socket.id, spectatorName, socket);
    this.setSpectatorName(socket.id, spectatorName);

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
        board: Array(15)
          .fill(null)
          .map(() => Array(15).fill(0)),
        currentPlayer: 1,
        status: 'waiting',
        moves: [],
        players: {
          black: roomInfo.blackPlayer || { id: '', name: 'Waiting...' },
          white: roomInfo.whitePlayer || { id: '', name: 'Waiting...' },
        },
        spectators: roomInfo.spectators || [],
        createdAt: Date.now(),
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

    log.info(`[Socket] Player switched to spectator in room ${roomId}`);
    callback({ success: true, gameState });
  }
}
