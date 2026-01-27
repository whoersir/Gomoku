import React, { useState, useEffect, useMemo } from 'react';
import { HistoryRecord } from '../types';

interface PlayerStats {
  id: string;
  name: string;
  score: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  lastPlayedAt: number;
}

interface PlayerHistoryProps {
  isOpen: boolean;
  playerName: string;
  onClose: () => void;
  serverUrl: string;
  embedded?: boolean;
}

export const PlayerHistory: React.FC<PlayerHistoryProps> = ({
  isOpen,
  playerName,
  onClose,
  serverUrl,
  embedded = false,
}) => {
  if (!isOpen) return null;
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayerData();
  }, [playerName, serverUrl]);

  const fetchPlayerData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 获取对局历史记录
      const historyResponse = await fetch(
        `${serverUrl}/api/history/player/${encodeURIComponent(playerName)}?limit=50`
      );
      const historyData: HistoryRecord[] = await historyResponse.json();
      setHistory(historyData);
    } catch (err) {
      console.error('Failed to fetch player data:', err);
      setError('获取玩家数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 从历史记录计算真实统计数据
  const stats: PlayerStats | null = useMemo(() => {
    if (history.length === 0) return null;

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let lastPlayedAt = 0;

    history.forEach((record) => {
      if (record.finishedAt > lastPlayedAt) {
        lastPlayedAt = record.finishedAt;
      }

      if (record.winner === 'draw' || !record.winner) {
        draws++;
      } else {
        const isBlack = record.blackPlayer.name === playerName;
        const playerWon = (record.winner === 1 && isBlack) || (record.winner === 2 && !isBlack);
        if (playerWon) {
          wins++;
        } else {
          losses++;
        }
      }
    });

    return {
      id: '',
      name: playerName,
      score: wins * 10 - losses * 10, // 估算分数
      totalGames: history.length,
      wins,
      losses,
      draws,
      lastPlayedAt,
    };
  }, [history, playerName]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number | undefined, record: HistoryRecord) => {
    // 如果没有 duration 字段，尝试从 createdAt 和 finishedAt 计算
    const duration = ms ?? record.finishedAt - record.createdAt;
    if (!duration || isNaN(duration)) return '未知';
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  };

  const getResultText = (record: HistoryRecord) => {
    if (!record.winner) return '🤝 平局';
    const playerWon =
      record.winner === 1
        ? record.blackPlayer.name === playerName
        : record.whitePlayer.name === playerName;
    return playerWon ? '🏆 胜利' : '😢 失败';
  };

  const getResultClass = (record: HistoryRecord) => {
    if (!record.winner) return 'text-gray-400';
    const playerWon =
      record.winner === 1
        ? record.blackPlayer.name === playerName
        : record.whitePlayer.name === playerName;
    return playerWon ? 'text-success' : 'text-danger';
  };

  const getWinRate = () => {
    if (!stats || stats.totalGames === 0) return '0%';
    return ((stats.wins / stats.totalGames) * 100).toFixed(1) + '%';
  };

  if (loading) {
    if (embedded) {
      return (
        <div className="card-base p-4 h-full">
          <h2 className="text-xl font-bold mb-4">📊 我的记录</h2>
          <div className="text-center py-8 text-dark-text-secondary">加载中...</div>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="card-base p-8 text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // 内嵌模式渲染
  if (embedded) {
    return (
      <div className="card-base p-4 h-full overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">📊 我的记录</h2>

        {error ? (
          <div className="text-center py-8 text-danger">{error}</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-dark-text-secondary">暂无对局记录</div>
        ) : (
          <>
            {/* 统计概览 */}
            {stats && (
              <div className="bg-dark-bg-secondary rounded-lg p-4 mb-4">
                <div className="text-lg font-bold text-primary mb-2">{stats.name}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-text-secondary">积分:</span>
                    <span className="font-bold text-accent">{stats.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-text-secondary">胜率:</span>
                    <span className="font-bold text-success">{getWinRate()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-text-secondary">战绩:</span>
                    <span className="font-bold">
                      {stats.wins}胜 {stats.losses}负
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-text-secondary">总场次:</span>
                    <span className="font-bold">{stats.totalGames}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 对局历史 */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-dark-text-secondary">📜 最近对局</h3>
              {history.slice(0, 5).map((record, index) => (
                <div
                  key={`${record.roomId}-${index}`}
                  className="bg-dark-bg-secondary rounded-lg p-3 text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold ${getResultClass(record)}`}>
                      {getResultText(record)}
                    </span>
                    <span className="text-xs text-dark-text-tertiary">
                      {formatDate(record.finishedAt)}
                    </span>
                  </div>
                  <div className="text-xs text-dark-text-secondary">
                    ⚫ {record.blackPlayer.name} vs ⚪ {record.whitePlayer.name}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card-base w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🎮 玩家对局记录</h2>
          <button
            onClick={onClose}
            className="text-dark-text-tertiary hover:text-dark-text-primary text-2xl"
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className="text-center py-8">
            <p className="text-danger mb-4">{error}</p>
            <button onClick={onClose} className="btn-secondary">
              关闭
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-dark-text-secondary">暂无对局记录</div>
        ) : (
          <>
            {/* Player Stats */}
            {stats && (
              <div className="bg-dark-bg-secondary rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">📊 玩家统计</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{stats.name}</div>
                    <div className="text-sm text-dark-text-secondary">昵称</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-accent">{stats.score}</div>
                    <div className="text-sm text-dark-text-secondary">总分数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-success">{getWinRate()}</div>
                    <div className="text-sm text-dark-text-secondary">胜率</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.wins}</div>
                    <div className="text-sm text-dark-text-secondary">胜场</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.losses}</div>
                    <div className="text-sm text-dark-text-secondary">败场</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-dark-text-tertiary/20 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-text-secondary">总场次:</span>
                    <span className="font-bold">{stats.totalGames}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-text-secondary">最后对局:</span>
                    <span className="font-bold">{formatDate(stats.lastPlayedAt)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Game History */}
            <div>
              <h3 className="text-xl font-bold mb-4">📜 对局历史</h3>
              <div className="space-y-3">
                {history.map((record, index) => (
                  <div
                    key={`${record.roomId}-${index}`}
                    className="bg-dark-bg-secondary rounded-lg p-4 hover:bg-dark-bg-secondary/80 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`font-bold text-lg ${getResultClass(record)}`}>
                        {getResultText(record)}
                      </div>
                      <div className="text-sm text-dark-text-secondary">
                        {formatDate(record.finishedAt)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⚫</span>
                        <span>{record.blackPlayer.name}</span>
                        {record.winner === 1 && <span className="text-success">🏆</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⚪</span>
                        <span>{record.whitePlayer.name}</span>
                        {record.winner === 2 && <span className="text-success">🏆</span>}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-dark-text-secondary">
                      <span>🎯 手数: {record.moveCount}</span>
                      <span>⏱️ 时长: {formatDuration(record.duration, record)}</span>
                      <span>🏠 房间: {record.roomId}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t border-dark-text-tertiary/20">
          <button onClick={onClose} className="btn-secondary w-full">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
