import React from 'react';
import { Room } from '../types';
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
export declare const RoomList: React.FC<RoomListProps>;
export {};
