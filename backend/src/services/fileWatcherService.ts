import chokidar from 'chokidar';
import path from 'path';
import { musicSyncService } from './musicSyncService';
import { log } from '../utils/logger';

// 获取音乐目录
const getMusicDir = (): string => {
  const envDir = process.env.MUSIC_DIR;
  if (envDir && process.env.MUSIC_DIR) {
    return envDir;
  }

  const windowsPath = 'F:\\Music';
  if (windowsPath) {
    return windowsPath;
  }

  const userMusicDir = path.join(process.env.USERPROFILE || '', 'Music');
  if (userMusicDir) {
    return userMusicDir;
  }

  return windowsPath;
};

const SUPPORTED_FORMATS = ['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg', '.lrc'];

/**
 * 文件监听服务
 * 监听音乐目录变化并自动同步到数据库
 */
class FileWatcherService {
  private watcher: chokidar.FSWatcher | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private DEBOUNCE_DELAY = 10000; // 10秒防抖，减少数据库压力

  /**
   * 启动文件监听器
   */
  start(): void {
    if (this.watcher) {
      log.warn('[FileWatcher] 监听器已在运行');
      return;
    }

    const musicDir = getMusicDir();

    try {
      this.watcher = chokidar.watch(musicDir, {
        ignored: /(^|[\/\\])\../, // 忽略隐藏文件
        persistent: true,
        ignoreInitial: false,
        followSymlinks: false,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100,
        },
      });

      this.watcher
        .on('add', (filePath) => this.onFileAdded(filePath))
        .on('change', (filePath) => this.onFileChanged(filePath))
        .on('unlink', (filePath) => this.onFileRemoved(filePath))
        .on('error', (error) => log.error('[FileWatcher] 监听错误:', error))
        .on('ready', () => {
          log.info('[FileWatcher] ✅ 开始监听音乐目录:', musicDir);
        });

      log.info('[FileWatcher] 初始化中...');
    } catch (error) {
      log.error('[FileWatcher] 启动失败:', error);
    }
  }

  /**
   * 停止文件监听器
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      log.info('[FileWatcher] 监听器已停止');
    }
  }

  /**
   * 检查是否是音乐文件
   */
  private isMusicFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return SUPPORTED_FORMATS.includes(ext);
  }

  /**
   * 文件添加事件（防抖）
   */
  private onFileAdded(filePath: string): void {
    if (!this.isMusicFile(filePath)) return;

    // 使用防抖避免短时间内多次触发
    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath)!);
    }

    const timer = setTimeout(async () => {
      try {
        log.info(`[FileWatcher] 📁 检测到新文件: ${filePath}`);
        await musicSyncService.onFileChanged(filePath);
      } catch (error) {
        log.error(`[FileWatcher] 处理新文件失败: ${filePath}`, error);
      } finally {
        this.debounceTimers.delete(filePath);
      }
    }, this.DEBOUNCE_DELAY);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * 文件变更事件（防抖）
   */
  private onFileChanged(filePath: string): void {
    if (!this.isMusicFile(filePath)) return;

    // 使用防抖避免短时间内多次触发
    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath)!);
    }

    const timer = setTimeout(async () => {
      try {
        log.info(`[FileWatcher] 📝 检测到文件变更: ${filePath}`);
        await musicSyncService.onFileChanged(filePath);
      } catch (error) {
        log.error(`[FileWatcher] 处理文件变更失败: ${filePath}`, error);
      } finally {
        this.debounceTimers.delete(filePath);
      }
    }, this.DEBOUNCE_DELAY);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * 文件删除事件（防抖）
   */
  private onFileRemoved(filePath: string): void {
    if (!this.isMusicFile(filePath)) return;

    // 使用防抖避免短时间内多次触发
    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath)!);
    }

    const timer = setTimeout(async () => {
      try {
        log.info(`[FileWatcher] 🗑️  检测到文件删除: ${filePath}`);
        await musicSyncService.onFileChanged(filePath);
      } catch (error) {
        log.error(`[FileWatcher] 处理文件删除失败: ${filePath}`, error);
      } finally {
        this.debounceTimers.delete(filePath);
      }
    }, this.DEBOUNCE_DELAY);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * 获取监听器状态
   */
  getStatus(): { running: boolean; watchedPath: string } {
    return {
      running: this.watcher !== null,
      watchedPath: getMusicDir(),
    };
  }
}

export const fileWatcherService = new FileWatcherService();
