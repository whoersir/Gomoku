import { GameState, Room } from '../types';
export declare const useSocket: () => {
    connected: boolean;
    error: string;
    socketId: string;
    connect: (serverUrl: string) => Promise<void>;
    disconnect: () => void;
    createRoom: (roomName: string, playerName: string) => Promise<{
        roomId: string;
        color: 1 | 2;
    } | null>;
    joinRoom: (roomId: string, playerName: string, preferredColor?: 'black' | 'white') => Promise<{
        color: 1 | 2;
        gameState: GameState;
    } | null>;
    makeMove: (roomId: string, x: number, y: number) => Promise<boolean>;
    sendMessage: (roomId: string, message: string) => Promise<boolean>;
    getRoomList: () => Promise<Room[]>;
    watchRoom: (roomId: string, spectatorName: string) => Promise<{
        gameState: GameState;
    } | null>;
    closeRoom: (roomId: string, isAdmin: boolean) => Promise<boolean>;
    restartGame: (roomId: string) => Promise<{
        gameState: GameState;
    } | null>;
    switchToSpectator: (roomId: string, playerName: string) => Promise<{
        gameState: GameState;
    } | null>;
    emit: (event: string, data?: any, timeout?: number) => Promise<any>;
};
