import React from 'react';
interface ConnectDialogProps {
    onConnect: (serverUrl: string, playerName: string, playerId?: string) => void;
    loading: boolean;
    error: string | null;
}
export declare const ConnectDialog: React.FC<ConnectDialogProps>;
export {};
