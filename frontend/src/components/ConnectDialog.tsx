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
    <div className="login-page">
      <div className="login-color"></div>
      <div className="login-color"></div>
      <div className="login-color"></div>

      <div className="login-box">
        <div className="login-square" style={{ '--i': 0 } as React.CSSProperties}></div>
        <div className="login-square" style={{ '--i': 1 } as React.CSSProperties}></div>
        <div className="login-square" style={{ '--i': 2 } as React.CSSProperties}></div>
        <div className="login-square" style={{ '--i': 3 } as React.CSSProperties}></div>
        <div className="login-square" style={{ '--i': 4 } as React.CSSProperties}></div>

        <div className="login-container">
          <div className="login-form">
            <h2>五子棋 - {authMode === 'login' ? '登录' : '注册'}</h2>

            {/* Saved Player Quick Login */}
            {savedPlayer && (
              <div className="inputBox">
                <div style={{ color: '#fff', marginBottom: '15px', fontSize: '14px' }}>
                  欢迎回来，{savedPlayer.name}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginBottom: '10px' }}>
                  积分 {savedPlayer.score} | {savedPlayer.wins}胜 {savedPlayer.losses}负
                </div>
                <input
                  type="submit"
                  value={isLoading ? '连接中...' : '快速进入'}
                  disabled={isLoading}
                  style={{ width: '100%' }}
                />
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    marginTop: '10px',
                    width: '100%'
                  }}
                >
                  退出登录
                </button>
              </div>
            )}

            {/* Auth Mode Tabs */}
            {!savedPlayer && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                  onClick={() => { setAuthMode('login'); setAuthError(null); }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: authMode === 'login' ? 'rgba(255,255,255,0.3)' : 'transparent',
                    border: '1px solid rgba(255,255,255,0.5)',
                    borderRadius: '20px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s'
                  }}
                >
                  登录
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setAuthError(null); }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: authMode === 'register' ? 'rgba(255,255,255,0.3)' : 'transparent',
                    border: '1px solid rgba(255,255,255,0.5)',
                    borderRadius: '20px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s'
                  }}
                >
                  注册
                </button>
              </div>
            )}

            {/* Name Input */}
            {!savedPlayer && (
              <div className="inputBox">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={authMode === 'register' ? '设置昵称' : '输入昵称'}
                  maxLength={20}
                />
                {authMode === 'register' && playerName.trim() && (
                  <span style={{
                    position: 'absolute',
                    right: '60px',
                    top: 'calc(50% + 80px)',
                    transform: 'translateY(-50%)',
                    color: nameAvailable === true ? '#4ade80' : (nameAvailable === false ? '#f87171' : '#fff')
                  }}>
                    {checkingName ? '...' : (nameAvailable === true ? '✓' : (nameAvailable === false ? '✗' : ''))}
                  </span>
                )}
                {authMode === 'register' && nameAvailable === false && (
                  <p style={{ color: '#f87171', fontSize: '12px', marginTop: '5px' }}>该昵称已被注册</p>
                )}
                {authMode === 'register' && nameAvailable === true && (
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginTop: '5px' }}>
                    注册后昵称将作为您的唯一标识
                  </p>
                )}
              </div>
            )}

            {/* Admin Password Toggle */}
            <button
              type="button"
              onClick={() => setShowAdminInput(!showAdminInput)}
              style={{
                marginTop: '10px',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '5px 0'
              }}
            >
              {showAdminInput ? '🔒 隐藏管理员选项' : '🔧 管理员登录'}
            </button>

          {showAdminInput && (
            <div className="inputBox">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入管理员密码（可选）"
              />
            </div>
          )}

          {/* Error Messages */}
          {(error || authError) && (
            <div style={{
              padding: '10px 15px',
              background: 'rgba(248, 113, 113, 0.2)',
              border: '1px solid rgba(248, 113, 113, 0.5)',
              borderRadius: '10px',
              color: '#f87171',
              fontSize: '13px',
              marginTop: '15px'
            }}>
              {authError || error}
            </div>
          )}

          {/* Submit Button */}
          {!savedPlayer && (
            <div className="inputBox">
              <button
                onClick={handleSubmit}
                disabled={isLoading || (authMode === 'register' && nameAvailable === false)}
              >
                {isLoading
                  ? (authMode === 'register' ? '注册中...' : '登录中...')
                  : (authMode === 'register' ? '注册并进入' : '登录')
                }
              </button>
            </div>
          )}

          {/* Server Info */}
          <div className="login-forget">
            💡 服务器地址：10.75.31.37:3000
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
