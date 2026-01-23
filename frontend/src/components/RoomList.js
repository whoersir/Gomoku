import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { PlayerNameModal } from './PlayerNameModal';
export const RoomList = ({ rooms, onCreateRoom, onJoinRoom, onWatchRoom, onCloseRoom, loading, error, playerName, playerSocketId, isAdmin = false, }) => {
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('join');
    const hasPlayerName = playerName && playerName.trim() !== '';
    const handleCreateRoom = async () => {
        if (hasPlayerName) {
            setModalMode('create');
            setModalOpen(true);
        }
    };
    const handleJoinRoom = (roomId) => {
        if (hasPlayerName) {
            // 直接加入，不需要输入昵称
            onJoinRoom(roomId, playerName);
        }
    };
    const handleWatchRoom = (roomId) => {
        if (hasPlayerName) {
            // 直接观战，不需要输入昵称
            onWatchRoom(roomId, playerName);
        }
    };
    const handleModalConfirm = (playerName, roomName) => {
        setModalOpen(false);
        if (modalMode === 'create' && roomName) {
            onCreateRoom(playerName, roomName);
            // Auto-join newly created room after a delay
            setTimeout(() => {
                if (rooms && rooms.length > 0 && rooms[0].playerCount === 1) {
                    setSelectedRoomId(rooms[0].roomId);
                }
            }, 200);
        }
    };
    const handleModalClose = () => {
        setModalOpen(false);
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "w-full max-w-4xl mx-auto", children: [error && (_jsxs("div", { className: "mb-6 p-4 bg-danger/20 border border-danger rounded text-danger", children: [_jsx("div", { className: "font-semibold", children: "\u274C \u9519\u8BEF" }), _jsx("div", { className: "text-sm mt-1", children: error })] })), _jsx("div", { className: "mb-6", children: _jsx("button", { onClick: handleCreateRoom, disabled: loading, className: "btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? '创建中...' : '➕ 创建新房间' }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-3", children: "\u53EF\u7528\u623F\u95F4" }), loading ? (_jsx("div", { className: "text-center text-dark-text-tertiary py-8", children: "\u52A0\u8F7D\u4E2D..." })) : rooms.length === 0 ? (_jsx("div", { className: "text-center text-dark-text-tertiary py-8", children: "\u6682\u65E0\u53EF\u7528\u623F\u95F4" })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: rooms.map((room) => (_jsxs("div", { className: `card-base cursor-pointer transition-all hover:border-primary ${selectedRoomId === room.roomId
                                        ? 'border-primary bg-primary/10'
                                        : 'hover:bg-dark-bg-tertiary'}`, onClick: () => setSelectedRoomId(room.roomId), children: [_jsxs("div", { className: "flex justify-between items-start mb-3", children: [_jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: room.roomName || `房间 #${room.roomId}` }), _jsx("div", { className: "text-xs text-dark-text-tertiary mt-1", children: new Date(room.createdAt).toLocaleTimeString() })] }), _jsx("div", { className: `text-xs px-2 py-1 rounded ${room.status === 'waiting'
                                                        ? 'bg-secondary/20 text-secondary'
                                                        : room.status === 'playing'
                                                            ? 'bg-warning/20 text-warning'
                                                            : 'bg-danger/20 text-danger'}`, children: room.status === 'waiting'
                                                        ? '等待中'
                                                        : room.status === 'playing'
                                                            ? '进行中'
                                                            : '已结束' })] }), _jsxs("div", { className: "space-y-1 text-sm mb-3", children: [_jsx("div", { className: "text-dark-text-secondary", children: room.blackPlayer
                                                        ? `黑棋: ${room.blackPlayer.name}`
                                                        : '黑棋: 等待玩家' }), _jsx("div", { className: "text-dark-text-secondary", children: room.whitePlayer
                                                        ? `白棋: ${room.whitePlayer.name}`
                                                        : '白棋: 等待玩家' }), room.spectatorCount !== undefined && room.spectatorCount > 0 && (_jsxs("div", { className: "text-dark-text-tertiary text-xs", children: ["\uD83D\uDC41\uFE0F ", room.spectatorCount, " \u540D\u89C2\u6218\u8005"] }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        handleJoinRoom(room.roomId);
                                                    }, disabled: room.playerCount >= 2 || loading, className: "btn-primary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed", children: room.playerCount >= 2
                                                        ? '房间已满'
                                                        : loading
                                                            ? '处理中...'
                                                            : '加入房间' }), _jsx("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        handleWatchRoom(room.roomId);
                                                    }, disabled: loading, className: "btn-secondary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? '处理中...' : '👁️ 实时观战' }), ((room.blackPlayer && playerSocketId === room.blackPlayer.id) || isAdmin) && (_jsx("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        console.log(`[RoomList] Close button clicked - roomId: ${room.roomId}, isAdmin: ${isAdmin}, playerSocketId: ${playerSocketId}`);
                                                        onCloseRoom(room.roomId);
                                                    }, disabled: loading, className: "btn-danger w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? '关闭中...' : isAdmin ? '🔧 管理员关闭' : '🗑️ 关闭房间' }))] })] }, room.roomId))) }))] })] }), _jsx(PlayerNameModal, { isOpen: modalOpen, mode: modalMode, onClose: handleModalClose, onConfirm: handleModalConfirm, loading: loading, showPlayerName: false, initialPlayerName: playerName })] }));
};
