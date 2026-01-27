import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { log } from '../utils/logger';

// 从环境变量获取配置
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zjvqemlddehxtwuohjzn.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdnFlbWxkZGVoeHR3dW9oanpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTIwNTMsImV4cCI6MjA4NDYyODA1M30.BU8NNhJPRCnSDKo5LY4lpH3swit8UCofbr10PPP3IHk';

// Supabase客户端单例
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabaseClient;
}

// 玩家数据接口
export interface PlayerRecord {
  id?: string;
  socket_id: string;
  name: string;
  score: number;
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  is_registered?: boolean;
  created_at?: string;
  last_played_at?: string;
}

// 登录响应接口
export interface AuthResult {
  success: boolean;
  player?: PlayerRecord;
  error?: string;
  isNewUser?: boolean;
}

// 对局记录接口
export interface GameRecord {
  id?: string;
  room_id: string;
  room_name?: string;
  black_player_id?: string;
  white_player_id?: string;
  black_player_name: string;
  white_player_name: string;
  winner?: 'black' | 'white' | 'draw' | null;
  move_count: number;
  moves: any[];
  started_at: string;
  finished_at?: string;
  duration_seconds?: number;
}

// 排行榜数据接口
export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  last_played_at: string;
}

/**
 * Supabase 数据服务
 */
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabaseClient();
  }

  // ========== 玩家认证相关 ==========

  /**
   * 注册新玩家（昵称唯一）
   */
  async registerPlayer(name: string): Promise<AuthResult> {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return { success: false, error: '昵称不能为空' };
      }
      if (trimmedName.length > 20) {
        return { success: false, error: '昵称不能超过20个字符' };
      }

      // 检查昵称是否已被注册
      const { data: existing } = await this.supabase
        .from('players')
        .select('*')
        .eq('name', trimmedName)
        .eq('is_registered', true)
        .single();

      if (existing) {
        return { success: false, error: '该昵称已被注册' };
      }

      // 创建新玩家
      const { data: created, error: createError } = await this.supabase
        .from('players')
        .insert({
          socket_id: `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: trimmedName,
          score: 0,
          total_games: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          is_registered: true,
        })
        .select()
        .single();

      if (createError) {
        log.error('[Supabase] Register player error:', createError);
        return { success: false, error: '注册失败，请稍后再试' };
      }

      log.info(`[Supabase] Registered new player: ${trimmedName} (${created.id})`);
      return { success: true, player: created, isNewUser: true };
    } catch (error) {
      log.error('[Supabase] registerPlayer error:', error);
      return { success: false, error: '注册失败' };
    }
  }

  /**
   * 登录（通过昵称）
   */
  async loginPlayer(name: string): Promise<AuthResult> {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return { success: false, error: '昵称不能为空' };
      }

      // 查找已注册玩家
      const { data: player, error } = await this.supabase
        .from('players')
        .select('*')
        .eq('name', trimmedName)
        .eq('is_registered', true)
        .single();

      if (error || !player) {
        return { success: false, error: '该昵称未注册' };
      }

      // 更新最后登录时间
      await this.supabase
        .from('players')
        .update({ last_played_at: new Date().toISOString() })
        .eq('id', player.id);

      log.info(`[Supabase] Player logged in: ${trimmedName} (${player.id})`);
      return { success: true, player, isNewUser: false };
    } catch (error) {
      log.error('[Supabase] loginPlayer error:', error);
      return { success: false, error: '登录失败' };
    }
  }

  /**
   * 检查昵称是否可用
   */
  async checkNameAvailable(name: string): Promise<boolean> {
    try {
      const { data } = await this.supabase
        .from('players')
        .select('id')
        .eq('name', name.trim())
        .eq('is_registered', true)
        .single();

      return !data;
    } catch {
      return true;
    }
  }

  /**
   * 更新玩家socket_id（登录时关联）
   */
  async updatePlayerSocketId(playerId: string, socketId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('players')
        .update({ socket_id: socketId, last_played_at: new Date().toISOString() })
        .eq('id', playerId);

      if (error) {
        log.error('[Supabase] Update socket_id error:', error);
        return false;
      }
      return true;
    } catch (error) {
      log.error('[Supabase] updatePlayerSocketId error:', error);
      return false;
    }
  }

  /**
   * 根据玩家ID获取玩家
   */
  async getPlayerById(playerId: string): Promise<PlayerRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (error) return null;
      return data;
    } catch {
      return null;
    }
  }

  // ========== 玩家相关 ==========

  /**
   * 获取或创建玩家（用于游客/兼容旧逻辑）
   */
  async getOrCreatePlayer(socketId: string, name: string): Promise<PlayerRecord | null> {
    try {
      // 先查找是否存在已注册玩家
      const { data: registered } = await this.supabase
        .from('players')
        .select('*')
        .eq('name', name)
        .eq('is_registered', true)
        .single();

      if (registered) {
        // 更新socket_id
        await this.updatePlayerSocketId(registered.id!, socketId);
        return { ...registered, socket_id: socketId };
      }

      // 查找临时玩家
      const { data: existing } = await this.supabase
        .from('players')
        .select('*')
        .eq('socket_id', socketId)
        .single();

      if (existing) {
        // 更新名称和最后游玩时间
        const { data: updated } = await this.supabase
          .from('players')
          .update({ name, last_played_at: new Date().toISOString() })
          .eq('socket_id', socketId)
          .select()
          .single();

        return updated || existing;
      }

      // 创建新临时玩家
      const { data: created, error: createError } = await this.supabase
        .from('players')
        .insert({
          socket_id: socketId,
          name,
          score: 0,
          total_games: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          is_registered: false,
        })
        .select()
        .single();

      if (createError) {
        log.error('[Supabase] Create player error:', createError);
        return null;
      }

      log.info(`[Supabase] Created temp player: ${name} (${socketId})`);
      return created;
    } catch (error) {
      log.error('[Supabase] getOrCreatePlayer error:', error);
      return null;
    }
  }

  /**
   * 根据socket_id获取玩家
   */
  async getPlayerBySocketId(socketId: string): Promise<PlayerRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select('*')
        .eq('socket_id', socketId)
        .single();

      if (error) {
        log.error('[Supabase] Get player error:', error);
        return null;
      }
      return data;
    } catch (error) {
      log.error('[Supabase] getPlayerBySocketId error:', error);
      return null;
    }
  }

  /**
   * 更新玩家游戏结果
   */
  async updatePlayerGameResult(
    socketId: string,
    isWinner: boolean,
    isDraw: boolean = false
  ): Promise<boolean> {
    try {
      const player = await this.getPlayerBySocketId(socketId);
      if (!player) return false;

      const scoreChange = isDraw ? 0 : isWinner ? 25 : -20;
      const updates: Partial<PlayerRecord> = {
        total_games: player.total_games + 1,
        score: Math.max(0, player.score + scoreChange),
        last_played_at: new Date().toISOString(),
      };

      if (isDraw) {
        updates.draws = player.draws + 1;
      } else if (isWinner) {
        updates.wins = player.wins + 1;
      } else {
        updates.losses = player.losses + 1;
      }

      const { error } = await this.supabase
        .from('players')
        .update(updates)
        .eq('socket_id', socketId);

      if (error) {
        log.error('[Supabase] Update player result error:', error);
        return false;
      }

      log.info(
        `[Supabase] Updated player ${socketId}: ${isWinner ? 'WIN' : isDraw ? 'DRAW' : 'LOSS'} (+${scoreChange} score)`
      );
      return true;
    } catch (error) {
      log.error('[Supabase] updatePlayerGameResult error:', error);
      return false;
    }
  }

  // ========== 对局相关 ==========

  /**
   * 保存对局记录
   */
  async saveGameRecord(gameData: {
    roomId: string;
    roomName?: string;
    blackPlayer: { id: string; name: string };
    whitePlayer: { id: string; name: string };
    winner: 1 | 2 | 'draw' | undefined;
    moves: any[];
    createdAt: number;
    finishedAt: number;
  }): Promise<string | null> {
    try {
      // 获取玩家UUID
      const blackPlayerRecord = await this.getPlayerBySocketId(gameData.blackPlayer.id);
      const whitePlayerRecord = await this.getPlayerBySocketId(gameData.whitePlayer.id);

      const winnerValue =
        gameData.winner === 1
          ? 'black'
          : gameData.winner === 2
            ? 'white'
            : gameData.winner === 'draw'
              ? 'draw'
              : null;

      const gameRecord: GameRecord = {
        room_id: gameData.roomId,
        room_name: gameData.roomName,
        black_player_id: blackPlayerRecord?.id,
        white_player_id: whitePlayerRecord?.id,
        black_player_name: gameData.blackPlayer.name,
        white_player_name: gameData.whitePlayer.name,
        winner: winnerValue,
        move_count: gameData.moves.length,
        moves: gameData.moves,
        started_at: new Date(gameData.createdAt).toISOString(),
        finished_at: new Date(gameData.finishedAt).toISOString(),
        duration_seconds: Math.floor((gameData.finishedAt - gameData.createdAt) / 1000),
      };

      const { data, error } = await this.supabase
        .from('games')
        .insert(gameRecord)
        .select('id')
        .single();

      if (error) {
        log.error('[Supabase] Save game record error:', error);
        return null;
      }

      log.info(`[Supabase] Saved game record: ${data.id}`);
      return data.id;
    } catch (error) {
      log.error('[Supabase] saveGameRecord error:', error);
      return null;
    }
  }

  /**
   * 获取对局历史
   */
  async getGameHistory(limit: number = 20, offset: number = 0): Promise<GameRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('games')
        .select('*')
        .order('finished_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        log.error('[Supabase] Get game history error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      log.error('[Supabase] getGameHistory error:', error);
      return [];
    }
  }

  // ========== 排行榜相关 ==========

  /**
   * 获取排行榜
   */
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await this.supabase.from('leaderboard').select('*').limit(limit);

      if (error) {
        log.error('[Supabase] Get leaderboard error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      log.error('[Supabase] getLeaderboard error:', error);
      return [];
    }
  }

  /**
   * 根据玩家名称获取统计信息
   */
  async getPlayerStatsByName(name: string): Promise<{
    score: number;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  } | null> {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select('score, total_games, wins, losses')
        .eq('name', name)
        .single();

      if (error || !data) {
        return null;
      }

      const totalGames = data.total_games || 0;
      const wins = data.wins || 0;
      const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

      return {
        score: data.score || 0,
        totalGames,
        wins,
        losses: data.losses || 0,
        winRate,
      };
    } catch (error) {
      log.error('[Supabase] getPlayerStatsByName error:', error);
      return null;
    }
  }

  /**
   * 获取玩家排名
   */
  async getPlayerRank(socketId: string): Promise<number | null> {
    try {
      const player = await this.getPlayerBySocketId(socketId);
      if (!player) return null;

      const { count, error } = await this.supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .gt('score', player.score);

      if (error) {
        log.error('[Supabase] Get player rank error:', error);
        return null;
      }

      return (count || 0) + 1;
    } catch (error) {
      log.error('[Supabase] getPlayerRank error:', error);
      return null;
    }
  }
}

// 导出单例
export const supabaseService = new SupabaseService();
