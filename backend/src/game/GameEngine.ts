import { Board } from './Board';
import { WinChecker } from './WinChecker';
import { GameState } from '../types/game';
import { log } from '../utils/logger';

export class GameEngine {
  private board: Board;
  private winChecker: WinChecker;
  private gameState: GameState;

  constructor(
    roomId: string,
    roomName: string,
    blackPlayer: { id: string; name: string },
    whitePlayer: { id: string; name: string }
  ) {
    this.board = new Board(15);
    this.winChecker = new WinChecker();
    this.gameState = {
      roomId,
      roomName,
      board: this.board.getBoard(),
      currentPlayer: 1,
      players: {
        black: blackPlayer,
        white: whitePlayer,
      },
      spectators: [],
      status: 'playing',
      moves: [],
      createdAt: Date.now(),
    };
  }

  makeMove(
    x: number,
    y: number,
    playerId: string
  ): { success: boolean; message?: string; gameState?: GameState } {
    // Validate player
    const playerColor = this.getPlayerColor(playerId);
    log.debug(
      `[GameEngine.makeMove] playerId: ${playerId}, playerColor: ${playerColor}, currentPlayer: ${this.gameState.currentPlayer}, blackId: ${this.gameState.players.black.id}, whiteId: ${this.gameState.players.white.id}`
    );

    if (!playerColor) {
      log.debug(`[GameEngine.makeMove] Player not found`);
      return { success: false, message: 'Player not found in this game' };
    }

    if (playerColor !== this.gameState.currentPlayer) {
      log.debug(
        `[GameEngine.makeMove] Not player's turn. playerColor: ${playerColor}, currentPlayer: ${this.gameState.currentPlayer}`
      );
      return { success: false, message: 'Not your turn' };
    }

    // Make the move
    if (!this.board.makeMove(x, y, playerColor)) {
      return { success: false, message: 'Invalid move' };
    }

    // Record move
    const move = { x, y, player: playerColor, timestamp: Date.now() };
    this.gameState.moves.push(move);
    this.gameState.board = this.board.getBoard();

    // Check win condition
    if (this.winChecker.checkWin(this.board.getBoard(), x, y, playerColor)) {
      this.gameState.status = 'finished';
      this.gameState.winner = playerColor;
      this.gameState.finishedAt = Date.now();
      return { success: true, gameState: this.gameState };
    }

    // Check draw
    if (this.winChecker.checkDraw(this.board.getBoard())) {
      this.gameState.status = 'finished';
      this.gameState.winner = 'draw';
      this.gameState.finishedAt = Date.now();
      return { success: true, gameState: this.gameState };
    }

    // Switch player
    this.gameState.currentPlayer = playerColor === 1 ? 2 : 1;
    return { success: true, gameState: this.gameState };
  }

  getGameState(): GameState {
    return JSON.parse(JSON.stringify(this.gameState));
  }

  setWaitingState(): void {
    this.gameState.status = 'waiting';
  }

  isGameFinished(): boolean {
    return this.gameState.status === 'finished';
  }

  private getPlayerColor(playerId: string): 1 | 2 | null {
    if (this.gameState.players.black.id === playerId) return 1;
    if (this.gameState.players.white.id === playerId) return 2;
    return null;
  }
}
