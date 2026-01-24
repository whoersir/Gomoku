/**
 * MusicAPI 服务集成
 * 支持 Netease、QQ、Xiami 等多个音乐源
 * 项目地址: https://github.com/LIU9293/musicAPI
 */

import { MusicTrack } from '../types/musicTypes';

interface MusicApiResult {
  songs?: Array<{
    id: string | number;
    name: string;
    artists: Array<{ name: string }>;
    album: { name: string; picUrl?: string };
    duration: number;
    url?: string;
  }>;
  data?: Array<{
    id: string | number;
    name: string;
    singer: Array<{ name: string }> | string;
    albumName: string;
    duration: number;
    url?: string;
    pic?: string;
  }>;
}

class MusicApiService {
  private readonly BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  /**
   * 搜索网易云音乐
   */
  async searchNetease(keyword: string, limit: number = 10): Promise<MusicTrack[]> {
    try {
      const params = new URLSearchParams({
        keyword,
        limit: limit.toString(),
      });

      const response = await fetch(
        `${this.BACKEND_URL}/api/music/netease?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Netease API request failed: ${response.status}`);
      }

      const data = await response.json() as MusicApiResult;

      if (!data.songs || data.songs.length === 0) {
        return [];
      }

      return data.songs.map((song, index) => this.transformNeteaseSong(song, index));
    } catch (error) {
      console.error('Netease search error:', error);
      return [];
    }
  }

  /**
   * 搜索 QQ 音乐
   */
  async searchQQ(keyword: string, limit: number = 10): Promise<MusicTrack[]> {
    try {
      const params = new URLSearchParams({
        keyword,
        limit: limit.toString(),
      });

      const response = await fetch(
        `${this.BACKEND_URL}/api/music/qq?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`QQ Music API request failed: ${response.status}`);
      }

      const data = await response.json() as MusicApiResult;

      if (!data.data || data.data.length === 0) {
        return [];
      }

      return data.data.map((song, index) => this.transformQQSong(song, index));
    } catch (error) {
      console.error('QQ Music search error:', error);
      return [];
    }
  }

  /**
   * 统一搜索多个源
   */
  async searchMultipleSources(keyword: string, limit: number = 10): Promise<MusicTrack[]> {
    try {
      const [neteaseResults, qqResults] = await Promise.allSettled([
        this.searchNetease(keyword, limit),
        this.searchQQ(keyword, limit),
      ]);

      const results: MusicTrack[] = [];

      if (neteaseResults.status === 'fulfilled') {
        results.push(...neteaseResults.value);
      }

      if (qqResults.status === 'fulfilled') {
        results.push(...qqResults.value);
      }

      // 去重（基于 title 和 artist）
      const uniqueTracks = Array.from(
        new Map(
          results.map((track) => [
            `${track.title}|${track.artist}`,
            track,
          ])
        ).values()
      );

      return uniqueTracks.slice(0, limit);
    } catch (error) {
      console.error('Multi-source search error:', error);
      return [];
    }
  }

  /**
   * 转换网易云音乐 Song 为 MusicTrack
   */
  private transformNeteaseSong(song: any, index: number): MusicTrack {
    const artistName = song.artists
      .map((artist: any) => artist.name)
      .join(', ') || 'Unknown Artist';

    return {
      id: `netease_${song.id}`,
      title: song.name,
      artist: artistName,
      album: song.album?.name || 'Unknown Album',
      duration: Math.floor((song.duration || 0) / 1000),
      cover: song.album?.picUrl || 'https://picsum.photos/200/200',
      url: song.url || '',
    };
  }

  /**
   * 转换 QQ 音乐 Song 为 MusicTrack
   */
  private transformQQSong(song: any, index: number): MusicTrack {
    const artistName = typeof song.singer === 'string'
      ? song.singer
      : (song.singer as any[])?.map((s: any) => s.name).join(', ') || 'Unknown Artist';

    return {
      id: `qq_${song.id}`,
      title: song.name,
      artist: artistName,
      album: song.albumName || 'Unknown Album',
      duration: Math.floor((song.duration || 0) / 1000),
      cover: song.pic || 'https://picsum.photos/200/200',
      url: song.url || '',
    };
  }
}

export const musicApiService = new MusicApiService();
