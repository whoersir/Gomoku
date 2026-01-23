import React from 'react';
interface PlayerNameModalProps {
    isOpen: boolean;
    mode: 'join' | 'watch' | 'create';
    onClose: () => void;
    onConfirm: (name: string, roomName?: string) => void;
    loading?: boolean;
    showPlayerName?: boolean;
    initialPlayerName?: string;
}
export declare const PlayerNameModal: React.FC<PlayerNameModalProps>;
export {};
