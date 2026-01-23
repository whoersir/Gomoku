import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export const Leaderboard = ({ isOpen, onClose, embedded = false }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (isOpen) {
            loadLeaderboard();
        }
    }, [isOpen]);
    const loadLeaderboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3000/api/leaderboard?limit=10');
            if (response.ok) {
                const data = await response.json();
                setLeaderboard(data);
            }
            else {
                throw new Error('Failed to fetch leaderboard');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
            console.error('[Leaderboard] Error loading leaderboard:', err);
        }
        finally {
            setLoading(false);
        }
    };
    if (!isOpen)
        return null;
    const getRankEmoji = (index) => {
        if (index === 0)
            return '🥇';
        if (index === 1)
            return '🥈';
        if (index === 2)
            return '🥉';
        return `#${index + 1}`;
    };
    const getWinRate = (player) => {
        if (player.winRate !== undefined)
            return `${player.winRate}%`;
        if (player.totalGames === 0)
            return '0%';
        return `${((player.wins / player.totalGames) * 100).toFixed(1)}%`;
    };
    const formatLastPlayed = (timestamp) => {
        if (!timestamp)
            return '未知';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60)
            return '刚刚';
        if (seconds < 3600)
            return `${Math.floor(seconds / 60)} 分钟前`;
        if (seconds < 86400)
            return `${Math.floor(seconds / 3600)} 小时前`;
        return `${Math.floor(seconds / 86400)} 天前`;
    };
    // 内嵌模式渲染
    if (embedded) {
        return (_jsxs("div", { className: "card-base p-4 h-full", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "\uD83C\uDFC6 \u6392\u884C\u699C" }), loading ? (_jsx("div", { className: "text-center py-8 text-dark-text-secondary", children: "\u52A0\u8F7D\u4E2D..." })) : error ? (_jsx("div", { className: "text-center py-8 text-danger", children: error })) : leaderboard.length === 0 ? (_jsx("div", { className: "text-center py-8 text-dark-text-secondary", children: "\u6682\u65E0\u6392\u884C\u6570\u636E" })) : (_jsx("div", { className: "space-y-2", children: leaderboard.map((player, index) => (_jsxs("div", { className: `flex items-center gap-3 p-2 rounded-lg ${index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                            index === 1 ? 'bg-gray-400/10 border border-gray-400/30' :
                                index === 2 ? 'bg-orange-500/10 border border-orange-500/30' :
                                    'hover:bg-dark-bg-tertiary'}`, children: [_jsx("span", { className: "font-bold w-8", children: getRankEmoji(index) }), _jsx("span", { className: "flex-1 truncate", children: player.name }), _jsx("span", { className: "text-primary font-bold", children: player.score }), _jsxs("span", { className: "text-xs text-dark-text-secondary w-16 text-right", children: [player.wins, "\u80DC", player.losses, "\u8D1F"] })] }, player.id))) })), _jsx("div", { className: "mt-4 text-xs text-dark-text-tertiary text-center", children: "\uD83D\uDCA1 \u80DC\u5229 +25\u5206\uFF0C\u5931\u8D25 -20\u5206" })] }));
    }
    // 弹窗模式渲染
    return (_jsx("div", { className: "fixed inset-0 bg-black/60 flex items-center justify-center z-50", children: _jsxs("div", { className: "card-base max-w-2xl w-full mx-4 p-6 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-2xl font-bold", children: "\uD83C\uDFC6 \u6392\u884C\u699C" }), _jsx("button", { onClick: onClose, className: "text-dark-text-secondary hover:text-dark-text-primary transition-colors text-2xl", children: "\u2715" })] }), loading ? (_jsx("div", { className: "text-center py-8 text-dark-text-secondary", children: "\u52A0\u8F7D\u4E2D..." })) : error ? (_jsx("div", { className: "text-center py-8 text-danger", children: error })) : leaderboard.length === 0 ? (_jsx("div", { className: "text-center py-8 text-dark-text-secondary", children: "\u6682\u65E0\u6392\u884C\u6570\u636E" })) : (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-12 gap-2 text-sm font-semibold text-dark-text-secondary pb-2 border-b border-dark-text-tertiary/20", children: [_jsx("div", { className: "col-span-1", children: "\u6392\u540D" }), _jsx("div", { className: "col-span-3", children: "\u73A9\u5BB6" }), _jsx("div", { className: "col-span-2 text-center", children: "\u79EF\u5206" }), _jsx("div", { className: "col-span-2 text-center", children: "\u80DC\u7387" }), _jsx("div", { className: "col-span-2 text-center", children: "\u6218\u7EE9" }), _jsx("div", { className: "col-span-2 text-center", children: "\u6700\u8FD1\u5BF9\u5C40" })] }), leaderboard.map((player, index) => (_jsxs("div", { className: `grid grid-cols-12 gap-2 text-sm py-3 px-3 rounded-lg transition-colors ${index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                                index === 1 ? 'bg-gray-400/10 border border-gray-400/30' :
                                    index === 2 ? 'bg-orange-500/10 border border-orange-500/30' :
                                        'hover:bg-dark-bg-tertiary'}`, children: [_jsx("div", { className: "col-span-1 font-bold text-lg", children: getRankEmoji(index) }), _jsx("div", { className: "col-span-3 font-medium truncate", children: player.name }), _jsx("div", { className: "col-span-2 text-center font-bold text-primary", children: player.score }), _jsx("div", { className: "col-span-2 text-center text-dark-text-secondary", children: getWinRate(player) }), _jsxs("div", { className: "col-span-2 text-center text-dark-text-secondary", children: [player.wins, "\u80DC", player.losses, "\u8D1F", player.draws ? `${player.draws}平` : ''] }), _jsx("div", { className: "col-span-2 text-center text-dark-text-tertiary text-xs", children: formatLastPlayed(player.lastPlayedAt) })] }, player.id)))] })), _jsx("div", { className: "mt-6 text-xs text-dark-text-tertiary text-center", children: "\uD83D\uDCA1 \u80DC\u5229 +25\u5206\uFF0C\u5931\u8D25 -20\u5206\uFF0C\u5E73\u5C40\u4E0D\u53D8" })] }) }));
};
