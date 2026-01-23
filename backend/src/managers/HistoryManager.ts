import { promises as fs } from 'fs';
import path from 'path';
import { HistoryRecord } from '../types/game';

export class HistoryManager {
  private dataDir: string;
  private historyFile: string;

  constructor(dataDir: string = 'data') {
    this.dataDir = dataDir;
    this.historyFile = path.join(dataDir, 'history.json');
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.access(this.historyFile);
    } catch {
      await fs.writeFile(this.historyFile, '');
    }
  }

  async saveRecord(record: HistoryRecord): Promise<void> {
    const line = JSON.stringify(record) + '\n';
    await fs.appendFile(this.historyFile, line);
  }

  async getRecords(limit: number = 100, offset: number = 0): Promise<{ total: number; records: HistoryRecord[] }> {
    try {
      const content = await fs.readFile(this.historyFile, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      const total = lines.length;

      const records = lines
        .slice(Math.max(0, total - offset - limit), total - offset)
        .reverse()
        .map(line => JSON.parse(line));

      return { total, records };
    } catch {
      return { total: 0, records: [] };
    }
  }

  async getRecordsByPlayer(playerName: string, limit: number = 100): Promise<HistoryRecord[]> {
    try {
      const content = await fs.readFile(this.historyFile, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);

      const records = lines
        .map(line => JSON.parse(line))
        .filter(
          record =>
            record.blackPlayer.name === playerName || record.whitePlayer.name === playerName
        )
        .slice(-limit);

      return records;
    } catch {
      return [];
    }
  }

  async clear(): Promise<void> {
    await fs.writeFile(this.historyFile, '');
  }
}
