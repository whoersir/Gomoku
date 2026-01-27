import { Socket } from 'socket.io';
import { BaseHandler } from './BaseHandler';
import { supabaseService } from '../services/supabaseService';
import { log } from '../utils/logger';

/**
 * 房间相关操作的处理器
 */
export class RoomHandler extends BaseHandler {
  /**
   * 处理创建房间请求
   */
  async handleCreateRoom(
    socket: Socket,
    data: { playerName: string; roomName: string },
    io: any,
    callback: any
  ): Promise<void> {
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

    log.info(`[Socket] Creating room "${roomName}" for player: ${playerName} (${socket.id})`);

    // Register or update player in PlayerManager
    this.playerManager.getOrCreatePlayer(socket.id, playerName);

    // 同步到Supabase
    supabaseService.getOrCreatePlayer(socket.id, playerName).catch((err) => {
      log.error('[Socket] Failed to sync player to Supabase:', err);
    });

    const { roomId, room } = this.roomManager.createRoom(roomName);
    log.info(`[Socket] Created room: ${roomId} with name: ${roomName}`);

    const result = room.addPlayer(socket.id, playerName, socket, undefined);
    if (result.success) {
      this.setPlayerName(socket.id, playerName);
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.playerName = playerName;
      socket.data.playerColor = result.color;

      // 获取并附加玩家统计信息
      let roomInfo = room.getRoomInfo();
      roomInfo = await this.attachRoomInfoPlayerStats(roomInfo);

      io.to(roomId).emit('roomInfo', roomInfo);
      io.emit('roomListUpdate', this.roomManager.getRoomList());

      log.info(
        `[Socket] Room ${roomId} created successfully with player ${playerName} (color: ${result.color})`
      );
      callback({ success: true, roomId, color: result.color });
    } else {
      log.error(`[Socket] Failed to add player to room: ${result.message}`);
      callback({ success: false, message: result.message });
    }
  }

  /**
   * 处理加入房间请求
   */
  async handleJoinRoom(
    socket: Socket,
    data: { roomId: string; playerName: string; preferredColor?: 'black' | 'white' },
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
    supabaseService.getOrCreatePlayer(socket.id, playerName).catch((err) => {
      log.error('[Socket] Failed to sync player to Supabase:', err);
    });

    const result = room.addPlayer(socket.id, playerName, socket, preferredColor);
    if (result.success) {
      this.setPlayerName(socket.id, playerName);
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.playerName = playerName;
      socket.data.playerColor = result.color;

      // Get game state - might be null if waiting for second player
      let gameState = room.getGameState();
      let roomInfo = room.getRoomInfo();

      log.info(
        `[handleJoinRoom] Player ${playerName} joined room ${roomId}, color: ${result.color}`
      );
      log.info(`[handleJoinRoom] gameState after addPlayer:`, gameState);
      log.info(`[handleJoinRoom] roomInfo:`, roomInfo);

      // 第二个玩家加入后，gameState 会被创建。需要立即广播给房间内所有玩家
      if (gameState) {
        // 附加玩家统计信息
        gameState = await this.attachPlayerStats(gameState);
        log.info(
          `[handleJoinRoom] Game started! Emitting gameStateUpdate to entire room with status: ${gameState?.status}`
        );
        io.to(roomId).emit('gameStateUpdate', gameState);
      }

      // 发送 playerJoined 事件
      io.to(roomId).emit('playerJoined', {
        playerId: socket.id,
        playerName,
        color: result.color,
      });
      log.info(`[handleJoinRoom] Emitted playerJoined to room ${roomId}`);

      // 发送 roomInfo 事件（附加玩家统计信息）
      roomInfo = await this.attachRoomInfoPlayerStats(roomInfo);
      io.to(roomId).emit('roomInfo', roomInfo);
      log.info(`[handleJoinRoom] Emitted roomInfo to room ${roomId}`, roomInfo);

      io.emit('roomListUpdate', this.roomManager.getRoomList());

      // Return gameState even if null - client will receive roomInfo and playerJoined events
      // to render the UI properly
      callback({
        success: true,
        roomId,
        color: result.color,
        gameState: gameState || {
          roomId,
          board: Array(15)
            .fill(null)
            .map(() => Array(15).fill(0)),
          currentPlayer: 1,
          status: 'waiting',
          moves: [],
          players: {
            black: {
              id: roomInfo.blackPlayer?.id || '',
              name: roomInfo.blackPlayer?.name || 'Player 1',
              stats: (roomInfo.blackPlayer as any)?.stats,
            },
            white: {
              id: roomInfo.whitePlayer?.id || '',
              name: roomInfo.whitePlayer?.name || 'Waiting...',
              stats: (roomInfo.whitePlayer as any)?.stats,
            },
          },
          spectators: [],
          createdAt: Date.now(),
        },
      });
    } else {
      callback({ success: false, message: result.message });
    }
  }

