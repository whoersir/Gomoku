import { GameEngine } from './GameEngine';
import { GameState, ChatMessage } from '../types/game';

export class Room {
  private roomId: string;
  private roomName: string; // 房间名称
  private gameEngine: GameEngine | null = null;
  private messages: ChatMessage[] = [];
  private playerSockets: Map<string, any> = new Map();
  private spectatorSockets: Map<string, any> = new Map(); // 观战者
  private spectatorNames: Map<string, string> = new Map(); // 观战者名称映射
  private blackPlayer: { id: string; name: string } | null = null;
  private whitePlayer: { id: string; name: string } | null = null;
  private createdAt: number;
  private maxPlayers = 2;

  constructor(roomId: string, roomName: string) {
    this.roomId = roomId;
    this.roomName = roomName;
    this.createdAt = Date.now();
  }

  getRoomId(): string {
    return this.roomId;
  }

  addPlayer(playerId: string, playerName: string, socket: any): { success: boolean; color?: 1 | 2; message?: string } {
    if (this.playerSockets.size >= this.maxPlayers) {
      return { success: false, message: 'Room is full' };
    }

    // If player already exists, update their socket (in case of reconnection)
    if (this.playerSockets.has(playerId)) {
      this.playerSockets.set(playerId, socket);
      // Return their existing color
      if (this.blackPlayer?.id === playerId) {
        return { success: true, color: 1 };
      } else if (this.whitePlayer?.id === playerId) {
        return { success: true, color: 2 };
      }
      return { success: false, message: 'Unable to assign color' };
    }

    // 检查玩家名称是否已经在房间中（防止同一玩家用不同socket加入两次）
    if (this.blackPlayer?.name === playerName) {
      console.log(`[Room.addPlayer] Player ${playerName} already in room as black player`);
      return { success: false, message: '你已经在这个房间中了' };
    }
    if (this.whitePlayer?.name === playerName) {
      console.log(`[Room.addPlayer] Player ${playerName} already in room as white player`);
      return { success: false, message: '你已经在这个房间中了' };
    }

    this.playerSockets.set(playerId, socket);

    console.log(`[Room.addPlayer] Player ${playerName} (${playerId}) joining room ${this.roomId}`);
    console.log(`[Room.addPlayer] Current players - black: ${!!this.blackPlayer}, white: ${!!this.whitePlayer}`);
    console.log(`[Room.addPlayer] Player sockets count: ${this.playerSockets.size}`);

    if (!this.blackPlayer) {
      this.blackPlayer = { id: playerId, name: playerName };
      console.log(`[Room.addPlayer] Assigned as black player`);
      if (this.whitePlayer) {
        this.startGame();
      }
      return { success: true, color: 1 };
    } else if (!this.whitePlayer) {
      this.whitePlayer = { id: playerId, name: playerName };
      console.log(`[Room.addPlayer] Assigned as white player, starting game`);
      this.startGame();
      return { success: true, color: 2 };
    }

    return { success: false, message: 'Unable to assign color' };
  }

  removePlayer(playerId: string): void {
    this.playerSockets.delete(playerId);

    if (this.blackPlayer?.id === playerId) {
      this.blackPlayer = null;
    } else if (this.whitePlayer?.id === playerId) {
      this.whitePlayer = null;
    }

    if (this.gameEngine && this.playerSockets.size < 2) {
      this.gameEngine = null;
    }
  }

  // 观战者加入房间
  addSpectator(spectatorId: string, spectatorName: string, socket: any): { success: boolean; message?: string } {
    if (this.spectatorSockets.has(spectatorId)) {
      // 更新观战者socket（重连情况）
      this.spectatorSockets.set(spectatorId, socket);
      this.spectatorNames.set(spectatorId, spectatorName);
      console.log(`[Room.addSpectator] Spectator ${spectatorName} (${spectatorId}) reconnected to room ${this.roomId}`);
      return { success: true };
    }

    this.spectatorSockets.set(spectatorId, socket);
    this.spectatorNames.set(spectatorId, spectatorName);
    console.log(`[Room.addSpectator] Spectator ${spectatorName} (${spectatorId}) joined room ${this.roomId}`);
    return { success: true };
  }

  // 移除观战者
  removeSpectator(spectatorId: string): void {
    this.spectatorSockets.delete(spectatorId);
    this.spectatorNames.delete(spectatorId);
  }

