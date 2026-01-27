import { useState, useEffect } from 'react';
import { ConnectDialog } from './components/ConnectDialog';
import { GameBoard } from './components/GameBoard';
import { VictoryModal } from './components/VictoryModal';
// import { Leaderboard } from './components/Leaderboard'; // 不再在房间列表页面显示
// import { PlayerHistory } from './components/PlayerHistory'; // 不再在房间列表页面显示
import { LeftSidePanel } from './components/LeftSidePanel';
import { SpectatorPanel } from './components/SpectatorPanel';
import { RightSidePanel } from './components/RightSidePanel';
import MusicPlayer from './components/MusicPlayer';
import { useSocket } from './hooks/useSocket';
import { useGameState } from './hooks/useGameState';
import { RoomListNew } from './components/RoomListNew';
import { getBackendUrl } from './services/apiConfig';
// import { on, off } from './services/socketService';

type PageState = 'connect' | 'roomList' | 'game';

// localStorage keys
const STORAGE_KEYS = {
  SERVER_URL: 'gomoku_server_url',
  PLAYER_NAME: 'gomoku_player_name',
  PAGE_STATE: 'gomoku_page_state',
  ROOM_ID: 'gomoku_room_id',
  PLAYER_COLOR: 'gomoku_player_color',
  IS_SPECTATOR: 'gomoku_is_spectator',
  IS_ADMIN: 'gomoku_is_admin'
};

