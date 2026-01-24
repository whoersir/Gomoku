import { MusicTrack, SearchFilters } from '../types/musicTypes';
import { presetPlaylist } from '../data/musicPresets';
import { jamendoService } from './jamendoService';
import { neteaseService } from './neteaseService';
import { musicApiService } from './musicApiService';

class MusicService {
  private readonly QQ_MUSIC_SEARCH = 'https://c.y.qq.com/v8/fcg-bin/fcg_v8_search_new_platform.fcg';

  async searchMusic(filters: SearchFilters): Promise<MusicTrack[]> {
    try {
      if (!filters.query || !filters.query.trim()) {
        // 如果没有搜索词，返回预设播放列表
        return presetPlaylist;
      }

      // 搜索策略：Jamendo -> musicAPI多源 -> 网易云音乐 -> 预设列表兜底
      // 1. 首选：Jamendo开放音乐平台（可播放完整歌曲）
      try {
        console.log('[MusicService] Trying Jamendo API (full-length tracks)...');
        const jamendoResults = await jamendoService.searchJamendo(filters.query, filters.limit || 10);
        if (jamendoResults.length > 0) {
          console.log(`[MusicService] Jamendo API found ${jamendoResults.length} full-length tracks`);
          return jamendoResults;
        }
      } catch (error) {
        console.warn('[MusicService] Jamendo search failed:', error);
      }

      // 2. 次选：musicAPI 多源搜索（Netease + QQ）
      try {
        console.log('[MusicService] Trying musicAPI multi-source search...');
        const multiSourceResults = await musicApiService.searchMultipleSources(filters.query, filters.limit || 10);
        if (multiSourceResults.length > 0) {
          console.log(`[MusicService] musicAPI found ${multiSourceResults.length} tracks`);
          return multiSourceResults;
        }
      } catch (error) {
        console.warn('[MusicService] musicAPI search failed:', error);
      }

      // 3. 备用：网易云音乐（完整歌曲）
      try {
        console.log('[MusicService] Trying Netease API (full-length tracks)...');
        const neteaseResults = await neteaseService.searchMusic(filters.query, filters.limit || 10);
        if (neteaseResults.length > 0) {
          console.log(`[MusicService] Netease API found ${neteaseResults.length} full-length tracks`);
          return neteaseResults;
        }
      } catch (error) {
        console.warn('[MusicService] Netease search failed:', error);
      }

      // 回退到预设列表过滤
      console.log('[MusicService] Falling back to preset playlist');
      return this.filterPresetPlaylist(filters.query);
    } catch (error) {
      console.error('Music service error:', error);
      // 出错时回退到预设列表过滤
      return this.filterPresetPlaylist(filters.query);
    }
  }

  private async searchQQMusic(keyword: string, limit: number): Promise<MusicTrack[]> {
    try {
      // 使用 musicAPI 搜索 QQ 音乐
      return await musicApiService.searchQQ(keyword, limit);
    } catch (error) {
      console.error('QQ Music search error:', error);
      throw error;
    }
  }

  /**
   * 使用 musicAPI 搜索网易云音乐
   */
  async searchNeteaseFromMusicAPI(keyword: string, limit: number = 10): Promise<MusicTrack[]> {
    try {
      console.log('[MusicService] Searching Netease via musicAPI...');
      return await musicApiService.searchNetease(keyword, limit);
    } catch (error) {
      console.error('Netease search via musicAPI failed:', error);
      return [];
    }
  }

  /**
   * 使用 musicAPI 搜索 QQ 音乐
   */
  async searchQQFromMusicAPI(keyword: string, limit: number = 10): Promise<MusicTrack[]> {
    try {
      console.log('[MusicService] Searching QQ Music via musicAPI...');
      return await musicApiService.searchQQ(keyword, limit);
    } catch (error) {
      console.error('QQ Music search via musicAPI failed:', error);
      return [];
    }
  }

  /**
   * 使用 musicAPI 搜索多个音乐源
   */
  async searchMultipleSourcesFromMusicAPI(keyword: string, limit: number = 10): Promise<MusicTrack[]> {
    try {
      console.log('[MusicService] Searching multiple sources via musicAPI...');
      return await musicApiService.searchMultipleSources(keyword, limit);
    } catch (error) {
      console.error('Multi-source search via musicAPI failed:', error);
      return [];
    }
  }

