import { MusicTrack } from '../types/musicTypes';
declare class LocalMusicService {
    /**
     * 搜索本地音乐
     */
    searchMusic(keyword: string, limit?: number): Promise<MusicTrack[]>;
    /**
     * 获取本地音乐列表（空搜索）
     */
    getAllMusic(limit?: number): Promise<MusicTrack[]>;
}
export declare const localMusicService: LocalMusicService;
export {};
