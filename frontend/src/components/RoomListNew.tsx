import React, { useState } from 'react';
import { Room } from '../types';
import MusicPlayer from './MusicPlayer';
import { getBackendUrl } from '../services/apiConfig';

interface RoomListProps {
  rooms: Room[];
  onCreateRoom: (playerName: string, roomName: string) => void;
  onJoinRoom: (roomId: string, playerName: string, preferredColor?: 'black' | 'white') => void;
  onWatchRoom: (roomId: string, spectatorName: string) => void;
  onCloseRoom: (roomId: string) => void;
  onUpdateNickname: (newNickname: string) => void;
  loading: boolean;
  error?: string | null;
  playerName: string;
  playerSocketId?: string | null;
  isAdmin?: boolean;
  playerInfo?: {
    score: number;
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
  };
}

export const RoomListNew: React.FC<RoomListProps> = ({
  rooms,
  onCreateRoom,
  onJoinRoom,
  onWatchRoom,
  onCloseRoom,
  onUpdateNickname,
  loading,
  error,
  playerName,
  playerSocketId,
  isAdmin = false,
  playerInfo,
}) => {
  const hasPlayerName = playerName && playerName.trim() !== '';
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [favoriteMusic, setFavoriteMusic] = useState<any[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showPieceSelection, setShowPieceSelection] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isNewRoom, setIsNewRoom] = useState(false);

  const handleJoinRoom = (roomId: string, preferredColor?: 'black' | 'white') => {
    if (hasPlayerName) {
      onJoinRoom(roomId, playerName, preferredColor);
    }
  };

  const handleWatchRoom = (roomId: string) => {
    if (hasPlayerName) {
      onWatchRoom(roomId, playerName);
    }
  };

  const handleJoinClick = (roomId: string) => {
    // 通过 roomId 找到对应的房间
    const targetRoom = rooms.find(room => room.roomId === roomId);
    
    if (targetRoom && targetRoom.status === 'waiting' && targetRoom.playerCount < 2) {
      // 有可用房间，加入现有房间
      setSelectedRoomId(roomId);
      setSelectedRoom(targetRoom);
      setIsNewRoom(false);
      setShowPieceSelection(true);
    } else {
      // 没有可用房间，创建新房间（快速开始）
      setSelectedRoomId(null);
      setSelectedRoom(null);
      setIsNewRoom(true);
      setShowPieceSelection(true);
    }
  };

  const handlePieceSelect = (color: 'black' | 'white') => {
    // 检查颜色是否已被占用（仅在加入现有房间时检查）
    if (!isNewRoom && selectedRoom) {
      const isBlackOccupied = selectedRoom.blackPlayer;
      const isWhiteOccupied = selectedRoom.whitePlayer;
      if ((color === 'black' && isBlackOccupied) || (color === 'white' && isWhiteOccupied)) {
        // 颜色已被占用，不执行任何操作，但可以给出提示（可选）
        console.warn(`颜色 ${color} 已被占用`);
        // 可以在这里添加 alert 或 toast 提示
        const occupiedName = color === 'black' ? selectedRoom.blackPlayer?.name : selectedRoom.whitePlayer?.name;
        alert(`抱歉，${color === 'black' ? '黑棋' : '白棋'}已被 ${occupiedName || '其他玩家'} 占用，请选择其他颜色。`);
        return; // 提前返回，不执行后续操作
      }
    }
    
    if (isNewRoom) {
      // 创建新房间
      const defaultRoomName = `快速游戏-${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      onCreateRoom(playerName, defaultRoomName);
    } else if (selectedRoomId) {
      // 加入现有房间
      handleJoinRoom(selectedRoomId, color);
    }
    setShowPieceSelection(false);
    setSelectedRoomId(null);
    setSelectedRoom(null);
    setIsNewRoom(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 2 * 1024 * 1024) { // 限制2MB
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setCustomAvatar(base64);
        localStorage.setItem('gomoku_custom_avatar', base64);
      };
      reader.readAsDataURL(file);
    } else {
      alert('头像大小不能超过2MB');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleMouseEnter = () => {
    setShowDetails(true);
  };

  const handleNicknameClick = () => {
    const newNickname = prompt('请输入新的昵称:', playerName);
    if (newNickname && newNickname.trim() !== '' && newNickname.trim() !== playerName) {
      onUpdateNickname(newNickname.trim());
    }
  };

  const handleMouseLeave = () => {
    setShowDetails(false);
  };

  // 获取保存的自定义头像
  React.useEffect(() => {
    const savedAvatar = localStorage.getItem('gomoku_custom_avatar');
    if (savedAvatar) {
      setCustomAvatar(savedAvatar);
    }

    // 从后端API获取音乐列表并获取播放次数
    const loadFavoriteMusic = async () => {
      try {
        // 获取后端URL
        const backendUrl = getBackendUrl();

        // 从后端获取音乐列表
        const response = await fetch(`${backendUrl}/api/music/local?keyword=&limit=999`);
        const playlist = await response.json();

        if (Array.isArray(playlist)) {
          // 获取播放次数
          const savedPlayCounts = localStorage.getItem('music_player_play_counts');
          const playCounts = savedPlayCounts ? JSON.parse(savedPlayCounts) : {};

          // 为每首音乐添加播放次数（默认为0）
          const musicWithPlayCounts = playlist.map((music: any) => ({
            ...music,
            playCount: playCounts[music.id] || 0
          }));

          // 过滤出播放次数≥1的歌曲，按播放次数降序排序，取前10首
          const top10 = musicWithPlayCounts
            .filter((music: any) => music.playCount >= 1)
            .sort((a: any, b: any) => b.playCount - a.playCount)
            .slice(0, 10);

          setFavoriteMusic(top10);
        }
      } catch (e) {
        console.error('Failed to load favorite music:', e);
      }
    };

    // 初始加载
    loadFavoriteMusic();

    // 监听localStorage变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'music_player_play_counts') {
        loadFavoriteMusic();
      }
    };

    // 定期刷新播放次数（每5秒）
    const intervalId = setInterval(() => {
      loadFavoriteMusic();
    }, 5000);

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  const displayAvatar = customAvatar || '👤';
  const isAvatarImage = customAvatar !== null;

  return (
    <>
      {/* Error Message */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          backgroundColor: 'rgba(248, 113, 113, 0.9)',
          color: 'white',
          borderRadius: '10px',
          fontSize: '14px',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
        }}>
          {error}
        </div>
      )}

      {/* Glass Card Container */}
      <div className="glass-card-container">
        {/* Personal Profile Card */}
        {playerInfo && (
          <div
            className="glass-card profile-card"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="glass-card-content">
              {/* 头像和基本信息（常驻显示） */}
              <div className="profile-basic-info">
                <div
                  className="profile-avatar"
                  onClick={handleAvatarClick}
                  title="点击更换头像"
                >
                  {isAvatarImage ? (
                    <img src={customAvatar} alt="玩家头像" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    displayAvatar
                  )}
                </div>
                <h3 className="profile-name">{playerName}</h3>
                <p className="profile-role">在线玩家</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />

              {/* 详细信息（悬停显示） */}
              <div className={`profile-details ${showDetails ? 'show' : 'hide'}`}>
                <button
                  className="change-avatar-button"
                  onClick={handleAvatarClick}
                  title="更改头像"
                >
                  更改头像
                </button>

                <button
                  className="change-nickname-button"
                  onClick={handleNicknameClick}
                  title="修改昵称"
                >
                  修改昵称
                </button>

                <div className="profile-stats">
                  <div className="profile-stat">
                    <div className="profile-stat-value">{playerInfo.score}</div>
                    <div className="profile-stat-label">积分</div>
                  </div>
                  <div className="profile-stat">
                    <div className="profile-stat-value">{playerInfo.totalGames}</div>
                    <div className="profile-stat-label">对局</div>
                  </div>
                  <div className="profile-stat">
                    <div className="profile-stat-value">{playerInfo.wins}</div>
                    <div className="profile-stat-label">胜</div>
                  </div>
                  <div className="profile-stat">
                    <div className="profile-stat-value">{playerInfo.losses}</div>
                    <div className="profile-stat-label">负</div>
                  </div>
                </div>

                {/* 常听音乐 */}
                <div className="profile-favorite-music">
                  <h4 className="favorite-music-title">常听音乐</h4>
                  {favoriteMusic.length > 0 && (
                    <div className="favorite-music-list">
                      {favoriteMusic.map((music: any, index: number) => (
                        <div key={index} className="favorite-music-item">
                          <span className="music-index">{index + 1}</span>
                          <div className="music-info">
                            <div className="music-name">{music.title || '未知曲目'}</div>
                            <div className="music-artist">{music.artist || '未知歌手'}</div>
                          </div>
                          <span className="music-play-count">{music.playCount}次</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Gomoku Room Card */}
        <div className="glass-card gomoku-room-card">
          {/* Default layer: always visible */}
          <div className="card-default">
            <div className="card-default-title">五子棋</div>
            <div className="card-default-subtitle">天王山之战</div>
          </div>
        
          {/* Hover layer: shows on hover */}
          <div className="card-hover">
            <div className="card-hover-content">
              <div className="card-rules">
                <h4>对战规则</h4>
                <ul>
                  <li>黑方先行，轮流落子</li>
                  <li>率先连成五子者获胜</li>
                  <li>棋盘大小为15×15</li>
                  <li>禁止长连（六子或以上）</li>
                </ul>
              </div>


        
              <div className="card-actions">
                <button
                  onClick={() => handleJoinClick(rooms && rooms.length > 0 ? rooms[0].roomId : '')}
                  disabled={loading || !hasPlayerName}
                  className="glass-card-button join-button"
                >
                  进入房间
                </button>
                <button
                  onClick={() => handleWatchRoom(rooms && rooms.length > 0 ? rooms[0].roomId : '')}
                  disabled={loading || !rooms || rooms.length === 0}
                  className="glass-card-button watch-button"
                >
                  观战
                </button>
              </div>
              

            </div>
          </div>
        </div>


        {/* Piece Selection Modal */}
        {showPieceSelection && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h3 style={{ fontSize: '28px', color: '#333', marginBottom: '20px' }}>选择棋子颜色</h3>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
                {isNewRoom ? '创建新房间，请选择您的棋子颜色' : '请选择您想执黑棋还是白棋'}
              </p>
              
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '30px' }}>
                {/* 黑棋按钮 */}
                {(() => {
                  const isOccupied = !!(selectedRoom && selectedRoom.blackPlayer);
                  const occupiedByName = selectedRoom?.blackPlayer?.name || '';
                  const isDisabled = !isNewRoom && isOccupied;
                  return (
                    <button
                      onClick={() => !isDisabled && handlePieceSelect('black')}
                      disabled={isDisabled}
                      style={{
                        flex: 1,
                        padding: '15px',
                        background: isDisabled 
                          ? 'linear-gradient(135deg, #666 0%, #888 100%)'
                          : 'linear-gradient(135deg, #333 0%, #555 100%)',
                        color: isDisabled ? '#ccc' : 'white',
                        border: 'none',
                        borderRadius: '15px',
                        fontSize: '18px',
                        fontWeight: '600',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.3s ease',
                        whiteSpace: 'nowrap',
                        opacity: isDisabled ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
                        }
                      }}
                    >
                      ⚫ 黑棋 (先手)
                      {isOccupied && <div style={{ fontSize: '12px', marginTop: '5px', color: '#ff9999' }}>已被 {occupiedByName} 占用</div>}
                    </button>
                  );
                })()}
                
                {/* 白棋按钮 */}
                {(() => {
                  const isOccupied = !!(selectedRoom && selectedRoom.whitePlayer);
                  const occupiedByName = selectedRoom?.whitePlayer?.name || '';
                  const isDisabled = !isNewRoom && isOccupied;
                  return (
                    <button
                      onClick={() => !isDisabled && handlePieceSelect('white')}
                      disabled={isDisabled}
                      style={{
                        flex: 1,
                        padding: '15px',
                        background: isDisabled
                          ? 'linear-gradient(135deg, #ddd 0%, #ccc 100%)'
                          : 'linear-gradient(135deg, #fff 0%, #eee 100%)',
                        color: isDisabled ? '#aaa' : '#333',
                        border: 'none',
                        borderRadius: '15px',
                        fontSize: '18px',
                        fontWeight: '600',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.3s ease',
                        whiteSpace: 'nowrap',
                        opacity: isDisabled ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
                        }
                      }}
                    >
                      ⚪ 白棋 (后手)
                      {isOccupied && <div style={{ fontSize: '12px', marginTop: '5px', color: '#ff9999' }}>已被 {occupiedByName} 占用</div>}
                    </button>
                  );
                })()}
              </div>
              
              <button
                onClick={() => {
                  setShowPieceSelection(false);
                  setSelectedRoomId(null);
                  setSelectedRoom(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#666',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Music Player Card */}
        <div className="glass-card music-player-card">
          <div className="glass-card-content" style={{ transform: 'translateY(0)', opacity: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <MusicPlayer />
          </div>
        </div>
      </div>
    </>
  );
};
