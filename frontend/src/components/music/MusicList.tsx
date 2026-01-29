import React from 'react';
import { useMusicPlayer } from '../../hooks/useMusicPlayer';

export const MusicList: React.FC = () => {
  const { musicList, currentTrack, playTrack, formatTime } = useMusicPlayer();

  if (musicList.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 text-center">
        <p className="text-gray-400">暂无音乐</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-xl overflow-hidden max-h-96 overflow-y-auto">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white font-semibold">播放列表</h3>
        <p className="text-sm text-gray-400">共 {musicList.length} 首歌曲</p>
      </div>

      <div className="divide-y divide-gray-700/50">
        {musicList.map((track, index) => {
          const isCurrentTrack = currentTrack?.id === track.id;

          return (
            <button
              key={track.id}
              onClick={(e) => {
                e.stopPropagation();
                playTrack(index);
              }}
              className={`w-full p-4 flex items-center gap-4 transition-colors ${
                isCurrentTrack ? 'bg-blue-500/20 hover:bg-blue-500/30' : 'hover:bg-gray-700/50'
              }`}
            >
              {/* 序号 */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCurrentTrack ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              >
                {isCurrentTrack ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <span className="text-sm text-gray-300">{index + 1}</span>
                )}
              </div>

              {/* 专辑封面 */}
              <img
                src={track.cover || 'https://picsum.photos/64/64'}
                alt={track.title}
                className="w-12 h-12 object-cover rounded flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = 'https://picsum.photos/64/64';
                }}
              />

              {/* 歌曲信息 */}
              <div className="flex-1 min-w-0 text-left">
                <p
                  className={`font-medium truncate ${
                    isCurrentTrack ? 'text-blue-400' : 'text-white'
                  }`}
                >
                  {track.title}
                </p>
                <p className="text-sm text-gray-400 truncate">{track.artist}</p>
              </div>

              {/* 时长 */}
              {track.duration && (
                <div className="text-sm text-gray-400 flex-shrink-0">
                  {formatTime(track.duration)}
                </div>
              )}

              {/* 当前播放指示器 */}
              {isCurrentTrack && (
                <div className="flex gap-1 items-end">
                  <div
                    className="w-1 bg-blue-500 rounded animate-pulse"
                    style={{ height: '8px' }}
                  ></div>
                  <div
                    className="w-1 bg-blue-500 rounded animate-pulse"
                    style={{ height: '12px', animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-1 bg-blue-500 rounded animate-pulse"
                    style={{ height: '6px', animationDelay: '0.2s' }}
                  ></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
