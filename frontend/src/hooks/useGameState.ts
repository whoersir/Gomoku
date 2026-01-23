import { useState, useEffect, useCallback } from 'react';
import { on, off, clearEventListeners } from '../services/socketService';
import { GameState, ChatMessage, Room } from '../types';

interface PlayerLeftEvent {
  playerId: string;
  playerName: string;
  playerColor?: 1 | 2;
}

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [playerColor, setPlayerColor] = useState<1 | 2 | null>(null);
  const [isSpectator, setIsSpectator] = useState<boolean>(false); // 观战标记
  const [playerLeftNotice, setPlayerLeftNotice] = useState<PlayerLeftEvent | null>(null);

  const joinedRoom = useCallback((color: 1 | 2, initialGameState?: GameState) => {
    setPlayerColor(color);
    setIsSpectator(false); // 加入房间时不是观战
    if (initialGameState) {
      setGameState(initialGameState);
    }
    setMessages([]);
  }, []);

  const watchingRoom = useCallback((initialGameState?: GameState) => {
    setPlayerColor(null);
    setIsSpectator(true); // 观战时不是玩家
    if (initialGameState) {
      setGameState(initialGameState);
    }
    setMessages([]);
  }, []);

  const leaveRoom = useCallback(() => {
    setGameState(null);
    setMessages([]);
    setPlayerColor(null);
    setIsSpectator(false);
  }, []);

  const updateRooms = useCallback((roomList: Room[]) => {
    setRooms(roomList);
  }, []);

  const updateGameState = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  useEffect(() => {
    console.log('[useGameState] Initializing event listeners...');

    // 定义事件处理器
    const handleGameStateUpdate = (state: GameState) => {
      console.log('[useGameState] gameStateUpdate received:', state);
      console.log('[useGameState] gameState status:', state.status);
      console.log('[useGameState] gameState players:', state.players);
      console.log('[useGameState] gameState currentPlayer:', state.currentPlayer);
      setGameState(state);
    };

    const handleNewMessage = (message: ChatMessage) => {
      console.log('[useGameState] newMessage received:', message);
      setMessages((prev) => [...prev, message]);
    };

    const handleRoomListUpdate = (roomList: Room[]) => {
      console.log('[useGameState] roomListUpdate received:', roomList);
      setRooms(roomList);
    };

    const handlePlayerLeft = (data: PlayerLeftEvent) => {
      console.log(`[useGameState] Player left: ${data.playerName} (${data.playerId}), color: ${data.playerColor}`);
      setPlayerLeftNotice(data);
      
      // 更新 gameState，清空离开玩家的信息
      setGameState(prev => {
        if (!prev) return prev;
        
        // 根据离开玩家的颜色或ID清空对应的玩家信息
        const newPlayers = { ...prev.players };
        
        if (data.playerColor === 1 || prev.players?.black?.id === data.playerId) {
          newPlayers.black = { id: '', name: 'Waiting...' };
        } else if (data.playerColor === 2 || prev.players?.white?.id === data.playerId) {
          newPlayers.white = { id: '', name: 'Waiting...' };
        }
        
        return {
          ...prev,
          status: 'waiting',
          players: newPlayers,
        };
      });
      
      // 清除通知，3秒后
      setTimeout(() => setPlayerLeftNotice(null), 3000);
    };

    const handleRoomInfo = (roomInfo: any) => {
      console.log(`[useGameState] Room info updated:`, roomInfo);
      console.log(`[useGameState] roomInfo.status:`, roomInfo.status);
      console.log(`[useGameState] roomInfo.blackPlayer:`, roomInfo.blackPlayer);
      console.log(`[useGameState] roomInfo.whitePlayer:`, roomInfo.whitePlayer);

      setGameState(prev => {
        console.log('[useGameState] Current gameState before roomInfo update:', prev);

        if (!prev) {
          console.log('[useGameState] gameState is null, creating new state from roomInfo');
          // If gameState is null, create one from roomInfo
          const newState = {
            roomId: roomInfo.roomId,
            roomName: roomInfo.roomName || '',
            board: Array(15).fill(null).map(() => Array(15).fill(0)),
            currentPlayer: 1 as const,
            status: roomInfo.status,
            moves: [],
            players: {
              black: roomInfo.blackPlayer || { id: '', name: 'Player 1' },
              white: roomInfo.whitePlayer || { id: '', name: 'Waiting...' },
            },
            spectators: roomInfo.spectators || [],
            createdAt: Date.now(),
          };
          console.log('[useGameState] New gameState created from roomInfo:', newState);
          return newState;
        }

        // If gameState exists, update players, status, and spectators from roomInfo
        // This is important when a new player joins the room
        console.log('[useGameState] gameState exists, updating players from roomInfo');

        // Update if roomInfo has valid data
        if (roomInfo.blackPlayer || roomInfo.whitePlayer || roomInfo.spectators) {
          return {
            ...prev,
            status: roomInfo.status || prev.status,
            players: {
              black: roomInfo.blackPlayer || prev.players?.black,
              white: roomInfo.whitePlayer || prev.players?.white,
            },
            spectators: roomInfo.spectators !== undefined ? roomInfo.spectators : prev.spectators,
          };
        }

        console.log('[useGameState] No valid player data in roomInfo, keeping current state');
        return prev;
      });
    };

    // 清理事件监听器（强制清理所有旧监听器，避免重复注册）
    const unregisterListeners = () => {
      console.log('[useGameState] Unregistering socket event listeners...');
      clearEventListeners('gameStateUpdate');
      clearEventListeners('newMessage');
      clearEventListeners('roomListUpdate');
      clearEventListeners('playerLeft');
      clearEventListeners('roomInfo');
    };

    // 注册事件监听器（使用 socketService 的 on 函数，它会处理 socket 未初始化的情况）
    const registerListeners = () => {
      console.log('[useGameState] Registering socket event listeners...');
      on('gameStateUpdate', handleGameStateUpdate);
      on('newMessage', handleNewMessage);
      on('roomListUpdate', handleRoomListUpdate);
      on('playerLeft', handlePlayerLeft);
      on('roomInfo', handleRoomInfo);
    };

    // 先清理所有旧监听器，再注册新监听器
    unregisterListeners();
    registerListeners();

    return () => {
      unregisterListeners();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    gameState,
    messages,
    rooms,
    playerColor,
    isSpectator,
    playerLeftNotice,
    joinedRoom,
    watchingRoom,
    leaveRoom,
    updateRooms,
    updateGameState,
  };
};
