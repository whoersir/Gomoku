import React, { useState, useRef, useEffect } from 'react';
import { useMusicPlayer } from '../hooks/useMusicPlayer';
import { MusicTrack } from '../types/musicTypes';
import { musicService } from '../services/musicService';
import './MusicPlayer.css';

const MusicPlayer: React.FC = () => {
  const {
    playerState,
    playPause,
    playNext,
    playPrevious,
    playTrack,
    setVolume,
    seek,
    searchMusic,
    formatTime,
    togglePlayMode,
    getCurrentDuration
  } = useMusicPlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const dragStartX = useRef(0);
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const { currentTrack, isPlaying, volume, currentTime, playMode } = playerState;
  const duration = getCurrentDuration();
  const actualProgress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progress = isSeeking ? displayProgress : actualProgress;

  const playModeIcons: { [key: string]: string } = {
    sequential: '🔁',
    random: '🔀',
    single: '🔂',
    loop: '🔁'
  };

  const playModeLabels: { [key: string]: string } = {
    sequential: '列表循环',
    random: '随机播放',
    single: '单曲循环',
    loop: '列表循环'
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');

    try {
      const results = await searchMusic(searchQuery);
      if (results.length > 0) {
        setShowPlaylist(true);
        setSearchError('');
      } else {
        setSearchError('未找到相关音乐，请尝试其他关键词或流派');
      }
    } catch (error) {
      console.error('Search error:', error);

      // 检查是否是CORS错误
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('CORS') || errorMsg.includes('Failed to fetch')) {
        setSearchError('部分API访问受限，但已尝试其他来源。建议使用免费音乐源或尝试其他关键词。');
      } else {
        setSearchError('搜索失败，请稍后重试');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // 内部搜索函数（实时搜索使用，不禁用输入框）
  const handleDebouncedSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await searchMusic(searchQuery);
      if (results.length > 0) {
        setShowPlaylist(true);
        setSearchError('');
      } else {
        setSearchError('未找到相关音乐，请尝试其他关键词或流派');
      }
    } catch (error) {
      console.error('Search error:', error);

      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('CORS') || errorMsg.includes('Failed to fetch')) {
        setSearchError('部分API访问受限，但已尝试其他来源。建议使用免费音乐源或尝试其他关键词。');
      } else {
        setSearchError('搜索失败，请稍后重试');
      }
    }
  };

  // 实时搜索（防抖）
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleDebouncedSearch();
    }, 500); // 500ms延迟

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);



  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    seek(newTime);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (!progressRef.current || !duration) return;

    setIsDragging(true);
    setIsSeeking(true);

    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;

    setDisplayProgress(percentage * 100);

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleDrag = (e: MouseEvent) => {
    if (!progressRef.current || !isDragging) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;

    setDisplayProgress(percentage * 100);
  };

  const handleDragEnd = () => {
    if (!duration || !isDragging) return;

    const newTime = (displayProgress / 100) * duration;
    seek(newTime);

    setIsDragging(false);
    setIsSeeking(false);

    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  // 当不在拖动时，同步 displayProgress 到实际进度
  useEffect(() => {
    if (!isSeeking) {
      setDisplayProgress(actualProgress);
    }
  }, [actualProgress, isSeeking]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  return (
    <div className="music-player" ref={containerRef}>
      <div className="music-player-header">
        <div className="music-player-title-section">
          <h3>🎵 LX Music</h3>
        </div>
        <button
          className="music-player-playlist-toggle"
          onClick={() => setShowPlaylist(!showPlaylist)}
          title="播放列表"
        >
          📋
        </button>
      </div>

      {currentTrack && (
        <div className="music-player-current">
          <div className="music-player-info">
            <div className="music-player-title">{currentTrack.title}</div>
            <div className="music-player-artist">{currentTrack.artist}</div>
            <div className="music-player-album">{currentTrack.album}</div>
          </div>
        </div>
      )}

      <div className="music-player-controls">
        <button onClick={playPrevious} title="上一首">⏮</button>
        <button
          onClick={playPause}
          className="music-player-play-btn"
          disabled={!currentTrack}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={playNext} title="下一首">⏭</button>
      </div>

      <div className="music-player-play-mode">
        <button
          onClick={togglePlayMode}
          title={playModeLabels[playMode]}
          className="music-player-play-mode-btn"
        >
          {playModeIcons[playMode]}
        </button>
        <span className="music-player-play-mode-label">{playModeLabels[playMode]}</span>
      </div>

      <div className="music-player-time">
        <span>{formatTime(currentTime)}</span>
        <div
          ref={progressRef}
          className="music-player-progress"
          onClick={handleProgressClick}
        >
          <div
            className="music-player-progress-bar"
            style={{ width: `${progress}%`, transition: isSeeking ? 'none' : 'width 0.1s' }}
            onMouseDown={handleDragStart}
          />
        </div>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="music-player-volume">
        <span>🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="music-player-volume-slider"
        />
        <span>{Math.round(volume * 100)}%</span>
      </div>

      <div className="music-player-search">
        <div className="music-player-search-controls">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="搜索音乐（支持本地、在线）..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="music-player-search-input"
              disabled={isSearching}
              autoComplete="off"
            />
            <button type="submit" disabled={isSearching}>
              {isSearching ? '⏳' : '🔍'}
            </button>
          </form>
        </div>

        {searchError && (
          <div className="music-player-search-error">
            {searchError}
          </div>
        )}
      </div>

      {showPlaylist && (
        <div className="music-player-playlist">
          <h4>播放列表 ({playerState.playlist.length})</h4>
          <div className="music-player-playlist-items">
            {playerState.playlist.map((track, index) => (
              <div
                key={track.id}
                className={`music-player-playlist-item ${
                  currentTrack?.id === track.id ? 'active' : ''
                }`}
                onClick={() => playTrack(track, index)}
              >
                <div className="playlist-item-info">
                  <div className="playlist-item-title">{track.title}</div>
                  <div className="playlist-item-artist">{track.artist}</div>
                </div>
                {isPlaying && currentTrack?.id === track.id && (
                  <div className="playlist-item-playing">▶</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
