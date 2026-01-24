import * as fs from 'fs';
import * as path from 'path';

export interface PlayerData {
  id: string;
  name: string;
  score: number;
  totalGames: number;
  wins: number;
  losses: number;
  lastPlayedAt: number;
}

export class PlayerManager {
  private playersDataPath: string;
  private players: Map<string, PlayerData> = new Map();

  constructor(dataDir: string) {
    this.playersDataPath = path.join(dataDir, 'players.json');
    this.loadPlayers();
  }

  private loadPlayers() {
    try {
      if (fs.existsSync(this.playersDataPath)) {
        const data = fs.readFileSync(this.playersDataPath, 'utf-8');
        const playersArray: PlayerData[] = JSON.parse(data);
        this.players = new Map(playersArray.map(p => [p.id, p]));
        console.log(`[PlayerManager] Loaded ${this.players.size} players`);
      }
    } catch (error) {
      console.error('[PlayerManager] Failed to load players:', error);
      this.players = new Map();
    }
  }

  private savePlayers() {
    try {
      const playersArray = Array.from(this.players.values());
      fs.writeFileSync(this.playersDataPath, JSON.stringify(playersArray, null, 2));
      console.log(`[PlayerManager] Saved ${this.players.size} players`);
    } catch (error) {
      console.error('[PlayerManager] Failed to save players:', error);
    }
  }

  getOrCreatePlayer(id: string, name: string): PlayerData {
    let player = this.players.get(id);

    if (!player) {
      player = {
        id,
        name,
        score: 0,
        totalGames: 0,
        wins: 0,
        losses: 0,
        lastPlayedAt: Date.now(),
      };
      this.players.set(id, player);
      this.savePlayers();
    } else {
      // Update name if changed
      if (player.name !== name) {
        player.name = name;
        this.savePlayers();
      }
    }

    return player;
  }

  recordGameResult(winnerId: string, loserId: string) {
    const winner = this.players.get(winnerId);
    const loser = this.players.get(loserId);

    if (winner) {
      winner.score += 1;
      winner.wins += 1;
      winner.totalGames += 1;
      winner.lastPlayedAt = Date.now();
    }

    if (loser) {
      loser.losses += 1;
      loser.totalGames += 1;
      loser.lastPlayedAt = Date.now();
    }

    this.savePlayers();
    console.log(`[PlayerManager] Recorded game result - Winner: ${winner?.name}, Loser: ${loser?.name}`);
  }

  getLeaderboard(limit: number = 10): PlayerData[] {
    return Array.from(this.players.values())
      .sort((a, b) => {
        // 按分数降序排序
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // 分数相同，按最近游戏时间排序
        return b.lastPlayedAt - a.lastPlayedAt;
      })
      .slice(0, limit);
  }

  getPlayerStats(id: string): PlayerData | null {
    return this.players.get(id) || null;
  }
}
