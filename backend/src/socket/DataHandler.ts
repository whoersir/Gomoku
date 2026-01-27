import { BaseHandler } from './BaseHandler';
import { HistoryManager } from '../managers/HistoryManager';
import { supabaseService } from '../services/supabaseService';
import { log } from '../utils/logger';

/**
 * 数据获取相关操作的处理器
 */
export class DataHandler extends BaseHandler {
  private historyManager: HistoryManager;

  constructor(historyManager: HistoryManager) {
    super(null as any, null as any); // 这些会在主类中初始化
    this.historyManager = historyManager;
  }

  /**
   * 处理获取历史记录请求
   */
  async handleGetHistory(data: { limit?: number; offset?: number }, callback: any): Promise<void> {
    if (typeof callback !== 'function') {
      log.warn('[Socket] handleGetHistory: callback is not a function', typeof callback);
      return;
    }

    const { limit = 100, offset = 0 } = data || {};
    const result = await this.historyManager.getRecords(limit, offset);
    callback(result);
  }

  /**
   * 处理获取排行榜请求
   */
  async handleGetLeaderboard(callback: any): Promise<void> {
    if (typeof callback !== 'function') {
      log.warn('[Socket] handleGetLeaderboard: callback is not a function', typeof callback);
      return;
    }

    try {
      // 优先从Supabase获取排行榜
      const supabaseLeaderboard = await supabaseService.getLeaderboard(10);
      if (supabaseLeaderboard.length > 0) {
        log.info(
          `[Socket] Sending Supabase leaderboard with ${supabaseLeaderboard.length} players`
        );
        callback(supabaseLeaderboard);
        return;
      }
    } catch (err) {
      log.error('[Socket] Failed to get Supabase leaderboard, fallback to local:', err);
    }

    // 降级到本地排行榜
    const leaderboard = this.playerManager.getLeaderboard(10);
    log.info(`[Socket] Sending local leaderboard with ${leaderboard.length} players`);
    callback(leaderboard);
  }

  /**
   * 设置RoomManager（因为BaseHandler需要，但DataHandler主要通过参数传递）
   */
  setDependencies(roomManager: any, playerManager: any): void {
    (this as any).roomManager = roomManager;
    (this as any).playerManager = playerManager;
  }
}
