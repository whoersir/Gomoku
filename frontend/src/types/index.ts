export interface GameState {
  roomId: string;
  roomName: string;
  board: number[][];
  currentPlayer: 1 | 2;
  players: {
    black: { id: string; name: string };
    white: { id: string; name: string };
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
  roomName?: string;
  blackPlayer?: { id: string; name: string };
  whitePlayer?: { id: string; name: string };
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
  playerCount: number;
  spectatorCount?: number;
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
