import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const SERVER_URL = 'http://10.75.31.37:3000';
export const ConnectDialog = ({ onConnect, loading, error, }) => {
    const [playerName, setPlayerName] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [showAdminInput, setShowAdminInput] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [authError, setAuthError] = useState(null);
    const [authLoading, setAuthLoading] = useState(false);
    const [savedPlayer, setSavedPlayer] = useState(null);
    const [nameAvailable, setNameAvailable] = useState(null);
    const [checkingName, setCheckingName] = useState(false);
    // Load saved player from localStorage
    useEffect(() => {
        const savedData = localStorage.getItem('gomoku_player');
        if (savedData) {
            try {
                const player = JSON.parse(savedData);
                setSavedPlayer(player);
                setPlayerName(player.name);
            }
            catch {
                localStorage.removeItem('gomoku_player');
            }
        }
    }, []);
    // Check name availability when registering
    useEffect(() => {
        if (authMode !== 'register' || !playerName.trim()) {
            setNameAvailable(null);
            return;
        }
        const timer = setTimeout(async () => {
            setCheckingName(true);
            try {
                const res = await fetch(`${SERVER_URL}/api/auth/check-name?name=${encodeURIComponent(playerName.trim())}`);
                const data = await res.json();
                setNameAvailable(data.available);
            }
            catch {
                setNameAvailable(null);
            }
            finally {
                setCheckingName(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [playerName, authMode]);
    const handleRegister = async () => {
        const trimmedName = playerName.trim();
        if (!trimmedName) {
            setAuthError('请输入昵称');
            return;
        }
        setAuthLoading(true);
        setAuthError(null);
        try {
            const res = await fetch(`${SERVER_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmedName }),
            });
            const data = await res.json();
            if (data.success) {
                // Save player info
                localStorage.setItem('gomoku_player', JSON.stringify(data.player));
                setSavedPlayer(data.player);
                // Connect to server
                onConnect(SERVER_URL, trimmedName, showAdminInput ? adminPassword : undefined, data.player.id);
            }
            else {
                setAuthError(data.error || '注册失败');
            }
        }
        catch (err) {
            setAuthError('服务器连接失败');
        }
        finally {
            setAuthLoading(false);
        }
    };
    const handleLogin = async () => {
        const trimmedName = playerName.trim();
        if (!trimmedName) {
            setAuthError('请输入昵称');
            return;
        }
        setAuthLoading(true);
        setAuthError(null);
        try {
            const res = await fetch(`${SERVER_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmedName }),
            });
            const data = await res.json();
            if (data.success) {
                // Save player info
                localStorage.setItem('gomoku_player', JSON.stringify(data.player));
                setSavedPlayer(data.player);
                // Connect to server
                onConnect(SERVER_URL, trimmedName, showAdminInput ? adminPassword : undefined, data.player.id);
            }
            else {
                setAuthError(data.error || '登录失败');
            }
        }
        catch (err) {
            setAuthError('服务器连接失败');
        }
        finally {
            setAuthLoading(false);
        }
    };
    const handleQuickLogin = () => {
        if (savedPlayer) {
            onConnect(SERVER_URL, savedPlayer.name, showAdminInput ? adminPassword : undefined, savedPlayer.id);
        }
    };
    const handleLogout = () => {
        localStorage.removeItem('gomoku_player');
        setSavedPlayer(null);
        setPlayerName('');
    };
    const handleSubmit = () => {
        if (authMode === 'register') {
            handleRegister();
        }
        else {
            handleLogin();
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };
    const isLoading = loading || authLoading;
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-dark-bg to-dark-bg-secondary flex items-center justify-center px-4", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-5xl font-bold mb-2", children: "\u4E94\u5B50\u68CB" }), _jsx("p", { className: "text-dark-text-secondary", children: "\u5C40\u57DF\u7F51\u5B9E\u65F6\u5BF9\u6218" })] }), _jsxs("div", { className: "card-base space-y-6", children: [savedPlayer && (_jsxs("div", { className: "p-4 bg-primary/10 border border-primary/30 rounded-lg", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("span", { className: "text-sm text-dark-text-secondary", children: "\u6B22\u8FCE\u56DE\u6765" }), _jsx("button", { onClick: handleLogout, className: "text-xs text-dark-text-tertiary hover:text-danger", children: "\u9000\u51FA\u767B\u5F55" })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("p", { className: "font-bold text-lg", children: savedPlayer.name }), _jsxs("p", { className: "text-sm text-dark-text-secondary", children: ["\u79EF\u5206 ", savedPlayer.score, " | ", savedPlayer.wins, "\u80DC ", savedPlayer.losses, "\u8D1F"] })] }), _jsx("button", { onClick: handleQuickLogin, disabled: isLoading, className: "btn-primary text-sm px-4 py-2", children: "\u5FEB\u901F\u8FDB\u5165" })] })] })), !savedPlayer && (_jsxs("div", { className: "flex border-b border-dark-text-tertiary/30", children: [_jsx("button", { onClick: () => { setAuthMode('login'); setAuthError(null); }, className: `flex-1 py-2 text-center text-sm font-medium border-b-2 transition-colors ${authMode === 'login'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-dark-text-secondary hover:text-dark-text'}`, children: "\u767B\u5F55" }), _jsx("button", { onClick: () => { setAuthMode('register'); setAuthError(null); }, className: `flex-1 py-2 text-center text-sm font-medium border-b-2 transition-colors ${authMode === 'register'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-dark-text-secondary hover:text-dark-text'}`, children: "\u6CE8\u518C" })] })), !savedPlayer && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: authMode === 'register' ? '设置昵称' : '输入昵称' }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", value: playerName, onChange: (e) => setPlayerName(e.target.value), onKeyPress: handleKeyPress, placeholder: authMode === 'register' ? '给自己取个昵称吧' : '输入已注册的昵称', maxLength: 20, className: "input-base w-full pr-10" }), authMode === 'register' && playerName.trim() && (_jsx("span", { className: "absolute right-3 top-1/2 -translate-y-1/2", children: checkingName ? (_jsx("span", { className: "text-dark-text-tertiary", children: "..." })) : nameAvailable === true ? (_jsx("span", { className: "text-success", children: "\u2713" })) : nameAvailable === false ? (_jsx("span", { className: "text-danger", children: "\u2717" })) : null }))] }), authMode === 'register' && nameAvailable === false && (_jsx("p", { className: "mt-1 text-xs text-danger", children: "\u8BE5\u6635\u79F0\u5DF2\u88AB\u6CE8\u518C" })), authMode === 'register' && (_jsx("p", { className: "mt-1 text-xs text-dark-text-tertiary", children: "\u6CE8\u518C\u540E\u6635\u79F0\u5C06\u4F5C\u4E3A\u60A8\u7684\u552F\u4E00\u6807\u8BC6" }))] })), _jsx("button", { type: "button", onClick: () => setShowAdminInput(!showAdminInput), className: "text-xs text-primary hover:text-primary/80", children: showAdminInput ? '🔒 隐藏管理员选项' : '🔧 管理员登录' }), showAdminInput && (_jsxs("div", { className: "pt-4 border-t border-dark-text-tertiary/20", children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "\u7BA1\u7406\u5458\u5BC6\u7801" }), _jsx("input", { type: "password", value: adminPassword, onChange: (e) => setAdminPassword(e.target.value), onKeyPress: handleKeyPress, placeholder: "\u8F93\u5165\u7BA1\u7406\u5458\u5BC6\u7801\uFF08\u53EF\u9009\uFF09", className: "input-base w-full" })] })), (error || authError) && (_jsx("div", { className: "p-3 bg-danger/20 border border-danger rounded-lg text-sm text-danger", children: authError || error })), !savedPlayer && (_jsx("button", { onClick: handleSubmit, disabled: isLoading || (authMode === 'register' && nameAvailable === false), className: "btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed", children: isLoading
                                ? (authMode === 'register' ? '注册中...' : '登录中...')
                                : (authMode === 'register' ? '注册并进入' : '登录') })), _jsx("div", { className: "text-xs text-dark-text-tertiary", children: _jsx("p", { children: "\uD83D\uDCA1 \u670D\u52A1\u5668\u5730\u5740\uFF1A10.75.31.37:3000" }) })] })] }) }));
};
