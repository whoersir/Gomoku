import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
export const ChatPanel = ({ messages, playerName, onSendMessage, }) => {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);
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
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    return (_jsxs("div", { className: "card-base flex flex-col h-96 max-h-96", style: { backgroundColor: 'rgba(26, 31, 46, 0.5)' }, children: [_jsx("div", { className: "text-lg font-semibold mb-3", children: "\u804A\u5929" }), _jsxs("div", { className: "flex-1 overflow-y-auto mb-3 space-y-2", children: [messages.length === 0 ? (_jsx("div", { className: "text-center text-dark-text-tertiary text-sm py-8", children: "\u6682\u65E0\u6D88\u606F" })) : (messages.map((msg, index) => (_jsxs("div", { className: "text-sm", children: [_jsxs("div", { className: "flex gap-2 mb-1", children: [_jsx("span", { className: "font-medium text-primary", children: msg.playerName }), _jsx("span", { className: "text-dark-text-tertiary text-xs", children: new Date(msg.timestamp).toLocaleTimeString() })] }), _jsx("div", { className: "text-dark-text-secondary break-words bg-dark-bg-tertiary p-2 rounded text-xs", children: msg.message })] }, index)))), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "flex gap-2 pt-3 border-t border-dark-text-tertiary/20", children: [_jsx("textarea", { value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyPress: handleKeyPress, placeholder: "\u8F93\u5165\u6D88\u606F...", className: "input-base flex-1 resize-none text-xs py-2", rows: 2 }), _jsx("button", { onClick: handleSend, className: "btn-primary text-xs px-3 py-2 h-fit whitespace-nowrap", children: "\u53D1\u9001" })] })] }));
};
