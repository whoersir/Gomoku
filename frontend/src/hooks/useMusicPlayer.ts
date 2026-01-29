import { useState, useEffect, useRef, useCallback } from 'react';
import { MusicTrack } from '../types/musicTypes';
import { musicService } from '../services/musicService';

export type PlayMode = 'sequential' | 'single' | 'random';

export interface UseMusicPlayerReturn {
  // 状态
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  musicList: MusicTrack[];
  isLoading: boolean;
  playMode: PlayMode;

  // 方法
  togglePlay: () => void;
  playTrack: (index: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlayMode: (mode: PlayMode) => void;
  refreshMusicList: () => Promise<void>;

  // 工具方法
  formatTime: (time: number) => string;
}

export const useMusicPlayer = (): UseMusicPlayerReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [musicList, setMusicList] = useState<MusicTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('sequential');
  const previousVolumeRef = useRef(0.8);
  const nextTrackRef = useRef<() => void>(() => {});

  // 初始化音频元素
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    // 加载保存的音量设置
    const savedVolume = localStorage.getItem('musicPlayer_volume');
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      audio.volume = vol;
      setVolumeState(vol);
      previousVolumeRef.current = vol;
    } else {
      audio.volume = volume;
    }

    // 监听音频事件
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime * 1000); // 转换为毫秒，与duration保持一致
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration * 1000); // 转换为毫秒，与后端保持一致
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      console.error('[useMusicPlayer] Audio error:', e);
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // 单独处理播放结束事件（使用ref避免循环依赖）
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (playMode === 'single') {
        // 单曲循环，重新播放当前歌曲
        audio.currentTime = 0;
        audio.play();
        setIsPlaying(true);
      } else {
        // 自动播放下一首
        nextTrackRef.current();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [playMode]);

  // 加载音乐列表
  useEffect(() => {
    const initializeMusic = async () => {
      try {
        setIsLoading(true);
        // 使用新的排序 API 获取音乐列表
        const allMusic = await musicService.getAllMusicSorted('title', 999999);
        setMusicList(allMusic);

        // 如果有预设的当前播放位置，设置当前歌曲
        if (currentTrack) {
          const index = allMusic.findIndex((t) => t.id === currentTrack.id);
          if (index !== -1) {
            setCurrentTrack(allMusic[index]);
            setCurrentTrackIndex(index);
          }
        }
      } catch (error) {
        console.error('Failed to initialize music:', error);
        // 降级使用预设播放列表
        setMusicList(musicService.getPresetPlaylist());
      } finally {
        setIsLoading(false);
      }
    };

    initializeMusic();
  }, []);

  // 刷新音乐列表
  const refreshMusicList = useCallback(async () => {
    try {
      setIsLoading(true);
      // 调用后端刷新API
      const response = await fetch('/api/music/refresh', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[useMusicPlayer] 后端音乐库刷新成功:', result.count);

        // 获取后端基础URL
        const backendUrl = window.location.origin.includes(':5173')
          ? window.location.origin.replace(':5173', ':3000')
          : `${window.location.protocol}//${window.location.hostname}:3000`;

        // 直接使用刷新API返回的音乐列表
        const allMusic = result.data.map((track: any) => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration: track.duration,
          url: track.url.startsWith('http') ? track.url : `${backendUrl}${track.url}`,
          cover: track.cover || 'https://picsum.photos/64/64',
        }));

        setMusicList(allMusic);

        // 如果有当前播放的歌曲，重新设置
        if (currentTrack) {
          const index = allMusic.findIndex((t) => t.id === currentTrack.id);
          if (index !== -1) {
            setCurrentTrack(allMusic[index]);
            setCurrentTrackIndex(index);
          }
        }
      } else {
        console.error('[useMusicPlayer] 后端音乐库刷新失败');
      }
    } catch (error) {
      console.error('[useMusicPlayer] 刷新音乐列表错误:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentTrack]);

  // 播放/暂停切换
  const togglePlay = useCallback(() => {
    if (!currentTrack || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  }, [currentTrack, isPlaying]);

  // 播放指定索引的曲目
  const playTrack = useCallback(
    (index: number) => {
      if (index < 0 || index >= musicList.length || !audioRef.current) return;

      setIsLoading(true);
      const track = musicList[index];

      console.log('[useMusicPlayer] Playing track:', track);
      console.log('[useMusicPlayer] Track URL:', track.url);

      // 重置音频元素
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      // 设置新的音频源
      audioRef.current.src = track.url;

      // 尝试播放
      audioRef.current.load(); // 先加载音频

      audioRef.current
        .play()
        .then(() => {
          console.log('[useMusicPlayer] Successfully started playing:', track.title);
          setIsPlaying(true);
          setCurrentTrack(track);
          setCurrentTrackIndex(index);
          setIsLoading(false);

          // 保存当前播放的歌曲ID
          localStorage.setItem('musicPlayer_trackId', track.id);
          localStorage.setItem('musicPlayer_time', '0');
        })
        .catch((error) => {
          console.error('[useMusicPlayer] Failed to play track:', error);
          console.error('[useMusicPlayer] Track details:', {
            title: track.title,
            url: track.url,
            exists: !!track.url,
          });
          setIsLoading(false);
        });
    },
    [musicList]
  );

  // 播放下一首
  const nextTrack = useCallback(() => {
    if (musicList.length === 0) return;

    if (playMode === 'single') {
      // 单曲循环，重新播放当前歌曲
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else if (playMode === 'random') {
      // 随机播放
      const randomIndex = Math.floor(Math.random() * musicList.length);
      playTrack(randomIndex);
    } else {
      // 顺序播放
      const nextIndex = (currentTrackIndex + 1) % musicList.length;
      playTrack(nextIndex);
    }
  }, [currentTrackIndex, musicList.length, playMode, playTrack]);

  // 更新ref以便在事件处理器中使用
  nextTrackRef.current = nextTrack;

  // 播放上一首
  const previousTrack = useCallback(() => {
    if (musicList.length === 0) return;

    const prevIndex = currentTrackIndex === 0 ? musicList.length - 1 : currentTrackIndex - 1;
    playTrack(prevIndex);
  }, [currentTrackIndex, musicList.length, playTrack]);

  // 跳转到指定时间（time参数为毫秒，需要转换为秒设置给audio）
  const seekTo = useCallback((time: number) => {
    if (!audioRef.current) return;

    const timeInSeconds = time / 1000;
    audioRef.current.currentTime = timeInSeconds;
    setCurrentTime(time);

    // 保存播放进度
    localStorage.setItem('musicPlayer_time', time.toString());
  }, []);

  // 设置音量
  const setVolume = useCallback((newVolume: number) => {
    if (!audioRef.current) return;

    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    audioRef.current.volume = clampedVolume;
    setVolumeState(clampedVolume);
    previousVolumeRef.current = clampedVolume;

    // 保存音量设置
    localStorage.setItem('musicPlayer_volume', clampedVolume.toString());

    // 如果音量大于0，取消静音
    if (clampedVolume > 0) {
      setIsMuted(false);
    }
  }, []);

  // 切换静音
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;

    if (isMuted) {
      // 取消静音，恢复之前的音量
      audioRef.current.volume = previousVolumeRef.current;
      setVolumeState(previousVolumeRef.current);
      setIsMuted(false);
    } else {
      // 静音
      audioRef.current.volume = 0;
      setVolumeState(0);
      setIsMuted(true);
    }
  }, [isMuted]);

  // 格式化时间显示（支持毫秒和秒两种格式）
  const formatTime = useCallback((time: number): string => {
    if (isNaN(time) || time < 0) return '0:00';

    // 检测是否为毫秒（大于10000认为是毫秒）
    const timeInSeconds = time > 10000 ? time / 1000 : time;

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    // 状态
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    musicList,
    isLoading,
    playMode,

    // 方法
    togglePlay,
    playTrack,
    nextTrack,
    previousTrack,
    seekTo,
    setVolume,
    toggleMute,
    setPlayMode,
    refreshMusicList,

    // 工具方法
    formatTime,
  };
};
