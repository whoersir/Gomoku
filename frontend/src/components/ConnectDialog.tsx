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
  onConnect: (serverUrl: string, playerName: string, playerId?: string) => void;
  loading: boolean;
  error: string | null;
}

const SERVER_URL = 'http://127.0.0.1:3000';

export const ConnectDialog: React.FC<ConnectDialogProps> = ({
  onConnect,
  loading,
  error,
}) => {
  const [playerName, setPlayerName] = useState('');
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
        onConnect(SERVER_URL, trimmedName, data.player.id);
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
        onConnect(SERVER_URL, trimmedName, data.player.id);
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
      onConnect(SERVER_URL, savedPlayer.name, savedPlayer.id);
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
      {/* 背景色彩光晕 */}
      <div className="color"></div>
      <div className="color"></div>
      <div className="color"></div>
      
      <div className="login-box">
        {/* 浮动方块 */}
        <div className="square" style={{'--i': 0} as React.CSSProperties}></div>
        <div className="square" style={{'--i': 1} as React.CSSProperties}></div>
        <div className="square" style={{'--i': 2} as React.CSSProperties}></div>
        <div className="square" style={{'--i': 3} as React.CSSProperties}></div>
        <div className="square" style={{'--i': 4} as React.CSSProperties}></div>

        <div className="login-container">
          <div className="login-form">
            <h2>五子棋 - {authMode === 'login' ? '登录' : '注册'}</h2>

            {/* Saved Player Quick Login */}
            {savedPlayer && (
              <div>
                <div className="saved-player-info">
                  <div className="welcome-message">欢迎回来，{savedPlayer.name}</div>
                  <div className="player-stats">积分 {savedPlayer.score} | {savedPlayer.wins}胜 {savedPlayer.losses}负</div>
                </div>
                <div className="inputBox">
                  <button
                    type="submit"
                    disabled={isLoading}
                    onClick={handleQuickLogin}
                  >
                    {isLoading ? '连接中...' : '快速进入'}
                  </button>
                </div>
                <div className="inputBox">
                  <button
                    onClick={handleLogout}
                    style={{background: 'rgba(255, 255, 255, 0.1)', color: '#fff'}}
                  >
                    退出登录
                  </button>
                </div>
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
                  <span className={`name-check ${nameAvailable === true ? 'available' : (nameAvailable === false ? 'taken' : '')}`}>
                    {checkingName ? '...' : (nameAvailable === true ? '✓' : (nameAvailable === false ? '✗' : ''))}
                  </span>
                )}
                {authMode === 'register' && nameAvailable === false && (
                  <p className="name-error">该昵称已被注册</p>
                )}
                {authMode === 'register' && nameAvailable === true && (
                  <p className="name-hint">
                    注册后昵称将作为您的唯一标识
                  </p>
                )}
              </div>
            )}

            {/* Error Messages */}
            {(error || authError) && (
              <div className="error-message">
                {authError || error}
              </div>
            )}

            {/* Submit Button */}
            {!savedPlayer && (
              <div>
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
                
                {/* 模式切换提示 */}
                {authMode === 'login' ? (
                  <div className="login-forget" style={{fontSize: '1.05em'}}>
                    没有帐户？<a href="#" onClick={(e) => { e.preventDefault(); setAuthMode('register'); }}>注册</a>
                  </div>
                ) : (
                  <div className="login-forget" style={{fontSize: '1.05em'}}>
                    已有帐户？<a href="#" onClick={(e) => { e.preventDefault(); setAuthMode('login'); }}>登录</a>
                  </div>
                )}
              </div>
            )}

            {/* Server Info */}
            <div className="login-forget">
              💡 服务器地址：{SERVER_URL.replace('http://', '')}
            </div>
        </div>
      </div>
    </div>
  </div>
  );
};
