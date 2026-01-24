import React from 'react';
interface VictoryModalProps {
    winner: 1 | 2 | 'draw' | null;
    playerColor: 1 | 2 | null;
    onRestart: () => void;
    onClose: () => void;
}
export declare const VictoryModal: React.FC<VictoryModalProps>;
export {};
