export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration?: number;
  cover?: string;
  url: string;
  trackNumber?: number;
  lyrics?: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: MusicTrack[];
}

export type PlayMode = 'sequential' | 'random' | 'single' | 'loop';

export interface PlayerState {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  playlist: MusicTrack[];
  currentTrackIndex: number;
  isMiniMode: boolean;
  playlistId: string;
  playMode: PlayMode;
}

export interface SearchFilters {
  query: string;
  genre?: string;
  limit?: number;
}

export interface FreeMusicArchiveTrack {
  track_id: string;
  track_title: string;
  artist_name: string;
  album_title: string;
  duration?: number;
  track_image_file?: string;
  audio_file?: string;
}
