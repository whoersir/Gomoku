import React from 'react';
import { GameState } from '../types';
interface PlayerLeftPanelProps {
    gameState: GameState | null;
    playerColor: 1 | 2 | null;
    playerName: string;
    isSpectator?: boolean;
}
export declare const PlayerLeftPanel: React.FC<PlayerLeftPanelProps>;
export {};
