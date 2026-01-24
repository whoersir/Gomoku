import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const VictoryModal = ({ winner, playerColor, onRestart, onClose, }) => {
    if (!winner)
        return null;
    // 判断当前玩家是否获胜
    const isWinner = winner !== 'draw' && winner === playerColor;
    const isLoser = winner !== 'draw' && winner !== playerColor;
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 flex items-center justify-center z-50", children: _jsxs("div", { className: "card-base max-w-md w-full mx-4 p-8 text-center animate-in fade-in zoom-in duration-300", children: [_jsxs("div", { className: "mb-6", children: [winner === 'draw' ? (_jsx("div", { className: "text-6xl mb-4", children: "\uD83E\uDD1D" })) : isWinner ? (_jsx("div", { className: "text-6xl mb-4", children: "\uD83C\uDF89" })) : (_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDE22" })), _jsx("h2", { className: "text-3xl font-bold mb-2", children: winner === 'draw'
                                ? '平局'
                                : isWinner
                                    ? '恭喜胜利！'
                                    : '对局结束' }), _jsx("p", { className: "text-dark-text-secondary text-sm", children: winner === 'draw'
                                ? '双方势均力敌，难分伯仲'
                                : isWinner
                                    ? '精彩对局，你赢得了这场比赛！继续保持！'
                                    : '不要气馁，胜败乃兵家常事，下次一定能赢！' })] }), _jsxs("div", { className: "flex gap-3 justify-center", children: [_jsx("button", { onClick: onRestart, className: "btn-primary px-6 py-3 text-lg", children: "\uD83D\uDD04 \u91CD\u65B0\u5BF9\u5C40" }), _jsx("button", { onClick: onClose, className: "btn-secondary px-6 py-3 text-lg", children: "\u5173\u95ED" })] })] }) }));
};
