import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const PlayerRightPanel = ({ gameState, playerColor, playerName, isSpectator, }) => {
    const handleJoinGame = () => {
        // Emit event to switch from spectator to player
        window.dispatchEvent(new CustomEvent('joinAsPlayer'));
    };
    if (!gameState) {
        return (_jsx("div", { className: "card-base", children: _jsx("div", { className: "text-dark-text-tertiary", children: "\u7B49\u5F85\u6E38\u620F\u5F00\u59CB..." }) }));
    }
    const isWaiting = gameState.status === 'waiting';
    const whitePlayer = gameState.players?.white;
    const blackPlayer = gameState.players?.black;
    const isBlackTurn = gameState.currentPlayer === 1;
    const isWhiteTurn = !isBlackTurn && !isWaiting;
    const hasEmptySpot = !blackPlayer || !whitePlayer || whitePlayer?.name === 'Waiting...';
    return (_jsxs("div", { className: "card-base space-y-4", style: { backgroundColor: 'rgba(26, 31, 46, 0.5)' }, children: [isSpectator && isWaiting && hasEmptySpot && (_jsx("button", { onClick: handleJoinGame, className: "w-full btn-primary text-sm py-2", children: "\uD83C\uDFAE \u53C2\u4E0E\u5BF9\u5C40" })), _jsxs("div", { className: `p-4 rounded-lg border-2 transition-colors ${isWhiteTurn
                    ? 'border-primary bg-primary/10'
                    : 'border-dark-text-tertiary/50 bg-dark-bg-tertiary'}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("div", { className: "w-4 h-4 rounded-full bg-white border border-dark-text-tertiary" }), _jsx("span", { className: "font-medium text-lg", children: "\u767D\u68CB" }), playerColor === 2 && _jsx("span", { className: "text-xs text-primary ml-auto", children: "(\u4F60)" })] }), _jsx("div", { className: "text-sm text-dark-text-secondary mt-2", children: whitePlayer?.name && whitePlayer.name !== 'Waiting...'
                            ? whitePlayer.name
                            : (isWaiting ? '⏳ 等待加入...' : whitePlayer?.name || '未加入') }), isWhiteTurn && (_jsx("div", { className: "mt-2 text-xs text-primary font-medium", children: "\u23F1\uFE0F \u6B63\u5728\u601D\u8003..." }))] }), _jsxs("div", { className: "pt-3 border-t border-dark-text-tertiary/20", children: [_jsxs("div", { className: "text-base font-semibold text-dark-text-secondary mb-2", children: ["\uD83D\uDC41\uFE0F \u89C2\u6218\u4EBA\u5458 (", gameState.spectators?.length || 0, ")"] }), _jsx("div", { className: "space-y-1 text-sm max-h-40 overflow-y-auto", children: gameState.spectators && gameState.spectators.length > 0 ? (gameState.spectators.map((spectator, index) => (_jsxs("div", { className: "flex items-center gap-2 p-2 bg-dark-bg-tertiary rounded", children: [_jsx("span", { className: "text-blue-400", children: "\uD83D\uDC41\uFE0F" }), _jsx("span", { className: "text-dark-text-secondary", children: spectator.name })] }, spectator.id)))) : (_jsx("div", { className: "text-xs text-dark-text-tertiary py-2", children: "\u6682\u65E0\u89C2\u6218\u4EBA\u5458" })) })] })] }));
};
