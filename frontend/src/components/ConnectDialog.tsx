import React, { useState, useEffect } from 'react';

interface PlayerInfo {
  id: string;
  name: string;
  score: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
}

interface ConnectDialogProps {
  onConnect: (serverUrl: string, playerName: string, adminPassword?: string, playerId?: string) => void;
  loading: boolean;
  error: string | null;
}

const SERVER_URL = 'http://10.75.31.37:3000';

export const ConnectDialog: React.FC<ConnectDialogProps> = ({
  onConnect,
  loading,
  error,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [savedPlayer, setSavedPlayer] = useState<PlayerInfo | null>(null);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [checkingName, setCheckingName] = useState(false);

  // Load saved player from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('gomoku_player');
    if (savedData) {
      try {
        const player = JSON.parse(savedData);
        setSavedPlayer(player);
        setPlayerName(player.name);
      } catch {
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
      } catch {
        setNameAvailable(null);
      } finally {
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
      } else {
        setAuthError(data.error || '注册失败');
      }
    } catch (err) {
      setAuthError('服务器连接失败');
    } finally {
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
      } else {
        setAuthError(data.error || '登录失败');
      }
    } catch (err) {
      setAuthError('服务器连接失败');
    } finally {
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
    } else {
      handleLogin();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isLoading = loading || authLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-bg-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">五子棋</h1>
          <p className="text-dark-text-secondary">局域网实时对战</p>
        </div>

        {/* Connection Card */}
        <div className="card-base space-y-6">
          {/* Saved Player Quick Login */}
          {savedPlayer && (
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-dark-text-secondary">欢迎回来</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-dark-text-tertiary hover:text-danger"
                >
                  退出登录
                </button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{savedPlayer.name}</p>
                  <p className="text-sm text-dark-text-secondary">
                    积分 {savedPlayer.score} | {savedPlayer.wins}胜 {savedPlayer.losses}负
                  </p>
                </div>
                <button
                  onClick={handleQuickLogin}
                  disabled={isLoading}
                  className="btn-primary text-sm px-4 py-2"
                >
                  快速进入
                </button>
              </div>
            </div>
          )}

          {/* Auth Mode Tabs */}
          {!savedPlayer && (
            <div className="flex border-b border-dark-text-tertiary/30">
              <button
                onClick={() => { setAuthMode('login'); setAuthError(null); }}
                className={`flex-1 py-2 text-center text-sm font-medium border-b-2 transition-colors ${
                  authMode === 'login'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-dark-text-secondary hover:text-dark-text'
                }`}
              >
                登录
              </button>
              <button
                onClick={() => { setAuthMode('register'); setAuthError(null); }}
                className={`flex-1 py-2 text-center text-sm font-medium border-b-2 transition-colors ${
                  authMode === 'register'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-dark-text-secondary hover:text-dark-text'
                }`}
              >
                注册
              </button>
            </div>
          )}

          {/* Name Input */}
          {!savedPlayer && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {authMode === 'register' ? '设置昵称' : '输入昵称'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={authMode === 'register' ? '给自己取个昵称吧' : '输入已注册的昵称'}
                  maxLength={20}
                  className="input-base w-full pr-10"
                />
                {authMode === 'register' && playerName.trim() && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingName ? (
                      <span className="text-dark-text-tertiary">...</span>
                    ) : nameAvailable === true ? (
                      <span className="text-success">✓</span>
                    ) : nameAvailable === false ? (
                      <span className="text-danger">✗</span>
                    ) : null}
                  </span>
                )}
              </div>
              {authMode === 'register' && nameAvailable === false && (
                <p className="mt-1 text-xs text-danger">该昵称已被注册</p>
              )}
              {authMode === 'register' && (
                <p className="mt-1 text-xs text-dark-text-tertiary">
                  注册后昵称将作为您的唯一标识
                </p>
              )}
            </div>
          )}

          {/* Admin Password Toggle */}
          <button
            type="button"
            onClick={() => setShowAdminInput(!showAdminInput)}
            className="text-xs text-primary hover:text-primary/80"
          >
            {showAdminInput ? '🔒 隐藏管理员选项' : '🔧 管理员登录'}
          </button>

          {showAdminInput && (
            <div className="pt-4 border-t border-dark-text-tertiary/20">
              <label className="block text-sm font-medium mb-2">管理员密码</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入管理员密码（可选）"
                className="input-base w-full"
              />
            </div>
          )}

          {/* Error Messages */}
          {(error || authError) && (
            <div className="p-3 bg-danger/20 border border-danger rounded-lg text-sm text-danger">
              {authError || error}
            </div>
          )}

          {/* Submit Button */}
          {!savedPlayer && (
            <button
              onClick={handleSubmit}
              disabled={isLoading || (authMode === 'register' && nameAvailable === false)}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? (authMode === 'register' ? '注册中...' : '登录中...')
                : (authMode === 'register' ? '注册并进入' : '登录')
              }
            </button>
          )}

          <div className="text-xs text-dark-text-tertiary">
            <p>💡 服务器地址：10.75.31.37:3000</p>
          </div>
        </div>
      </div>
    </div>
  );
};