function App() {
  const [page, setPage] = useState<PageState>(() => {
    const savedPage = localStorage.getItem(STORAGE_KEYS.PAGE_STATE);
    return (savedPage as PageState) || 'connect';
  });
  const [loading, setLoading] = useState(false);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '');
  const [serverUrl, setServerUrl] = useState(() => {
    const savedUrl = localStorage.getItem(STORAGE_KEYS.SERVER_URL);
    // 如果保存的是内网地址，自动替换为动态地址
    if (savedUrl && (savedUrl.includes('10.75.31.37') || savedUrl.includes('localhost'))) {
      console.log('[App] Detected old local URL, using dynamic backend URL');
      localStorage.removeItem(STORAGE_KEYS.SERVER_URL);
      return '';
    }
    return savedUrl || '';
  });
  const [victoryModalVisible, setVictoryModalVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true');

  const socket = useSocket();
  const gameState = useGameState();

  const handleConnect = async (url: string, name: string) => {
    setLoading(true);
    try {
      await socket.connect(url);
      setLoading(false);
      setServerUrl(url);
      setPlayerName(name);

      // 自动判断管理员身份
      const ADMIN_ACCOUNTS = ['admin', 'administrator', '王香归'];
      const isAdminAccount = ADMIN_ACCOUNTS.includes(name.toLowerCase());
      setIsAdmin(isAdminAccount);
      localStorage.setItem(STORAGE_KEYS.IS_ADMIN, String(isAdminAccount));
      
      if (isAdminAccount) {
        console.log('[App] Admin login successful for account:', name);
      }

      // 保存到 localStorage
      localStorage.setItem(STORAGE_KEYS.SERVER_URL, url);
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
      localStorage.setItem(STORAGE_KEYS.PAGE_STATE, 'roomList');
      setPage('roomList');
    } catch (err) {
      setLoading(false);
      console.error('[App] Connection failed:', err);
    }
  };

  const handleJoinRoom = async (roomId: string, name: string, preferredColor?: 'black' | 'white') => {
    setLoading(true);
    setPlayerName(name);
    const result = await socket.joinRoom(roomId, name, preferredColor);
    setLoading(false);
    if (result) {
      gameState.joinedRoom(result.color, result.gameState);
      // 保存房间状态到 localStorage
      localStorage.setItem(STORAGE_KEYS.ROOM_ID, roomId);
      localStorage.setItem(STORAGE_KEYS.PLAYER_COLOR, String(result.color));
      localStorage.setItem(STORAGE_KEYS.IS_SPECTATOR, 'false');
      localStorage.setItem(STORAGE_KEYS.PAGE_STATE, 'game');
      setPage('game');
    } else {
      alert(socket.error || '房间不存在，请检查房间ID或创建新房间。');
    }
  };

  const handleCreateRoom = async (roomName: string, name: string) => {
    setLoading(true);
    setPlayerName(name);
    const result = await socket.createRoom(roomName, name);
    setLoading(false);
    if (result) {
      gameState.joinedRoom(result.color, null);
      // 保存房间状态到 localStorage
      localStorage.setItem(STORAGE_KEYS.ROOM_ID, result.roomId);
      localStorage.setItem(STORAGE_KEYS.PLAYER_COLOR, String(result.color));
      localStorage.setItem(STORAGE_KEYS.IS_SPECTATOR, 'false');
      localStorage.setItem(STORAGE_KEYS.PAGE_STATE, 'game');
      setPage('game');
    }
  };

  const handleWatchRoom = async (roomId: string, name: string) => {
    setLoading(true);
    setPlayerName(name);
    const result = await socket.watchRoom(roomId, name);
    setLoading(false);
    if (result) {
      gameState.watchingRoom(result.gameState);
      // 保存观战状态到 localStorage
      localStorage.setItem(STORAGE_KEYS.ROOM_ID, roomId);
      localStorage.setItem(STORAGE_KEYS.PLAYER_COLOR, '');
      localStorage.setItem(STORAGE_KEYS.IS_SPECTATOR, 'true');
      localStorage.setItem(STORAGE_KEYS.PAGE_STATE, 'game');
      setPage('game');
    }
  };

  const handleUpdateNickname = (newNickname: string) => {
    setPlayerName(newNickname);
    localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, newNickname);
  };

  const handleMove = async (x: number, y: number) => {
    console.log(`[App] Making move at (${x}, ${y}), playerColor:`, gameState.playerColor);
    if (gameState.gameState && gameState.playerColor) {
      console.log(`[App] Emitting move event to socket`);
      await socket.makeMove(gameState.gameState.roomId, x, y);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (gameState.gameState) {
      await socket.sendMessage(gameState.gameState.roomId, message);
    }
  };

  const handleBackToRoomList = async () => {
    // 通知服务器离开房间
    await socket.emit('leaveRoom', {});

    gameState.leaveRoom();
    // 清理房间状态
    localStorage.removeItem(STORAGE_KEYS.ROOM_ID);
    localStorage.removeItem(STORAGE_KEYS.PLAYER_COLOR);
    localStorage.removeItem(STORAGE_KEYS.IS_SPECTATOR);
    localStorage.setItem(STORAGE_KEYS.PAGE_STATE, 'roomList');
    setPage('roomList');

    // 立即刷新房间列表，确保UI更新（仅在socket连接时）
    if (socket.connected) {
      setTimeout(async () => {
        const rooms = await socket.getRoomList();
        console.log('[App] Room list refreshed after leaving:', rooms);
        gameState.updateRooms(rooms);
      }, 100);
    }
  };

  const handleDisconnect = () => {
    socket.disconnect();
    gameState.leaveRoom();
    // 清理所有 localStorage
    localStorage.removeItem(STORAGE_KEYS.SERVER_URL);
    localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
    localStorage.removeItem(STORAGE_KEYS.PAGE_STATE);
    localStorage.removeItem(STORAGE_KEYS.ROOM_ID);
    localStorage.removeItem(STORAGE_KEYS.PLAYER_COLOR);
    localStorage.removeItem(STORAGE_KEYS.IS_SPECTATOR);
    localStorage.removeItem(STORAGE_KEYS.IS_ADMIN);
    setPage('connect');
  };

  const handleCloseRoom = async (roomId: string) => {
    console.log(`[App] handleCloseRoom called - roomId: ${roomId}, isAdmin: ${isAdmin}`);
    const message = isAdmin
      ? '您正在以管理员身份关闭此房间，确定继续吗？'
      : '确定要关闭这个房间吗？';
    const confirmed = window.confirm(message);
    if (confirmed) {
      console.log(`[App] User confirmed close room, calling socket.closeRoom`);
      const success = await socket.closeRoom(roomId, isAdmin);
      if (!success) {
        console.error(`[App] Close room failed`);
        alert('关闭房间失败');
      }
    }
  };

  const handleRestartGame = async () => {
    if (!gameState.gameState) return;

    setLoading(true);
    const result = await socket.restartGame(gameState.gameState.roomId);
    setLoading(false);

    if (result) {
      setVictoryModalVisible(false);
      gameState.updateGameState(result.gameState);
    } else {
      alert('重新对局失败');
    }
  };

  const handleSwitchToSpectator = async () => {
    if (!gameState.gameState || gameState.isSpectator) return;

    setLoading(true);
    const result = await socket.switchToSpectator(gameState.gameState.roomId, playerName);
    setLoading(false);

    if (result) {
      gameState.watchingRoom(result.gameState);
    } else {
      alert('切换观战失败');
    }
  };

  const handleJoinAsPlayer = async () => {
    if (!gameState.gameState || !gameState.isSpectator) return;

    setLoading(true);
    const result = await socket.joinRoom(gameState.gameState.roomId, playerName);
    setLoading(false);

    if (result) {
      gameState.joinedRoom(result.color, result.gameState);
    } else {
      alert('参与对局失败');
    }
  };

  // Load room list when page changes to roomList
  useEffect(() => {
    if (page === 'roomList' && socket.connected) {
      const loadRooms = async () => {
        const rooms = await socket.getRoomList();
        console.log('[App] Room list loaded:', rooms);
        gameState.updateRooms(rooms);
      };

      // Load once
      loadRooms();
    }
  }, [page, socket.connected, socket.getRoomList, gameState.updateRooms]); // 添加 connected 依赖

  // Show victory modal when game is finished
  useEffect(() => {
    if (gameState.gameState?.status === 'finished' && gameState.gameState.winner && !gameState.isSpectator) {
      setVictoryModalVisible(true);
    }
  }, [gameState.gameState?.status, gameState.gameState?.winner, gameState.isSpectator]);

  // 页面加载时恢复连接状态
  useEffect(() => {
    const restoreConnection = async () => {
      // 如果有保存的连接信息和页面状态，尝试恢复连接
      const urlToConnect = serverUrl || getBackendUrl();
      if (playerName && (page === 'roomList' || page === 'game')) {
        console.log('[App] Restoring connection from localStorage...', urlToConnect);
        try {
          setLoading(true);
          await socket.connect(urlToConnect);
          setLoading(false);

          // 如果之前在游戏页面，尝试重新加入房间
          if (page === 'game') {
            const savedRoomId = localStorage.getItem(STORAGE_KEYS.ROOM_ID);
            const savedPlayerColor = localStorage.getItem(STORAGE_KEYS.PLAYER_COLOR);
            const savedIsSpectator = localStorage.getItem(STORAGE_KEYS.IS_SPECTATOR) === 'true';

            if (savedRoomId) {
              console.log('[App] Rejoining room:', savedRoomId);
              try {
                if (savedIsSpectator) {
                  const result = await socket.watchRoom(savedRoomId, playerName);
                  if (result) {
                    gameState.watchingRoom(result.gameState);
                  } else {
                    // 观战失败（房间不存在），返回房间列表
                    console.warn('[App] Failed to watch room, room may not exist');
                    localStorage.removeItem(STORAGE_KEYS.ROOM_ID);
                    localStorage.removeItem(STORAGE_KEYS.PLAYER_COLOR);
                    localStorage.removeItem(STORAGE_KEYS.IS_SPECTATOR);
                    localStorage.setItem(STORAGE_KEYS.PAGE_STATE, 'roomList');
                    setPage('roomList');
                  }
                } else if (savedPlayerColor === '1' || savedPlayerColor === '2') {
                  const result = await socket.joinRoom(savedRoomId, playerName);
                  if (result) {
                    gameState.joinedRoom(parseInt(savedPlayerColor) as 1 | 2, result.gameState);
                  } else {
                    // 加入房间失败（房间不存在），返回房间列表
                    console.warn('[App] Failed to join room, room may not exist');
                    localStorage.removeItem(STORAGE_KEYS.ROOM_ID);
                    localStorage.removeItem(STORAGE_KEYS.PLAYER_COLOR);
                    localStorage.removeItem(STORAGE_KEYS.IS_SPECTATOR);
                    localStorage.setItem(STORAGE_KEYS.PAGE_STATE, 'roomList');
                    setPage('roomList');
                  }
                } else {
                  // 没有有效的玩家颜色，返回房间列表
                  setPage('roomList');
                }
              } catch (err) {
                console.error('[App] Failed to rejoin room:', err);
                // 如果重新加入房间失败，返回房间列表
                localStorage.removeItem(STORAGE_KEYS.ROOM_ID);
                localStorage.removeItem(STORAGE_KEYS.PLAYER_COLOR);
                localStorage.removeItem(STORAGE_KEYS.IS_SPECTATOR);
                localStorage.setItem(STORAGE_KEYS.PAGE_STATE, 'roomList');
                setPage('roomList');
              }
            } else {
              // 没有房间ID，返回房间列表
              setPage('roomList');
            }
          }
        } catch (err) {
          console.error('[App] Failed to restore connection:', err);
          // 如果连接失败，清理 localStorage 并返回登录页
          localStorage.removeItem(STORAGE_KEYS.SERVER_URL);
          localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
          localStorage.removeItem(STORAGE_KEYS.PAGE_STATE);
          localStorage.removeItem(STORAGE_KEYS.ROOM_ID);
          localStorage.removeItem(STORAGE_KEYS.PLAYER_COLOR);
          localStorage.removeItem(STORAGE_KEYS.IS_SPECTATOR);
          setLoading(false);
          setPage('connect');
        }
      }
    };

    restoreConnection();
  }, []); // 只在组件挂载时执行一次

  // Listen for custom events from child components
  useEffect(() => {
    const onJoinAsPlayer = () => {
      handleJoinAsPlayer();
    };

    window.addEventListener('joinAsPlayer', onJoinAsPlayer);

    return () => {
      window.removeEventListener('joinAsPlayer', onJoinAsPlayer);
    };
  }, [gameState.gameState, gameState.isSpectator, playerName, socket]);

  const isCurrentPlayer =
    !!(gameState.gameState &&
    gameState.playerColor ===
    gameState.gameState.currentPlayer);

  return (
    <div className={`w-full min-h-screen bg-dark-bg flex`}>
      <div className={`${page === 'connect' ? 'w-full' : 'flex-1'}`}>
      
      {page === 'connect' && (
        <ConnectDialog
          onConnect={handleConnect}
          loading={loading}
          error={socket.error}
        />
      )}

      {page === 'roomList' && (
        <div className="roomlist-page">
          {/* 背景色彩光晕 - 与登录页面相同 */}
          <div className="color"></div>
          <div className="color"></div>
          <div className="color"></div>

          {/* 断开连接按钮 */}
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '30px',
            zIndex: 100,
          }}>
            <button
              onClick={handleDisconnect}
              style={{
                padding: '8px 20px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '20px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s',
                transform: 'translateY(0px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              断开连接
            </button>
          </div>

          {/* 新的房间列表 - 使用玻璃卡片样式 */}
          <RoomListNew
            rooms={gameState.rooms}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onWatchRoom={handleWatchRoom}
            onCloseRoom={handleCloseRoom}
            onUpdateNickname={handleUpdateNickname}
            loading={loading}
            error={socket.error}
            playerName={playerName}
            playerSocketId={socket.socketId}
            isAdmin={isAdmin}
            playerInfo={localStorage.getItem('gomoku_player') ? JSON.parse(localStorage.getItem('gomoku_player')!) : undefined}
          />
        </div>
      )}



      {page === 'game' && gameState.gameState && (
        <div className="min-h-screen py-6 relative" style={{ backgroundImage: 'url(/room-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', paddingRight: '420px' }}>
          <div className="mb-4 flex justify-between items-center">
            <h1 className="text-3xl font-bold">
              五子棋 - 天王山之战
            </h1>
            <div className="flex gap-2 items-center">
              {!gameState.isSpectator && (
                <button
                  onClick={handleSwitchToSpectator}
                  className="btn-secondary text-sm"
                  disabled={loading}
                >
                  👁️ 切换观战
                </button>
              )}

              <button
                onClick={handleBackToRoomList}
                className="btn-secondary text-sm"
              >
                返回主页
              </button>
            </div>
          </div>

          <div className="flex gap-4 max-w-7xl mx-auto px-2 justify-center items-start pt-12" style={{ minHeight: 'calc(100vh - 160px)' }}>
            {/* Left Side Panel - 与棋盘高度对齐 */}
            <div className="w-56 flex-shrink-0" style={{ height: '750px', marginTop: '60px' }}>
              <LeftSidePanel
                gameState={gameState.gameState}
                playerColor={gameState.playerColor}
                playerName={playerName}
                isSpectator={gameState.isSpectator}
              />
            </div>

            {/* Game Board - Center */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <GameBoard
                gameState={gameState.gameState}
                playerColor={gameState.playerColor}
                isCurrentPlayer={isCurrentPlayer}
                onMove={handleMove}
                onGameFinished={() => {
                  console.log('[App] Game finished, reloading leaderboard');
                }}
              />
              {/* Spectator Panel - Below Game Board */}
              <div className="mt-4" style={{ width: '750px' }}>
                <SpectatorPanel
                  gameState={gameState.gameState}
                  isSpectator={gameState.isSpectator}
                  onJoinAsPlayer={handleJoinAsPlayer}
                  boardWidth="750px"
                />
              </div>
            </div>

{/* Right Side Panel */}
          <div className="flex-shrink-0 flex flex-col" style={{ width: '260px', height: '750px', marginTop: '58px', gap: '16px' }}>
            <RightSidePanel
              gameState={gameState.gameState}
              playerName={playerName}
              messages={gameState.messages}
              isSpectator={gameState.isSpectator}
              onSendMessage={handleSendMessage}
            />
          </div>


          </div>
        </div>
      )}

      {/* Victory Modal */}
      {victoryModalVisible && gameState.gameState && (
        <VictoryModal
          winner={gameState.gameState.winner || null}
          playerColor={gameState.playerColor}
          onRestart={handleRestartGame}
          onClose={() => setVictoryModalVisible(false)}
        />
      )}

      {/* Music Player - Only show on game page (using fixed positioning) */}
      {page === 'game' && (
        <div className="music-player-sidebar-game-room">
          <MusicPlayer />
        </div>
      )}
      </div>
    </div>
  );
}

export default App;
