export interface HistoryQueryOptions {
  limit?: number;
  offset?: number;
  playerName?: string;
  startDate?: number;
  endDate?: number;
}

export interface HistoryResponse {
  total: number;
  records: HistoryRecord[];
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
