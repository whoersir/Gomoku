import React, { useState, useEffect } from 'react';

interface PlayerNameModalProps {
  isOpen: boolean;
  mode: 'join' | 'watch' | 'create';
  onClose: () => void;
  onConfirm: (name: string, roomName?: string) => void;
  loading?: boolean;
  showPlayerName?: boolean; // 是否显示玩家昵称输入框
  initialPlayerName?: string; // 初始昵称（从 ConnectDialog 传入）
}

export const PlayerNameModal: React.FC<PlayerNameModalProps> = ({
  isOpen,
  mode,
  onClose,
  onConfirm,
  loading = false,
  showPlayerName = true, // 默认显示昵称输入框
  initialPlayerName = '', // 初始昵称
}) => {
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');

  // Reset input when modal opens
  useEffect(() => {
    if (isOpen) {
      setPlayerName(showPlayerName ? '' : initialPlayerName); // 如果不显示昵称输入框，使用初始昵称
      setRoomName('');
    }
  }, [isOpen, showPlayerName, initialPlayerName]);

  const handleConfirm = () => {
    const name = showPlayerName ? playerName.trim() : initialPlayerName;

    if (name) {
      if (mode === 'create' && !roomName.trim()) {
        return; // 房间名称不能为空
      }
      onConfirm(name, mode === 'create' ? roomName.trim() : undefined);
      if (showPlayerName) {
        setPlayerName('');
      }
      setRoomName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  const titles = {
    join: '加入房间',
    watch: '观战房间',
    create: '创建房间',
  };

  const placeholders = showPlayerName
    ? {
        join: '输入你的昵称加入房间...',
        watch: '输入你的昵称开始观战...',
        create: '输入你的昵称创建房间...',
      }
    : {
        join: '加入房间',
        watch: '开始观战',
        create: '创建房间',
      };

  const buttonLabels = {
    join: '加入房间',
    watch: '开始观战',
    create: '创建房间',
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="card-base max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-300">
        <h2 className="text-2xl font-bold mb-4">{titles[mode]}</h2>

        {mode === 'create' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">房间名称</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入房间名称..."
              className="input-base w-full"
              maxLength={30}
              autoFocus={!showPlayerName}
            />
          </div>
        )}

        {showPlayerName && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">玩家昵称</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholders[mode]}
              className="input-base w-full"
              maxLength={20}
              autoFocus={mode !== 'create'}
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-secondary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              (showPlayerName && !playerName.trim()) ||
              (mode === 'create' && !roomName.trim()) ||
              loading
            }
            className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : buttonLabels[mode]}
          </button>
        </div>
      </div>
    </div>
  );
};
