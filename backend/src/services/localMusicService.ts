import fs from 'fs';
import path from 'path';
import { parseFile } from 'music-metadata';
import os from 'os';
import { log } from '../utils/logger';

interface LocalMusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  url: string;
  cover?: string;
  hasCover?: boolean;
  lrc?: string; // 歌词文件 URL
}

// 获取音乐目录 - 优先级: 环境变量 > F:\Music > 用户主目录下的 Music
const getMusicDir = (): string => {
  const envDir = process.env.MUSIC_DIR;
  if (envDir && fs.existsSync(envDir)) {
    return envDir;
  }

  // Windows 默认路径
  const windowsPath = 'F:\\Music';
  if (fs.existsSync(windowsPath)) {
    return windowsPath;
  }

  // 用户主目录下的 Music 文件夹
  const userMusicDir = path.join(os.homedir(), 'Music');
  if (fs.existsSync(userMusicDir)) {
    return userMusicDir;
  }

  // 如果都不存在，返回默认值（会在运行时检查）
  return windowsPath;
};

// 检查是否禁用本地音乐库
const isLocalMusicDisabled = (): boolean => {
  return process.env.DISABLE_LOCAL_MUSIC === 'true';
};

const MUSIC_DIR = getMusicDir();
const SUPPORTED_FORMATS = ['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg'];
const MUSIC_CACHE_TIME = 60 * 60 * 1000; // 1小时缓存

class LocalMusicService {
  private musicCache: LocalMusicTrack[] = [];
  private lastCacheTime: number = 0;
  private initialized: boolean = false;
  private disabled: boolean = isLocalMusicDisabled();

