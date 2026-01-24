// 玩家统计信息
export interface PlayerStats {
  score: number;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number; // 胜率，0-100
}

// 玩家信息（包含统计）
export interface PlayerInfo {
  id: string;
  name: string;
  stats?: PlayerStats;
}

export interface GameState {
  roomId: string;
  roomName: string;
  board: number[][];
  currentPlayer: 1 | 2;
  players: {
    black: PlayerInfo;
    white: PlayerInfo;
  };
  spectators: { id: string; name: string }[];
  status: 'waiting' | 'playing' | 'finished';
  winner?: 1 | 2 | 'draw';
  moves: Array<{ x: number; y: number; player: 1 | 2; timestamp: number }>;
  createdAt: number;
  finishedAt?: number;
}

export interface Room {
  roomId: string;
  gameState: GameState;
  messages: ChatMessage[];
  playerSockets: Map<string, any>;
  maxPlayers: 2;
  createdAt: number;
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export interface HistoryRecord {
  roomId: string;
  blackPlayer: { id: string; name: string };
  whitePlayer: { id: string; name: string };
  winner?: 1 | 2 | 'draw';
  moveCount: number;
  createdAt: number;
  finishedAt: number;
  duration: number;
}
