import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const PlayerPanel = ({ gameState, playerColor, playerName, playerLeftNotice, isSpectator, }) => {
    if (!gameState) {
        return (_jsx("div", { className: "card-base", children: _jsx("div", { className: "text-dark-text-tertiary", children: "\u7B49\u5F85\u6E38\u620F\u5F00\u59CB..." }) }));
    }
    // Handle waiting state - if players info is incomplete, show placeholder
    const isWaiting = gameState.status === 'waiting';
    const blackPlayer = gameState.players?.black;
    const whitePlayer = gameState.players?.white;
    const isBlackTurn = gameState.currentPlayer === 1;
    return (_jsxs("div", { className: "card-base space-y-4", children: [_jsx("div", { className: "text-lg font-semibold", children: isSpectator ? '👁️ 观战信息' : '玩家信息' }), isSpectator && (_jsx("div", { className: "p-3 rounded-lg bg-blue-500/20 border border-blue-500/50", children: _jsxs("div", { className: "text-sm text-blue-400", children: ["\uD83D\uDC41\uFE0F \u4F60\u6B63\u5728\u5B9E\u65F6\u89C2\u6218 - ", playerName] }) })), playerLeftNotice && (_jsx("div", { className: "p-3 rounded-lg bg-red-500/20 border border-red-500/50 animate-pulse", children: _jsxs("div", { className: "text-sm text-red-400", children: ["\u26A0\uFE0F ", playerLeftNotice.playerName, " \u5DF2\u79BB\u5F00\u6E38\u620F"] }) })), _jsxs("div", { className: `p-3 rounded-lg border-2 transition-colors ${isBlackTurn && !isWaiting
                    ? 'border-primary bg-primary/10'
                    : 'border-dark-text-tertiary/50 bg-dark-bg-tertiary'}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-black" }), _jsx("span", { className: "font-medium", children: "\u9ED1\u68CB" }), playerColor === 1 && _jsx("span", { className: "text-xs text-primary ml-auto", children: "(\u4F60)" })] }), _jsx("div", { className: "text-sm text-dark-text-secondary", children: blackPlayer?.name || playerName })] }), _jsxs("div", { className: `p-3 rounded-lg border-2 transition-colors ${!isBlackTurn && !isWaiting
                    ? 'border-primary bg-primary/10'
                    : 'border-dark-text-tertiary/50 bg-dark-bg-tertiary'}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-white border border-dark-text-tertiary" }), _jsx("span", { className: "font-medium", children: "\u767D\u68CB" }), playerColor === 2 && _jsx("span", { className: "text-xs text-primary ml-auto", children: "(\u4F60)" })] }), _jsx("div", { className: "text-sm text-dark-text-secondary", children: whitePlayer?.name && whitePlayer.name !== 'Waiting...'
                            ? whitePlayer.name
                            : (isWaiting ? '⏳ 等待加入...' : whitePlayer?.name || '未加入') })] }), _jsxs("div", { className: "pt-3 border-t border-dark-text-tertiary/20", children: [_jsx("div", { className: "text-xs text-dark-text-tertiary mb-1", children: "\u6E38\u620F\u72B6\u6001" }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "capitalize", children: isWaiting ? '等待中' : gameState.status }), _jsxs("span", { className: "text-xs bg-dark-bg-tertiary px-2 py-1 rounded", children: [gameState.moves?.length || 0, " \u6B65"] })] })] })] }));
};
