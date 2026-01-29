import React, { useState, useMemo, useRef } from 'react';
import { MusicTrack } from '../../types/musicTypes';
import { useMusicPlayer } from '../../contexts/MusicProvider';
import { useFavorites } from '../../hooks/useFavorites';
import { groupTracksByArtist, getArtistColor } from '../../utils/musicUtils';
import { pinyin } from 'pinyin-pro';

interface ArtistViewProps {
  tracks: MusicTrack[];
}

interface ArtistGroup {
  artist: string;
  tracks: MusicTrack[];
  count: number;
}

export const ArtistView: React.FC<ArtistViewProps> = ({ tracks }) => {
  const { playTrack, musicList, currentTrack, formatTime } = useMusicPlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取歌手的首字母（支持中文转拼音）
  const getArtistFirstLetter = useMemo(() => {
    return (artistName: string): string => {
      if (!artistName) return '#';

      const firstChar = artistName.charAt(0);

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
        // 转换单个字符的拼音
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

  // 计算所有存在的字母
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    const allGroups = groupTracksByArtist(tracks);
    allGroups.forEach((group) => {
      const letter = getArtistFirstLetter(group.artist);
      letters.add(letter);
    });
    // 排序：A-Z 在前，# 在最后
    const sortedLetters = Array.from(letters).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });
    return sortedLetters;
  }, [tracks, getArtistFirstLetter]);

  const artistGroups = useMemo(() => {
    let result = groupTracksByArtist(tracks);

    // 先按搜索框过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((group) => group.artist.toLowerCase().includes(query));
    }

    // 再按字母过滤
    if (selectedLetter) {
      result = result.filter((group) => {
        const letter = getArtistFirstLetter(group.artist);
        return letter === selectedLetter;
      });
    }

    return result;
  }, [tracks, searchQuery, selectedLetter]);

  const handlePlayTrack = (track: MusicTrack, e?: React.MouseEvent) => {
    e?.stopPropagation();

    // 使用传入的 tracks prop 来查找索引
    const index = tracks.findIndex((t) => t.id === track.id);

    // 如果在 tracks 中找不到，尝试在 musicList 中查找
    let musicListIndex = index;
    if (index === -1) {
      musicListIndex = musicList.findIndex((t) => t.id === track.id);
    }

    if (musicListIndex !== -1) {
      playTrack(musicListIndex);
    }
  };

  const handlePlayArtist = (artistGroup: ArtistGroup) => {
    if (artistGroup.tracks.length > 0) {
      handlePlayTrack(artistGroup.tracks[0]);
    }
  };

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
      {/* 搜索栏 */}
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="搜索艺术家..."
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

      {/* 结果计数 */}
      <div className="text-sm text-gray-400 mb-3">
        共 <span className="text-white font-semibold">{artistGroups.length}</span> 位艺术家
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

      {/* 艺术家列表 */}
      {artistGroups.length === 0 ? (
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
            <p className="text-gray-400">未找到匹配的艺术家</p>
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="flex-1 overflow-y-auto space-y-2">
          {artistGroups.map((group) => {
            const isExpanded = expandedArtist === group.artist;
            const artistColor = getArtistColor(group.artist);

            return (
              <div key={group.artist} className="border border-white/10 rounded-lg overflow-hidden">
                {/* 艺术家卡片 */}
                <button
                  onClick={() => setExpandedArtist(isExpanded ? null : group.artist)}
                  onDoubleClick={() => handlePlayArtist(group)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
                >
                  {/* 艺术家头像（颜色块） */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
                    style={{ backgroundColor: artistColor }}
                  >
                    {group.artist.charAt(0).toUpperCase()}
                  </div>

                  {/* 艺术家信息 */}
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="font-semibold text-white truncate">{group.artist}</h3>
                    <p className="text-sm text-gray-400">{group.count} 首歌曲</p>
                  </div>

                  {/* 展开箭头 */}
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>

                {/* 展开的歌曲列表 */}
                {isExpanded && (
                  <div className="border-t border-white/10 bg-white/5 divide-y divide-white/10">
                    {group.tracks.map((track, index) => {
                      const isPlaying = currentTrack?.id === track.id;
                      const favorite = isFavorite(track.id);

                      return (
                        <button
                          key={track.id}
                          onClick={(e) => handlePlayTrack(track, e)}
                          className={`w-full p-3 flex items-center gap-3 transition-colors group ${
                            isPlaying ? 'bg-blue-500/20' : 'hover:bg-white/10'
                          }`}
                        >
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

                          <img
                            src={track.cover || 'https://picsum.photos/32/32'}
                            alt={track.title}
                            className="w-8 h-8 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = 'https://picsum.photos/32/32';
                            }}
                          />

                          <div className="flex-1 min-w-0 text-left">
                            <p
                              className={`font-medium truncate text-sm ${isPlaying ? 'text-blue-400' : 'text-white'}`}
                            >
                              {track.title}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{track.album}</p>
                          </div>

                          <div className="text-xs text-gray-400 flex-shrink-0">
                            {formatTime(track.duration || 0)}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(track.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg
                              className={`w-4 h-4 transition-colors ${
                                favorite
                                  ? 'text-red-500 fill-red-500'
                                  : 'text-gray-400 hover:text-red-500'
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
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
