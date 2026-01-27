import { supabaseService } from '../services/supabaseService';
import { GameState } from '../types/game';
import { RoomManager } from '../managers/RoomManager';
import { PlayerManager } from '../managers/PlayerManager';
import { log } from '../utils/logger';

/**
 * 基础处理器类，提供通用的速率限制、输入验证和玩家统计信息附加功能
 */
export class BaseHandler {
  protected roomManager: RoomManager;
  protected playerManager: PlayerManager;
  protected playerNames: Map<string, string> = new Map();
  protected spectatorNames: Map<string, string> = new Map();
  protected rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  protected readonly RATE_LIMIT_MAX = 100; // 每分钟最大请求数
  protected readonly RATE_LIMIT_WINDOW = 60000; // 1分钟窗口

  // 管理员账号列表，这些账号登录后自动成为管理员
  protected readonly ADMIN_ACCOUNTS = ['admin', 'administrator', '王香归'];

  constructor(roomManager: RoomManager, playerManager: PlayerManager) {
    this.roomManager = roomManager;
    this.playerManager = playerManager;
  }

  /**
   * 速率限制检查
   */
  protected checkRateLimit(socketId: string): boolean {
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

  /**
   * XSS防护 - 清理用户输入
   */
  protected sanitizeInput(input: string, maxLength: number = 100): string {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>"'&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        };
        return entities[char] || char;
      });
  }

  /**
   * 为游戏状态附加玩家统计信息
   */
  protected async attachPlayerStats(gameState: GameState | null): Promise<GameState | null> {
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
      log.error('[Socket] Failed to attach player stats:', error);
    }

    return gameState;
  }

  /**
   * 为房间信息附加玩家统计信息
   */
  protected async attachRoomInfoPlayerStats(roomInfo: any): Promise<any> {
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
      log.error('[Socket] Failed to attach room info player stats:', error);
    }

    return roomInfo;
  }

  /**
   * 检查是否为管理员
   */
  protected isAdmin(playerName: string | undefined): boolean {
    return !!playerName && this.ADMIN_ACCOUNTS.includes(playerName.toLowerCase());
  }

  /**
   * 获取玩家名称
   */
  protected getPlayerName(socketId: string): string | undefined {
    return this.playerNames.get(socketId);
  }

  /**
   * 设置玩家名称
   */
  protected setPlayerName(socketId: string, playerName: string): void {
    this.playerNames.set(socketId, playerName);
  }

  /**
   * 删除玩家名称
   */
  protected deletePlayerName(socketId: string): void {
    this.playerNames.delete(socketId);
  }

  /**
   * 获取观战者名称
   */
  protected getSpectatorName(socketId: string): string | undefined {
    return this.spectatorNames.get(socketId);
  }

  /**
   * 设置观战者名称
   */
  protected setSpectatorName(socketId: string, spectatorName: string): void {
    this.spectatorNames.set(socketId, spectatorName);
  }

  /**
   * 删除观战者名称
   */
  protected deleteSpectatorName(socketId: string): void {
    this.spectatorNames.delete(socketId);
  }
}
