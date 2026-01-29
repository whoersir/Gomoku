import React from 'react';
import { useMusicPlayer } from '../../contexts/MusicProvider';

interface MiniPlayerProps {
  onOpenFullPlayer: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onOpenFullPlayer }) => {
  const { currentTrack, isPlaying, currentTime, duration, togglePlay, formatTime } =
    useMusicPlayer();

  // 如果没有音乐，显示占位符
  if (!currentTrack) {
    return (
      <div
        className="fixed right-4 top-1/2 -translate-y-1/2 backdrop-blur-md rounded-lg p-3 cursor-pointer hover:bg-black/70 transition-all duration-300"
        style={{
          width: '320px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          zIndex: 9999,
        }}
        onClick={onOpenFullPlayer}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center">
            <svg className="w-6 h-6 text-white/80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V3h-2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">播放器</p>
            <p className="text-white/60 text-xs">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleOpenPlayer = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    console.log('[MiniPlayer] Opening full player');
    onOpenFullPlayer();
  };

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md rounded-lg p-3 hover:bg-black/70 transition-all duration-300"
      style={{
        width: '320px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        zIndex: 9999,
      }}
      onClick={(e) => {
        console.log('[MiniPlayer] Div clicked');
        handleOpenPlayer(e);
      }}
    >
      {/* 播放器内容 */}
      <div className="flex items-center gap-3">
        {/* 专辑封面 */}
        <div
          className="relative w-12 h-12 flex-shrink-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenPlayer(e);
          }}
        >
          <img
            src={currentTrack.cover || 'https://picsum.photos/64/64'}
            alt={currentTrack.title}
            className="w-full h-full object-cover rounded"
            onError={(e) => {
              e.currentTarget.src = 'https://picsum.photos/64/64';
            }}
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/30 rounded flex items-center justify-center">
              <div className="flex gap-1 items-end">
                <div className="w-1 bg-white rounded animate-pulse" style={{ height: '8px' }}></div>
                <div
                  className="w-1 bg-white rounded animate-pulse"
                  style={{ height: '12px', animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-1 bg-white rounded animate-pulse"
                  style={{ height: '6px', animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* 歌曲信息 */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenPlayer(e);
          }}
        >
          <p className="text-white text-sm font-medium truncate">{currentTrack.title}</p>
          <p className="text-white/70 text-xs truncate">{currentTrack.artist}</p>
        </div>

        {/* 播放/暂停按钮 */}
        <button
          className="flex-shrink-0 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        >
          {isPlaying ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* 进度条 */}
      <div
        className="mt-2 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenPlayer(e);
        }}
      >
        <div className="h-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-white/70">{formatTime(currentTime)}</span>
          <span className="text-xs text-white/70">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