  // 获取观战者列表
  getSpectators(): { id: string; name: string }[] {
    const spectators: { id: string; name: string }[] = [];
    // 使用 spectatorNames Map 获取观战者名称
    this.spectatorNames.forEach((name, id) => {
      spectators.push({ id, name });
    });
    return spectators;
  }

  // 获取观战者sockets
  getSpectatorSockets(): Map<string, any> {
    return new Map(this.spectatorSockets);
  }

  // 获取观战者数量
  getSpectatorCount(): number {
    return this.spectatorSockets.size;
  }

  private startGame(): void {
    if (this.blackPlayer && this.whitePlayer) {
      console.log(`[Room.startGame] Starting game for room ${this.roomId} (${this.roomName})`);
      console.log(`[Room.startGame] Black player:`, this.blackPlayer);
      console.log(`[Room.startGame] White player:`, this.whitePlayer);
      this.gameEngine = new GameEngine(this.roomId, this.roomName, this.blackPlayer, this.whitePlayer);
      const gameState = this.gameEngine.getGameState();
      console.log(`[Room.startGame] Game engine created, initial gameState:`, gameState);
    } else {
      console.log(`[Room.startGame] Cannot start game - blackPlayer: ${!!this.blackPlayer}, whitePlayer: ${!!this.whitePlayer}`);
    }
  }

  restartGame(): GameState {
    console.log(`[Room.restartGame] Restarting game for room ${this.roomId} (${this.roomName})`);
    console.log(`[Room.restartGame] Current players - black: ${!!this.blackPlayer}, white: ${!!this.whitePlayer}`);

    // 只有当两个玩家都在时才重启游戏
    if (this.blackPlayer && this.whitePlayer) {
      this.gameEngine = new GameEngine(this.roomId, this.roomName, this.blackPlayer, this.whitePlayer);
      const gameState = this.gameEngine.getGameState();
      console.log(`[Room.restartGame] Game restarted, new gameState:`, gameState);
      return gameState;
    }

    // 如果只有一个玩家或没有玩家，清除游戏引擎，返回等待状态
    this.gameEngine = null;
    console.log(`[Room.restartGame] Game cleared, waiting for players`);
    
    // 返回一个等待状态
    return {
      roomId: this.roomId,
      roomName: this.roomName,
      board: Array(15).fill(null).map(() => Array(15).fill(0)),
      currentPlayer: 1,
      status: 'waiting',
      moves: [],
      players: {
        black: this.blackPlayer || { id: '', name: 'Waiting...' },
        white: this.whitePlayer || { id: '', name: 'Waiting...' }
      },
      spectators: this.getSpectators(),
      createdAt: Date.now()
    };
  }

  makeMove(playerId: string, x: number, y: number) {
    if (!this.gameEngine) {
      return { success: false, message: 'Game not started' };
    }
    return this.gameEngine.makeMove(x, y, playerId);
  }

  getGameState(): GameState | null {
    if (!this.gameEngine) {
      console.log(`[Room.getGameState] No game engine yet for room ${this.roomId}`);
      return null;
    }
    const state = this.gameEngine.getGameState();
    // 添加观战人员信息
    const spectators = this.getSpectators();
    state.spectators = spectators;
    console.log(`[Room.getGameState] Returning game state:`, {
      roomId: state.roomId,
      status: state.status,
      players: state.players,
      spectators: spectators,
      spectatorCount: spectators.length
    });
    return state;
  }

  addMessage(playerId: string, playerName: string, message: string): ChatMessage {
    const chatMessage: ChatMessage = {
      playerId,
      playerName,
      message,
      timestamp: Date.now(),
    };
    this.messages.push(chatMessage);
    return chatMessage;
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  getPlayerSockets(): Map<string, any> {
    return new Map(this.playerSockets);
  }

  getPlayerCount(): number {
    return this.playerSockets.size;
  }

  isFull(): boolean {
    return this.playerSockets.size >= this.maxPlayers;
  }

  isEmpty(): boolean {
    return this.playerSockets.size === 0;
  }

  getStatus(): 'waiting' | 'playing' | 'finished' {
    if (!this.gameEngine) {
      return 'waiting';
    }
    const state = this.gameEngine.getGameState();
    return state.status;
  }

  getRoomInfo() {
    return {
      roomId: this.roomId,
      roomName: this.roomName,
      blackPlayer: this.blackPlayer,
      whitePlayer: this.whitePlayer,
      status: this.getStatus(),
      playerCount: this.getPlayerCount(),
      spectators: this.getSpectators(),
      spectatorCount: this.getSpectatorCount(),
      createdAt: this.createdAt,
    };
  }
}
