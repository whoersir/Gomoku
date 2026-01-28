import React, { useState, useMemo, useRef } from 'react';
import { MusicTrack } from '../../types/musicTypes';
import { useMusicPlayer } from '../../hooks/useMusicPlayer';
import { useFavorites } from '../../hooks/useFavorites';
import { searchTracks } from '../../utils/musicUtils';
import { pinyin } from 'pinyin-pro';

interface AllSongsViewProps {
  tracks: MusicTrack[];
}

type SortBy = 'title' | 'artist' | 'album' | 'duration';

export const AllSongsView: React.FC<AllSongsViewProps> = ({ tracks }) => {
  const { playTrack, musicList, currentTrack, formatTime, refreshMusicList, isLoading } =
    useMusicPlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('title');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取歌曲的首字母（支持中文转拼音，按歌曲名）
  const getTrackFirstLetter = useMemo(() => {
    return (trackTitle: string): string => {
      if (!trackTitle) return '#';

      const firstChar = trackTitle.charAt(0);

      // 英文字母
      if (/[a-zA-Z]/.test(firstChar)) {
        return firstChar.toUpperCase();
      }

      // 数字
      if (/[0-9]/.test(firstChar)) {
        return '#';
      }

      // 中文转拼音首字母
      try {
        const pinyinResult = pinyin(firstChar);
        if (pinyinResult && typeof pinyinResult === 'string' && pinyinResult.length > 0) {
          const letter = pinyinResult.charAt(0).toUpperCase();
          if (/[A-Z]/.test(letter)) {
            return letter;
          }
        }
      } catch (error) {
        console.warn('拼音转换失败:', firstChar, error);
      }

      // 其他字符
      return '#';
    };
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = searchTracks(tracks, searchQuery);

    // 按字母筛选
    if (selectedLetter) {
      result = result.filter((track) => {
        const letter = getTrackFirstLetter(track.title);
        return letter === selectedLetter;
      });
    }

    // 排序
    result.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title, 'en');
        case 'artist':
          return a.artist.localeCompare(b.artist, 'en');
        case 'album':
          return a.album.localeCompare(b.album, 'en');
        case 'duration':
          return (a.duration || 0) - (b.duration || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [tracks, searchQuery, sortBy, selectedLetter, getTrackFirstLetter]);

  const handlePlayTrack = (track: MusicTrack) => {
    const index = musicList.findIndex((t) => t.id === track.id);
    if (index !== -1) {
      playTrack(index);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMusicList();
    // 延迟隐藏提示，让用户看到刷新完成的消息
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // 计算所有存在的字母
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    const allTracks = searchTracks(tracks, '');
    allTracks.forEach((track) => {
      const letter = getTrackFirstLetter(track.title);
      letters.add(letter);
    });
    // 排序：A-Z 在前，# 在最后
    const sortedLetters = Array.from(letters).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });
    return sortedLetters;
  }, [tracks, getTrackFirstLetter]);

  // 处理字母筛选
  const handleLetterSelect = (letter: string | null) => {
    setSelectedLetter(letter);
    // 如果是点击"全部"，滚动到顶部
    if (letter === null && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 搜索时清除字母筛选
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      setSelectedLetter(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 搜索和排序栏 */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="搜索歌曲名、艺术家或专辑..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLetter(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
        >
          <option value="title">按歌名</option>
          <option value="artist">按艺术家</option>
          <option value="album">按专辑</option>
          <option value="duration">按时长</option>
        </select>
      </div>

      {/* 结果计数和刷新按钮 */}
      <div className="text-sm text-gray-400 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          共 <span className="text-white font-semibold">{filteredAndSorted.length}</span> 首歌曲
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white/70 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="w-3 h-3 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.2 12.2A4 4 0 0 1 4 12 4 4 0 0 1 4.2 12.2z" />
              </svg>
              刷新中
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              刷新
            </>
          )}
        </button>
      </div>

      {/* 横向导航栏 */}
      <div className="flex flex-wrap gap-1 py-2 px-1 mb-3">
        <button
          onClick={() => handleLetterSelect(null)}
          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
            selectedLetter === null
              ? 'bg-blue-500 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          全部
        </button>
        {availableLetters.map((letter) => (
          <button
            key={letter}
            onClick={() => handleLetterSelect(letter)}
            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              selectedLetter === letter
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* 刷新提示 */}
      {isRefreshing && (
        <div className="mb-3 px-4 py-3 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-400 animate-spin"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M4.2 12.2A4 4 0 0 1 4 12 4 4 0 0 1 4.2 12.2z" />
          </svg>
          <span className="text-sm text-blue-400">音乐库更新中，请等待......</span>
        </div>
      )}

      {/* 歌曲列表 */}
      {filteredAndSorted.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-12 h-12 text-gray-600 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-400">未找到匹配的歌曲</p>
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="flex-1 overflow-y-auto space-y-1">
          {filteredAndSorted.map((track, index) => {
            const isPlaying = currentTrack?.id === track.id;
            const favorite = isFavorite(track.id);

            return (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(track)}
                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors group cursor-pointer ${
                  isPlaying ? 'bg-blue-500/20' : 'hover:bg-white/10'
                }`}
              >
                {/* 播放状态指示 */}
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs ${
                    isPlaying ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {isPlaying ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* 专辑封面 */}
                <img
                  src={track.cover || 'https://picsum.photos/40/40'}
                  alt={track.title}
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = 'https://picsum.photos/40/40';
                  }}
                />

                {/* 歌曲信息 */}
                <div className="flex-1 min-w-0 text-left">
                  <p
                    className={`font-medium truncate text-sm ${isPlaying ? 'text-blue-400' : 'text-white'}`}
                  >
                    {track.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                </div>

                {/* 时长 */}
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {formatTime(track.duration || 0)}
                </div>

                {/* 收藏按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(track.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    className={`w-4 h-4 transition-colors ${
                      favorite ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                    fill={favorite ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