  /**
   * 获取热门音乐
   */
  async getTrendingMusic(limit: number = 10): Promise<MusicTrack[]> {
    try {
      // 首选Jamendo热门音乐（完整歌曲）
      try {
        console.log('[MusicService] Getting trending from Jamendo...');
        const jamendoTrending = await jamendoService.getTrendingTracks(limit);
        if (jamendoTrending.length > 0) {
          console.log(`[MusicService] Jamendo trending found ${jamendoTrending.length} tracks`);
          return jamendoTrending;
        }
      } catch (error) {
        console.warn('[MusicService] Jamendo trending failed:', error);
      }

      // 备用网易云音乐热门音乐（完整歌曲）
      try {
        console.log('[MusicService] Getting trending from Netease...');
        const neteaseTrending = await neteaseService.getTrendingMusic(limit);
        if (neteaseTrending.length > 0) {
          console.log(`[MusicService] Netease trending found ${neteaseTrending.length} tracks`);
          return neteaseTrending;
        }
      } catch (error) {
        console.warn('[MusicService] Netease trending failed:', error);
      }

      // 回退到预设列表
      console.log('[MusicService] Falling back to preset playlist');
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
      // 首选Jamendo流派音乐（完整歌曲）
      try {
        console.log(`[MusicService] Getting genre "${genre}" from Jamendo...`);
        const jamendoResults = await jamendoService.getTracksByGenre(genre, limit);
        if (jamendoResults.length > 0) {
          console.log(`[MusicService] Jamendo genre found ${jamendoResults.length} tracks`);
          return jamendoResults;
        }
      } catch (error) {
        console.warn('[MusicService] Jamendo genre search failed:', error);
      }

      // 备用网易云音乐流派音乐（完整歌曲）
      try {
        console.log(`[MusicService] Getting genre "${genre}" from Netease...`);
        const neteaseResults = await neteaseService.getMusicByGenre(genre, limit);
        if (neteaseResults.length > 0) {
          console.log(`[MusicService] Netease genre found ${neteaseResults.length} tracks`);
          return neteaseResults;
        }
      } catch (error) {
        console.warn('[MusicService] Netease genre search failed:', error);
      }

      // 回退到预设列表过滤
      console.log('[MusicService] Falling back to preset playlist');
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
        cover: 'https://picsum.photos/200/200',
        url: url,
      };

      return customTrack;
    } catch (error) {
      console.error('Add custom music error:', error);
      throw new Error('Failed to add custom music');
    }
  }

  /**
   * 获取流行流派列表（合并Jamendo和网易云音乐）
   */
  getPopularGenres(): string[] {
    const jamendoGenres = [
      'rock',
      'pop',
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
      'soul'
    ];

    const neteaseGenres = [
      'pop',
      'rock',
      'electronic',
      'hip-hop',
      'hiphop',
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
      'rnb',
      'dance'
    ];

    // 合并去重
    const allGenres = [...new Set([...jamendoGenres, ...neteaseGenres])];
    return allGenres.sort();
  }

  async getTrackPlayUrl(songmid: string, mediaMid: string): Promise<string> {
    // 如果songmid和mediaMid都不存在，说明是免费音乐或预设音乐，直接返回空字符串
    // 播放时会使用MusicTrack中已有的url字段
    if (!songmid && !mediaMid) {
      return '';
    }

    try {
      // 直接API调用（可能遇到CORS问题）
      const url = `https://c.y.qq.com/v8/fcg-bin/fcg_v8_song_info.fcg?songmid=${songmid}&mediaMid=${mediaMid}&g_tk=5381&uin=0&format=json&inCharset=utf-8&outCharset=utf-8`;

      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`QQ Music URL API request failed: ${response.status}`);
      }

      const data = await response.json();
      const playUrl = data?.data?.[0]?.url || '';

      return playUrl;
    } catch (error) {
      console.error('Get play URL error:', error);
      return '';
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

  private transformQQMusicTrack(song: any, index: number): MusicTrack {
    return {
      id: `qq_${song.songmid || `song_${index}`}`,
      title: song.songname || 'Unknown Title',
      artist: song.singername || 'Unknown Artist',
      album: song.albumname || 'Unknown Album',
      duration: song.interval ? this.parseDuration(song.interval) : 180,
      cover: song.songmid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.albummid?.slice(-2)}${song.albummid?.slice(-2)}.jpg` : 'https://picsum.photos/200/200',
      url: '', // 播放URL需要在播放时动态获取
      songmid: song.songmid,
      mediaMid: song.strMediaMid,
    };
  }

  private parseDuration(interval: string): number {
    if (!interval) return 180;

    try {
      const parts = interval.split(':');
      if (parts.length === 3) {
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        return minutes * 60 + seconds;
      }
      return 180;
    } catch {
      return 180;
    }
  }
}

// 扩展 MusicTrack 类型以支持QQ音乐特有字段
declare module '../types/musicTypes' {
  interface MusicTrack {
    songmid?: string;
    mediaMid?: string;
  }
}

export const musicService = new MusicService();
