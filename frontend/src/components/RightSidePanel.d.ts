import React from 'react';
import { ChatMessage } from '../types';
import { GameState } from '../types';
interface RightSidePanelProps {
    gameState: GameState | null;
    playerName: string;
    messages: ChatMessage[];
    isSpectator: boolean;
    onSendMessage: (message: string) => void;
}
export declare const RightSidePanel: React.FC<RightSidePanelProps>;
export {};
