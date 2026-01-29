import { MusicTrack } from '../types/musicTypes';
import { vi } from 'vitest';

/**
 * Mock 音乐数据
 */
export const mockMusicTrack: MusicTrack = {
  id: 'track-1',
  title: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  duration: 180000, // 3分钟，单位毫秒
  url: 'https://example.com/music/test.mp3',
  cover: 'https://picsum.photos/256/256',
};

export const mockMusicTracks: MusicTrack[] = [
  {
    id: 'track-1',
    title: 'Song 1',
    artist: 'Artist A',
    album: 'Album A',
    duration: 180000,
    url: 'https://example.com/music/1.mp3',
    cover: 'https://picsum.photos/256/256',
  },
  {
    id: 'track-2',
    title: 'Song 2',
    artist: 'Artist B',
    album: 'Album B',
    duration: 240000,
    url: 'https://example.com/music/2.mp3',
    cover: 'https://picsum.photos/256/256',
  },
  {
    id: 'track-3',
    title: 'Song 3',
    artist: 'Artist A',
    album: 'Album A',
    duration: 200000,
    url: 'https://example.com/music/3.mp3',
    cover: 'https://picsum.photos/256/256',
  },
];

/**
 * Mock useMusicPlayer hook 返回值
 */
export const mockUseMusicPlayer = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  musicList: mockMusicTracks,
  isLoading: false,
  playMode: 'sequential' as const,
  togglePlay: vi.fn(),
  playTrack: vi.fn(),
  nextTrack: vi.fn(),
  previousTrack: vi.fn(),
  seekTo: vi.fn(),
  setVolume: vi.fn(),
  toggleMute: vi.fn(),
  setPlayMode: vi.fn(),
  refreshMusicList: vi.fn().mockResolvedValue(undefined),
  formatTime: (time: number) => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },
};

/**
 * Mock useFavorites hook 返回值
 */
export const mockUseFavorites = {
  favorites: ['track-1'],
  favoritesCount: 1,
  toggleFavorite: vi.fn(),
  isFavorite: vi.fn((id: string) => id === 'track-1'),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
};
