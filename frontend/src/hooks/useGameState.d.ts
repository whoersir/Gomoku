import { GameState, ChatMessage, Room } from '../types';
interface PlayerLeftEvent {
    playerId: string;
    playerName: string;
    playerColor?: 1 | 2;
}
export declare const useGameState: () => {
    gameState: GameState;
    messages: ChatMessage[];
    rooms: Room[];
    playerColor: 2 | 1;
    isSpectator: boolean;
    playerLeftNotice: PlayerLeftEvent;
    joinedRoom: (color: 1 | 2, initialGameState?: GameState) => void;
    watchingRoom: (initialGameState?: GameState) => void;
    leaveRoom: () => void;
    updateRooms: (roomList: Room[]) => void;
    updateGameState: (state: GameState) => void;
};
export {};
