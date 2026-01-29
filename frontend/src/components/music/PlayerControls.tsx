import React, { useRef, useState, useEffect, memo, useCallback } from 'react';
import { useMusicPlayer, PlayMode } from '../../contexts/MusicProvider';
import './PlayerControls.scss';

// 播放模式配置（组件外部，避免每次渲染都重新创建）
const playModeConfig: Record<
  PlayMode,
  { icon: React.ReactNode; label: string; nextMode: PlayMode }
> = {
  sequential: {
    icon: <img src="/icons8-重复-50.png" alt="循环播放" className="w-6 h-6" />,
    label: '循环播放',
    nextMode: 'random',
  },
  random: {
    icon: <img src="/icons8-随机-50.png" alt="随机播放" className="w-6 h-6" />,
    label: '随机播放',
    nextMode: 'single',
  },
  single: {
    icon: <img src="/icons8-重复一个-50.png" alt="单曲循环" className="w-6 h-6" />,
    label: '单曲循环',
    nextMode: 'sequential',
  },
};

// 进度条组件（独立组件，只更新必要的部分）
const ProgressBar = memo(({ currentTime, duration, formatTime, seekTo }: {
  currentTime: number;
  duration: number;
  formatTime: (time: number) => string;
  seekTo: (time: number) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

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

    if (isDragging) {
      seekTo(progress * duration);
    }
  };

  const handleProgressMouseUp = () => {
    if (isDragging && duration > 0) {
      const time = dragProgress * duration;
      seekTo(time);
    }
    setIsDragging(false);
  };

  // 全局拖拽处理
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !duration) return;

      const progressBar = document.querySelector('[data-progress-bar]') as HTMLElement;
      if (progressBar) {
        const rect = progressBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = Math.max(0, Math.min(1, x / rect.width));
        setDragProgress(progress);
        seekTo(progress * duration);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, duration, seekTo]);

  const displayedProgress = isDragging ? dragProgress : (duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0);
  const displayedTime = isDragging ? dragProgress * (duration || 0) : currentTime;

  return (
    <div className="player-controls__progress-bar">
      <div
        className="player-controls__progress-bar-container"
        onMouseDown={handleProgressMouseDown}
        data-progress-bar
        style={{ minHeight: '6px' }}
      >
        <div
          className="player-controls__progress-bar-fill"
          style={{ width: `${displayedProgress * 100}%` }}
        >
          <div className="player-controls__progress-bar-fill__handle" />
        </div>
      </div>
      <div className="player-controls__progress-bar-time">
        <span className="player-controls__progress-bar-time__label">{formatTime(displayedTime)}</span>
        <span className="player-controls__progress-bar-time__label">{formatTime(duration)}</span>
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

// 音量控制组件
const VolumeControl = memo(({ volume, isMuted, setVolume, toggleMute }: {
  volume: number;
  isMuted: boolean;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeContainerRef = useRef<HTMLDivElement>(null);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  }, [setVolume]);

  // 点击外部关闭滑块
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeContainerRef.current && !volumeContainerRef.current.contains(event.target as Node)) {
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
    <div
      ref={volumeContainerRef}
      className="player-controls__volume player-controls__buttons--left"
      onMouseEnter={() => setShowVolumeSlider(true)}
    >
      <button
        onClick={toggleMute}
        className="player-controls__volume-button p-2 relative z-20 focus:outline-none"
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
        <div className="player-controls__volume-slider">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="player-controls__volume-input"
            style={{
              WebkitAppearance: 'none',
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`,
            }}
          />
          <div className="player-controls__volume-input-percentage">
            {Math.round(volume * 100)}%
          </div>
        </div>
      )}
    </div>
  );
});

VolumeControl.displayName = 'VolumeControl';

// 播放按钮组件
const PlayButtons = memo(({ isPlaying, previousTrack, togglePlay, nextTrack }: {
  isPlaying: boolean;
  previousTrack: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
}) => {
  return (
    <div className="player-controls__buttons--center">
      <button
        onClick={previousTrack}
        className="player-controls__nav-button"
        title="上一首"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
        </svg>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        className="player-controls__play-button"
        title={isPlaying ? '暂停' : '播放'}
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
        className="player-controls__nav-button"
        title="下一首"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </button>
    </div>
  );
});

PlayButtons.displayName = 'PlayButtons';

// 播放模式按钮组件
const PlayModeButton = memo(({ playMode, setPlayMode }: {
  playMode: PlayMode;
  setPlayMode: (mode: PlayMode) => void;
}) => {
  const togglePlayMode = () => {
    setPlayMode(playModeConfig[playMode].nextMode);
  };

  return (
    <div className="player-controls__buttons--right">
      <button
        onClick={togglePlayMode}
        className="player-controls__mode-button"
        title={playModeConfig[playMode].label}
      >
        {playModeConfig[playMode].icon}
      </button>
    </div>
  );
});

PlayModeButton.displayName = 'PlayModeButton';

// 主组件（使用 memo 避免不必要的重新渲染）
const PlayerControlsComponent = memo(() => {
  const {
    currentTime,
    duration,
    volume,
    isMuted,
    isPlaying,
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

  return (
    <div className="player-controls">
      <ProgressBar
        currentTime={currentTime}
        duration={duration}
        formatTime={formatTime}
        seekTo={seekTo}
      />
      <div className="player-controls__buttons">
        <VolumeControl
          volume={volume}
          isMuted={isMuted}
          setVolume={setVolume}
          toggleMute={toggleMute}
        />
        <PlayButtons
          isPlaying={isPlaying}
          previousTrack={previousTrack}
          togglePlay={togglePlay}
          nextTrack={nextTrack}
        />
        <PlayModeButton
          playMode={playMode}
          setPlayMode={setPlayMode}
        />
      </div>
    </div>
  );
});

PlayerControlsComponent.displayName = 'PlayerControlsComponent';

// 导出组件
export const PlayerControls = PlayerControlsComponent;
