import { MusicTrack } from '../types/musicTypes';

interface LocalMusicResponse extends MusicTrack {
  // 本地音乐可能有额外字段
}

class LocalMusicService {
  /**
   * 搜索本地音乐
   */
  async searchMusic(keyword: string, limit: number = 10): Promise<MusicTrack[]> {
    try {
      if (!keyword || !keyword.trim()) {
        return [];
      }

      console.log('[LocalMusicService] Searching local music:', keyword);
      
      const response = await fetch(
        `/api/music/local?keyword=${encodeURIComponent(keyword)}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Local music search failed: ${response.status}`);
      }

      const data: LocalMusicResponse[] = await response.json();

      if (!Array.isArray(data)) {
        console.warn('[LocalMusicService] Invalid response format');
        return [];
      }

      console.log(`[LocalMusicService] Found ${data.length} local tracks`);
      if (data.length > 0) {
        console.log('[LocalMusicService] First track raw data:', data[0]);
        console.log('[LocalMusicService] First track URL:', data[0].url);
      }
      return data.map(track => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        url: track.url,
        cover: track.cover || 'https://picsum.photos/64/64'
      }));
    } catch (error) {
      console.error('[LocalMusicService] Search error:', error);
      return [];
    }
  }

  /**
   * 获取本地音乐列表（空搜索）
   */
  async getAllMusic(limit: number = 50): Promise<MusicTrack[]> {
    return this.searchMusic('', limit);
  }
}

export const localMusicService = new LocalMusicService();
