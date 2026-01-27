import React from 'react';
import { GameState } from '../types';

interface PlayerLeftPanelProps {
  gameState: GameState | null;
  playerColor: 1 | 2 | null;
  playerName: string;
  isSpectator?: boolean;
}

export const PlayerLeftPanel: React.FC<PlayerLeftPanelProps> = ({
  gameState,
  playerColor,
  playerName,
  isSpectator,
}) => {
  if (!gameState) {
    return (
      <div className="card-base">
        <div className="text-dark-text-tertiary">等待游戏开始...</div>
      </div>
    );
  }

  const isWaiting = gameState.status === 'waiting';
  const blackPlayer = gameState.players?.black;
  const isBlackTurn = gameState.currentPlayer === 1;

  return (
    <div className="card-base space-y-4" style={{ backgroundColor: 'rgba(26, 31, 46, 0.5)' }}>
      {/* Spectator Badge */}
      {isSpectator && (
        <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/50">
          <div className="text-sm text-blue-400">👁️ 你正在实时观战 - {playerName}</div>
        </div>
      )}

      {/* Black Player */}
      <div
        className={`p-4 rounded-lg border-2 transition-colors ${
          isBlackTurn && !isWaiting
            ? 'border-primary bg-primary/10'
            : 'border-dark-text-tertiary/50 bg-dark-bg-tertiary'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-full bg-black"></div>
          <span className="font-medium text-lg">黑棋</span>
          {playerColor === 1 && <span className="text-xs text-primary ml-auto">(你)</span>}
        </div>
        <div className="text-sm text-dark-text-secondary mt-2">
          {blackPlayer?.name || playerName}
        </div>
        {isBlackTurn && !isWaiting && (
          <div className="mt-2 text-xs text-primary font-medium">⏱️ 正在思考...</div>
        )}
      </div>

      {/* Game Info */}
      <div className="pt-3 border-t border-dark-text-tertiary/20">
        <div className="text-base font-semibold text-dark-text-secondary mb-2">游戏信息</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>步数</span>
            <span className="text-dark-text-secondary">{gameState.moves?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>当前</span>
            <span className="text-dark-text-secondary">{isBlackTurn ? '黑棋' : '白棋'}</span>
          </div>
          <div className="flex justify-between">
            <span>状态</span>
            <span className="text-dark-text-secondary capitalize">
              {isWaiting ? '等待中' : gameState.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
