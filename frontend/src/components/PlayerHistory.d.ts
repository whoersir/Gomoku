import React from 'react';
interface PlayerHistoryProps {
    isOpen: boolean;
    playerName: string;
    onClose: () => void;
    serverUrl: string;
    embedded?: boolean;
}
export declare const PlayerHistory: React.FC<PlayerHistoryProps>;
export {};
