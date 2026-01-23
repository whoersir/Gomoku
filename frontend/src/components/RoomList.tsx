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
      <div className="w-full max-w-4xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-danger/20 border border-danger rounded text-danger">
            <div className="font-semibold">❌ 错误</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        )}

        {/* Create Room Button */}
        <div className="mb-6">
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '创建中...' : '➕ 创建新房间'}
          </button>
        </div>

        {/* Room List */}
        <div>
          <h2 className="text-lg font-semibold mb-3">可用房间</h2>
          {loading ? (
            <div className="text-center text-dark-text-tertiary py-8">加载中...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center text-dark-text-tertiary py-8">暂无可用房间</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.roomId}
                  className={`card-base cursor-pointer transition-all hover:border-primary ${
                    selectedRoomId === room.roomId
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-dark-bg-tertiary'
                  }`}
                  onClick={() => setSelectedRoomId(room.roomId)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold">
                        {room.roomName || `房间 #${room.roomId}`}
                      </div>
                      <div className="text-xs text-dark-text-tertiary mt-1">
                        {new Date(room.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        room.status === 'waiting'
                          ? 'bg-secondary/20 text-secondary'
                          : room.status === 'playing'
                            ? 'bg-warning/20 text-warning'
                            : 'bg-danger/20 text-danger'
                      }`}
                    >
                      {room.status === 'waiting'
                        ? '等待中'
                        : room.status === 'playing'
                          ? '进行中'
                          : '已结束'}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm mb-3">
                    <div className="text-dark-text-secondary">
                      {room.blackPlayer
                        ? `黑棋: ${room.blackPlayer.name}`
                        : '黑棋: 等待玩家'}
                    </div>
                    <div className="text-dark-text-secondary">
                      {room.whitePlayer
                        ? `白棋: ${room.whitePlayer.name}`
                        : '白棋: 等待玩家'}
                    </div>
                    {room.spectatorCount !== undefined && room.spectatorCount > 0 && (
                      <div className="text-dark-text-tertiary text-xs">
                        👁️ {room.spectatorCount} 名观战者
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinRoom(room.roomId);
                      }}
                      disabled={room.playerCount >= 2 || loading}
                      className="btn-primary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {room.playerCount >= 2
                        ? '房间已满'
                        : loading
                          ? '处理中...'
                          : '加入房间'}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWatchRoom(room.roomId);
                      }}
                      disabled={loading}
                      className="btn-secondary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '处理中...' : '👁️ 实时观战'}
                    </button>

                    {/* Close Room Button - Visible to room owner or admin */}
                    {((room.blackPlayer && playerSocketId === room.blackPlayer.id) || isAdmin) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(`[RoomList] Close button clicked - roomId: ${room.roomId}, isAdmin: ${isAdmin}, playerSocketId: ${playerSocketId}`);
                          onCloseRoom(room.roomId);
                        }}
                        disabled={loading}
                        className="btn-danger w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? '关闭中...' : isAdmin ? '🔧 管理员关闭' : '🗑️ 关闭房间'}
                      </button>
                    )}
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
