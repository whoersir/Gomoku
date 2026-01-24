import { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerState, MusicTrack, PlayMode } from '../types/musicTypes';
import { musicService } from '../services/musicService';
import {
  STORAGE_KEY_PLAYLIST,
  STORAGE_KEY_TRACK_INDEX,
  STORAGE_KEY_VOLUME,
  STORAGE_KEY_PLAY_MODE
} from '../data/musicPresets';

export function useMusicPlayer() {
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    try {
      const savedPlaylist = localStorage.getItem(STORAGE_KEY_PLAYLIST);
      const savedIndex = localStorage.getItem(STORAGE_KEY_TRACK_INDEX);
      const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);
      const savedPlayMode = localStorage.getItem(STORAGE_KEY_PLAY_MODE);

      // 过滤掉没有有效 URL 的音乐
      const rawPlaylist = savedPlaylist ? JSON.parse(savedPlaylist) : musicService.getPresetPlaylist();
      const validPlaylist = rawPlaylist.filter((track: any) => {
        return track.url && track.url.trim() !== '';
      });
      const playlist = validPlaylist.length > 0 ? validPlaylist : musicService.getPresetPlaylist();

      const currentTrackIndex = savedIndex ? Math.min(parseInt(savedIndex, 10), playlist.length - 1) : 0;
      const volume = savedVolume ? parseFloat(savedVolume) : 0.7;
      const playMode = (savedPlayMode as PlayMode) || 'sequential';

      return {
        currentTrack: playlist[currentTrackIndex] || null,
        isPlaying: false,
        volume,
        currentTime: 0,
        playlist,
        currentTrackIndex,
        isMiniMode: false,
        playlistId: 'default',
        playMode
      };
    } catch (error) {
      console.error('Error loading player state:', error);
      return {
        currentTrack: null,
        isPlaying: false,
        volume: 0.7,
        currentTime: 0,
        playlist: musicService.getPresetPlaylist(),
        currentTrackIndex: 0,
        isMiniMode: false,
        playlistId: 'default',
        playMode: 'sequential'
      };
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setPlayerState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

  const handleEnded = () => {
    const { playMode, currentTrackIndex, playlist } = playerState;

    // 根据播放模式处理歌曲结束
    if (playMode === 'single') {
      // 单曲循环：重新播放当前歌曲
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    } else if (playMode === 'random') {
      // 随机播放：随机选择一首歌
      const randomIndex = Math.floor(Math.random() * playlist.length);
      playTrack(playlist[randomIndex], randomIndex);
    } else {
      // 顺序播放或列表循环
      playNext();
    }
  };

    const handleCanPlay = () => {
      if (playerState.isPlaying) {
        audio.play().catch(console.error);
      }
    };

    const handleError = (e: Event) => {
      const track = playerState.currentTrack;
      console.error('[useMusicPlayer] Audio playback error:', {
        trackTitle: track?.title,
        trackUrl: track?.url,
        error: e
      });
      // 停止当前播放，不自动跳到下一首（避免循环错误）
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [playerState.isPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    if (playerState.currentTrack) {
      const loadAndPlay = async (track: typeof playerState.currentTrack) => {
        // 检查是否有有效的播放URL（不为空、不是Stream API）
        if (!track.url ||
            track.url.trim() === '' ||
            track.url.includes('/api/music/stream/')) {
          console.warn('[useMusicPlayer] No valid URL for track:', track.title, track.url);
          // 本地音乐或无效URL，停止播放
          setPlayerState(prev => ({ ...prev, isPlaying: false }));
          return;
        }

        audio.src = track.url;

        audio.volume = playerState.volume;

        if (playerState.isPlaying) {
          audio.play().catch(console.error);
        }
      };

      loadAndPlay(playerState.currentTrack);
    }

    return () => {
      audio.pause();
    };
  }, [playerState.currentTrack, playerState.isPlaying]);

  // 单独处理音量变化，避免重新加载音轨
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = playerState.volume;
    }
  }, [playerState.volume]);

  useEffect(() => {
    try {
      // 保存播放列表时移除封面图片，避免localStorage配额超限
      const playlistWithoutCovers = playerState.playlist.map(track => ({
        ...track,
        cover: undefined // 移除Base64封面图片
      }));

      localStorage.setItem(STORAGE_KEY_PLAYLIST, JSON.stringify(playlistWithoutCovers));
      localStorage.setItem(STORAGE_KEY_TRACK_INDEX, String(playerState.currentTrackIndex));
      localStorage.setItem(STORAGE_KEY_VOLUME, String(playerState.volume));
      localStorage.setItem(STORAGE_KEY_PLAY_MODE, playerState.playMode);
    } catch (error) {
      console.error('Error saving player state:', error);
    }
  }, [playerState.playlist, playerState.currentTrackIndex, playerState.volume, playerState.playMode]);

  const playPause = useCallback(() => {
    if (!audioRef.current || !playerState.currentTrack) return;

    if (playerState.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }

    setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [playerState.isPlaying, playerState.currentTrack]);

  const playNext = useCallback(() => {
    const { playMode, currentTrackIndex, playlist } = playerState;

    // 列表循环模式：到最后一首时回到第一首
    // 顺序模式：到最后一首时停止
    if (playMode === 'sequential' && currentTrackIndex === playlist.length - 1) {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      return;
    }

    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    const nextTrack = playlist[nextIndex];

    setPlayerState(prev => ({
      ...prev,
      currentTrack: nextTrack,
      currentTrackIndex: nextIndex,
      currentTime: 0,
      isPlaying: true
    }));
  }, [playerState.currentTrackIndex, playerState.playlist, playerState.playMode]);

  const playPrevious = useCallback(() => {
    const prevIndex = playerState.currentTrackIndex === 0 
      ? playerState.playlist.length - 1 
      : playerState.currentTrackIndex - 1;
    const prevTrack = playerState.playlist[prevIndex];

    setPlayerState(prev => ({
      ...prev,
      currentTrack: prevTrack,
      currentTrackIndex: prevIndex,
      currentTime: 0,
      isPlaying: true
    }));
  }, [playerState.currentTrackIndex, playerState.playlist]);

  const playTrack = useCallback((track: MusicTrack, index?: number) => {
    const trackIndex = index !== undefined ? index : playerState.playlist.findIndex(t => t.id === track.id);

    if (trackIndex === -1) return;

    setPlayerState(prev => ({
      ...prev,
      currentTrack: track,
      currentTrackIndex: trackIndex,
      currentTime: 0,
      isPlaying: true
    }));
  }, [playerState.playlist]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
    setPlayerState(prev => ({ ...prev, volume: clampedVolume }));
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;

    const duration = audioRef.current.duration;
    if (isNaN(duration)) return;

    const clampedTime = Math.max(0, Math.min(duration, time));
    audioRef.current.currentTime = clampedTime;
    setPlayerState(prev => ({ ...prev, currentTime: clampedTime }));
  }, []);

  // const toggleMiniMode = useCallback(() => {
  //   setPlayerState(prev => ({ ...prev, isMiniMode: !prev.isMiniMode }));
  // }, []);

  const loadPlaylist = useCallback(async (tracks: MusicTrack[]) => {
    // 过滤掉没有有效 URL 的音乐
    const validTracks = tracks.filter(track => {
      return track.url && track.url.trim() !== '';
    });

    if (validTracks.length === 0) {
      console.warn('[useMusicPlayer] No valid tracks with URLs, skipping playlist load');
      return;
    }

    setPlayerState(prev => ({
      ...prev,
      playlist: validTracks,
      currentTrackIndex: 0,
      currentTrack: validTracks[0] || null,
      currentTime: 0,
      isPlaying: true
    }));
  }, []);

  const searchMusic = useCallback(async (query: string) => {
    try {
      const results = await musicService.searchMusic({ query, limit: 999999 });
      // 过滤掉没有有效 URL 的音乐
      const validResults = results.filter(track => {
        return track.url && track.url.trim() !== '';
      });

      if (validResults.length > 0) {
        await loadPlaylist(validResults);
      } else {
        console.warn('[useMusicPlayer] Search returned no valid tracks with URLs');
      }

      return validResults;
    } catch (error) {
      console.error('Search music error:', error);
      return [];
    }
  }, [loadPlaylist]);

  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const togglePlayMode = useCallback(() => {
    const modes: PlayMode[] = ['sequential', 'random', 'single', 'loop'];
    const currentIndex = modes.indexOf(playerState.playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];

    setPlayerState(prev => ({ ...prev, playMode: nextMode }));
  }, [playerState.playMode]);

  return {
    playerState,
    playPause,
    playNext,
    playPrevious,
    playTrack,
    setVolume,
    seek,
    loadPlaylist,
    searchMusic,
    formatTime,
    togglePlayMode,
    getCurrentDuration: useCallback((): number => audioRef.current?.duration || 0, [])
  };
}
