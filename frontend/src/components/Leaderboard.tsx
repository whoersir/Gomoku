import React, { useState, useEffect } from 'react';

interface PlayerData {
  id: string;
  name: string;
  score: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws?: number;
  winRate?: number;
  lastPlayedAt: number;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose, embedded = false }) => {
  const [leaderboard, setLeaderboard] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLeaderboard();
    }
  }, [isOpen]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      // 添加缓存破坏参数以确保获取最新数据
      const response = await fetch(`http://localhost:3000/api/leaderboard?limit=10&timestamp=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      } else {
        throw new Error('Failed to fetch leaderboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      console.error('[Leaderboard] Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getWinRate = (player: PlayerData) => {
    if (player.winRate !== undefined) return `${player.winRate}%`;
    if (player.totalGames === 0) return '0%';
    return `${((player.wins / player.totalGames) * 100).toFixed(1)}%`;
  };

  const formatLastPlayed = (timestamp: number) => {
    if (!timestamp) return '未知';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return '刚刚';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
    return `${Math.floor(seconds / 86400)} 天前`;
  };

  // 内嵌模式渲染
  if (embedded) {
    return (
      <div className="glass-base p-4 h-full rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-glass">🏆 排行榜</h2>

        {loading ? (
          <div className="text-center py-8 text-dark-text-secondary">加载中...</div>
        ) : error ? (
          <div className="text-center py-8 text-danger">{error}</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-dark-text-secondary">暂无排行数据</div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                  index === 0 ? 'glass-light border-yellow-500/30' :
                  index === 1 ? 'glass-light border-gray-400/30' :
                  index === 2 ? 'glass-light border-orange-500/30' :
                  'glass-light hover:bg-white/5'
                }`}
              >
                <span className="font-bold w-8">{getRankEmoji(index)}</span>
                <span className="flex-1 truncate text-glass">{player.name}</span>
                <span className="text-primary font-bold text-glass">{player.score}</span>
                <span className="text-xs text-dark-text-secondary w-16 text-right">
                  {player.wins}胜{player.losses}负
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-dark-text-tertiary text-center glass-strong inline-block px-3 py-1 rounded-full">
          💡 胜利 +25分，失败 -20分
        </div>
      </div>
    );
  }

  // 弹窗模式渲染
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="glass-base max-w-2xl w-full mx-4 p-6 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-glass-strong">🏆 排行榜</h2>
          <button
            onClick={onClose}
            className="text-dark-text-secondary hover:text-dark-text-primary transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-dark-text-secondary">加载中...</div>
        ) : error ? (
          <div className="text-center py-8 text-danger">{error}</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-dark-text-secondary">暂无排行数据</div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-sm font-semibold text-dark-text-secondary pb-2 border-b border-dark-text-tertiary/20">
              <div className="col-span-1 text-glass">排名</div>
              <div className="col-span-3 text-glass">玩家</div>
              <div className="col-span-2 text-center text-glass">积分</div>
              <div className="col-span-2 text-center text-glass">胜率</div>
              <div className="col-span-2 text-center text-glass">战绩</div>
              <div className="col-span-2 text-center text-glass">最近对局</div>
            </div>

            {leaderboard.map((player, index) => (
              <div
                key={player.id}
                className={`grid grid-cols-12 gap-2 text-sm py-3 px-3 rounded-lg transition-all hover:scale-[1.01] ${
                  index === 0 ? 'glass-light border-yellow-500/30' :
                  index === 1 ? 'glass-light border-gray-400/30' :
                  index === 2 ? 'glass-light border-orange-500/30' :
                  'glass-light hover:bg-white/5'
                }`}
              >
                <div className="col-span-1 font-bold text-lg">{getRankEmoji(index)}</div>
                <div className="col-span-3 font-medium truncate text-glass">{player.name}</div>
                <div className="col-span-2 text-center font-bold text-primary text-glass-strong">{player.score}</div>
                <div className="col-span-2 text-center text-dark-text-secondary">
                  {getWinRate(player)}
                </div>
                <div className="col-span-2 text-center text-dark-text-secondary">
                  {player.wins}胜{player.losses}负{player.draws ? `${player.draws}平` : ''}
                </div>
                <div className="col-span-2 text-center text-dark-text-tertiary text-xs">
                  {formatLastPlayed(player.lastPlayedAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-xs text-dark-text-tertiary text-center glass-strong inline-block px-4 py-2 rounded-full">
          💡 胜利 +25分，失败 -20分，平局不变
        </div>
      </div>
    </div>
  );
};
