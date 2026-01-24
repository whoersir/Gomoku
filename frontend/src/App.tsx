import { useState, useEffect } from 'react';
import { ConnectDialog } from './components/ConnectDialog';
import { RoomList } from './components/RoomList';
import { GameBoard } from './components/GameBoard';
import { VictoryModal } from './components/VictoryModal';
import { Leaderboard } from './components/Leaderboard';
import { PlayerHistory } from './components/PlayerHistory';
import { LeftSidePanel } from './components/LeftSidePanel';
import { SpectatorPanel } from './components/SpectatorPanel';
import { RightSidePanel } from './components/RightSidePanel';
import MusicPlayer from './components/MusicPlayer';
import { useSocket } from './hooks/useSocket';
import { useGameState } from './hooks/useGameState';
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
  const [serverUrl, setServerUrl] = useState(() => localStorage.getItem(STORAGE_KEYS.SERVER_URL) || '');
  const [victoryModalVisible, setVictoryModalVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true');

  const socket = useSocket();
  const gameState = useGameState();

  const handleConnect = async (url: string, name: string, adminPassword?: string) => {
    setLoading(true);
    try {
      await socket.connect(url);
      setLoading(false);
      setServerUrl(url);
      setPlayerName(name);

      // 验证管理员密码
      const ADMIN_PASSWORD = 'admin123'; // 默认管理员密码
      if (adminPassword === ADMIN_PASSWORD) {
        setIsAdmin(true);
        localStorage.setItem(STORAGE_KEYS.IS_ADMIN, 'true');
        console.log('[App] Admin login successful');
      } else if (adminPassword && adminPassword !== ADMIN_PASSWORD) {
        alert('管理员密码错误，将以普通用户身份连接');
        setIsAdmin(false);
        localStorage.setItem(STORAGE_KEYS.IS_ADMIN, 'false');
      } else {
        setIsAdmin(false);
        localStorage.setItem(STORAGE_KEYS.IS_ADMIN, 'false');
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

  const handleCreateRoom = async (playerName: string, roomName: string) => {
    console.log(`[App] Creating room "${roomName}" with player: ${playerName}`);
    setLoading(true);
    setPlayerName(playerName);
    const result = await socket.createRoom(roomName, playerName);
    setLoading(false);
    if (result) {
      console.log(`[App] Successfully created room: ${result.roomId}`);
      // Auto-join the created room
      await handleJoinRoom(result.roomId, playerName);
    } else {
      console.error(`[App] Failed to create room`);
    }
  };

  const handleJoinRoom = async (roomId: string, name: string) => {
    setLoading(true);
    setPlayerName(name);
    const result = await socket.joinRoom(roomId, name);
    setLoading(false);
    if (result) {
      gameState.joinedRoom(result.color, result.gameState);
      // 保存房间状态到 localStorage
      localStorage.setItem(STORAGE_KEYS.ROOM_ID, roomId);
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
    // 先通知服务器离开房间
    await socket.emit('leaveRoom', {});

    gameState.leaveRoom();
    // 清理房间状态
    localStorage.removeItem(STORAGE_KEYS.ROOM_ID);
    localStorage.removeItem(STORAGE_KEYS.PLAYER_COLOR);
    localStorage.removeItem(STORAGE_KEYS.IS_SPECTATOR);
    localStorage.setItem(STORAGE_KEYS.PAGE_STATE, 'roomList');
    setPage('roomList');

    // 立即刷新房间列表，确保UI更新
    setTimeout(async () => {
      const rooms = await socket.getRoomList();
      console.log('[App] Room list refreshed after leaving:', rooms);
      gameState.updateRooms(rooms);
    }, 100);
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
      const adminPassword = isAdmin ? 'admin123' : undefined;
      console.log(`[App] adminPassword to send: ${adminPassword ? '***' : 'undefined'}`);
      const success = await socket.closeRoom(roomId, adminPassword);
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

  // Load room list periodically and listen to updates
  useEffect(() => {
    if (page === 'roomList') {
      const loadRooms = async () => {
        const rooms = await socket.getRoomList();
        console.log('[App] Room list loaded:', rooms);
        gameState.updateRooms(rooms);
      };

      // Initial load
      loadRooms();

      // Reload every 1.5 seconds for faster updates
      const interval = setInterval(loadRooms, 1500);

      return () => clearInterval(interval);
    }
  }, [page, socket.getRoomList, gameState.updateRooms]); // 使用稳定的函数引用，避免无限循环

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
      if (serverUrl && playerName && (page === 'roomList' || page === 'game')) {
        console.log('[App] Restoring connection from localStorage...');
        try {
          setLoading(true);
          await socket.connect(serverUrl);
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
    <div className="w-full min-h-screen bg-dark-bg">
      {page === 'connect' && (
        <ConnectDialog
          onConnect={handleConnect}
          loading={loading}
          error={socket.error}
        />
      )}

      {page === 'roomList' && (
        <div className="min-h-screen py-8 px-4" style={{ backgroundImage: 'url(/room-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
          <div className="mb-4 flex justify-between items-center">
            <h1 className="text-3xl font-bold">五子棋 - 房间列表</h1>
            <div className="flex gap-2">
              <button
                onClick={handleDisconnect}
                className="btn-secondary text-sm"
              >
                断开连接
              </button>
            </div>
          </div>
          
          {/* Three column layout: Leaderboard | RoomList | PlayerHistory */}
          <div className="flex gap-6 max-w-7xl mx-auto">
            {/* Left: Leaderboard */}
            <div className="w-80 flex-shrink-0">
              <Leaderboard isOpen={true} onClose={() => {}} embedded={true} />
            </div>
            
            {/* Center: Room List */}
            <div className="flex-1">
              <RoomList
                rooms={gameState.rooms}
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
                onWatchRoom={handleWatchRoom}
                onCloseRoom={handleCloseRoom}
                loading={loading}
                error={socket.error}
                playerName={playerName}
                playerSocketId={socket.socketId}
                isAdmin={isAdmin}
              />
            </div>
            
            {/* Right: Player History + Music Player */}
            <div className="w-80 flex-shrink-0 flex flex-col gap-4">
              <PlayerHistory
                playerName={playerName}
                isOpen={true}
                onClose={() => {}}
                serverUrl={serverUrl}
                embedded={true}
              />
              {/* Music Player below Player History */}
              <div className="music-player-room-list-wrapper">
                <MusicPlayer />
              </div>
            </div>
          </div>
        </div>
      )}



      {page === 'game' && gameState.gameState && (
        <div className="min-h-screen py-6 px-4 relative" style={{ backgroundImage: 'url(/room-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
          <div className="mb-4 flex justify-between items-center">
            <h1 className="text-3xl font-bold">
              {gameState.gameState.roomName || '五子棋'} - 房间 #{gameState.gameState.roomId}
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
                返回房间列表
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

            {/* Right Side Panel - 与棋盘高度对齐 */}
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

          {/* Music Player - Bottom Right Corner */}
          <div className="music-player-game-room-wrapper">
            <MusicPlayer />
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
    </div>
  );
}

export default App;
