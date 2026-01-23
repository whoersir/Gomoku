import React from 'react';

interface VictoryModalProps {
  winner: 1 | 2 | 'draw' | null;
  playerColor: 1 | 2 | null;
  onRestart: () => void;
  onClose: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  playerColor,
  onRestart,
  onClose,
}) => {
  if (!winner) return null;

  // 判断当前玩家是否获胜
  const isWinner = winner !== 'draw' && winner === playerColor;
  const isLoser = winner !== 'draw' && winner !== playerColor;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="card-base max-w-md w-full mx-4 p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="mb-6">
          {winner === 'draw' ? (
            <div className="text-6xl mb-4">🤝</div>
          ) : isWinner ? (
            <div className="text-6xl mb-4">🎉</div>
          ) : (
            <div className="text-6xl mb-4">😢</div>
          )}
          <h2 className="text-3xl font-bold mb-2">
            {winner === 'draw' 
              ? '平局' 
              : isWinner 
                ? '恭喜胜利！' 
                : '对局结束'}
          </h2>
          <p className="text-dark-text-secondary text-sm">
            {winner === 'draw'
              ? '双方势均力敌，难分伯仲'
              : isWinner
                ? '精彩对局，你赢得了这场比赛！继续保持！'
                : '不要气馁，胜败乃兵家常事，下次一定能赢！'}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onRestart}
            className="btn-primary px-6 py-3 text-lg"
          >
            🔄 重新对局
          </button>
          <button
            onClick={onClose}
            className="btn-secondary px-6 py-3 text-lg"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
