import React from 'react';
import { GameState } from '../types';
interface LeftSidePanelProps {
    gameState: GameState | null;
    playerColor: 1 | 2 | null;
    playerName: string;
    isSpectator?: boolean;
}
export declare const LeftSidePanel: React.FC<LeftSidePanelProps>;
export {};
