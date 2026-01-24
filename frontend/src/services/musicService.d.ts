import { MusicTrack, SearchFilters } from '../types/musicTypes';
declare class MusicService {
    searchMusic(filters: SearchFilters): Promise<MusicTrack[]>;
    /**
     * 获取热门音乐
     */
    getTrendingMusic(limit?: number): Promise<MusicTrack[]>;
    /**
     * 根据流派获取音乐
     */
    getMusicByGenre(genre: string, limit?: number): Promise<MusicTrack[]>;
    /**
     * 添加自定义音乐URL
     */
    addCustomMusic(url: string, title?: string, artist?: string): Promise<MusicTrack>;
    /**
     * 获取本地音乐列表
     */
    getAllMusic(limit?: number): Promise<MusicTrack[]>;
    getTrackDetails(trackId: string): Promise<MusicTrack | null>;
    getPresetPlaylist(): MusicTrack[];
    getTrackById(trackId: string): MusicTrack | null;
    private filterPresetPlaylist;
}
export declare const musicService: MusicService;
export {};
