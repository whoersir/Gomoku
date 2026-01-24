export interface ServerToClientEvents {
  gameState: (state: any) => void;
  chat: (message: any) => void;
  playerJoined: (player: any) => void;
  playerLeft: (playerId: string) => void;
  roomList: (rooms: any[]) => void;
  gameFinished: (result: any) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  move: (data: { roomId: string; x: number; y: number }) => void;
  chat: (data: { roomId: string; message: string }) => void;
  joinRoom: (data: { roomId: string; playerName: string }) => void;
  createRoom: (data: { playerName: string }) => void;
  getRoomList: () => void;
  getHistory: (data: { limit?: number; offset?: number }) => void;
  disconnect: () => void;
}
