import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  playerName: string;
  onSendMessage: (message: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  playerName,
  onSendMessage,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Use setTimeout to ensure DOM is ready before scrolling
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
    <div className="card-base flex flex-col h-96 max-h-96" style={{ backgroundColor: 'rgba(26, 31, 46, 0.5)' }}>
      <div className="text-lg font-semibold mb-3">聊天</div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-dark-text-tertiary text-sm py-8">
            暂无消息
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="text-sm">
              <div className="flex gap-2 mb-1">
                <span className="font-medium text-primary">{msg.playerName}</span>
                <span className="text-dark-text-tertiary text-xs">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-dark-text-secondary break-words bg-dark-bg-tertiary p-2 rounded text-xs">
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2 pt-3 border-t border-dark-text-tertiary/20">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息..."
          className="input-base flex-1 resize-none text-xs py-2"
          rows={2}
        />
        <button
          onClick={handleSend}
          className="btn-primary text-xs px-3 py-2 h-fit whitespace-nowrap"
        >
          发送
        </button>
      </div>
    </div>
  );
};
