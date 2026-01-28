import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parseFile } from 'music-metadata';
import os from 'os';
import { getSupabaseClient } from './supabaseService';
import { log } from '../utils/logger';
import * as iconv from 'iconv-lite';

interface MusicTrackMetadata {
  filePath: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // 秒
  hasCover: boolean;
  coverData?: string; // Base64 编码的封面数据
  coverMimeType?: string; // 封面图片的 MIME 类型
  fileHash: string;
  fileSize: number;
}

interface SyncResult {
  added: number;
  updated: number;
  deleted: number;
  errors: string[];
  duration: number;
}

// 获取音乐目录
const getMusicDir = (): string => {
  const envDir = process.env.MUSIC_DIR;
  if (envDir && fs.existsSync(envDir)) {
    return envDir;
  }

  const windowsPath = 'F:\\Music';
  if (fs.existsSync(windowsPath)) {
    return windowsPath;
  }

  const userMusicDir = path.join(os.homedir(), 'Music');
  if (fs.existsSync(userMusicDir)) {
    return userMusicDir;
  }

  return windowsPath;
};

const SUPPORTED_FORMATS = ['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg'];

/**
 * 清理歌曲标题
 * 1. 去除 "歌手 - " 前缀
 * 2. 去除开头的数字（如 05、01 等）
 * 3. 去除多余空格
 */
function cleanTitle(title: string): string {
  let cleaned = title.trim();

  // 去除开头的数字（如 05、01、10 等，后面跟空格或点）
  cleaned = cleaned.replace(/^\d{1,2}[.\s]*/, '');

  // 去除 "歌手 - " 前缀（匹配歌手名后跟分隔符）
  // 支持: "周杰伦 - 歌名", "周杰伦-歌名", "周杰伦,莫诗旎 - 歌名"
  // 使用 \S 匹配非空白字符
  cleaned = cleaned.replace(/^\S+[，,.-]+\s*/, '');

  // 去除前后空格
  cleaned = cleaned.trim();

  // 如果清理后为空或太短，返回原标题
  if (!cleaned || cleaned.length < 2) {
    return title;
  }

  return cleaned;
}

/**
 * 清理字符串，防止 PostgreSQL 中的 Unicode 转义序列错误
 * 替换反斜杠和特殊转义字符
 */
function sanitizeString(str: string): string {
  if (!str) return str;
  // 替换反斜杠为普通斜杠
  let sanitized = str.replace(/\\/g, '/');
  // 移除其他可能引起问题的控制字符
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  return sanitized;
}

/**
 * 检测文本是否包含乱码特征
 * 返回 true 表示文本是有效的（不包含乱码）
 */
