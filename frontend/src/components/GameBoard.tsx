import React from 'react';
import { GameState } from '../types';

interface GameBoardProps {
  gameState: GameState | null;
  playerColor: 1 | 2 | null;
  isCurrentPlayer: boolean;
  onMove: (x: number, y: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  playerColor,
  isCurrentPlayer,
  onMove,
}) => {
  const boardSize = gameState?.board.length || 15;
  const cellSize = 50;
  const boardWidth = boardSize * cellSize;
  const isGameOver = gameState?.status === 'finished';

  const handleCellClick = (x: number, y: number) => {
    console.log(`[GameBoard] Cell clicked (${x}, ${y}), isCurrentPlayer:`, isCurrentPlayer, 'playerColor:', playerColor, 'currentPlayer:', gameState?.currentPlayer, 'isGameOver:', isGameOver);
    if (!isCurrentPlayer || !gameState || isGameOver) return;
    onMove(x, y);
  };

  const renderStone = (x: number, y: number) => {
    if (!gameState) return null;
    const value = gameState.board[y][x];
    if (value === 0) return null;

    const isBlack = value === 1;
    return (
      <circle
        key={`stone-${x}-${y}`}
        cx={x * cellSize + cellSize / 2}
        cy={y * cellSize + cellSize / 2}
        r={cellSize / 2 - 2}
        fill={isBlack ? '#000000' : '#FFFFFF'}
        className="pointer-events-none"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
      />
    );
  };

  const renderBoard = () => {
    const lines = [];

    // Horizontal lines
    for (let i = 0; i < boardSize; i++) {
      lines.push(
        <line
          key={`h-${i}`}
          x1={cellSize / 2}
          y1={i * cellSize + cellSize / 2}
          x2={boardWidth - cellSize / 2}
          y2={i * cellSize + cellSize / 2}
          stroke="#000000"
          strokeWidth="1.5"
          className="pointer-events-none"
        />
      );
    }

    // Vertical lines
    for (let i = 0; i < boardSize; i++) {
      lines.push(
        <line
          key={`v-${i}`}
          x1={i * cellSize + cellSize / 2}
          y1={cellSize / 2}
          x2={i * cellSize + cellSize / 2}
          y2={boardWidth - cellSize / 2}
          stroke="#000000"
          strokeWidth="1.5"
          className="pointer-events-none"
        />
      );
    }

    // Star points (for 15x15 board)
    if (boardSize === 15) {
      const stars = [
        [3, 3],
        [7, 7],
        [11, 11],
        [3, 11],
        [11, 3],
      ];
      for (const [x, y] of stars) {
        lines.push(
          <circle
            key={`star-${x}-${y}`}
            cx={x * cellSize + cellSize / 2}
            cy={y * cellSize + cellSize / 2}
            r="3"
            fill="#E8EAED"
            className="pointer-events-none"
          />
        );
      }
    }

    return lines;
  };

  const renderClickAreas = () => {
    const areas = [];
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        if (gameState && gameState.board[y][x] === 0) {
          areas.push(
            <rect
              key={`click-${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill="transparent"
              className={isCurrentPlayer ? 'cursor-pointer hover:bg-blue-400 hover:opacity-20' : 'cursor-not-allowed'}
              onClick={() => handleCellClick(x, y)}
              onMouseEnter={(e) => {
                if (isCurrentPlayer) {
                  (e.currentTarget as SVGRectElement).style.fill = '#073AB5';
                  (e.currentTarget as SVGRectElement).style.opacity = '0.2';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as SVGRectElement).style.fill = 'transparent';
              }}
            />
          );
        }
      }
    }
    return areas;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Game status above board */}
      <div className="text-lg text-center text-dark-text-secondary font-medium">
        {gameState?.status === 'waiting'
          ? '⏳ 等待第二名玩家加入...'
          : gameState?.status === 'finished'
            ? gameState.winner === 'draw'
              ? '🤝 游戏结束：平局'
              : `🎉 游戏结束：${gameState.winner === 1 ? '黑棋' : '白棋'}胜利`
            : isCurrentPlayer
              ? '⭕ 轮到你走棋'
              : '⏳ 等待对方落子'}
      </div>
      <svg
        width={boardWidth}
        height={boardWidth}
        className="rounded-lg border-2 border-dark-text-tertiary"
        style={{
          backgroundImage: `url('C:\\Users\\v_bxgxwang\\AppData\\Local\\Temp\\4440bca4-4eed-4d4c-a168-2eddac9b89b0(1).jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {renderBoard()}
        {renderClickAreas()}
        {gameState && Array.from({ length: boardSize }, (_, y) =>
          Array.from({ length: boardSize }, (_, x) => renderStone(x, y))
        )}
      </svg>
    </div>
  );
};
