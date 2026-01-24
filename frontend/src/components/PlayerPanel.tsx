import React from 'react';
import { GameState } from '../types';

interface PlayerLeftEvent {
  playerId: string;
  playerName: string;
}

interface PlayerPanelProps {
  gameState: GameState | null;
  playerColor: 1 | 2 | null;
  playerName: string;
  playerLeftNotice?: PlayerLeftEvent | null;
  isSpectator?: boolean;
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  gameState,
  playerColor,
  playerName,
  playerLeftNotice,
  isSpectator,
}) => {
  if (!gameState) {
    return (
      <div className="card-base">
        <div className="text-dark-text-tertiary">等待游戏开始...</div>
      </div>
    );
  }

  // Handle waiting state - if players info is incomplete, show placeholder
  const isWaiting = gameState.status === 'waiting';
  const blackPlayer = gameState.players?.black;
  const whitePlayer = gameState.players?.white;
  const isBlackTurn = gameState.currentPlayer === 1;

  return (
    <div className="card-base space-y-4">
      <div className="text-lg font-semibold">
        {isSpectator ? '👁️ 观战信息' : '玩家信息'}
      </div>

      {/* Spectator Badge */}
      {isSpectator && (
        <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/50">
          <div className="text-sm text-blue-400">
            👁️ 你正在实时观战 - {playerName}
          </div>
        </div>
      )}

      {/* Player Left Notification */}
      {playerLeftNotice && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 animate-pulse">
          <div className="text-sm text-red-400">
            ⚠️ {playerLeftNotice.playerName} 已离开游戏
          </div>
        </div>
      )}

      {/* Black Player */}
      <div
        className={`p-3 rounded-lg border-2 transition-colors ${
          isBlackTurn && !isWaiting
            ? 'border-primary bg-primary/10'
            : 'border-dark-text-tertiary/50 bg-dark-bg-tertiary'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-black"></div>
          <span className="font-medium">黑棋</span>
          {playerColor === 1 && <span className="text-xs text-primary ml-auto">(你)</span>}
        </div>
        <div className="text-sm text-dark-text-secondary">
          {blackPlayer?.name || playerName}
        </div>
      </div>

      {/* White Player */}
      <div
        className={`p-3 rounded-lg border-2 transition-colors ${
          !isBlackTurn && !isWaiting
            ? 'border-primary bg-primary/10'
            : 'border-dark-text-tertiary/50 bg-dark-bg-tertiary'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-white border border-dark-text-tertiary"></div>
          <span className="font-medium">白棋</span>
          {playerColor === 2 && <span className="text-xs text-primary ml-auto">(你)</span>}
        </div>
        <div className="text-sm text-dark-text-secondary">
          {whitePlayer?.name && whitePlayer.name !== 'Waiting...' 
            ? whitePlayer.name 
            : (isWaiting ? '⏳ 等待加入...' : whitePlayer?.name || '未加入')}
        </div>
      </div>

      {/* Game Status */}
      <div className="pt-3 border-t border-dark-text-tertiary/20">
        <div className="text-xs text-dark-text-tertiary mb-1">游戏状态</div>
        <div className="flex justify-between items-center">
          <span className="capitalize">
            {isWaiting ? '等待中' : gameState.status}
          </span>
          <span className="text-xs bg-dark-bg-tertiary px-2 py-1 rounded">
            {gameState.moves?.length || 0} 步
          </span>
        </div>
      </div>
    </div>
  );
};
