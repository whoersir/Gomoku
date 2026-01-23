export class Board {
  private board: number[][];
  private size: number;

  constructor(size: number = 15) {
    this.size = size;
    this.board = Array(size)
      .fill(null)
      .map(() => Array(size).fill(0));
  }

  isValidMove(x: number, y: number): boolean {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      return false;
    }
    return this.board[y][x] === 0;
  }

  makeMove(x: number, y: number, player: 1 | 2): boolean {
    if (!this.isValidMove(x, y)) {
      return false;
    }
    this.board[y][x] = player;
    return true;
  }

  getBoard(): number[][] {
    return this.board.map(row => [...row]);
  }

  getCell(x: number, y: number): number {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      return -1;
    }
    return this.board[y][x];
  }

  isBoardFull(): boolean {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.board[i][j] === 0) {
          return false;
        }
      }
    }
    return true;
  }

  reset(): void {
    this.board = Array(this.size)
      .fill(null)
      .map(() => Array(this.size).fill(0));
  }

  getSize(): number {
    return this.size;
  }
}
