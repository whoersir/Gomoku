import React from 'react';
import { ChatMessage } from '../types';
interface ChatPanelProps {
    messages: ChatMessage[];
    playerName: string;
    onSendMessage: (message: string) => void;
}
export declare const ChatPanel: React.FC<ChatPanelProps>;
export {};
