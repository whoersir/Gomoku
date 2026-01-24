import fs from 'fs';
import path from 'path';
import { parseFile } from 'music-metadata';

interface LocalMusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  url: string;
  cover?: string;
}

const MUSIC_DIR = 'F:\\Music';
const SUPPORTED_FORMATS = ['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg'];
const MUSIC_CACHE_TIME = 60 * 60 * 1000; // 1小时缓存

class LocalMusicService {
  private musicCache: LocalMusicTrack[] = [];
  private lastCacheTime: number = 0;

  /**
   * 递归扫描本地音乐目录（支持子目录按音乐人分类）
   */
  private async scanMusicDirectory(): Promise<LocalMusicTrack[]> {
    const tracks: LocalMusicTrack[] = [];

    try {
      // 检查目录是否存在
      if (!fs.existsSync(MUSIC_DIR)) {
        console.warn(`[LocalMusic] Music directory not found: ${MUSIC_DIR}`);
        return [];
      }

      // 递归扫描函数
      const recursiveScan = async (dir: string, artistName?: string) => {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);

          // 如果是目录，递归扫描（使用目录名作为艺术家名）
          if (stats.isDirectory()) {
            await recursiveScan(filePath, file);
            continue;
          }

          // 检查文件格式
          const ext = path.extname(file).toLowerCase();
          if (!SUPPORTED_FORMATS.includes(ext)) continue;

          try {
            // 提取元数据
            const metadata = await parseFile(filePath);
            
            const track: LocalMusicTrack = {
              id: `local_${Date.now()}_${Math.random()}`,
              title: metadata.common?.title || path.basename(file, ext),
              artist: metadata.common?.artist || artistName || 'Unknown Artist',
              album: metadata.common?.album || 'Local Music',
              duration: Math.floor((metadata.format?.duration || 0) * 1000),
              url: `/api/music/stream/${Buffer.from(filePath).toString('base64')}`,
              cover: 'https://picsum.photos/200/200'
            };

            tracks.push(track);
            console.log(`[LocalMusic] Scanned: ${track.title} by ${track.artist}`);
          } catch (err) {
            console.warn(`[LocalMusic] Failed to parse metadata for ${file}:`, err);
            // 即使元数据提取失败，仍然添加基本信息
            const track: LocalMusicTrack = {
              id: `local_${Date.now()}_${Math.random()}`,
              title: path.basename(file, ext),
              artist: artistName || 'Unknown Artist',
              album: 'Local Music',
              duration: 0,
              url: `/api/music/stream/${Buffer.from(filePath).toString('base64')}`,
            };
            tracks.push(track);
          }
        }
      };

      await recursiveScan(MUSIC_DIR);
      console.log(`[LocalMusic] Scanned ${tracks.length} music files`);
      return tracks;
    } catch (error) {
      console.error('[LocalMusic] Error scanning directory:', error);
      return [];
    }
  }

  /**
   * 获取音乐列表（带缓存）
   */
  private async getMusicList(): Promise<LocalMusicTrack[]> {
    const now = Date.now();
    
    // 如果缓存未过期，使用缓存
    if (this.musicCache.length > 0 && now - this.lastCacheTime < MUSIC_CACHE_TIME) {
      return this.musicCache;
    }

    // 重新扫描目录
    this.musicCache = await this.scanMusicDirectory();
    this.lastCacheTime = now;
    return this.musicCache;
  }

  /**
   * 搜索本地音乐
   */
  async searchMusic(keyword: string, limit: number = 10): Promise<LocalMusicTrack[]> {
    try {
      const allMusic = await this.getMusicList();
      
      if (!keyword || !keyword.trim()) {
        return allMusic.slice(0, limit);
      }

      const lowerKeyword = keyword.toLowerCase();
      
      // 搜索标题、艺术家、专辑
      const results = allMusic.filter(track =>
        track.title.toLowerCase().includes(lowerKeyword) ||
        track.artist.toLowerCase().includes(lowerKeyword) ||
        track.album.toLowerCase().includes(lowerKeyword)
      );

      return results.slice(0, limit);
    } catch (error) {
      console.error('[LocalMusic] Search error:', error);
      return [];
    }
  }

  /**
   * 获取文件流
   */
  getFileStream(encodedPath: string) {
    try {
      const filePath = Buffer.from(encodedPath, 'base64').toString('utf-8');
      
      // 安全检查：确保路径在允许的目录内
      const resolvedPath = path.resolve(filePath);
      const resolvedMusicDir = path.resolve(MUSIC_DIR);
      
      if (!resolvedPath.startsWith(resolvedMusicDir)) {
        throw new Error('Access denied: Path is outside music directory');
      }

      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      return fs.createReadStream(filePath);
    } catch (error) {
      console.error('[LocalMusic] Error getting file stream:', error);
      throw error;
    }
  }

  /**
   * 刷新缓存
   */
  refreshCache() {
    this.musicCache = [];
    this.lastCacheTime = 0;
  }
}

export const localMusicService = new LocalMusicService();
