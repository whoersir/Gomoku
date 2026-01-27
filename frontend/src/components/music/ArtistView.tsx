import React, { useState, useMemo } from 'react';
import { MusicTrack } from '../../types/musicTypes';
import { useMusicPlayer } from '../../hooks/useMusicPlayer';
import { useFavorites } from '../../hooks/useFavorites';
import { groupTracksByArtist, getArtistColor } from '../../utils/musicUtils';

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

  const artistGroups = useMemo(() => {
    let result = groupTracksByArtist(tracks);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(group =>
        group.artist.toLowerCase().includes(query)
      );
    }

    return result;
  }, [tracks, searchQuery]);

  const handlePlayTrack = (track: MusicTrack) => {
    const index = musicList.findIndex(t => t.id === track.id);
    if (index !== -1) {
      playTrack(index);
    }
  };

  const handlePlayArtist = (artistGroup: ArtistGroup) => {
    if (artistGroup.tracks.length > 0) {
      handlePlayTrack(artistGroup.tracks[0]);
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
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
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

      {/* 艺术家列表 */}
      {artistGroups.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-400">未找到匹配的艺术家</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
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
                          onClick={() => handlePlayTrack(track)}
                          className={`w-full p-3 flex items-center gap-3 transition-colors group ${
                            isPlaying ? 'bg-blue-500/20' : 'hover:bg-white/10'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs ${
                            isPlaying ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
                          }`}>
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
                            <p className={`font-medium truncate text-sm ${isPlaying ? 'text-blue-400' : 'text-white'}`}>
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
