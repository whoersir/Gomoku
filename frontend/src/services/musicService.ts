import { MusicTrack, SearchFilters } from '../types/musicTypes';
import { presetPlaylist } from '../data/musicPresets';
import { localMusicService } from './localMusicService';

class MusicService {
  async searchMusic(filters: SearchFilters): Promise<MusicTrack[]> {
    try {
      if (!filters.query || !filters.query.trim()) {
        // 如果没有搜索词，返回预设播放列表
        return presetPlaylist;
      }

      // 搜索策略：只搜索本地音乐
      try {
        console.log('[MusicService] Searching local music library...');
        const localResults = await localMusicService.searchMusic(filters.query, filters.limit || 10);
        if (localResults.length > 0) {
          console.log(`[MusicService] Local music found ${localResults.length} tracks`);
          if (localResults.length > 0) {
            console.log('[MusicService] First track before return:', {
              title: localResults[0].title,
              url: localResults[0].url,
              urlType: typeof localResults[0].url
            });
          }
          return localResults;
        }
      } catch (error) {
        console.warn('[MusicService] Local music search failed:', error);
      }

      // 本地无结果时，返回预设列表过滤
      console.log('[MusicService] No local music found, falling back to preset playlist');
      return this.filterPresetPlaylist(filters.query);
    } catch (error) {
      console.error('Music service error:', error);
      // 出错时回退到预设列表过滤
      return this.filterPresetPlaylist(filters.query);
    }
  }

  /**
   * 获取热门音乐
   */
  async getTrendingMusic(limit: number = 10): Promise<MusicTrack[]> {
    try {
      // 返回预设列表
      console.log('[MusicService] Getting trending from preset playlist');
      return presetPlaylist.slice(0, limit);
    } catch (error) {
      console.error('Get trending music error:', error);
      return presetPlaylist.slice(0, limit);
    }
  }

  /**
   * 根据流派获取音乐
   */
  async getMusicByGenre(genre: string, limit: number = 10): Promise<MusicTrack[]> {
    try {
      // 回退到预设列表过滤
      console.log(`[MusicService] Getting genre "${genre}" from preset playlist`);
      return this.filterPresetPlaylist(genre);
    } catch (error) {
      console.error('Get music by genre error:', error);
      return this.filterPresetPlaylist(genre);
    }
  }

  /**
   * 添加自定义音乐URL
   */
  async addCustomMusic(url: string, title?: string, artist?: string): Promise<MusicTrack> {
    try {
      // 提取文件名作为标题
      const fileName = url.split('/').pop() || 'Custom Track';
      const trackTitle = title || fileName;

      const customTrack: MusicTrack = {
        id: `custom_${Date.now()}`,
        title: trackTitle,
        artist: artist || 'Custom',
        album: 'Custom Playlist',
        duration: 180,
        cover: 'https://picsum.photos/64/64',
        url: url,
      };

      return customTrack;
    } catch (error) {
      console.error('Add custom music error:', error);
      throw new Error('Failed to add custom music');
    }
  }

  /**
   * 获取所有音乐（按A-Z排序）
   */
  async getAllMusicSorted(
    sortBy: 'title' | 'artist' | 'album' = 'title',
    limit: number = 999999
  ): Promise<MusicTrack[]> {
    try {
      // 直接调用后端的 /api/music/all API
      const response = await fetch(`/api/music/all?limit=${limit}&sortBy=${sortBy}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch music list: ${response.status}`);
      }

      const localTracks: any[] = await response.json();

      console.log(`[musicService] 获取到 ${localTracks.length} 首歌曲 (排序: ${sortBy})`);

      if (localTracks.length > 0) {
        console.log('[musicService] 第一首歌示例:', {
          id: localTracks[0].id,
          title: localTracks[0].title,
          url: localTracks[0].url,
          cover: localTracks[0].cover
        });
      }

      // 转换为前端使用的 MusicTrack 格式
      const tracks = localTracks.map((track: any) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        url: track.url,
        cover: track.cover || 'https://picsum.photos/64/64'
      }));

      console.log('[musicService] 转换后的第一首歌:', tracks[0]);

      return tracks;
    } catch (error) {
      console.error('[musicService] Get all music sorted error:', error);
      // 降级到预设播放列表
      return this.getPresetPlaylist();
    }
  }

  /**
   * 获取本地音乐列表
   */
  async getAllMusic(limit: number = 50): Promise<MusicTrack[]> {
    try {
      return await localMusicService.getAllMusic(limit);
    } catch (error) {
      console.error('Get all music error:', error);
      return presetPlaylist.slice(0, limit);
    }
  }

  async getTrackDetails(trackId: string): Promise<MusicTrack | null> {
    try {
      return presetPlaylist.find(t => t.id === trackId) || null;
    } catch (error) {
      console.error('Get track details error:', error);
      return null;
    }
  }

  getPresetPlaylist(): MusicTrack[] {
    return presetPlaylist;
  }

  getTrackById(trackId: string): MusicTrack | null {
    return presetPlaylist.find(t => t.id === trackId) || null;
  }

  private filterPresetPlaylist(query: string): MusicTrack[] {
    if (!query) return presetPlaylist;

    const lowerQuery = query.toLowerCase();
    return presetPlaylist.filter(
      track =>
        track.title.toLowerCase().includes(lowerQuery) ||
        track.artist.toLowerCase().includes(lowerQuery) ||
        track.album.toLowerCase().includes(lowerQuery)
    );
  }
}

export const musicService = new MusicService();
