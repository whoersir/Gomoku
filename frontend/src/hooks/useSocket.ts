import { useEffect, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket, emit, getSocket } from '../services/socketService';
import { GameState, Room } from '../types';

export const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);

  const connect = useCallback(async (serverUrl: string) => {
    try {
      setError(null);
      await connectSocket(serverUrl);
      setConnected(true);
      // 连接成功后获取socketId
      const socket = getSocket();
      if (socket) {
        setSocketId(socket.id || null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      setConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
    setConnected(false);
  }, []);

  const createRoom = useCallback(
    async (roomName: string, playerName: string): Promise<{ roomId: string; color: 1 | 2 } | null> => {
      try {
        console.log(`[useSocket] Creating room "${roomName}" with player: ${playerName}`);
        const response = await emit('createRoom', { playerName, roomName });
        console.log(`[useSocket] Create room response:`, response);

        if (response.success) {
          console.log(`[useSocket] Room created successfully: ${response.roomId}`);
          return { roomId: response.roomId, color: response.color };
        } else {
          const errorMsg = response.message || 'Unknown error';
          console.error(`[useSocket] Room creation failed: ${errorMsg}`);
          setError(errorMsg);
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create room';
        console.error(`[useSocket] Room creation error:`, errorMessage);
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  const joinRoom = useCallback(
    async (roomId: string, playerName: string): Promise<{ color: 1 | 2; gameState: GameState } | null> => {
      try {
        const response = await emit('joinRoom', { roomId, playerName });
        if (response.success) {
          return { color: response.color, gameState: response.gameState };
        } else {
          setError(response.message);
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to join room';
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  const makeMove = useCallback(async (roomId: string, x: number, y: number): Promise<boolean> => {
    try {
      const response = await emit('move', { roomId, x, y });
      return response.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to make move';
      setError(errorMessage);
      return false;
    }
  }, []);

  const sendMessage = useCallback(async (roomId: string, message: string): Promise<boolean> => {
    try {
      const response = await emit('chat', { roomId, message });
      return response.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      return false;
    }
  }, []);

  const getRoomList = useCallback(async (): Promise<Room[]> => {
    try {
      const response = await emit('getRoomList');
      return response || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get room list');
      return [];
    }
  }, []);

  const watchRoom = useCallback(
    async (roomId: string, spectatorName: string): Promise<{ gameState: GameState } | null> => {
      try {
        const response = await emit('watchRoom', { roomId, spectatorName });
        if (response.success) {
          return { gameState: response.gameState };
        } else {
          setError(response.message);
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to watch room';
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  const closeRoom = useCallback(
    async (roomId: string, adminPassword?: string): Promise<boolean> => {
      try {
        console.log(`[useSocket] closeRoom called - roomId: ${roomId}, adminPassword: ${adminPassword ? '***' : 'undefined'}`);
        const response = await emit('closeRoom', { roomId, adminPassword }, 5000);
        console.log(`[useSocket] closeRoom response:`, response);

        if (!response) {
          console.error(`[useSocket] closeRoom - no response received`);
          setError('No response from server');
          return false;
        }

        if (!response.success) {
          console.error(`[useSocket] closeRoom failed - message: ${response.message}`);
          setError(response.message || 'Failed to close room');
          return false;
        }

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to close room';
        console.error(`[useSocket] closeRoom error:`, errorMessage);
        setError(errorMessage);
        return false;
      }
    },
    []
  );

  const restartGame = useCallback(
    async (roomId: string): Promise<{ gameState: GameState } | null> => {
      try {
        const response = await emit('restartGame', { roomId });
        if (response.success) {
          return { gameState: response.gameState };
        } else {
          setError(response.message);
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to restart game';
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  const switchToSpectator = useCallback(
    async (roomId: string, playerName: string): Promise<{ gameState: GameState } | null> => {
      try {
        const response = await emit('switchToSpectator', { roomId, playerName });
        if (response.success) {
          return { gameState: response.gameState };
        } else {
          setError(response.message);
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to switch to spectator';
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    // 注册全局事件监听器，即使 socket 还未初始化
    // 当 socket 连接后，这些监听器会自动生效
    const socket = getSocket();
    
    const handleConnect = () => {
      const currentSocket = getSocket();
      setConnected(true);
      setSocketId(currentSocket?.id || null);
    };
    
    const handleDisconnect = () => {
      setConnected(false);
      setSocketId(null);
    };
    
    const handleError = (msg: string) => setError(msg);

    // 如果 socket 存在，立即注册监听器
    if (socket) {
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('error', handleError);
    }

    return () => {
      const currentSocket = getSocket();
      if (currentSocket) {
        currentSocket.off('connect', handleConnect);
        currentSocket.off('disconnect', handleDisconnect);
        currentSocket.off('error', handleError);
      }
    };
  }, []);

  return {
    connected,
    error,
    socketId,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    makeMove,
    sendMessage,
    getRoomList,
    watchRoom,
    closeRoom,
    restartGame,
    switchToSpectator,
    emit,
  };
};
