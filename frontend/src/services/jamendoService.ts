/**
 * Jamendo 音乐服务
 * Jamendo 是一个开放的音乐平台，提供大量免费和CC许可音乐
 */

import { MusicTrack } from '../types/musicTypes';

interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  album_name: string;
  album_image: string;
  audio: string;
  duration: number;
  license_ccurl: string;
}

interface JamendoResponse {
  headers: {
    status: string;
    count: number;
  };
  results: JamendoTrack[];
}

class JamendoService {
  private readonly JAMENDO_API = 'https://api.jamendo.com/v3.0';

  /**
   * 搜索Jamendo音乐
   */
  async searchJamendo(keyword: string, limit: number = 10): Promise<MusicTrack[]> {
    try {
      const url = `${this.JAMENDO_API}/tracks/search/`;

      const params = new URLSearchParams({
        client_id: '1f777c24',
        format: 'json',
        limit: limit.toString(),
        include: 'musicinfo',
        tags: keyword,
      });

      const response = await fetch(`${url}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Jamendo API request failed: ${response.status}`);
      }

      const data: JamendoResponse = await response.json();

      if (!data.results || data.results.length === 0) {
        return [];
      }

      return data.results.map((track, index) => this.transformJamendoTrack(track, index));
    } catch (error) {
      console.error('Jamendo search error:', error);
      return [];
    }
  }

  /**
   * 获取热门音乐
   */
  async getTrendingTracks(limit: number = 10): Promise<MusicTrack[]> {
    try {
      const url = `${this.JAMENDO_API}/tracks/`;

      const params = new URLSearchParams({
        client_id: '1f777c24',
        format: 'json',
        limit: limit.toString(),
        order: 'trending_desc',
        include: 'musicinfo',
      });

      const response = await fetch(`${url}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Jamendo API request failed: ${response.status}`);
      }

      const data: JamendoResponse = await response.json();

      if (!data.results || data.results.length === 0) {
        return [];
      }

      return data.results.map((track, index) => this.transformJamendoTrack(track, index));
    } catch (error) {
      console.error('Jamendo trending error:', error);
      return [];
    }
  }

  /**
   * 根据流派获取音乐
   */
  async getTracksByGenre(genre: string, limit: number = 10): Promise<MusicTrack[]> {
    try {
      const url = `${this.JAMENDO_API}/tracks/`;

      const params = new URLSearchParams({
        client_id: '1f777c24',
        format: 'json',
        limit: limit.toString(),
        include: 'musicinfo',
        tags: genre,
      });

      const response = await fetch(`${url}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Jamendo API request failed: ${response.status}`);
      }

      const data: JamendoResponse = await response.json();

      if (!data.results || data.results.length === 0) {
        return [];
      }

      return data.results.map((track, index) => this.transformJamendoTrack(track, index));
    } catch (error) {
      console.error('Jamendo genre search error:', error);
      return [];
    }
  }

  /**
   * 获取热门流派
   */
  async getPopularGenres(): Promise<string[]> {
    return [
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
  }

  /**
   * 转换Jamendo Track为MusicTrack
   */
  private transformJamendoTrack(track: JamendoTrack, index: number): MusicTrack {
    return {
      id: `jamendo_${track.id}`,
      title: track.name,
      artist: track.artist_name,
      album: track.album_name || 'Unknown Album',
      duration: track.duration,
      cover: track.album_image || 'https://picsum.photos/200/200',
      url: track.audio,
    };
  }
}

export const jamendoService = new JamendoService();
