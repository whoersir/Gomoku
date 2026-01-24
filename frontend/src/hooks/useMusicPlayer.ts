import { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerState, MusicTrack } from '../types/musicTypes';
import { musicService } from '../services/musicService';
import {
  STORAGE_KEY_PLAYLIST,
  STORAGE_KEY_TRACK_INDEX,
  STORAGE_KEY_VOLUME
} from '../data/musicPresets';

export function useMusicPlayer() {
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    try {
      const savedPlaylist = localStorage.getItem(STORAGE_KEY_PLAYLIST);
      const savedIndex = localStorage.getItem(STORAGE_KEY_TRACK_INDEX);
      const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);

      const playlist = savedPlaylist ? JSON.parse(savedPlaylist) : musicService.getPresetPlaylist();
      const currentTrackIndex = savedIndex ? parseInt(savedIndex, 10) : 0;
      const volume = savedVolume ? parseFloat(savedVolume) : 0.7;

      return {
        currentTrack: playlist[currentTrackIndex] || null,
        isPlaying: false,
        volume,
        currentTime: 0,
        playlist,
        currentTrackIndex,
        isMiniMode: false,
        playlistId: 'default'
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
        playlistId: 'default'
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
      playNext();
    };

    const handleCanPlay = () => {
      if (playerState.isPlaying) {
        audio.play().catch(console.error);
      }
    };

    const handleError = (e: Event) => {
      console.error('Audio playback error:', e);
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
        // 如果是QQ音乐歌曲，需要动态获取播放URL
        if (track.songmid && track.mediaMid) {
          try {
            const playUrl = await musicService.getTrackPlayUrl(track.songmid, track.mediaMid);
            audio.src = playUrl;
          } catch (error) {
            console.error('Failed to get QQ Music play URL:', error);
            audio.src = track.url;
          }
        } else {
          audio.src = track.url;
        }

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
      localStorage.setItem(STORAGE_KEY_PLAYLIST, JSON.stringify(playerState.playlist));
      localStorage.setItem(STORAGE_KEY_TRACK_INDEX, String(playerState.currentTrackIndex));
      localStorage.setItem(STORAGE_KEY_VOLUME, String(playerState.volume));
    } catch (error) {
      console.error('Error saving player state:', error);
    }
  }, [playerState.playlist, playerState.currentTrackIndex, playerState.volume]);

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
    const nextIndex = (playerState.currentTrackIndex + 1) % playerState.playlist.length;
    const nextTrack = playerState.playlist[nextIndex];

    setPlayerState(prev => ({
      ...prev,
      currentTrack: nextTrack,
      currentTrackIndex: nextIndex,
      currentTime: 0,
      isPlaying: true
    }));
  }, [playerState.currentTrackIndex, playerState.playlist]);

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
    setPlayerState(prev => ({
      ...prev,
      playlist: tracks,
      currentTrackIndex: 0,
      currentTrack: tracks[0] || null,
      currentTime: 0,
      isPlaying: true
    }));
  }, []);

  const searchMusic = useCallback(async (query: string) => {
    try {
      const results = await musicService.searchMusic({ query, limit: 10 });
      if (results.length > 0) {
        await loadPlaylist(results);
      }
      return results;
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
    getCurrentDuration: useCallback((): number => audioRef.current?.duration || 0, [])
  };
}
