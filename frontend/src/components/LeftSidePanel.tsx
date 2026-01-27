import React from 'react';
import { GameState, PlayerInfo } from '../types';

interface LeftSidePanelProps {
  gameState: GameState | null;
  playerColor: 1 | 2 | null;
  playerName: string;
  isSpectator?: boolean;
}

// 获取段位信息
const getRankInfo = (score: number): { name: string; color: string; icon: string } => {
  if (score >= 2000) return { name: '大师', color: 'text-purple-400', icon: '👑' };
  if (score >= 1500) return { name: '钻石', color: 'text-cyan-400', icon: '💎' };
  if (score >= 1200) return { name: '黄金', color: 'text-yellow-400', icon: '🥇' };
  if (score >= 900) return { name: '白银', color: 'text-gray-300', icon: '🥈' };
  if (score >= 600) return { name: '青铜', color: 'text-orange-400', icon: '🥉' };
  return { name: '新手', color: 'text-green-400', icon: '🌱' };
};

// 玩家信息卡片组件
const PlayerCard: React.FC<{
  player: PlayerInfo | undefined;
  isWaiting: boolean;
  isCurrentTurn: boolean;
  isBlack: boolean;
  isYou: boolean;
}> = ({ player, isWaiting, isCurrentTurn, isBlack, isYou }) => {
  const hasStats = !!player?.stats;
  const stats = player?.stats;
  const rankInfo = stats ? getRankInfo(stats.score) : null;

  return (
    <div
      className={`card-base p-4 rounded-lg border-2 transition-all ${
        isCurrentTurn && !isWaiting
          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
          : 'border-dark-text-tertiary/50'
      }`}
    >
      {/* 头部：棋子图标 + 名称 */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-8 h-8 rounded-full shadow-lg flex items-center justify-center ${
            isBlack ? 'bg-black' : 'bg-white border-2 border-dark-text-tertiary'
          }`}
        >
          {hasStats && rankInfo && <span className="text-xs">{rankInfo.icon}</span>}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{isBlack ? '黑棋' : '白棋'}</span>
            {isYou && (
              <span className="text-xs text-primary bg-primary/20 px-2 py-0.5 rounded">(你)</span>
            )}
          </div>
        </div>
      </div>

      {/* 玩家名称 */}
      <div className="text-base text-dark-text-secondary font-medium mb-2">
        {isBlack
          ? player?.name || '等待玩家'
          : player?.name && player.name !== 'Waiting...'
            ? player.name
            : isWaiting
              ? '⏳ 等待加入...'
              : '未加入'}
      </div>

      {/* 段位和积分 */}
      {hasStats && rankInfo && (
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-sm font-bold ${rankInfo.color}`}>
            {rankInfo.icon} {rankInfo.name}
          </span>
          <span className="text-xs text-dark-text-tertiary">|</span>
          <span className="text-sm text-yellow-400 font-bold">🏆 {stats!.score} 分</span>
        </div>
      )}

      {/* 战绩统计 */}
      {hasStats && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-dark-bg-tertiary rounded p-1.5 text-center">
            <div className="text-dark-text-tertiary">总场次</div>
            <div className="font-bold text-dark-text-primary">{stats!.totalGames}</div>
          </div>
          <div className="bg-dark-bg-tertiary rounded p-1.5 text-center">
            <div className="text-dark-text-tertiary">胜/负</div>
            <div className="font-bold">
              <span className="text-green-400">{stats!.wins}</span>
              <span className="text-dark-text-tertiary">/</span>
              <span className="text-red-400">{stats!.losses}</span>
            </div>
          </div>
          <div className="bg-dark-bg-tertiary rounded p-1.5 text-center">
            <div className="text-dark-text-tertiary">胜率</div>
            <div
              className={`font-bold ${stats!.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}
            >
              {stats!.winRate}%
            </div>
          </div>
        </div>
      )}

      {/* 回合提示 */}
      {isCurrentTurn && !isWaiting && (
        <div className="mt-2 text-sm text-primary font-semibold animate-pulse flex items-center gap-1">
          <span>⏱️</span> 正在思考...
        </div>
      )}
    </div>
  );
};

export const LeftSidePanel: React.FC<LeftSidePanelProps> = ({
  gameState,
  playerColor,
  playerName,
  isSpectator,
}) => {
  // 调试日志
  console.log('[LeftSidePanel] Rendering with gameState:', gameState);
  console.log('[LeftSidePanel] gameState.players:', gameState?.players);
  console.log('[LeftSidePanel] blackPlayer.stats:', gameState?.players?.black?.stats);
  console.log('[LeftSidePanel] whitePlayer.stats:', gameState?.players?.white?.stats);

  if (!gameState) {
    return (
      <div className="card-base space-y-4">
        <div className="text-dark-text-tertiary">等待游戏开始...</div>
      </div>
    );
  }

  const isWaiting = gameState.status === 'waiting';
  const blackPlayer = gameState.players?.black;
  const whitePlayer = gameState.players?.white;
  const isBlackTurn = gameState.currentPlayer === 1;
  const isWhiteTurn = !isBlackTurn && !isWaiting;

  return (
    <div className="flex flex-col h-full gap-3 justify-center">
      {/* Black Player */}
      <PlayerCard
        player={blackPlayer}
        isWaiting={isWaiting}
        isCurrentTurn={isBlackTurn}
        isBlack={true}
        isYou={playerColor === 1}
      />

      {/* Game Info */}
      <div className="card-base p-4">
        <div className="text-lg font-bold text-dark-text-secondary mb-4 flex items-center gap-2">
          <span>📊</span>游戏信息
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center p-2 bg-transparent border border-dark-text-tertiary/30 rounded">
            <span className="text-dark-text-tertiary">步数</span>
            <span className="font-bold text-xl text-primary">{gameState.moves?.length || 0}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-transparent border border-dark-text-tertiary/30 rounded">
            <span className="text-dark-text-tertiary">当前</span>
            <span className={`font-bold ${isBlackTurn ? 'text-black' : 'text-white'}`}>
              {isBlackTurn ? '⚫ 黑棋' : '⚪ 白棋'}
            </span>
          </div>
          <div className="flex justify-between items-center p-2 bg-transparent border border-dark-text-tertiary/30 rounded">
            <span className="text-dark-text-tertiary">状态</span>
            <span
              className={`font-bold ${
                isWaiting
                  ? 'text-warning'
                  : gameState.status === 'playing'
                    ? 'text-secondary'
                    : 'text-danger'
              }`}
            >
              {isWaiting ? '⏳ 等待中' : gameState.status === 'playing' ? '▶️ 进行中' : '🏁 已结束'}
            </span>
          </div>
          {isSpectator && (
            <div className="p-2 bg-blue-500/20 border border-blue-500/50 rounded">
              <div className="text-sm text-blue-400 font-medium">👁️ 你正在实时观战</div>
            </div>
          )}
        </div>
      </div>

      {/* White Player */}
      <PlayerCard
        player={whitePlayer}
        isWaiting={isWaiting}
        isCurrentTurn={isWhiteTurn}
        isBlack={false}
        isYou={playerColor === 2}
      />
    </div>
  );
};
