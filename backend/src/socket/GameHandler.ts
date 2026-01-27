import { Socket } from 'socket.io';
import { BaseHandler } from './BaseHandler';
import { supabaseService } from '../services/supabaseService';
import { HistoryRecord } from '../types/game';
import { log } from '../utils/logger';

/**
 * 游戏相关操作的处理器
 */
export class GameHandler extends BaseHandler {
  /**
   * 处理移动请求
   */
  async handleMove(
    socket: Socket,
    data: { roomId: string; x: number; y: number },
    io: any,
    callback: any
  ): Promise<void> {
    // 速率限制检查
    if (!this.checkRateLimit(socket.id)) {
      callback({ success: false, message: 'Rate limit exceeded. Please wait a moment.' });
      return;
    }

    const { roomId, x, y } = data;

    // 坐标验证
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      x < 0 ||
      x >= 15 ||
      y < 0 ||
      y >= 15 ||
      !Number.isInteger(x) ||
      !Number.isInteger(y)
    ) {
      callback({ success: false, message: 'Invalid coordinates' });
      return;
    }

    const room = this.roomManager.getRoom(roomId);

    if (!room) {
      callback({ success: false, message: 'Room not found' });
      return;
    }

    log.info(
      `[handleMove] socket.id: ${socket.id}, playerColor: ${socket.data.playerColor}, attempting move at (${x}, ${y})`
    );
    const moveResult = room.makeMove(socket.id, x, y);
    log.info(`[handleMove] moveResult:`, moveResult);

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
      log.info(`[handleMove] Move failed for socket ${socket.id}: ${moveResult.message}`);
      callback({ success: false, message: moveResult.message });
    }
  }

  /**
   * 处理重新开始游戏请求
   */
  async handleRestartGame(
    socket: Socket,
    data: { roomId: string },
    io: any,
    callback: any
  ): Promise<void> {
    const { roomId } = data;
    const room = this.roomManager.getRoom(roomId);

    if (!room) {
      callback({ success: false, message: 'Room not found' });
      return;
    }

    log.info(`[Socket] Restarting game in room ${roomId} by ${socket.id}`);

    // Reset the game state
    let newGameState = room.restartGame();

    // 附加玩家统计信息
    newGameState = (await this.attachPlayerStats(newGameState))!;

    // Broadcast the new game state to all players and spectators in the room
    io.to(roomId).emit('gameStateUpdate', newGameState);
    io.to(roomId).emit('roomInfo', room.getRoomInfo());
    io.emit('roomListUpdate', this.roomManager.getRoomList());

    log.info(`[Socket] Game restarted in room ${roomId}`);
    callback({ success: true, gameState: newGameState });
  }

  /**
   * 处理游戏结束逻辑
   */
  private async handleGameFinished(
    roomId: string,
    gameState: any,
    _room: any,
    io: any
  ): Promise<void> {
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

    await this.saveGameToHistory(historyRecord);
    await this.saveGameToSupabase(roomId, gameState);
    await this.updatePlayerStats(gameState);
  }

  /**
   * 保存游戏记录到历史记录
   */
  private async saveGameToHistory(_historyRecord: HistoryRecord): Promise<void> {
    // 这个方法需要访问HistoryManager，通过RoomHandler或者主类传递
    // 暂时留空，在handlers.ts中处理
  }

  /**
   * 保存游戏到Supabase
   */
  private async saveGameToSupabase(roomId: string, gameState: any): Promise<void> {
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
    } catch (err) {
      log.error('[Socket] Failed to save game to Supabase:', err);
    }
  }

  /**
   * 更新玩家统计数据
   */
  private async updatePlayerStats(gameState: any): Promise<void> {
    // 更新玩家积分到Supabase
    const isDraw = gameState.winner === 'draw';
    if (isDraw) {
      await supabaseService.updatePlayerGameResult(gameState.players.black.id, false, true);
      await supabaseService.updatePlayerGameResult(gameState.players.white.id, false, true);
    } else if (gameState.winner) {
      const winnerId =
        gameState.winner === 1 ? gameState.players.black.id : gameState.players.white.id;
      const loserId =
        gameState.winner === 1 ? gameState.players.white.id : gameState.players.black.id;
      await supabaseService.updatePlayerGameResult(winnerId, true, false);
      await supabaseService.updatePlayerGameResult(loserId, false, false);
    }

    // Record game result in PlayerManager (本地备份)
    if (gameState.winner && gameState.winner !== 'draw') {
      const winnerId =
        gameState.winner === 1 ? gameState.players.black.id : gameState.players.white.id;
      const loserId =
        gameState.winner === 1 ? gameState.players.white.id : gameState.players.black.id;
      this.playerManager.recordGameResult(winnerId, loserId);
    }
  }
}
