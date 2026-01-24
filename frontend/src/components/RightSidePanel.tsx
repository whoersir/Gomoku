import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { GameState } from '../types';
import MusicPlayer from './MusicPlayer';

interface RightSidePanelProps {
  gameState: GameState | null;
  playerName: string;
  messages: ChatMessage[];
  isSpectator: boolean;
  onSendMessage: (message: string) => void;
}

export const RightSidePanel: React.FC<RightSidePanelProps> = ({
  gameState,
  playerName,
  messages,
  isSpectator,
  onSendMessage,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Chat Panel - flex-1 to fill available space */}
      <div className="card-base flex flex-col overflow-hidden flex-1 min-h-0">
        <div className="text-lg font-bold text-dark-text-secondary mb-3 flex items-center gap-2">
          <span>💬</span>聊天
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center text-dark-text-tertiary text-sm py-8">
              暂无消息
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="text-sm">
                <div className="flex gap-2 mb-1 items-baseline">
                  <span className="font-semibold text-primary text-xs">{msg.playerName}</span>
                  <span className="text-dark-text-tertiary text-xs">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-dark-text-secondary break-words glass-light p-2 rounded text-xs">
                  {msg.message}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2 pt-3 border-t border-dark-text-tertiary/20 flex-shrink-0">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="input-base flex-1 resize-none text-xs py-2 min-h-[60px]"
            rows={2}
          />
          <button
            onClick={handleSend}
            className="btn-primary text-xs px-4 py-2 h-fit whitespace-nowrap self-center"
          >
            发送
          </button>
        </div>
      </div>
      
      {/* Music Player - flex-shrink-0 to maintain size */}
      <div className="flex-shrink-0">
        <MusicPlayer />
      </div>
    </div>
  );
};
