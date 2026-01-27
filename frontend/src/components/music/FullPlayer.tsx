import React, { useState } from 'react';
import { useMusicPlayer } from '../../hooks/useMusicPlayer';
import { PlayerControls } from './PlayerControls';
import { MusicList } from './MusicList';
import { AllSongsView } from './AllSongsView';
import { ArtistView } from './ArtistView';
import { FavoriteView } from './FavoriteView';
import { useFavorites } from '../../hooks/useFavorites';

type LibraryViewMode = 'all' | 'artist' | 'favorite';
type PlayerViewMode = 'cover' | 'lyrics';

interface FullPlayerProps {
  onClose: () => void;
}

export const FullPlayer: React.FC<FullPlayerProps> = ({ onClose }) => {
  const { currentTrack, musicList, isLoading } = useMusicPlayer();

  const { favoritesCount } = useFavorites();
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [libraryViewMode, setLibraryViewMode] = useState<LibraryViewMode>('all');
  const [playerViewMode, setPlayerViewMode] = useState<PlayerViewMode>('cover');

  return (
    <>
      {/* 半透明遮罩背景 */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* 主容器 - 居中浮动 */}
      <div
        className="fixed flex flex-col rounded-3xl overflow-hidden shadow-2xl"
        style={{
          width: '90%',
          maxWidth: '1200px',
          height: '80vh',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000,
          background:
            'linear-gradient(135deg, rgba(45, 27, 105, 0.85) 0%, rgba(76, 29, 149, 0.85) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* 右上角关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-md border border-white/30 z-50 flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        {/* 主体内容 - 左右分屏 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧 - 播放视图（35%）*/}
          <div
            className="w-1/3 flex flex-col border-r border-white/10 overflow-y-auto"
            style={{
              background:
                'linear-gradient(135deg, rgba(45, 27, 105, 0.5) 0%, rgba(76, 29, 149, 0.5) 100%)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* 播放视图切换按钮 */}
            <div className="flex justify-center px-4 py-4 border-b border-white/10 flex-shrink-0">
              <div className="flex gap-2 bg-white/10 rounded-full p-1 backdrop-blur-md">
                <button
                  onClick={() => setPlayerViewMode('cover')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    playerViewMode === 'cover'
                      ? 'bg-white text-gray-900'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  封面
                </button>

                <button
                  onClick={() => setPlayerViewMode('lyrics')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    playerViewMode === 'lyrics'
                      ? 'bg-white text-gray-900'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  歌词
                </button>
              </div>
            </div>

            {/* 播放内容区 */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
              {isLoading ? (
                // 加载中状态
                <div className="text-center">
                  <div className="w-32 h-32 mb-6 bg-white/10 rounded-2xl flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-white/50 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8 0 018 8 0 018-8 0 018 8 0 018-8z"
                      ></path>
                    </svg>
                  </div>
                  <p className="text-white/70 text-xl">加载音乐中...</p>
                </div>
              ) : currentTrack ? (
                // 有音乐时显示
                <>
                  {playerViewMode === 'cover' ? (
                    <>
                      {/* 专辑封面 */}
                      <div className="w-48 h-48 mb-6 rounded-2xl shadow-2xl overflow-hidden flex-shrink-0">
                        <img
                          src={currentTrack.cover || 'https://picsum.photos/256/256'}
                          alt={currentTrack.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://picsum.photos/256/256';
                          }}
                        />
                      </div>

                      {/* 歌曲信息 */}
                      <div className="text-center mb-8 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-white mb-2 truncate px-2">
                          {currentTrack.title}
                        </h2>
                        <p className="text-gray-400 text-base truncate px-2">
                          {currentTrack.artist}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* 歌词视图 */}
                      <div className="text-center px-4">
                        <h2 className="text-2xl font-bold text-white mb-4 truncate px-2">
                          {currentTrack.title}
                        </h2>
                        <p className="text-gray-400 text-base mb-8 truncate px-2">
                          {currentTrack.artist}
                        </p>
                        <div className="text-white/70 text-sm leading-loose max-h-64 overflow-y-auto">
                          <p className="mb-4">歌词功能开发中...</p>
                          <p className="text-white/50">敬请期待</p>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                // 无音乐时显示
                <div className="text-center">
                  <div className="w-32 h-32 mb-6 bg-white/10 rounded-2xl flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-white/50"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V3h-2z" />
                    </svg>
                  </div>
                  <p className="text-white/70 text-xl">暂无音乐</p>
                  <p className="text-white/50 text-sm mt-2">请稍后刷新</p>
                </div>
              )}
            </div>

            {/* 播放控制 - 固定在下方 */}
            <div className="flex-shrink-0 border-t border-white/10 px-4 py-4 flex flex-col gap-3">
              {/* 播放控制器 */}
              <div className="bg-white/5 rounded-lg p-3">
                <PlayerControls />
              </div>

              {/* 播放列表切换按钮 */}
              {currentTrack && (
                <button
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                  </svg>
                  <span>{showPlaylist ? '隐藏' : '显示'}列表</span>
                </button>
              )}

              {/* 播放列表 */}
              {showPlaylist && currentTrack && (
                <div className="max-h-40 overflow-y-auto">
                  <MusicList />
                </div>
              )}
            </div>
          </div>

          {/* 右侧 - 曲库视图（65%） */}
          <div
            className="w-2/3 flex flex-col overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, rgba(76, 29, 149, 0.5) 0%, rgba(124, 58, 237, 0.5) 100%)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* 曲库标签栏 - 居中显示 */}
            <div className="flex justify-center px-4 py-4 border-b border-white/10 flex-shrink-0">
              <div className="flex gap-2 bg-white/10 rounded-full p-1 backdrop-blur-md">
                <button
                  onClick={() => setLibraryViewMode('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    libraryViewMode === 'all'
                      ? 'bg-white text-gray-900'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  全部歌曲
                </button>

                <button
                  onClick={() => setLibraryViewMode('artist')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    libraryViewMode === 'artist'
                      ? 'bg-white text-gray-900'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  歌手视图
                </button>

                <button
                  onClick={() => setLibraryViewMode('favorite')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                    libraryViewMode === 'favorite'
                      ? 'bg-white text-gray-900'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span>收藏音乐</span>
                  {favoritesCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {favoritesCount > 99 ? '99+' : favoritesCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* 曲库内容区 */}
            <div className="flex-1 overflow-hidden px-4 py-4">
              {libraryViewMode === 'all' && <AllSongsView tracks={musicList} />}
              {libraryViewMode === 'artist' && <ArtistView tracks={musicList} />}
              {libraryViewMode === 'favorite' && <FavoriteView tracks={musicList} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
