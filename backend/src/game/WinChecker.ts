export class WinChecker {
  private readonly WINNING_COUNT = 5;

  checkWin(board: number[][], lastX: number, lastY: number, player: number): boolean {
    const directions = [
      { dx: 1, dy: 0 }, // horizontal
      { dx: 0, dy: 1 }, // vertical
      { dx: 1, dy: 1 }, // diagonal \
      { dx: 1, dy: -1 }, // diagonal /
    ];

    for (const { dx, dy } of directions) {
      const count =
        1 +
        this.getConnectedCount(board, lastX, lastY, dx, dy, player) +
        this.getConnectedCount(board, lastX, lastY, -dx, -dy, player);

      if (count >= this.WINNING_COUNT) {
        return true;
      }
    }

    return false;
  }

  checkDraw(board: number[][]): boolean {
    const size = board.length;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (board[i][j] === 0) {
          return false;
        }
      }
    }
    return true;
  }

  private getConnectedCount(
    board: number[][],
    x: number,
    y: number,
    dx: number,
    dy: number,
    player: number
  ): number {
    let count = 0;
    let nx = x + dx;
    let ny = y + dy;

    while (nx >= 0 && nx < board.length && ny >= 0 && ny < board[0].length) {
      if (board[ny][nx] === player) {
        count++;
        nx += dx;
        ny += dy;
      } else {
        break;
      }
    }

    return count;
  }
}
