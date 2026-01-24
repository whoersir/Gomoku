import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
export const PlayerHistory = ({ isOpen, playerName, onClose, serverUrl, embedded = false }) => {
    if (!isOpen)
        return null;
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetchPlayerData();
    }, [playerName, serverUrl]);
    const fetchPlayerData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 获取对局历史记录
            const historyResponse = await fetch(`${serverUrl}/api/history/player/${encodeURIComponent(playerName)}?limit=50`);
            const historyData = await historyResponse.json();
            setHistory(historyData);
        }
        catch (err) {
            console.error('Failed to fetch player data:', err);
            setError('获取玩家数据失败');
        }
        finally {
            setLoading(false);
        }
    };
    // 从历史记录计算真实统计数据
    const stats = useMemo(() => {
        if (history.length === 0)
            return null;
        let wins = 0;
        let losses = 0;
        let draws = 0;
        let lastPlayedAt = 0;
        history.forEach(record => {
            if (record.finishedAt > lastPlayedAt) {
                lastPlayedAt = record.finishedAt;
            }
            if (record.winner === 'draw' || !record.winner) {
                draws++;
            }
            else {
                const isBlack = record.blackPlayer.name === playerName;
                const playerWon = (record.winner === 1 && isBlack) || (record.winner === 2 && !isBlack);
                if (playerWon) {
                    wins++;
                }
                else {
                    losses++;
                }
            }
        });
        return {
            id: '',
            name: playerName,
            score: wins * 10 - losses * 10, // 估算分数
            totalGames: history.length,
            wins,
            losses,
            draws,
            lastPlayedAt,
        };
    }, [history, playerName]);
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    const formatDuration = (ms, record) => {
        // 如果没有 duration 字段，尝试从 createdAt 和 finishedAt 计算
        const duration = ms ?? (record.finishedAt - record.createdAt);
        if (!duration || isNaN(duration))
            return '未知';
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        return `${minutes}分${seconds}秒`;
    };
    const getResultText = (record) => {
        if (!record.winner)
            return '🤝 平局';
        const playerWon = record.winner === 1
            ? record.blackPlayer.name === playerName
            : record.whitePlayer.name === playerName;
        return playerWon ? '🏆 胜利' : '😢 失败';
    };
    const getResultClass = (record) => {
        if (!record.winner)
            return 'text-gray-400';
        const playerWon = record.winner === 1
            ? record.blackPlayer.name === playerName
            : record.whitePlayer.name === playerName;
        return playerWon ? 'text-success' : 'text-danger';
    };
    const getWinRate = () => {
        if (!stats || stats.totalGames === 0)
            return '0%';
        return ((stats.wins / stats.totalGames) * 100).toFixed(1) + '%';
    };
    if (loading) {
        if (embedded) {
            return (_jsxs("div", { className: "card-base p-4 h-full", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "\uD83D\uDCCA \u6211\u7684\u8BB0\u5F55" }), _jsx("div", { className: "text-center py-8 text-dark-text-secondary", children: "\u52A0\u8F7D\u4E2D..." })] }));
        }
        return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "card-base p-8 text-center", children: [_jsx("div", { className: "animate-spin text-4xl mb-4", children: "\u23F3" }), _jsx("p", { children: "\u52A0\u8F7D\u4E2D..." })] }) }));
    }
    // 内嵌模式渲染
    if (embedded) {
        return (_jsxs("div", { className: "card-base p-4 h-full overflow-y-auto", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "\uD83D\uDCCA \u6211\u7684\u8BB0\u5F55" }), error ? (_jsx("div", { className: "text-center py-8 text-danger", children: error })) : history.length === 0 ? (_jsx("div", { className: "text-center py-8 text-dark-text-secondary", children: "\u6682\u65E0\u5BF9\u5C40\u8BB0\u5F55" })) : (_jsxs(_Fragment, { children: [stats && (_jsxs("div", { className: "bg-dark-bg-secondary rounded-lg p-4 mb-4", children: [_jsx("div", { className: "text-lg font-bold text-primary mb-2", children: stats.name }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-dark-text-secondary", children: "\u79EF\u5206:" }), _jsx("span", { className: "font-bold text-accent", children: stats.score })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-dark-text-secondary", children: "\u80DC\u7387:" }), _jsx("span", { className: "font-bold text-success", children: getWinRate() })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-dark-text-secondary", children: "\u6218\u7EE9:" }), _jsxs("span", { className: "font-bold", children: [stats.wins, "\u80DC ", stats.losses, "\u8D1F"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-dark-text-secondary", children: "\u603B\u573A\u6B21:" }), _jsx("span", { className: "font-bold", children: stats.totalGames })] })] })] })), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-sm font-bold text-dark-text-secondary", children: "\uD83D\uDCDC \u6700\u8FD1\u5BF9\u5C40" }), history.slice(0, 5).map((record, index) => (_jsxs("div", { className: "bg-dark-bg-secondary rounded-lg p-3 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: `font-bold ${getResultClass(record)}`, children: getResultText(record) }), _jsx("span", { className: "text-xs text-dark-text-tertiary", children: formatDate(record.finishedAt) })] }), _jsxs("div", { className: "text-xs text-dark-text-secondary", children: ["\u26AB ", record.blackPlayer.name, " vs \u26AA ", record.whitePlayer.name] })] }, `${record.roomId}-${index}`)))] })] }))] }));
    }
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "card-base w-full max-w-4xl max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold", children: "\uD83C\uDFAE \u73A9\u5BB6\u5BF9\u5C40\u8BB0\u5F55" }), _jsx("button", { onClick: onClose, className: "text-dark-text-tertiary hover:text-dark-text-primary text-2xl", children: "\u2715" })] }), error ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("p", { className: "text-danger mb-4", children: error }), _jsx("button", { onClick: onClose, className: "btn-secondary", children: "\u5173\u95ED" })] })) : history.length === 0 ? (_jsx("div", { className: "text-center py-8 text-dark-text-secondary", children: "\u6682\u65E0\u5BF9\u5C40\u8BB0\u5F55" })) : (_jsxs(_Fragment, { children: [stats && (_jsxs("div", { className: "bg-dark-bg-secondary rounded-lg p-6 mb-6", children: [_jsx("h3", { className: "text-xl font-bold mb-4", children: "\uD83D\uDCCA \u73A9\u5BB6\u7EDF\u8BA1" }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold text-primary", children: stats.name }), _jsx("div", { className: "text-sm text-dark-text-secondary", children: "\u6635\u79F0" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold text-accent", children: stats.score }), _jsx("div", { className: "text-sm text-dark-text-secondary", children: "\u603B\u5206\u6570" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold text-success", children: getWinRate() }), _jsx("div", { className: "text-sm text-dark-text-secondary", children: "\u80DC\u7387" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold", children: stats.wins }), _jsx("div", { className: "text-sm text-dark-text-secondary", children: "\u80DC\u573A" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold", children: stats.losses }), _jsx("div", { className: "text-sm text-dark-text-secondary", children: "\u8D25\u573A" })] })] }), _jsxs("div", { className: "mt-4 pt-4 border-t border-dark-text-tertiary/20 grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-dark-text-secondary", children: "\u603B\u573A\u6B21:" }), _jsx("span", { className: "font-bold", children: stats.totalGames })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-dark-text-secondary", children: "\u6700\u540E\u5BF9\u5C40:" }), _jsx("span", { className: "font-bold", children: formatDate(stats.lastPlayedAt) })] })] })] })), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold mb-4", children: "\uD83D\uDCDC \u5BF9\u5C40\u5386\u53F2" }), _jsx("div", { className: "space-y-3", children: history.map((record, index) => (_jsxs("div", { className: "bg-dark-bg-secondary rounded-lg p-4 hover:bg-dark-bg-secondary/80 transition-colors", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("div", { className: `font-bold text-lg ${getResultClass(record)}`, children: getResultText(record) }), _jsx("div", { className: "text-sm text-dark-text-secondary", children: formatDate(record.finishedAt) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-2xl", children: "\u26AB" }), _jsx("span", { children: record.blackPlayer.name }), record.winner === 1 && _jsx("span", { className: "text-success", children: "\uD83C\uDFC6" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-2xl", children: "\u26AA" }), _jsx("span", { children: record.whitePlayer.name }), record.winner === 2 && _jsx("span", { className: "text-success", children: "\uD83C\uDFC6" })] })] }), _jsxs("div", { className: "flex justify-between text-xs text-dark-text-secondary", children: [_jsxs("span", { children: ["\uD83C\uDFAF \u624B\u6570: ", record.moveCount] }), _jsxs("span", { children: ["\u23F1\uFE0F \u65F6\u957F: ", formatDuration(record.duration, record)] }), _jsxs("span", { children: ["\uD83C\uDFE0 \u623F\u95F4: ", record.roomId] })] })] }, `${record.roomId}-${index}`))) })] })] })), _jsx("div", { className: "mt-6 pt-4 border-t border-dark-text-tertiary/20", children: _jsx("button", { onClick: onClose, className: "btn-secondary w-full", children: "\u5173\u95ED" }) })] }) }));
};
