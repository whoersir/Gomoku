import React, { useRef, useState } from 'react';
import { useMusicPlayer, PlayMode } from '../../hooks/useMusicPlayer';

export const PlayerControls: React.FC = () => {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playMode,
    togglePlay,
    nextTrack,
    previousTrack,
    seekTo,
    setVolume,
    toggleMute,
    setPlayMode,
    formatTime,
  } = useMusicPlayer();

  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeSliderRef = useRef<HTMLDivElement>(null);

  // 播放模式映射
  const playModeConfig: Record<PlayMode, { icon: React.ReactNode; label: string; nextMode: PlayMode }> = {
    sequential: {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
        </svg>
      ),
      label: '顺序播放',
      nextMode: 'single'
    },
    single: {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
        </svg>
      ),
      label: '单曲循环',
      nextMode: 'random'
    },
    random: {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
        </svg>
      ),
      label: '随机播放',
      nextMode: 'sequential'
    }
  };

  // 切换播放模式
  const togglePlayMode = () => {
    setPlayMode(playModeConfig[playMode].nextMode);
  };

  // 进度条拖拽处理
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressSeek(e);
  };

  const handleProgressSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    setDragProgress(progress);
  };

  const handleProgressMouseUp = () => {
    if (isDragging && duration > 0) {
      const time = dragProgress * duration;
      seekTo(time);
    }
    setIsDragging(false);
  };

  // 计算显示的进度
  const displayedProgress = isDragging ? dragProgress : (duration > 0 ? currentTime / duration : 0);
  const displayedTime = isDragging ? formatTime(dragProgress * duration) : currentTime;

  // 音量滑块处理
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  // 点击外部关闭音量滑块
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeSliderRef.current && !volumeSliderRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false);
      }
    };

    if (showVolumeSlider) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolumeSlider]);

  return (
    <div className="w-full">
      {/* 进度条 */}
      <div className="mb-4">
        <div
          className="h-1.5 bg-gray-700 rounded-full cursor-pointer relative group"
          onMouseDown={handleProgressMouseDown}
          onMouseMove={handleProgressSeek}
          onMouseUp={handleProgressMouseUp}
          onMouseLeave={handleProgressMouseUp}
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${displayedProgress * 100}%` }}
          >
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">{formatTime(displayedTime)}</span>
          <span className="text-xs text-gray-400">{formatTime(duration)}</span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-between">
        {/* 左侧：音量控制 */}
        <div className="flex items-center gap-2" ref={volumeSliderRef}>
          <button
            onClick={() => {
              toggleMute();
              setShowVolumeSlider(false);
            }}
            onDoubleClick={() => setShowVolumeSlider(!showVolumeSlider)}
            className="text-gray-400 hover:text-white transition-colors"
            title="音量"
          >
            {isMuted || volume === 0 ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : volume < 0.5 ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>

          {showVolumeSlider && (
            <div className="absolute bottom-16 left-0 bg-gray-800 rounded-lg p-3 shadow-xl">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  WebkitAppearance: 'none',
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`
                }}
              />
              <div className="text-center text-xs text-gray-400 mt-1">
                {Math.round(volume * 100)}%
              </div>
            </div>
          )}
        </div>

        {/* 中间：播放控制 */}
        <div className="flex items-center gap-6">
          <button
            onClick={previousTrack}
            className="text-gray-400 hover:text-white transition-colors"
            title="上一首"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors shadow-lg"
            title={isPlaying ? "暂停" : "播放"}
          >
            {isPlaying ? (
              <svg className="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={nextTrack}
            className="text-gray-400 hover:text-white transition-colors"
            title="下一首"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* 右侧：播放模式 */}
        <div className="w-16 flex justify-end">
          <button
            onClick={togglePlayMode}
            className="text-gray-400 hover:text-white transition-colors"
            title={playModeConfig[playMode].label}
          >
            {playMode === 'single' ? (
              // 单曲循环模式显示重复图标
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
              </svg>
            ) : (
              playModeConfig[playMode].icon
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