function isValidText(text: string): boolean {
  if (!text || text.trim() === '') return false;
  
  // 检测常见的乱码模式（如 Â、Ã、Ð、Ë 等拉丁字符）
  const garbledPattern = /[ÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ¿¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿]/;
  
  // 检测锟斤拷等常见乱码
  const commonGarbage = /锟斤拷|�|Â|Ã|Ð|Ë|Ì|Í|Î|Ï|Ñ|Ò|Ó|Ô|Õ|Ö|×|Ø|Ù|Ú|Û|Ü|Ý|Þ|ß/;
  
  // 如果包含乱码特征字符，则认为是乱码
  if (garbledPattern.test(text) || commonGarbage.test(text)) {
    return false;
  }
  
  // 检测文本中是否包含足够多的正常字符（中文、英文、数字、常见标点）
  const validCharPattern = /[\u4e00-\u9fa5a-zA-Z0-9\s\-_\.\(\)\[\]【】（），,、&·'`\"'']/;
  const validChars = (text.match(validCharPattern) || []).length;
  const totalChars = text.length;
  
  // 如果有效字符比例低于 50%，认为是乱码
  if (validChars / totalChars < 0.5) {
    return false;
  }
  
  return true;
}

/**
 * 检测是否是默认的专辑名称（如 "律动车载音乐" 这种通用名称）
 */
function isDefaultAlbumName(album: string): boolean {
  if (!album) return true;
  
  const defaultPatterns = [
    '律动车载音乐',
    '未知专辑',
    'Unknown Album',
    'Various Artists',
    '精选集',
    '热门歌曲',
    '流行金曲',
    '经典老歌',
    '车载音乐',
    '网络歌曲',
  ];
  
  return defaultPatterns.some(pattern => 
    album.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * 智能编码转换 - 尝试多种编码方式解码字符串
 * 优先检查是否已经是正确的UTF-8，只在检测到乱码时尝试其他编码
 */
function smartDecode(input: string): string {
  if (!input) return input;
  
  // 首先检查是否包含足够多的正常中文字符（已经是正确UTF-8）
  const chineseChars = (input.match(/[\u4e00-\u9fa5]/g) || []).length;
  const totalChars = input.length;
  
  // 如果已经包含大量中文字符，认为是正确的UTF-8，直接返回
  if (chineseChars >= 2 || (chineseChars > 0 && chineseChars / totalChars > 0.3)) {
    return input;
  }
  
  // 如果输入已经是有效文本（不包含乱码特征），直接返回
  if (isValidText(input)) {
    return input;
  }
  
  // 检测到乱码，尝试 GBK 解码
  try {
    const buffer = Buffer.from(input, 'binary');
    const gbkDecoded = iconv.decode(buffer, 'gbk');
    
    // 检查解码结果是否包含正常中文字符
    const hasChinese = /[\u4e00-\u9fa5]/.test(gbkDecoded);
    const hasReplacementChar = gbkDecoded.includes('�');
    
    if (hasChinese && !hasReplacementChar) {
      log.debug(`[编码转换] GBK解码成功: "${input}" -> "${gbkDecoded}"`);
      return gbkDecoded;
    }
  } catch (e) {
    log.debug(`[编码转换] GBK解码失败: "${input}"`);
  }
  
  // 尝试 Big5 解码（台湾/香港系统）
  try {
    const buffer = Buffer.from(input, 'binary');
    const big5Decoded = iconv.decode(buffer, 'big5');
    
    const hasChinese = /[\u4e00-\u9fa5]/.test(big5Decoded);
    const hasReplacementChar = big5Decoded.includes('�');
    
    if (hasChinese && !hasReplacementChar) {
      log.debug(`[编码转换] Big5解码成功: "${input}" -> "${big5Decoded}"`);
      return big5Decoded;
    }
  } catch (e) {
    log.debug(`[编码转换] Big5解码失败: "${input}"`);
  }
  
  // 返回原样
  return input;
}

/**
 * 音乐同步服务
 * 负责将文件系统中的音乐同步到数据库
 */
class MusicSyncService {
  private supabase = getSupabaseClient();
  private musicDir: string = getMusicDir();

  /**
   * 计算文件哈希（用于检测文件变化）
   * 使用文件大小 + 部分内容哈希（快速且准确）
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    try {
      const stats = fs.statSync(filePath);
      const size = stats.size;

      // 只读取文件头和尾部各 1024 字节用于哈希计算
      const buffer = Buffer.alloc(2048);
      const fd = fs.openSync(filePath, 'r');

      try {
        // 读取文件开头
        const bytesRead1 = fs.readSync(fd, buffer, 0, 1024, 0);
        // 读取文件结尾
        const bytesRead2 = fs.readSync(fd, buffer, bytesRead1, 1024, Math.max(0, size - 1024));
        fs.closeSync(fd);

        // 计算 size + content 的哈希
        const hash = crypto.createHash('md5');
        hash.update(size.toString());
        hash.update(buffer.subarray(0, bytesRead1 + bytesRead2));
        return hash.digest('hex');
      } catch (readError) {
        fs.closeSync(fd);
        throw readError;
      }
    } catch (error) {
      log.error(`[MusicSync] 计算文件哈希失败: ${filePath}`, error);
      return '';
    }
  }

    /**
   * 扫描文件系统获取所有音乐文件
   */
  async scanFileSystem(): Promise<Map<string, MusicTrackMetadata>> {
    const tracks = new Map<string, MusicTrackMetadata>();

    log.info(`[MusicSync] 开始扫描目录: ${this.musicDir}`);
    log.info(`[MusicSync] 目录存在: ${fs.existsSync(this.musicDir)}`);

    if (!fs.existsSync(this.musicDir)) {
      log.warn(`[MusicSync] 音乐目录不存在: ${this.musicDir}`);
      return tracks;
    }

    let processedCount = 0;

    const recursiveScan = async (dir: string, artistName?: string): Promise<void> => {
      try {
        log.info(`[MusicSync] [DEBUG] 正在扫描目录: ${dir}`);
        // 使用 UTF-8 编码读取目录
        const files = fs.readdirSync(dir, { encoding: 'utf8' });
        log.info(`[MusicSync] 扫描目录: ${dir} (${files.length} 项)`);

        let dirFileCount = 0;
        let dirMusicCount = 0;

        for (const file of files) {
          try {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
              // 递归扫描子目录（使用目录名作为艺术家）
              await recursiveScan(filePath, file);
              continue;
            }

            dirFileCount++;
            const ext = path.extname(file).toLowerCase();
            if (!SUPPORTED_FORMATS.includes(ext)) {
              continue;
            }

            dirMusicCount++;

            processedCount++;
            if (processedCount <= 10 || processedCount % 100 === 0) {
              log.info(`[MusicSync] 处理文件 ${processedCount}: ${file}`);
            }

            // 计算文件哈希 - 暂时使用文件大小和修改时间
            let fileHash = '';
            try {
              const fileStats = fs.statSync(filePath);
              fileHash = `${fileStats.size}-${fileStats.mtime.getTime()}`;
              if (!fileHash) {
                log.error(`[MusicSync] 哈希计算失败: ${filePath}`);
                continue;
              }
            } catch (hashError) {
              log.error(`[MusicSync] 哈希计算异常: ${filePath}`, hashError);
              continue;
            }

            // 提取元数据 - 暂时跳过，使用文件名
            let title = path.basename(file, ext);

            // 清理标题，去除 "歌手 - " 前缀和开头的数字
            const originalTitle = title;
            title = cleanTitle(title);
            if (originalTitle !== title && processedCount % 50 === 0) {
              log.info(`[MusicSync] 清理标题: "${originalTitle}" => "${title}"`);
            }

            // 从文件路径中提取 artist 和 album
            // 路径格式: F:\Music\许嵩\许嵩单曲集\歌曲.mp3
            //          F:\Music  = 根目录
            //          许嵩     = artist (二级目录)
            //          许嵩单曲集 = album (三级目录)
            let artist = 'Unknown Artist';
            let album = 'Local Music';

            try {
              // 使用 normalize 统一路径分隔符
              const normalizedPath = filePath.replace(/\\/g, '/');
              const relativePath = normalizedPath.replace(this.musicDir.replace(/\\/g, '/') + '/', '');
              const pathParts = relativePath.split('/').filter(p => p);

              if (pathParts.length >= 1) {
                // 二级目录（第一个路径部分）是歌手
                // 使用智能编码转换处理目录名
                artist = smartDecode(pathParts[0]);

                // 三级目录（第二个路径部分）是专辑
                if (pathParts.length >= 2) {
                  album = smartDecode(pathParts[1]);
                } else {
                  // 如果没有三级目录，使用歌手名作为专辑名
                  album = artist;
                }
              }
            } catch (pathError) {
              log.error(`[MusicSync] 提取路径失败: ${filePath}`, pathError);
            }

            if (processedCount <= 5) {
              log.info(`[MusicSync] [DEBUG] artist="${artist}" album="${album}"`);
            }

            let duration = 0;
            let hasCover = false;
            let coverData: string | undefined;
            let coverMimeType: string | undefined;
            let metadataExtracted = false;

            // 尝试提取元数据（包括封面）
            try {
              const metadata = await parseFile(filePath, {
                skipCovers: false, // 不跳过封面
              });

              if (metadata.common) {
                // 只使用元数据中的标题（歌曲名）
                if (metadata.common.title) {
                  // 对标题进行编码处理
                  const decodedTitle = smartDecode(metadata.common.title);
                  // 检测解码后的标题是否有效（不包含乱码特征）
                  if (isValidText(decodedTitle)) {
                    title = decodedTitle;
                    metadataExtracted = true;
                  } else {
                    log.debug(`[MusicSync] 标题解码后仍乱码，使用文件名: ${filePath}`);
                  }
                }
                // 注意：artist 和 album 使用文件路径提取的信息（编码更可靠）
                // 不使用 metadata.common.artist 和 metadata.common.album
                
                if (metadata.format?.duration) {
                  duration = Math.floor(metadata.format.duration);
                }
                // 检查是否有封面
                // 暂时不存储 Base64 数据，只标记 hasCover
                if (metadata.common.picture && metadata.common.picture.length > 0) {
                  hasCover = true;
                  // TODO: 封面数据存储有兼容性问题，暂时不提取
                  // const picture = metadata.common.picture[0];
                  // try {
                  //   coverData = picture.data.toString('base64');
                  //   coverMimeType = picture.format || 'image/jpeg';
                  // } catch (e) {
                  //   log.debug(`[MusicSync] 封面编码失败: ${filePath}`, e);
                  // }
                }
              }
            } catch (metaError) {
              // 元数据提取失败，使用文件名和目录名
              log.debug(`[MusicSync] 元数据提取失败: ${filePath}，使用文件名和目录名`);
            }

            // 确保标题和艺术家不为空
            if (!title || title.trim() === '') {
              title = path.basename(file, ext);
            }

            const track: MusicTrackMetadata = {
              filePath,
              title,
              artist,
              album,
              duration,
              hasCover,
              coverData,
              coverMimeType,
              fileHash,
              fileSize: stats.size,
            };

            tracks.set(filePath, track);

            // 只在元数据提取失败或包含中文时打印调试信息
            if (!metadataExtracted || /[\u4e00-\u9fa5]/.test(title + artist)) {
              log.debug(`[MusicSync] 处理: ${title} - ${artist}`);
            }
          } catch (fileError) {
            log.error(`[MusicSync] 处理文件失败: ${file}`, fileError);
          }
        }

        if (dirMusicCount > 0 || dirFileCount > 0) {
          log.info(`[MusicSync] [DEBUG] 目录 ${dir}: 总文件 ${dirFileCount}, 音乐文件 ${dirMusicCount}`);
        }
      } catch (dirError) {
        log.error(`[MusicSync] 扫描目录失败: ${dir}`, dirError);
      }
    };

    await recursiveScan(this.musicDir);
    log.info(`[MusicSync] 扫描完成: 共处理 ${processedCount} 个文件`);
    return tracks;
  }

  /**
   * 从数据库获取所有音乐记录
   */
  async getAllFromDB(): Promise<Map<string, any>> {
    try {
      const { data, error } = await this.supabase
        .from('music_tracks')
        .select('id, file_path, file_hash');

      if (error) {
        throw error;
      }

      const map = new Map<string, any>();
      if (data) {
        data.forEach((track) => {
          map.set(track.file_path, track);
        });
      }

      return map;
    } catch (error) {
      log.error('[MusicSync] 从数据库获取音乐记录失败:', error);
      return new Map();
    }
  }

  /**
   * 批量插入新记录
   */
  private async batchInsert(tracks: MusicTrackMetadata[]): Promise<number> {
    if (tracks.length === 0) return 0;

    try {
      const records = tracks.map((track) => ({
        id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file_path: sanitizeString(track.filePath),
        title: sanitizeString(cleanTitle(track.title)),
        artist: sanitizeString(track.artist),
        album: sanitizeString(track.album),
        duration: track.duration,
        has_cover: track.hasCover,
        cover_data: track.coverData || null,
        cover_mime_type: track.coverMimeType || null,
        file_hash: sanitizeString(track.fileHash),
        file_size: track.fileSize,
      }));

      const { error } = await this.supabase.from('music_tracks').insert(records);

      if (error) {
        throw error;
      }

      return tracks.length;
    } catch (error) {
      log.error('[MusicSync] 批量插入失败:', error);
      return 0;
    }
  }

  /**
   * 批量更新记录 - 优化版本：分批处理，添加延迟，避免语句超时
   */
  private async batchUpdate(tracks: Map<string, any>): Promise<number> {
    if (tracks.size === 0) return 0;

    const BATCH_SIZE = 50; // 每批更新数量
    const DELAY_BETWEEN_BATCHES = 100; // 批次间延迟（毫秒）
    let totalUpdated = 0;
    
    // 将 Map 转换为数组以便分批处理
    const trackEntries = Array.from(tracks.entries());
    
    // 单个更新函数
    const updateTrack = async (filePath: string, dbTrack: any): Promise<number> => {
      try {
        const { error } = await this.supabase
          .from('music_tracks')
          .update({
            file_hash: dbTrack.fileHash,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dbTrack.id);
        
        if (error) {
          log.error(`[MusicSync] 更新记录失败: ${filePath}`, error);
          return 0;
        }
        return 1;
      } catch (error) {
        log.error(`[MusicSync] 更新记录异常: ${filePath}`, error);
        return 0;
      }
    };
    
    for (let i = 0; i < trackEntries.length; i += BATCH_SIZE) {
      const batch = trackEntries.slice(i, i + BATCH_SIZE);
      
      try {
        // 构建批量更新 Promise 数组
        const updatePromises = batch.map(([filePath, dbTrack]) =>
          updateTrack(filePath, dbTrack)
        );
        
        // 等待当前批次完成
        const results = await Promise.all(updatePromises);
        const batchUpdated = results.reduce((sum: number, val: number) => sum + val, 0);
        totalUpdated += batchUpdated;
        
        log.debug(`[MusicSync] 批处理更新: ${batchUpdated}/${batch.length} 成功 (批次 ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(trackEntries.length/BATCH_SIZE)})`);
        
        // 如果不是最后一批，添加延迟
        if (i + BATCH_SIZE < trackEntries.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      } catch (batchError) {
        log.error(`[MusicSync] 批处理更新失败:`, batchError);
      }
      
      // 添加进度日志
      if (i % (BATCH_SIZE * 10) === 0 || i + BATCH_SIZE >= trackEntries.length) {
        log.info(`[MusicSync] 更新进度: ${Math.min(i + BATCH_SIZE, trackEntries.length)}/${trackEntries.length} (${totalUpdated} 成功)`);
      }
    }
    
    return totalUpdated;
  }

  /**
   * 批量删除记录
   */
  private async batchDelete(tracks: any[]): Promise<number> {
    if (tracks.length === 0) return 0;

    try {
      const ids = tracks.map((track) => track.id);
      const { error } = await this.supabase
        .from('music_tracks')
        .delete()
        .in('id', ids);

      if (error) {
        throw error;
      }

      return tracks.length;
    } catch (error) {
      log.error('[MusicSync] 批量删除失败:', error);
      return 0;
    }
  }

  /**
   * 同步音乐库到数据库
   */
  async syncMusicLibrary(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      added: 0,
      updated: 0,
      deleted: 0,
      errors: [],
      duration: 0,
    };

    try {
      log.info('[MusicSync] 开始同步音乐库...');

      // 1. 扫描文件系统
      process.stdout.write('[MusicSync] 扫描文件系统...\r');
      const fsTracks = await this.scanFileSystem();
      log.info(`[MusicSync] 扫描完成，发现 ${fsTracks.size} 个音乐文件`);

      // 2. 从数据库获取记录
      process.stdout.write('[MusicSync] 读取数据库记录...\r');
      const dbTracks = await this.getAllFromDB();
      log.info(`[MusicSync] 数据库中有 ${dbTracks.size} 条记录`);

      // 3. 对比差异
      process.stdout.write('[MusicSync] 对比差异...\r');
      const toAdd: MusicTrackMetadata[] = [];
      const toUpdate = new Map<string, any>();
      const toDelete: any[] = [];

      // 查找新增和更新的文件
      for (const [filePath, fsTrack] of fsTracks) {
        const dbTrack = dbTracks.get(filePath);

        if (!dbTrack) {
          // 新文件
          toAdd.push(fsTrack);
        } else if (dbTrack.file_hash !== fsTrack.fileHash) {
          // 文件已变化
          toUpdate.set(filePath, {
            id: dbTrack.id,
            fileHash: fsTrack.fileHash,
          });
        }
      }

      // 查找已删除的文件
      for (const [filePath, dbTrack] of dbTracks) {
        if (!fsTracks.has(filePath)) {
          toDelete.push(dbTrack);
        }
      }

      log.info(`[MusicSync] 需要新增: ${toAdd.length}, 更新: ${toUpdate.size}, 删除: ${toDelete.length}`);

      // 4. 执行批量操作
      if (toAdd.length > 0) {
        process.stdout.write(`[MusicSync] 插入 ${toAdd.length} 条记录...\r`);
        const added = await this.batchInsert(toAdd);
        result.added = added;
        log.info(`[MusicSync] ✓ 插入 ${added} 条记录`);
      }

      if (toUpdate.size > 0) {
        process.stdout.write(`[MusicSync] 更新 ${toUpdate.size} 条记录...\r`);
        const updated = await this.batchUpdate(toUpdate);
        result.updated = updated;
        log.info(`[MusicSync] ✓ 更新 ${updated} 条记录`);
      }

      if (toDelete.length > 0) {
        process.stdout.write(`[MusicSync] 删除 ${toDelete.length} 条记录...\r`);
        const deleted = await this.batchDelete(toDelete);
        result.deleted = deleted;
        log.info(`[MusicSync] ✓ 删除 ${deleted} 条记录`);
      }

      result.duration = Date.now() - startTime;
      log.info(`[MusicSync] ✓ 同步完成 (耗时 ${result.duration}ms)`);
    } catch (error) {
      const errorMsg = `同步失败: ${error}`;
      log.error('[MusicSync]', errorMsg);
      result.errors.push(errorMsg);
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * 增量更新（单个文件）
   * 用于文件监听器触发
   */
  async onFileChanged(filePath: string): Promise<boolean> {
    try {
      const ext = path.extname(filePath).toLowerCase();
      if (!SUPPORTED_FORMATS.includes(ext)) {
        return false;
      }

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        // 文件已删除
        const { data } = await this.supabase
          .from('music_tracks')
          .select('id')
          .eq('file_path', filePath)
          .single();

        if (data) {
          await this.supabase.from('music_tracks').delete().eq('id', data.id);
          log.info(`[MusicSync] 删除文件记录: ${filePath}`);
        }
        return true;
      }

      // 文件新增或更新
      const fileHash = await this.calculateFileHash(filePath);
      const stats = fs.statSync(filePath);

      // 检查是否已存在
      const { data: existing } = await this.supabase
        .from('music_tracks')
        .select('id, file_hash')
        .eq('file_path', filePath)
        .single();

      let title = path.basename(filePath, ext);
      let artist = 'Unknown Artist';
      let album = 'Local Music';
      let duration = 0;
      let hasCover = false;
      let coverData: string | undefined;
      let coverMimeType: string | undefined;
      let metadataExtracted = false;

      try {
        // 解析元数据
        const metadata = await parseFile(filePath, {
          skipCovers: false,
        });

        // 优先使用元数据，确保编码正确
        if (metadata.common) {
          if (metadata.common.title) {
            title = metadata.common.title;
            metadataExtracted = true;
          }
          if (metadata.common.artist) {
            artist = metadata.common.artist;
          }
          if (metadata.common.album) {
            album = metadata.common.album;
          }
          if (metadata.format?.duration) {
            duration = Math.floor(metadata.format.duration);
          }
          // 提取封面数据
          if (metadata.common.picture && metadata.common.picture.length > 0) {
            hasCover = true;
            const picture = metadata.common.picture[0];
            coverData = picture.data.toString('base64');
            coverMimeType = picture.format || 'image/jpeg';
          }
        }
      } catch (metaError) {
        // 元数据提取失败，使用文件名和目录名
        log.debug(`[MusicSync] 元数据提取失败: ${filePath}，使用文件名和目录名`);
      }

      // 确保标题和艺术家不为空
      if (!title || title.trim() === '') {
        title = path.basename(filePath, ext);
      }
      if (!artist || artist.trim() === '') {
        artist = 'Unknown Artist';
      }

      if (existing) {
        // 更新
        await this.supabase
          .from('music_tracks')
          .update({
            title,
            artist,
            album,
            duration,
            has_cover: hasCover,
            cover_data: coverData,
            cover_mime_type: coverMimeType,
            file_hash: fileHash,
            file_size: stats.size,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        log.info(`[MusicSync] 更新文件记录: ${filePath}`);
      } else {
        // 新增
        await this.supabase.from('music_tracks').insert({
          id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file_path: filePath,
          title,
          artist,
          album,
          duration,
          has_cover: hasCover,
          cover_data: coverData,
          cover_mime_type: coverMimeType,
          file_hash: fileHash,
          file_size: stats.size,
        });
        log.info(`[MusicSync] 新增文件记录: ${filePath}`);
      }

      return true;
    } catch (error) {
      log.error(`[MusicSync] 文件变更处理失败: ${filePath}`, error);
      return false;
    }
  }

  /**
   * 清空数据库中的所有音乐记录
   */
  async clearDatabase(): Promise<{ deleted: number; success: boolean; error?: string }> {
    try {
      log.info('[MusicSync] 开始清空音乐数据库...');

      // 获取所有记录ID
      const { data: tracks, error: selectError } = await this.supabase
        .from('music_tracks')
        .select('id');

      if (selectError) {
        throw selectError;
      }

      if (!tracks || tracks.length === 0) {
        log.info('[MusicSync] 数据库已为空，无需清空');
        return { deleted: 0, success: true };
      }

      const ids = tracks.map(t => t.id);
      const batchSize = 100; // 每批删除100条

      // 分批删除
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const { error: deleteError } = await this.supabase
          .from('music_tracks')
          .delete()
          .in('id', batch);

        if (deleteError) {
          throw deleteError;
        }

        log.info(`[MusicSync] 已删除 ${Math.min(i + batchSize, ids.length)}/${ids.length} 条记录`);
      }

      log.info(`[MusicSync] ✓ 数据库清空完成，共删除 ${ids.length} 条记录`);
      return { deleted: ids.length, success: true };
    } catch (error) {
      log.error('[MusicSync] 清空数据库失败:', error);
      return {
        deleted: 0,
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(): Promise<{ totalTracks: number; lastSyncTime?: string }> {
    try {
      const { count, error } = await this.supabase
        .from('music_tracks')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      return {
        totalTracks: count || 0,
      };
    } catch (error) {
      log.error('[MusicSync] 获取同步状态失败:', error);
      return { totalTracks: 0 };
    }
  }
}

export const musicSyncService = new MusicSyncService();
