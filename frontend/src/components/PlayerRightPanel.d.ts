import React from 'react';
import { GameState } from '../types';
interface PlayerRightPanelProps {
    gameState: GameState | null;
    playerColor: 1 | 2 | null;
    playerName: string;
    isSpectator?: boolean;
}
export declare const PlayerRightPanel: React.FC<PlayerRightPanelProps>;
export {};
