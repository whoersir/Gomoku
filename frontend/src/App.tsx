import { useState, useEffect } from 'react';
import { ConnectDialog } from './components/ConnectDialog';
import { RoomList } from './components/RoomList';
import { GameBoard } from './components/GameBoard';
import { PlayerLeftPanel } from './components/PlayerLeftPanel';
import { PlayerRightPanel } from './components/PlayerRightPanel';
import { ChatPanel } from './components/ChatPanel';
import { VictoryModal } from './components/VictoryModal';
import { Leaderboard } from './components/Leaderboard';
import { PlayerHistory } from './components/PlayerHistory';
import { BGMPlayer } from './components/BGMPlayer';
import { useSocket } from './hooks/useSocket';
import { useGameState } from './hooks/useGameState';
// import { on, off } from './services/socketService';

type PageState = 'connect' | 'roomList' | 'game';

function App() {
  const [page, setPage] = useState<PageState>('connect');
  const [loading, setLoading] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [victoryModalVisible, setVictoryModalVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const socket = useSocket();
  const gameState = useGameState();

  const handleConnect = async (url: string, name: string, adminPassword?: string, pId?: string) => {
    setLoading(true);
    try {
      await socket.connect(url);
      setLoading(false);
      setServerUrl(url);
      setPlayerName(name);
      if (pId) setPlayerId(pId);
      // 验证管理员密码
      const ADMIN_PASSWORD = 'admin123'; // 默认管理员密码
      if (adminPassword === ADMIN_PASSWORD) {
        setIsAdmin(true);
        console.log('[App] Admin login successful');
      } else if (adminPassword && adminPassword !== ADMIN_PASSWORD) {
        alert('管理员密码错误，将以普通用户身份连接');
        setIsAdmin(false);
      } else {
        setIsAdmin(false);
      }
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

  const handleBackToRoomList = () => {
    gameState.leaveRoom();
    setPage('roomList');
  };

  const handleDisconnect = () => {
    socket.disconnect();
    gameState.leaveRoom();
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
            
            {/* Right: Player History */}
            <div className="w-80 flex-shrink-0">
              <PlayerHistory
                playerName={playerName}
                isOpen={true}
                onClose={() => {}}
                serverUrl={serverUrl}
                embedded={true}
              />
            </div>
          </div>
        </div>
      )}

      {page === 'game' && gameState.gameState && (
        <div className="min-h-screen py-8 px-4" style={{ backgroundImage: 'url(/room-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
          {/* BGM Player - 在游戏页面时播放 */}
          {(() => {
            console.log('[App] Rendering BGMPlayer, page:', page, 'gameState:', gameState.gameState);
            return <BGMPlayer isPlaying={true} volume={0.5} loop={true} />;
          })()}
          
          <div className="mb-4 flex justify-between items-center">
            <h1 className="text-3xl font-bold">
              {gameState.gameState.roomName || '五子棋'} - 房间 #{gameState.gameState.roomId}
            </h1>
            <div className="flex gap-2">
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

          <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Top Row: Player Info | Game Board | Player Info | Spectators */}
            <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
              {/* Left: Black Player Info */}
              <div className="w-full lg:w-64 flex-shrink-0">
                <PlayerLeftPanel
                  gameState={gameState.gameState}
                  playerColor={gameState.playerColor}
                  playerName={playerName}
                  isSpectator={gameState.isSpectator}
                />
              </div>

              {/* Middle: Game Board */}
              <div className="flex justify-center">
                <GameBoard
                  gameState={gameState.gameState}
                  playerColor={gameState.playerColor}
                  isCurrentPlayer={isCurrentPlayer}
                  onMove={handleMove}
                  onGameFinished={() => {
                    // 当游戏结束时，重新加载排行榜
                    console.log('[App] Game finished, reloading leaderboard');
                    // 这里可以添加重新加载排行榜的逻辑，或者触发父组件重新渲染
                  }}
                />
              </div>

              {/* Right: White Player Info & Spectators */}
              <div className="w-full lg:w-64 flex-shrink-0">
                <PlayerRightPanel
                  gameState={gameState.gameState}
                  playerColor={gameState.playerColor}
                  playerName={playerName}
                  isSpectator={gameState.isSpectator}
                />
              </div>
            </div>

            {/* Bottom: Chat Panel */}
            <div className="max-w-7xl mx-auto w-full">
              <ChatPanel
                messages={gameState.messages}
                playerName={playerName}
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
    </div>
  );
}

export default App;
