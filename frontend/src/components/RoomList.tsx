import React, { useState } from 'react';
import { Room } from '../types';
import { PlayerNameModal } from './PlayerNameModal';

interface RoomListProps {
  rooms: Room[];
  onCreateRoom: (playerName: string, roomName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  onWatchRoom: (roomId: string, spectatorName: string) => void;
  onCloseRoom: (roomId: string) => void;
  loading: boolean;
  error?: string | null;
  playerName: string;
  playerSocketId?: string | null;
  isAdmin?: boolean;
}

export const RoomList: React.FC<RoomListProps> = ({
  rooms,
  onCreateRoom,
  onJoinRoom,
  onWatchRoom,
  onCloseRoom,
  loading,
  error,
  playerName,
  playerSocketId,
  isAdmin = false,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'join' | 'watch' | 'create'>('join');
  const hasPlayerName = playerName && playerName.trim() !== '';

  const handleCreateRoom = async () => {
    if (hasPlayerName) {
      setModalMode('create');
      setModalOpen(true);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    if (hasPlayerName) {
      // 直接加入，不需要输入昵称
      onJoinRoom(roomId, playerName);
    }
  };

  const handleWatchRoom = (roomId: string) => {
    if (hasPlayerName) {
      // 直接观战，不需要输入昵称
      onWatchRoom(roomId, playerName);
    }
  };

  const handleModalConfirm = (playerName: string, roomName?: string) => {
    setModalOpen(false);

    if (modalMode === 'create' && roomName) {
      onCreateRoom(playerName, roomName);
      // Auto-join newly created room after a delay
      setTimeout(() => {
        if (rooms && rooms.length > 0 && rooms[0].playerCount === 1) {
          setSelectedRoomId(rooms[0].roomId);
        }
      }, 200);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  return (
    <>
      <div className="w-full max-w-6xl mx-auto px-4">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-danger/20 border border-danger rounded-lg text-danger">
            <div className="font-semibold">❌ 错误</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        )}

        {/* Create Room Button Section */}
        <div className="mb-8">
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="group relative w-full py-4 px-6 bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/90 
                       text-white font-semibold rounded-xl shadow-lg hover:shadow-xl 
                       transition-all duration-300 transform hover:scale-[1.01] 
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                       border border-primary/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                        -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">✨</span>
              <span className="text-lg">{loading ? '创建中...' : '创建新房间'}</span>
              <span className="text-2xl">🎮</span>
            </div>
          </button>
        </div>

        {/* Room List Header */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span>🏠</span>
            <span>可用房间</span>
            {!loading && rooms.length > 0 && (
              <span className="text-sm font-normal text-dark-text-tertiary bg-dark-bg-tertiary px-3 py-1 rounded-full">
                {rooms.length} 个
              </span>
            )}
          </h2>
        </div>

        {/* Room List */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4"></div>
              <div className="text-dark-text-tertiary">正在加载房间列表...</div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎯</div>
              <div className="text-dark-text-secondary text-lg mb-2">暂无可用房间</div>
              <div className="text-dark-text-tertiary text-sm">点击上方按钮创建一个新房间开始游戏</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {rooms.map((room) => (
                <div
                  key={room.roomId}
                  className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                    selectedRoomId === room.roomId
                      ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'border-dark-border bg-dark-bg-secondary hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.01]'
                  }`}
                >
                  {/* Status Badge */}
                  <div
                    className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                      room.status === 'waiting'
                        ? 'bg-success/80 text-white'
                        : room.status === 'playing'
                          ? 'bg-warning/80 text-white'
                          : 'bg-danger/80 text-white'
                    }`}
                  >
                    {room.status === 'waiting'
                      ? '⏳ 等待中'
                      : room.status === 'playing'
                        ? '🎮 进行中'
                        : '🏁 已结束'}
                  </div>

                  {/* Room Info */}
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="text-xl font-bold text-white mb-2 pr-16">
                        {room.roomName || `房间 #${room.roomId}`}
                      </div>
                      <div className="text-xs text-dark-text-tertiary flex items-center gap-2">
                        <span>🕐</span>
                        <span>{new Date(room.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Players Info */}
                    <div className="space-y-2 mb-5">
                      <div className={`flex items-center gap-2 p-2 rounded-lg ${
                        room.blackPlayer
                          ? 'bg-dark-bg-tertiary'
                          : 'bg-dark-bg-tertiary/50 opacity-60'
                      }`}>
                        <span className="text-lg">⚫</span>
                        <span className="text-sm text-dark-text-secondary">
                          {room.blackPlayer
                            ? room.blackPlayer.name
                            : '等待玩家加入...'}
                        </span>
                      </div>
                      <div className={`flex items-center gap-2 p-2 rounded-lg ${
                        room.whitePlayer
                          ? 'bg-dark-bg-tertiary'
                          : 'bg-dark-bg-tertiary/50 opacity-60'
                      }`}>
                        <span className="text-lg">⚪</span>
                        <span className="text-sm text-dark-text-secondary">
                          {room.whitePlayer
                            ? room.whitePlayer.name
                            : '等待玩家加入...'}
                        </span>
                      </div>
                      {room.spectatorCount !== undefined && room.spectatorCount > 0 && (
                        <div className="text-dark-text-tertiary text-xs flex items-center gap-1">
                          <span>👁️</span>
                          <span>{room.spectatorCount} 名观战者</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleJoinRoom(room.roomId)}
                        disabled={room.playerCount >= 2 || loading}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-primary/90 to-primary 
                                   hover:from-primary hover:to-primary/95
                                   text-white font-semibold rounded-lg
                                   transition-all duration-200 
                                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-primary/90
                                   flex items-center justify-center gap-2"
                      >
                        <span>🚪</span>
                        <span>{room.playerCount >= 2 ? '房间已满' : '加入房间'}</span>
                      </button>

                      <button
                        onClick={() => handleWatchRoom(room.roomId)}
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-secondary/90 to-secondary 
                                   hover:from-secondary hover:to-secondary/95
                                   text-white font-semibold rounded-lg
                                   transition-all duration-200 
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   flex items-center justify-center gap-2"
                      >
                        <span>👁️</span>
                        <span>实时观战</span>
                      </button>

                      {/* Close Room Button */}
                      {((room.blackPlayer && playerSocketId === room.blackPlayer.id) || isAdmin) && (
                        <button
                          onClick={() => {
                            console.log(`[RoomList] Close button clicked - roomId: ${room.roomId}`);
                            onCloseRoom(room.roomId);
                          }}
                          disabled={loading}
                          className="w-full py-2 px-4 bg-danger/10 hover:bg-danger/20
                                     text-danger font-semibold rounded-lg
                                     transition-all duration-200 border border-danger/30
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     flex items-center justify-center gap-2"
                        >
                          <span>{isAdmin ? '🔧' : '🗑️'}</span>
                          <span>{isAdmin ? '管理员关闭' : '关闭房间'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Player Name Modal */}
      <PlayerNameModal
        isOpen={modalOpen}
        mode={modalMode}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        loading={loading}
        showPlayerName={false}
        initialPlayerName={playerName}
      />
    </>
  );
};
