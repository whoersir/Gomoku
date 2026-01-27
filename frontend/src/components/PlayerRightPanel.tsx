import React from 'react';
import { GameState } from '../types';

interface PlayerRightPanelProps {
  gameState: GameState | null;
  playerColor: 1 | 2 | null;
  playerName: string;
  isSpectator?: boolean;
}

export const PlayerRightPanel: React.FC<PlayerRightPanelProps> = ({
  gameState,
  playerColor,
  playerName,
  isSpectator,
}) => {
  const handleJoinGame = () => {
    // Emit event to switch from spectator to player
    window.dispatchEvent(new CustomEvent('joinAsPlayer'));
  };
  if (!gameState) {
    return (
      <div className="card-base">
        <div className="text-dark-text-tertiary">等待游戏开始...</div>
      </div>
    );
  }

  const isWaiting = gameState.status === 'waiting';
  const whitePlayer = gameState.players?.white;
  const blackPlayer = gameState.players?.black;
  const isBlackTurn = gameState.currentPlayer === 1;
  const isWhiteTurn = !isBlackTurn && !isWaiting;
  const hasEmptySpot = !blackPlayer || !whitePlayer || whitePlayer?.name === 'Waiting...';

  return (
    <div className="card-base space-y-4" style={{ backgroundColor: 'rgba(26, 31, 46, 0.5)' }}>
      {/* Spectator Action - Only show when there's an empty spot */}
      {isSpectator && isWaiting && hasEmptySpot && (
        <button onClick={handleJoinGame} className="w-full btn-primary text-sm py-2">
          🎮 参与对局
        </button>
      )}

      {/* White Player */}
      <div
        className={`p-4 rounded-lg border-2 transition-colors ${
          isWhiteTurn
            ? 'border-primary bg-primary/10'
            : 'border-dark-text-tertiary/50 bg-dark-bg-tertiary'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-full bg-white border border-dark-text-tertiary"></div>
          <span className="font-medium text-lg">白棋</span>
          {playerColor === 2 && <span className="text-xs text-primary ml-auto">(你)</span>}
        </div>
        <div className="text-sm text-dark-text-secondary mt-2">
          {whitePlayer?.name && whitePlayer.name !== 'Waiting...'
            ? whitePlayer.name
            : isWaiting
              ? '⏳ 等待加入...'
              : whitePlayer?.name || '未加入'}
        </div>
        {isWhiteTurn && <div className="mt-2 text-xs text-primary font-medium">⏱️ 正在思考...</div>}
      </div>

      {/* Spectators List */}
      <div className="pt-3 border-t border-dark-text-tertiary/20">
        <div className="text-base font-semibold text-dark-text-secondary mb-2">
          👁️ 观战人员 ({gameState.spectators?.length || 0})
        </div>
        <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
          {gameState.spectators && gameState.spectators.length > 0 ? (
            gameState.spectators.map((spectator, index) => (
              <div
                key={spectator.id}
                className="flex items-center gap-2 p-2 bg-dark-bg-tertiary rounded"
              >
                <span className="text-blue-400">👁️</span>
                <span className="text-dark-text-secondary">{spectator.name}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-dark-text-tertiary py-2">暂无观战人员</div>
          )}
        </div>
      </div>
    </div>
  );
};
