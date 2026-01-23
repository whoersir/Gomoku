import React from 'react';
import { GameState } from '../types';
interface PlayerLeftEvent {
    playerId: string;
    playerName: string;
}
interface PlayerPanelProps {
    gameState: GameState | null;
    playerColor: 1 | 2 | null;
    playerName: string;
    playerLeftNotice?: PlayerLeftEvent | null;
    isSpectator?: boolean;
}
export declare const PlayerPanel: React.FC<PlayerPanelProps>;
export {};
