import React, { useState, useRef, useEffect } from 'react';
import './MusicPlayer.css';
import { getBackendUrl } from '../services/apiConfig';

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  url: string;
  cover?: string;
  hasCover?: boolean;
}

type PlayMode = 'sequential' | 'shuffle' | 'repeat' | 'loop';

const PLAY_MODES: { key: PlayMode; label: string; icon: string }[] = [
  { key: 'sequential', label: '顺序播放', icon: '🔁' },
  { key: 'shuffle', label: '乱序播放', icon: '🔀' },
  { key: 'loop', label: '列表循环', icon: '🔂' },
  { key: 'repeat', label: '单曲循环', icon: '🔁' }
];

const MusicPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const soundProgressRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('sequential');
  const [showSearchModal, setShowSearchModal] = useState(false);

  // 从localStorage加载播放器设置
  useEffect(() => {
    try {
      const savedVolume = localStorage.getItem('music_player_volume');
      const savedIsMuted = localStorage.getItem('music_player_is_muted');
      const savedPlayMode = localStorage.getItem('music_player_play_mode');

      if (savedVolume) setVolume(parseFloat(savedVolume));
      if (savedIsMuted) setIsMuted(savedIsMuted === 'true');
      if (savedPlayMode) {
        const mode = JSON.parse(savedPlayMode);
        setPlayMode(mode);
      }
      console.log('[音乐播放器] ✅ 成功加载播放器设置');
    } catch (e) {
      console.warn('[音乐播放器] ⚠️  加载播放器设置失败:', e);
    }
  }, []);

  // 保存播放器设置到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('music_player_volume', volume.toString());
      console.log(`[音乐播放器] 💾 音量已保存: ${Math.round(volume * 100)}%`);
    } catch (e) {
      console.warn('[音乐播放器] ⚠️  保存音量失败:', e);
    }
  }, [volume]);

  useEffect(() => {
    try {
      localStorage.setItem('music_player_is_muted', isMuted.toString());
      console.log(`[音乐播放器] 💾 静音状态已保存: ${isMuted ? '静音' : '正常'}`);
    } catch (e) {
      console.warn('[音乐播放器] ⚠️  保存静音状态失败:', e);
    }
  }, [isMuted]);

  useEffect(() => {
    try {
      localStorage.setItem('music_player_play_mode', JSON.stringify(playMode));
      const modeLabel = PLAY_MODES.find(m => m.key === playMode)?.label;
      console.log(`[音乐播放器] 💾 播放模式已保存: ${modeLabel}`);
    } catch (e) {
      console.warn('[音乐播放器] ⚠️  保存播放模式失败:', e);
    }
  }, [playMode]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [musicList, setMusicList] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendUrl, setBackendUrl] = useState('');
  // 洗牌播放队列和历史记录
  const [shuffleQueue, setShuffleQueue] = useState<number[]>([]);
  const [shuffleIndex, setShuffleIndex] = useState(0);
  const [playHistory, setPlayHistory] = useState<number[]>([]);
  const [isBuffering, setIsBuffering] = useState(false);
  // 进度条拖拽相关
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [dragCurrentTime, setDragCurrentTime] = useState(0);
  // 播放统计相关
  const [playStartTime, setPlayStartTime] = useState<number>(0);
  const [sessionPlayedTracks, setSessionPlayedTracks] = useState<Set<string>>(new Set());

  // 初始化后端URL和加载音乐列表
  useEffect(() => {
    const url = getBackendUrl();
    setBackendUrl(url);
    loadMusicList(url);
  }, []);

  // 确保audio元素使用正确的初始音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 从localStorage恢复最后播放的歌曲信息
  useEffect(() => {
    if (musicList.length === 0) return;

    try {
      const savedLastPlay = localStorage.getItem('music_player_last_play');
      if (savedLastPlay) {
        const { trackIndex, currentTime, isPlaying } = JSON.parse(savedLastPlay);

        // 确保存的索引在有效范围内
        if (trackIndex >= 0 && trackIndex < musicList.length) {
          setCurrentTrackIndex(trackIndex);
          setCurrentTime(currentTime);

          const track = musicList[trackIndex];
          console.log(`[音乐播放器] 🔄 恢复播放: ${track.title} - ${track.artist}`);

          if (audioRef.current) {
            const audioUrl = track.url.startsWith('/api') ? `${backendUrl}${track.url}` : track.url;
            audioRef.current.src = audioUrl;
            audioRef.current.volume = isMuted ? 0 : volume;

            // 设置播放位置
            audioRef.current.addEventListener('loadedmetadata', () => {
              if (audioRef.current) {
                audioRef.current.currentTime = currentTime;
                console.log(`[音乐播放器] ⏱️  恢复播放进度: ${formatTime(currentTime)}`);
                // 如果之前在播放，自动开始播放
                if (isPlaying) {
                  audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    console.log('[音乐播放器] ▶️  自动继续播放');
                  }).catch(err => {
                    console.log('[音乐播放器] ⚠️  浏览器阻止自动播放，需要手动点击播放');
                    setIsPlaying(false);
                  });
                }
              }
            }, { once: true });
          }
        }
      } else {
        console.log('[音乐播放器] ℹ️  未找到上次播放记录，从头开始播放');
      }
    } catch (e) {
      console.warn('[音乐播放器] ⚠️  恢复上次播放失败:', e);
    }
  }, [musicList, backendUrl]); // 移除 volume 和 isMuted 依赖，避免调整音量时重新加载音频

  // 保存最后播放的信息到localStorage
  useEffect(() => {
    if (musicList.length === 0) return;

    try {
      const lastPlayData = {
        trackIndex: currentTrackIndex,
        currentTime: currentTime,
        isPlaying: isPlaying,
        timestamp: Date.now()
      };
      localStorage.setItem('music_player_last_play', JSON.stringify(lastPlayData));
      const track = musicList[currentTrackIndex];
      console.log(`[音乐播放器] 💾 保存播放状态: ${track.title} - 进度: ${formatTime(currentTime)}`);
    } catch (e) {
      console.warn('[音乐播放器] ⚠️  保存播放状态失败:', e);
    }
  }, [currentTrackIndex, currentTime, isPlaying, musicList.length]);

  // 洗牌算法：Fisher-Yates 洗牌
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 生成洗牌队列
  const generateShuffleQueue = (currentIndex: number): number[] => {
    const indices = Array.from({ length: musicList.length }, (_, i) => i);
    // 移除当前索引，避免重复
    const filtered = indices.filter(i => i !== currentIndex);
    const shuffled = shuffleArray(filtered);
    // 将当前歌曲放在第一个位置
    return [currentIndex, ...shuffled];
  };

  // 更新洗牌队列
  const updateShuffleQueue = () => {
    if (musicList.length > 0) {
      const newQueue = generateShuffleQueue(currentTrackIndex);
      setShuffleQueue(newQueue);
      setShuffleIndex(0);
    }
  };

  // 添加到播放历史
  const addToHistory = (index: number) => {
    setPlayHistory(prev => {
      const newHistory = [index, ...prev.filter(i => i !== index)];
      // 最多保留50条历史记录
      return newHistory.slice(0, 50);
    });
  };

  // 加载音乐列表
  const loadMusicList = async (baseUrl: string) => {
    try {
      setLoading(true);
      console.log('[音乐播放器] 📡 正在加载音乐列表...');
      const response = await fetch(`${baseUrl}/api/music/local?keyword=&limit=999`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setMusicList(data);
        console.log(`[音乐播放器] ✅ 成功加载 ${data.length} 首歌曲`);
      } else {
        // 如果没有音乐，至少保留BGM
        setMusicList([{
          id: 'bgm',
          title: '背景音乐',
          artist: 'BGM',
          album: 'Default',
          duration: 0,
          url: '/BGM.wav',
          cover: '/room-bg.png'
        }]);
        console.log('[音乐播放器] ⚠️  未找到音乐，使用默认BGM');
      }
    } catch (error) {
      console.error('[音乐播放器] ❌ 加载音乐列表失败:', error);
      console.log('[音乐播放器] 🔄 使用默认BGM');
      // 加载失败时使用默认BGM
      setMusicList([{
        id: 'bgm',
        title: '背景音乐',
        artist: 'BGM',
        album: 'Default',
        duration: 0,
        url: '/BGM.wav',
        cover: '/room-bg.png'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // 防抖函数
  const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // 搜索缓存
  const searchCacheRef = useRef<Map<string, { data: MusicTrack[]; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  // 搜索音乐（带防抖和缓存）
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    console.log(`[音乐播放器] 🔍 搜索: "${query}"`);

    // 检查缓存
    const cached = searchCacheRef.current.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[音乐播放器] 💾 使用缓存结果 (${cached.data.length} 条)`);
      setSearchResults(cached.data);
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/music/local?keyword=${encodeURIComponent(query)}&limit=999`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setSearchResults(data);
        console.log(`[音乐播放器] ✅ 搜索完成: 找到 ${data.length} 首歌曲`);
        // 更新缓存
        searchCacheRef.current.set(query, { data, timestamp: Date.now() });
      } else {
        console.log('[音乐播放器] ⚠️  搜索结果格式错误');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('[音乐播放器] ❌ 搜索失败:', error);
      setSearchResults([]);
      // 显示错误提示
      alert('搜索失败，请稍后重试');
    }
  };

  // 防抖后的搜索函数
  const debouncedSearch = debounce(performSearch, 300);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const currentTrack = musicList[currentTrackIndex] || {
    id: 'bgm',
    title: '背景音乐',
    artist: 'BGM',
    album: 'Default',
    duration: 0,
    url: '/BGM.wav',
    cover: '/room-bg.png'
  };

  // 格式化时间显示
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // 播放音乐
  const playMusic = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      console.log(`[音乐播放器] ▶️  播放: ${currentTrack.title}`);
    }
  };

  // 暂停音乐
  const pauseMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      console.log(`[音乐播放器] ⏸️  暂停: ${currentTrack.title} (进度: ${formatTime(currentTime)})`);
    }
  };

  // 切换播放/暂停
  const togglePlayPause = () => {
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  };

  // 加载歌曲
  const setMusic = (index: number, autoPlay: boolean = true) => {
    if (index < 0 || index >= musicList.length) return;

    // 保存当前播放状态，用于错误恢复
    const previousIndex = currentTrackIndex;
    const previousTime = audioRef.current?.currentTime || 0;
    const wasPlaying = isPlaying;

    setCurrentTrackIndex(index);
    addToHistory(index);
    const track = musicList[index];

    console.log(`[音乐播放器] 🎵 切换歌曲: ${track.title} - ${track.artist}`);

    if (audioRef.current) {
      // 如果URL是相对路径（如/BGM.wav），直接使用
      // 如果是API路径（如/api/music/stream），使用后端URL
      const audioUrl = track.url.startsWith('/api') ? `${backendUrl}${track.url}` : track.url;

      // 先暂停当前播放，避免中断
      if (!audioRef.current.paused) {
        audioRef.current.pause();
      }

      // 设置新的音频源
      audioRef.current.src = audioUrl;
      // 重新设置音量和静音状态
      audioRef.current.volume = isMuted ? 0 : volume;

      if (autoPlay) {
        // 使用事件监听代替 setTimeout，并添加错误恢复
        audioRef.current.addEventListener('loadedmetadata', () => {
          playMusic();
        }, { once: true });

        // 如果加载失败，尝试恢复上一首歌
        audioRef.current.addEventListener('error', () => {
          console.log('[音乐播放器] ⚠️  新歌曲加载失败，恢复上一首');
          if (previousIndex !== index && audioRef.current) {
            // 恢复到上一首歌
            setCurrentTrackIndex(previousIndex);
            const previousTrack = musicList[previousIndex];
            const previousUrl = previousTrack.url.startsWith('/api') ?
              `${backendUrl}${previousTrack.url}` : previousTrack.url;
            audioRef.current.src = previousUrl;
            audioRef.current.volume = isMuted ? 0 : volume;

            // 恢复播放位置
            audioRef.current.addEventListener('loadedmetadata', () => {
              if (audioRef.current) {
                audioRef.current.currentTime = previousTime;
                if (wasPlaying) {
                  audioRef.current.play().catch(err => {
                    console.log('[音乐播放器] ⚠️  恢复播放失败:', err);
                  });
                }
              }
            }, { once: true });
          }
        }, { once: true });
      }
    }
  };

  // 上一首
  const previousMusic = () => {
    let newIndex: number;

    if (playMode === 'shuffle') {
      // 乱序播放：从洗牌队列中取上一首
      if (shuffleIndex > 0) {
        newIndex = shuffleQueue[shuffleIndex - 1];
        setShuffleIndex(shuffleIndex - 1);
      } else {
        // 队列第一首，重新洗牌
        const newQueue = generateShuffleQueue(currentTrackIndex);
        setShuffleQueue(newQueue);
        setShuffleIndex(newQueue.length - 1);
        newIndex = newQueue[newQueue.length - 1];
      }
    } else if (playMode === 'repeat') {
      // 单曲循环：保持在当前歌曲
      setMusic(currentTrackIndex);
      return;
    } else {
      // 顺序播放或列表循环：上一首
      if (playMode === 'loop' && currentTrackIndex === 0) {
        // 列表循环：最后一首
        newIndex = musicList.length - 1;
      } else if (currentTrackIndex === 0) {
        newIndex = musicList.length - 1;
      } else {
        newIndex = currentTrackIndex - 1;
      }
    }
    setMusic(newIndex);
  };

  // 下一首
  const nextMusic = () => {
    let newIndex: number;

    if (playMode === 'shuffle') {
      // 乱序播放：从洗牌队列中取下一首
      if (shuffleIndex < shuffleQueue.length - 1) {
        newIndex = shuffleQueue[shuffleIndex + 1];
        setShuffleIndex(shuffleIndex + 1);
      } else {
        // 队列已用完，重新洗牌
        const newQueue = generateShuffleQueue(currentTrackIndex);
        setShuffleQueue(newQueue);
        setShuffleIndex(1);
        newIndex = newQueue[1];
      }
    } else if (playMode === 'repeat') {
      // 单曲循环：保持在当前歌曲
      setMusic(currentTrackIndex);
      return;
    } else if (playMode === 'loop') {
      // 列表循环：下一首
      newIndex = currentTrackIndex === musicList.length - 1 ? 0 : currentTrackIndex + 1;
    } else {
      // 顺序播放：下一首，到最后一首停止
      newIndex = currentTrackIndex === musicList.length - 1 ? currentTrackIndex : currentTrackIndex + 1;
    }
    setMusic(newIndex);
  };

  // 选择搜索结果中的音乐
  const selectSearchResult = (track: MusicTrack) => {
    // 检查是否已经在musicList中
    const existingIndex = musicList.findIndex(m => m.id === track.id);

    if (existingIndex !== -1) {
      // 如果已存在，直接播放
      setMusic(existingIndex);
    } else {
      // 如果不存在，添加到列表并播放
      const newIndex = musicList.length;
      setMusicList([...musicList, track]);
      setCurrentTrackIndex(newIndex);

      if (audioRef.current) {
        const audioUrl = track.url.startsWith('/api') ? `${backendUrl}${track.url}` : track.url;
        audioRef.current.src = audioUrl;
        // 重新设置音量和静音状态
        audioRef.current.volume = isMuted ? 0 : volume;
        audioRef.current.addEventListener('loadedmetadata', () => {
          playMusic();
        }, { once: true });
      }
    }

    setShowSearchModal(false);
  };

  // 处理进度条点击和拖拽
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audioRef.current.currentTime = percentage * duration;
  };

  const handleProgressBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    setIsDraggingProgress(true);
    updateDragProgress(e);
  };

  const updateDragProgress = (e: MouseEvent | React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !soundProgressRef.current) return;
    const progressBar = soundProgressRef.current;
    const rect = progressBar.getBoundingClientRect();
    const x = (e as MouseEvent).clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    setDragCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingProgress) return;
    updateDragProgress(e);
  };

  // 处理音量调整
  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!soundProgressRef.current || !audioRef.current) return;
    const rect = soundProgressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    audioRef.current.volume = percentage;
    setVolume(percentage);
  };

  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingVolume(true);
    handleVolumeChange(e);
  };

  const handleVolumeMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingVolume) return;
    handleVolumeChange(e);
  };

  const handleVolumeMouseUp = () => {
    setIsDraggingVolume(false);
  };

  // 监听音频事件
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (!isDraggingProgress) {
        setCurrentTime(audio.currentTime);
      }
    };
    const updateDuration = () => {
      setDuration(audio.duration);
      setIsBuffering(false);
    };
    const handleEnded = () => {
      checkAndRecordPlay();
      nextMusic();
    };
    const handlePlay = () => {
      // 开始播放时记录开始时间
      setPlayStartTime(Date.now());
      setIsBuffering(false);
    };
    const handlePause = () => {
      checkAndRecordPlay();
      setIsBuffering(false);
    };
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    // 错误处理 - 确保播放不会中断
    const handleError = (e: Event) => {
      console.error('[音乐播放器] ❌ 音频错误:', e);
      console.log('[音乐播放器] 🔄 尝试自动恢复播放...');

      // 尝试重新加载当前音频
      if (audio.src && audio.error) {
        const wasPlaying = !audio.paused;
        const currentTime = audio.currentTime;

        // 重新加载音频
        audio.load();

        // 恢复播放位置和状态
        audio.addEventListener('canplay', () => {
          if (currentTime > 0) {
            audio.currentTime = currentTime;
          }
          if (wasPlaying) {
            audio.play().catch(err => {
              console.log('[音乐播放器] ⚠️  自动播放失败，需要手动操作:', err);
            });
          }
        }, { once: true });
      }
    };

    // 处理网络中断
    const handleStalled = () => {
      console.log('[音乐播放器] ⚠️  播放停滞，等待恢复...');
      setIsBuffering(true);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleStalled);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [currentTrackIndex, isDraggingProgress, playStartTime]);

  // 组件卸载前保存播放状态
  useEffect(() => {
    return () => {
      // 组件卸载时，确保保存当前播放状态
      if (audioRef.current && !audioRef.current.paused) {
        const currentTime = audioRef.current.currentTime;
        console.log(`[音乐播放器] 💾 组件卸载，保存播放状态: ${formatTime(currentTime)}`);

        try {
          const lastPlayData = {
            trackIndex: currentTrackIndex,
            currentTime: currentTime,
            isPlaying: true,
            timestamp: Date.now()
          };
          localStorage.setItem('music_player_last_play', JSON.stringify(lastPlayData));
        } catch (e) {
          console.warn('[音乐播放器] ⚠️  保存播放状态失败:', e);
        }
      }
    };
  }, [currentTrackIndex]);

  // 自动重试机制 - 当音频加载失败时自动重试
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    let retryCount = 0;
    const maxRetries = 3;

    const handleError = () => {
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`[音乐播放器] 🔄 自动重试加载 (${retryCount}/${maxRetries})...`);

        // 延迟重试
        setTimeout(() => {
          if (audio.src) {
            audio.load();
            if (isPlaying) {
              audio.play().catch(err => {
                console.log('[音乐播放器] ⚠️  重试播放失败:', err);
              });
            }
          }
        }, 1000 * retryCount); // 每次重试间隔递增
      } else {
        console.log('[音乐播放器] ❌ 已达到最大重试次数，停止重试');
      }
    };

    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('error', handleError);
    };
  }, [isPlaying, currentTrackIndex]);

  // 预加载下一首
  useEffect(() => {
    if (!audioRef.current || isDraggingProgress) return;

    const audio = audioRef.current;
    const currentTime = audio.currentTime;
    const duration = audio.duration;

    // 当播放超过50%时，预加载下一首
    if (duration > 0 && currentTime > duration * 0.5 && isPlaying) {
      let nextIndex: number;

      if (playMode === 'shuffle') {
        if (shuffleIndex < shuffleQueue.length - 1) {
          nextIndex = shuffleQueue[shuffleIndex + 1];
        } else {
          nextIndex = shuffleQueue[0];
        }
      } else if (playMode === 'repeat') {
        nextIndex = currentTrackIndex;
      } else if (playMode === 'loop') {
        nextIndex = currentTrackIndex === musicList.length - 1 ? 0 : currentTrackIndex + 1;
      } else {
        nextIndex = currentTrackIndex === musicList.length - 1 ? currentTrackIndex : currentTrackIndex + 1;
      }

      // 创建一个新的audio元素进行预加载
      if (nextIndex !== currentTrackIndex && nextIndex < musicList.length) {
        const nextTrack = musicList[nextIndex];
        const preloadAudio = new Audio();
        const audioUrl = nextTrack.url.startsWith('/api') ? `${backendUrl}${nextTrack.url}` : nextTrack.url;
        preloadAudio.src = audioUrl;
        preloadAudio.preload = 'auto';
      }
    }
  }, [currentTime, duration, isPlaying, playMode, shuffleIndex, shuffleQueue, currentTrackIndex]);

  // 只保存播放次数到localStorage，不保存完整的音乐列表（避免超出存储限制）
  // 音乐列表通过后端API获取，避免存储大量数据

  // 增加歌曲播放次数（智能统计：播放超过30秒才计入）
  const incrementPlayCount = (trackId: string) => {
    // 去重检查：同一首歌每次会话只统计一次
    if (sessionPlayedTracks.has(trackId)) {
      console.log(`[音乐播放器] ℹ️  歌曲本次会话已统计过: ${currentTrack.title}`);
      return;
    }

    try {
      const savedPlayCounts = localStorage.getItem('music_player_play_counts');
      const playCounts = savedPlayCounts ? JSON.parse(savedPlayCounts) : {};
      const count = (playCounts[trackId] || 0) + 1;
      playCounts[trackId] = count;
      localStorage.setItem('music_player_play_counts', JSON.stringify(playCounts));

      console.log(`[音乐播放器] 📊 播放次数已更新: ${currentTrack.title} (${count}次)`);

      // 添加到本次会话已播放记录
      setSessionPlayedTracks(prev => new Set([...prev, trackId]));
    } catch (e) {
      console.warn('[音乐播放器] ⚠️  更新播放次数失败:', e);
    }
  };

  // 检查并统计播放次数（播放超过30秒）
  const checkAndRecordPlay = () => {
    if (playStartTime > 0) {
      const playDuration = Date.now() - playStartTime;
      // 播放超过30秒才计入播放次数
      if (playDuration > 30000) {
        incrementPlayCount(currentTrack.id);
      }
      setPlayStartTime(0);
    }
  };

  // 监听全局鼠标事件用于音量拖动和进度条拖拽
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingVolume && soundProgressRef.current) {
        const rect = soundProgressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        if (audioRef.current) {
          audioRef.current.volume = percentage;
          setVolume(percentage);
        }
      }

      if (isDraggingProgress && audioRef.current) {
        const progressBar = document.querySelector('.player-progress-bar');
        if (progressBar) {
          const rect = progressBar.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percentage = Math.max(0, Math.min(1, x / rect.width));
          const newTime = percentage * duration;
          setDragCurrentTime(newTime);
          audioRef.current.currentTime = newTime;
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingVolume) {
        setIsDraggingVolume(false);
      }
      if (isDraggingProgress) {
        setIsDraggingProgress(false);
      }
    };

    if (isDraggingVolume || isDraggingProgress) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingVolume, isDraggingProgress, duration]);

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果用户正在输入框中输入，不触发快捷键
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (audioRef.current && duration > 0) {
            audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (audioRef.current) {
            const newVolume = Math.min(1, volume + 0.1);
            audioRef.current.volume = newVolume;
            setVolume(newVolume);
            setIsMuted(false);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (audioRef.current) {
            const newVolume = Math.max(0, volume - 0.1);
            audioRef.current.volume = newVolume;
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
          }
          break;
        case 'KeyM':
          e.preventDefault();
          setIsMuted(!isMuted);
          if (audioRef.current) {
            audioRef.current.volume = isMuted ? volume : 0;
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [volume, isMuted, duration, isPlaying]);

  return (
    <div className="music-player-wrapper">
      <audio
        ref={audioRef}
        src={currentTrack.url.startsWith('/api') ? `${backendUrl}${currentTrack.url}` : currentTrack.url}
      />
      <div className="music-player">
        {/* 顶部音量条 */}
        <div className="top-bar">
          <span 
            className="icon volume-icon"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "取消静音" : "静音"}
          >
            {isMuted ? '🔇' : '🔊'}
          </span>
          <div className="volume-container">
            <div
              className="progress-bar sound-progress-bar"
              ref={soundProgressRef}
              onMouseDown={handleVolumeMouseDown}
              onMouseMove={handleVolumeMouseMove}
              onMouseUp={handleVolumeMouseUp}
            >
              <span className="duration-bar sound-duration"></span>
              <span
                className="progress sound-progress"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              >
                <span className="round"></span>
              </span>
            </div>
            <span className="sound-volume-display">
              {isMuted ? '0' : Math.round(volume * 100)}%
            </span>
          </div>
        </div>
        {/* 搜索图标 - 独立右上角 */}
        <span 
          className="search-icon-container"
          onClick={() => setShowSearchModal(true)}
          title="搜索音乐"
        >
          🔍
        </span>

        {/* 音乐信息区 */}
        <div className="music-info">
          <div className="info-left">
            <img
              className="music-img"
              src={currentTrack.cover || '/room-bg.png'}
              alt={currentTrack.title}
            />
          </div>
          <div className="info-right">
            <div className="music-name">
              <span className="name">{currentTrack.title}</span>
              <span className="musician">{currentTrack.artist}</span>
            </div>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="playback-setting">
          <div className="play-mode-container">
            <span
              className="control-btn play-mode"
              onClick={() => {
                const currentIndex = PLAY_MODES.findIndex(m => m.key === playMode);
                const nextIndex = (currentIndex + 1) % PLAY_MODES.length;
                const newMode = PLAY_MODES[nextIndex].key;
                setPlayMode(newMode);
                // 切换到乱序模式时，生成洗牌队列
                if (newMode === 'shuffle') {
                  updateShuffleQueue();
                }
              }}
              title={PLAY_MODES.find(m => m.key === playMode)?.label}
            >
              {PLAY_MODES.find(m => m.key === playMode)?.icon}
            </span>
          </div>
          <span
            className="control-btn previous"
            onClick={previousMusic}
          >
            ⏮
          </span>
          {!isPlaying ? (
            <span 
              className="control-btn play-icon"
              onClick={togglePlayPause}
            >
              ▶
            </span>
          ) : (
            <span 
              className="control-btn pause-icon"
              onClick={togglePlayPause}
            >
              ⏸
            </span>
          )}
          <span 
            className="control-btn next"
            onClick={nextMusic}
          >
            ⏭
          </span>
        </div>

        {/* 播放进度条 */}
        <div className="progress-container">
          {isBuffering && <div className="buffering-indicator">⏳ 缓冲中...</div>}
          <div
            ref={progressBarRef}
            className={`player-progress-bar ${isDraggingProgress ? 'dragging' : ''}`}
            onClick={handleProgressBarClick}
            onMouseDown={handleProgressBarMouseDown}
            onMouseMove={handleProgressBarMouseMove}
          >
            <div className="progress-background"></div>
            <div
              className="progress-filled"
              style={{ width: duration ? `${((isDraggingProgress ? dragCurrentTime : currentTime) / duration) * 100}%` : '0%' }}
            ></div>
            <div
              className="progress-handle"
              style={{ left: duration ? `${((isDraggingProgress ? dragCurrentTime : currentTime) / duration) * 100}%` : '0%' }}
            ></div>
          </div>
          <div className="time-display">
            <span className="current-time">{formatTime(isDraggingProgress ? dragCurrentTime : currentTime)}</span>
            <span className="total-time">{duration ? formatTime(duration) : '00:00'}</span>
          </div>
        </div>
      </div>

      {/* 搜索音乐模态框 */}
      {showSearchModal && (
        <div className="search-modal-overlay" onClick={() => setShowSearchModal(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <h2>搜索音乐</h2>
              <button 
                className="close-btn"
                onClick={() => setShowSearchModal(false)}
              >
                ✕
              </button>
            </div>
            
            <input 
              type="text"
              className="search-input"
              placeholder="输入歌曲名或歌手..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
            
            <div className="search-results">
              {loading ? (
                <div className="no-results">正在加载音乐库...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((track) => (
                  <div
                    key={track.id}
                    className="search-result-item"
                    onClick={() => selectSearchResult(track)}
                  >
                    <div className="result-info">
                      <div className="result-name">{track.title}</div>
                      <div className="result-artist">{track.artist}</div>
                    </div>
                  </div>
                ))
              ) : searchQuery ? (
                <div className="no-results">未找到相关音乐</div>
              ) : (
                <div className="no-results">输入关键词开始搜索</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
