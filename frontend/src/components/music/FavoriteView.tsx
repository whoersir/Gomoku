import React, { useMemo } from 'react';
import { MusicTrack } from '../../types/musicTypes';
import { useMusicPlayer } from '../../hooks/useMusicPlayer';
import { useFavorites } from '../../hooks/useFavorites';

interface FavoriteViewProps {
  tracks: MusicTrack[];
}

export const FavoriteView: React.FC<FavoriteViewProps> = ({ tracks }) => {
  const { playTrack, musicList, currentTrack, formatTime } = useMusicPlayer();
  const { favorites, toggleFavorite } = useFavorites();

  const favoriteTracks = useMemo(() => {
    return tracks.filter((track) => favorites.includes(track.id));
  }, [tracks, favorites]);

  const handlePlayTrack = (track: MusicTrack, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const index = musicList.findIndex((t) => t.id === track.id);
    if (index !== -1) {
      playTrack(index);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 结果计数 */}
      <div className="text-sm text-gray-400 mb-4">
        已收藏 <span className="text-white font-semibold">{favoriteTracks.length}</span> 首歌曲
      </div>

      {/* 收藏列表 */}
      {favoriteTracks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-12 h-12 text-gray-600 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <p className="text-gray-400">还没有收藏任何歌曲</p>
            <p className="text-gray-500 text-sm mt-1">收藏你喜欢的歌曲吧</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1">
          {favoriteTracks.map((track, index) => {
            const isPlaying = currentTrack?.id === track.id;

            return (
              <button
                key={track.id}
                onClick={(e) => handlePlayTrack(track, e)}
                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors group ${
                  isPlaying ? 'bg-blue-500/20' : 'hover:bg-white/10'
                }`}
              >
                {/* 播放状态指示 */}
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs ${
                    isPlaying ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {isPlaying ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <span>♥</span>
                  )}
                </div>

                {/* 专辑封面 */}
                <img
                  src={track.cover || 'https://picsum.photos/40/40'}
                  alt={track.title}
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = 'https://picsum.photos/40/40';
                  }}
                />

                {/* 歌曲信息 */}
                <div className="flex-1 min-w-0 text-left">
                  <p
                    className={`font-medium truncate text-sm ${isPlaying ? 'text-blue-400' : 'text-white'}`}
                  >
                    {track.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                </div>

                {/* 时长 */}
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {formatTime(track.duration || 0)}
                </div>

                {/* 移除收藏按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(track.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    className="w-4 h-4 text-red-500 fill-red-500 hover:text-red-600"
                    fill="currentColor"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