  /**
   * 处理关闭房间请求
   */
  handleCloseRoom(socket: Socket, data: { roomId: string }, io: any, callback: any): void {
    try {
      const { roomId } = data;
      log.info(
        `[handleCloseRoom] Received closeRoom request - roomId: ${roomId}, socket.id: ${socket.id}`
      );

      const room = this.roomManager.getRoom(roomId);
      if (!room) {
        log.info(`[handleCloseRoom] Room ${roomId} not found`);
        callback({ success: false, message: 'Room not found' });
        return;
      }

      // Check if the player is the room owner (black player who created the room) or admin
      const socketPlayerId = socket.id;
      const blackPlayer = room.getRoomInfo().blackPlayer;
      const playerName = socket.data.playerName;
      const isAdmin = this.isAdmin(playerName);

      log.info(
        `[handleCloseRoom] Permission check - socketPlayerId: ${socketPlayerId}, blackPlayer.id: ${blackPlayer?.id}, isAdmin: ${isAdmin}, playerName: ${playerName}`
      );

      // Allow if room owner OR admin
      if (blackPlayer?.id === socketPlayerId || isAdmin) {
        log.info(
          `[Socket] Closing room ${roomId} by ${isAdmin ? 'admin' : 'owner'} ${socket.id}`
        );

        // Notify all players in the room that it's being closed
        io.to(roomId).emit('roomClosed', {
          roomId,
          reason: isAdmin ? 'Room closed by admin' : 'Room closed by owner',
        });

        // Remove the room
        this.roomManager.removeRoom(roomId);

        // Update room list for all clients
        io.emit('roomListUpdate', this.roomManager.getRoomList());

        log.info(`[handleCloseRoom] Room ${roomId} closed successfully, calling callback`);
        callback({ success: true, message: 'Room closed successfully' });
      } else {
        log.info(`[handleCloseRoom] Permission denied - not room owner or admin`);
        callback({ success: false, message: 'Only the room owner or admin can close the room' });
      }
    } catch (error) {
      log.error(`[handleCloseRoom] Error closing room:`, error);
      callback({ success: false, message: 'Internal server error' });
    }
  }

  /**
   * 处理离开房间请求
   */
  handleLeaveRoom(socket: Socket, io: any, callback: any): void {
    const roomId = socket.data.roomId;
    const isSpectator = socket.data.isSpectator;

    if (roomId) {
      const room = this.roomManager.getRoom(roomId);
      if (room) {
        if (isSpectator) {
          // 观战者离开
          room.removeSpectator(socket.id);
          this.deleteSpectatorName(socket.id);
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
            log.info(`[Socket] Room ${roomId} is now empty but remains open`);
            // 更新房间信息，让列表反映空房间状态
            const roomInfo = room.getRoomInfo();
            io.to(roomId).emit('roomInfo', roomInfo);
          }

          this.deletePlayerName(socket.id);
        }
      }
    }

    // 清除socket的房间数据
    socket.data.roomId = null;
    socket.data.playerName = null;
    socket.data.playerColor = null;
    socket.data.isSpectator = null;

    log.info(`[Socket] Player left room: ${socket.id}`);

    if (callback) {
      callback({ success: true });
    }

    // 广播房间列表更新
    io.emit('roomListUpdate', this.roomManager.getRoomList());
  }

  /**
   * 处理断开连接
   */
  handleDisconnect(socket: Socket, io: any): void {
    const roomId = socket.data.roomId;
    const isSpectator = socket.data.isSpectator;

    if (roomId) {
      const room = this.roomManager.getRoom(roomId);
      if (room) {
        if (isSpectator) {
          // 观战者断开连接
          room.removeSpectator(socket.id);
          log.info(`[Socket] Spectator disconnected: ${socket.id}`);
          this.deleteSpectatorName(socket.id);

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
              });
            }
          }

          // 不再自动关闭房间，即使所有玩家退出，房间也保持开放
          // 房间只能通过closeRoom接口显式关闭

          if (room.getPlayerCount() === 0) {
            log.info(`[Socket] Room ${roomId} is now empty but remains open`);
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
              });
            }

            io.emit('roomListUpdate', this.roomManager.getRoomList());
          }
          this.deletePlayerName(socket.id);
        }
      }
    }

    // 清除socket的房间数据，防止后续请求时还显示旧房间信息
    socket.data.roomId = null;
    socket.data.playerName = null;
    socket.data.playerColor = null;
    socket.data.isSpectator = null;

    log.info(`[Socket] Player disconnected: ${socket.id}`);
  }

  /**
   * 处理获取房间列表请求
   */
  handleGetRoomList(callback: any): void {
    const roomList = this.roomManager.getRoomList();
    if (typeof callback === 'function') {
      callback(roomList);
    } else {
      log.warn('[Socket] handleGetRoomList: callback is not a function', typeof callback);
    }
  }
}
