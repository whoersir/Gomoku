import { PlayerState, MusicTrack } from '../types/musicTypes';
export declare function useMusicPlayer(): {
    playerState: PlayerState;
    playPause: () => void;
    playNext: () => void;
    playPrevious: () => void;
    playTrack: (track: MusicTrack, index?: number) => void;
    setVolume: (volume: number) => void;
    seek: (time: number) => void;
    loadPlaylist: (tracks: MusicTrack[]) => Promise<void>;
    searchMusic: (query: string) => Promise<MusicTrack[]>;
    formatTime: (seconds: number) => string;
    togglePlayMode: () => void;
    getCurrentDuration: () => number;
};
