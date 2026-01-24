import React from 'react';
import { GameState } from '../types';
interface SpectatorPanelProps {
    gameState: GameState | null;
    isSpectator: boolean;
    onJoinAsPlayer: () => void;
    boardWidth?: string;
}
export declare const SpectatorPanel: React.FC<SpectatorPanelProps>;
export {};
