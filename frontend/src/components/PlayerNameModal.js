import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export const PlayerNameModal = ({ isOpen, mode, onClose, onConfirm, loading = false, showPlayerName = true, // 默认显示昵称输入框
initialPlayerName = '', // 初始昵称
 }) => {
    const [playerName, setPlayerName] = useState('');
    const [roomName, setRoomName] = useState('');
    // Reset input when modal opens
    useEffect(() => {
        if (isOpen) {
            setPlayerName(showPlayerName ? '' : initialPlayerName); // 如果不显示昵称输入框，使用初始昵称
            setRoomName('');
        }
    }, [isOpen, showPlayerName, initialPlayerName]);
    const handleConfirm = () => {
        const name = showPlayerName ? playerName.trim() : initialPlayerName;
        if (name) {
            if (mode === 'create' && !roomName.trim()) {
                return; // 房间名称不能为空
            }
            onConfirm(name, mode === 'create' ? roomName.trim() : undefined);
            if (showPlayerName) {
                setPlayerName('');
            }
            setRoomName('');
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };
    if (!isOpen)
        return null;
    const titles = {
        join: '加入房间',
        watch: '观战房间',
        create: '创建房间',
    };
    const placeholders = showPlayerName ? {
        join: '输入你的昵称加入房间...',
        watch: '输入你的昵称开始观战...',
        create: '输入你的昵称创建房间...',
    } : {
        join: '加入房间',
        watch: '开始观战',
        create: '创建房间',
    };
    const buttonLabels = {
        join: '加入房间',
        watch: '开始观战',
        create: '创建房间',
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 flex items-center justify-center z-50", children: _jsxs("div", { className: "card-base max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-300", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: titles[mode] }), mode === 'create' && (_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "\u623F\u95F4\u540D\u79F0" }), _jsx("input", { type: "text", value: roomName, onChange: (e) => setRoomName(e.target.value), onKeyPress: handleKeyPress, placeholder: "\u8F93\u5165\u623F\u95F4\u540D\u79F0...", className: "input-base w-full", maxLength: 30, autoFocus: !showPlayerName })] })), showPlayerName && (_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "\u73A9\u5BB6\u6635\u79F0" }), _jsx("input", { type: "text", value: playerName, onChange: (e) => setPlayerName(e.target.value), onKeyPress: handleKeyPress, placeholder: placeholders[mode], className: "input-base w-full", maxLength: 20, autoFocus: mode !== 'create' })] })), _jsxs("div", { className: "flex gap-3 justify-end", children: [_jsx("button", { onClick: onClose, disabled: loading, className: "btn-secondary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed", children: "\u53D6\u6D88" }), _jsx("button", { onClick: handleConfirm, disabled: (showPlayerName && !playerName.trim()) || (mode === 'create' && !roomName.trim()) || loading, className: "btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? '处理中...' : buttonLabels[mode] })] })] }) }));
};
