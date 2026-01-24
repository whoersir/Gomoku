/**
 * 网易云音乐服务
 * 使用网易云音乐的API接口进行音乐搜索和播放
 */

import { MusicTrack } from '../types/musicTypes';

interface NeteaseSearchResponse {
  code: number;
  result: {
    songs: NeteaseSong[];
  };
}

interface NeteaseSongDetailResponse {
  code: number;
  songs: NeteaseSongDetail[];
}

interface NeteaseSongUrlResponse {
  code: number;
  data: {
    id: number;
    url: string;
  }[];
}

interface NeteaseSong {
  id: number;
  name: string;
  artists: Array<{
    id: number;
    name: string;
  }>;
  album: {
    id: number;
    name: string;
    picUrl: string;
  };
  duration: number;
}

interface NeteaseSongDetail {
  id: number;
  name: string;
  ar: Array<{
    id: number;
    name: string;
  }>;
  al: {
    id: number;
    name: string;
    picUrl: string;
  };
  dt: number;
}

class NeteaseMusicService {
  // 使用Vite代理，解决CORS问题 - Meting API
  private readonly API_BASE = '/api/meting';

  /**
   * 搜索网易云音乐
   */
  async searchMusic(keyword: string, limit: number = 10): Promise<MusicTrack[]> {
    try {
      // Meting API格式: ?type=netease&name=关键词&limit=数量&server=netease
      const url = `${this.API_BASE}?type=netease&name=${encodeURIComponent(keyword)}&limit=${limit}&server=netease`;

      console.log('[NeteasService] Searching with URL:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Netease API request failed: ${response.status}`);
      }

      // 检查响应内容类型
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.error('[NeteasService] Invalid response content-type:', contentType);
        console.error('[NeteasService] Response status:', response.status);
        
        // 获取响应体用于调试
        const responseText = await response.text();
        console.error('[NeteasService] Response body (first 200 chars):', responseText.substring(0, 200));
        throw new Error(`Invalid response format from Netease API. Expected JSON, got: ${contentType}`);
      }

      const data: any = await response.json();
      console.log('[NeteasService] API Response:', data);

      if (!data || !Array.isArray(data)) {
        console.warn('[NeteasService] Response is not an array:', typeof data);
        return [];
      }

      return data.slice(0, limit).map((song: any, index: number) => this.transformNeteaseTrack(song, index));
    } catch (error) {
      console.error('Netease music search error:', error);
      return [];
    }
  }

  /**
   * 获取热门音乐
   */
  async getTrendingMusic(limit: number = 10): Promise<MusicTrack[]> {
    try {
      // 使用热门关键词搜索
      const keywords = ['热歌榜', '流行', '新歌'];
      const results: MusicTrack[] = [];

      for (const keyword of keywords.slice(0, 2)) {
        const tracks = await this.searchMusic(keyword, Math.ceil(limit / 2));
        results.push(...tracks);
        if (results.length >= limit) break;
      }

      return results.slice(0, limit);
    } catch (error) {
      console.error('Get trending music error:', error);
      return [];
    }
  }

  /**
   * 根据流派获取音乐
   */
  async getMusicByGenre(genre: string, limit: number = 10): Promise<MusicTrack[]> {
    try {
      // 将流派关键词转换为中文
      const genreMap: { [key: string]: string } = {
        'rock': '摇滚',
        'pop': '流行',
        'electronic': '电子',
        'hip-hop': '说唱',
        'hiphop': '说唱',
        'jazz': '爵士',
        'classical': '古典',
        'reggae': '雷鬼',
        'blues': '蓝调',
        'folk': '民谣',
        'metal': '金属',
        'ambient': '氛围',
        'instrumental': '纯音乐',
        'world': '世界音乐',
        'country': '乡村',
        'soul': '灵魂乐',
        'r&b': '节奏布鲁斯',
        'rnb': '节奏布鲁斯',
        'dance': '舞曲',
        'house': '浩室',
        'techno': '泰克诺',
      };

      const searchKeyword = genreMap[genre.toLowerCase()] || genre;
      const tracks = await this.searchMusic(searchKeyword, limit);
      return tracks;
    } catch (error) {
      console.error('Get music by genre error:', error);
      return [];
    }
  }

  /**
   * 获取流行流派列表
   */
  getPopularGenres(): string[] {
    return [
      'pop',
      'rock',
      'electronic',
      'hip-hop',
      'jazz',
      'classical',
      'reggae',
      'blues',
      'folk',
      'metal',
      'ambient',
      'instrumental',
      'world',
      'country',
      'soul',
      'r&b',
      'dance'
    ];
  }

  /**
   * 转换网易云音乐Track为MusicTrack
   */
  private transformNeteaseTrack(song: any, index: number): MusicTrack {
    return {
      id: `netease_${song.id || song.mid}`,
      title: song.name || song.title || 'Unknown Title',
      artist: song.artist || song.ar?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
      album: song.album || song.al?.name || 'Unknown Album',
      duration: Math.floor((song.duration || song.dt || 180000) / 1000),
      cover: song.pic || song.picUrl || song.al?.picUrl || 'https://picsum.photos/200/200',
      url: song.url || '',
    };
  }
}

export const neteaseService = new NeteaseMusicService();
