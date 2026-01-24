import React from 'react';
import { GameState } from '../types';

interface SpectatorPanelProps {
  gameState: GameState | null;
  isSpectator: boolean;
  onJoinAsPlayer: () => void;
  boardWidth?: string;
}

export const SpectatorPanel: React.FC<SpectatorPanelProps> = ({
  gameState,
  isSpectator,
  onJoinAsPlayer,
  boardWidth = '600px',
}) => {
  const whitePlayer = gameState?.players?.white;
  const blackPlayer = gameState?.players?.black;
  const hasEmptySpot = !blackPlayer || !whitePlayer || whitePlayer?.name === 'Waiting...';

  return (
    <div className="card-base p-4" style={{ width: boardWidth }}>
      <div className="flex justify-between items-center mb-3">
        <div className="text-base font-bold text-dark-text-secondary flex items-center gap-2">
          <span>👁️</span>观战人员 ({gameState?.spectators?.length || 0})
        </div>
        {isSpectator && gameState?.status === 'waiting' && hasEmptySpot && (
          <button
            onClick={onJoinAsPlayer}
            className="btn-primary text-sm py-2 px-4"
          >
            🎮 参与对局
          </button>
        )}
      </div>
      <div className="space-y-2 max-h-40 overflow-y-auto text-sm">
        {gameState?.spectators && gameState.spectators.length > 0 ? (
          gameState.spectators.map((spectator) => (
            <div
              key={spectator.id}
              className="flex items-center gap-2 p-2 bg-dark-bg-tertiary rounded hover:bg-dark-bg-tertiary/80 transition-colors"
            >
              <span className="text-blue-400">👁️</span>
              <span className="text-dark-text-secondary">{spectator.name}</span>
            </div>
          ))
        ) : (
          <div className="text-xs text-dark-text-tertiary py-2 text-center">
            暂无观战人员
          </div>
        )}
      </div>
    </div>
  );
};