  /**
   * 初始化：在服务器启动时预加载所有音乐
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 检查是否禁用本地音乐
    if (this.disabled) {
      log.warn('[LocalMusic] ⚠️  本地音乐库已禁用');
      this.initialized = true;
      return;
    }

    try {
      process.stdout.write('[LocalMusic] loading (0)...\r');
      const startTime = Date.now();
      const allMusic = await this.getMusicList();
      Date.now() - startTime;
      process.stdout.write(`[LocalMusic] loading (${allMusic.length})....done\n`);
      this.initialized = true;
    } catch (error) {
      process.stdout.write(`[LocalMusic] error\n`);
      log.error('[LocalMusic] 初始化错误:', error);
    }
  }

  /**
   * 递归扫描本地音乐目录（支持子目录按音乐人分类）
   */
  private async scanMusicDirectory(): Promise<LocalMusicTrack[]> {
    const tracks: LocalMusicTrack[] = [];

    try {
      // 检查目录是否存在
      if (!fs.existsSync(MUSIC_DIR)) {
        log.warn(`[LocalMusic] ⚠️  音乐目录不存在: ${MUSIC_DIR}`);
        return [];
      }

      // 检查是否有读取权限
      try {
        fs.accessSync(MUSIC_DIR, fs.constants.R_OK);
      } catch (accessError) {
        log.error(`[LocalMusic] ❌ 无法访问音乐目录: ${MUSIC_DIR}`, accessError);
        return [];
      }

      // 递归扫描函数
      const recursiveScan = async (dir: string, artistName?: string) => {
        try {
          const files = fs.readdirSync(dir);

          for (const file of files) {
            try {
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

                // 提取专辑封面图片
                let coverUrl = 'https://picsum.photos/64/64';
                if (metadata.common?.picture && metadata.common.picture.length > 0) {
                  try {
                    const picture = metadata.common.picture[0];
                    const base64Image = Buffer.from(picture.data).toString('base64');
                    coverUrl = `data:${picture.format};base64,${base64Image}`;
                  } catch (imgErr) {
                    // 封面提取失败，使用默认封面
                  }
                }

                const encodedPath = encodeURIComponent(filePath);
                const streamUrl = `/api/music/stream?path=${encodedPath}`;

                // 查找对应的歌词文件
                const lrcFilePath = filePath.replace(ext, '.lrc');
                let lrcUrl: string | undefined;
                if (fs.existsSync(lrcFilePath)) {
                  lrcUrl = `/api/music/lrc?path=${encodedPath}`;
                }

                const track: LocalMusicTrack = {
                  id: `local_${Date.now()}_${Math.random()}`,
                  title: metadata.common?.title || path.basename(file, ext),
                  artist: metadata.common?.artist || artistName || 'Unknown Artist',
                  album: metadata.common?.album || 'Local Music',
                  duration: Math.floor((metadata.format?.duration || 0) * 1000),
                  url: streamUrl,
                  cover: coverUrl,
                  lrc: lrcUrl,
                };

                if (tracks.length % 20 === 0) {
                  process.stdout.write(`[LocalMusic] loading (${tracks.length})...\r`);
                }
                tracks.push(track);
              } catch (err) {
                // 即使元数据提取失败，仍然添加基本信息
                const track: LocalMusicTrack = {
                  id: `local_${Date.now()}_${Math.random()}`,
                  title: path.basename(file, ext),
                  artist: artistName || 'Unknown Artist',
                  album: 'Local Music',
                  duration: 0,
                  url: `/api/music/stream?path=${encodeURIComponent(filePath)}`,
                };
                tracks.push(track);
              }
            } catch (fileErr) {
              // 继续处理下一个文件
              continue;
            }
          }
        } catch (dirErr) {
          // 继续处理其他目录
        }
      };

      await recursiveScan(MUSIC_DIR);
      return tracks;
    } catch (error) {
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
   * 获取所有音乐（按 A-Z 排序）
   */
  async getAllMusicSorted(
    limit: number = 50,
    sortBy: 'title' | 'artist' | 'album' = 'title'
  ): Promise<LocalMusicTrack[]> {
    try {
      const allMusic = await this.getMusicList();

      // 按 A-Z 排序
      const sortedMusic = allMusic.sort((a, b) => {
        switch (sortBy) {
          case 'title':
            return a.title.localeCompare(b.title, 'zh');
          case 'artist':
            return a.artist.localeCompare(b.artist, 'zh');
          case 'album':
            return a.album.localeCompare(b.album, 'zh');
          default:
            return 0;
        }
      });

      return sortedMusic.slice(0, limit);
    } catch (error) {
      log.error('[LocalMusic] 获取所有音乐失败:', error);
      return [];
    }
  }

  /**
   * 搜索本地音乐
   */
  async searchMusic(keyword: string, limit: number = 10): Promise<LocalMusicTrack[]> {
    try {
      // 如果本地音乐库被禁用，返回空数组
      if (this.disabled) {
        return [];
      }

      const allMusic = await this.getMusicList();

      if (!keyword || !keyword.trim()) {
        return allMusic.slice(0, limit);
      }

      const lowerKeyword = keyword.toLowerCase();

      // 搜索标题、艺术家、专辑
      const results = allMusic.filter(
        (track) =>
          track.title.toLowerCase().includes(lowerKeyword) ||
          track.artist.toLowerCase().includes(lowerKeyword) ||
          track.album.toLowerCase().includes(lowerKeyword)
      );

      return results.slice(0, limit);
    } catch (error) {
      log.error('[LocalMusic] 搜索错误:', error);
      return [];
    }
  }

  /**
   * 刷新缓存
   */
  refreshCache() {
    this.musicCache = [];
    this.lastCacheTime = 0;
    this.initialized = false;
  }

  /**
   * 获取音乐库状态
   */
  getStatus() {
    return {
      initialized: this.initialized,
      musicDir: MUSIC_DIR,
      cacheSize: this.musicCache.length,
      lastCacheTime: this.lastCacheTime,
      cacheExpired:
        this.musicCache.length > 0 && Date.now() - this.lastCacheTime > MUSIC_CACHE_TIME,
    };
  }

  /**
   * 获取本地音乐列表
   */
  async getAllMusic(limit: number = 50): Promise<LocalMusicTrack[]> {
    try {
      const allMusic = await this.getMusicList();
      return allMusic.slice(0, limit);
    } catch (error) {
      log.error('[LocalMusic] 获取所有音乐失败:', error);
      return [];
    }
  }
}

export const localMusicService = new LocalMusicService();
