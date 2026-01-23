import React from 'react';
import { GameState } from '../types';
interface GameBoardProps {
    gameState: GameState | null;
    playerColor: 1 | 2 | null;
    isCurrentPlayer: boolean;
    onMove: (x: number, y: number) => void;
}
export declare const GameBoard: React.FC<GameBoardProps>;
export {};
