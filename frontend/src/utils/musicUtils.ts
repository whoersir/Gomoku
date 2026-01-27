import { MusicTrack } from '../types/musicTypes';

// 按歌手分组
export const groupTracksByArtist = (tracks: MusicTrack[]) => {
  const grouped = tracks.reduce((acc, track) => {
    const artist = track.artist || '未知艺术家';
    if (!acc[artist]) {
      acc[artist] = [];
    }
    acc[artist].push(track);
    return acc;
  }, {} as Record<string, MusicTrack[]>);

  return Object.entries(grouped)
    .map(([artist, tracks]) => ({
      artist,
      tracks: tracks.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0)),
      count: tracks.length,
    }))
    .sort((a, b) => a.artist.localeCompare(b.artist, 'zh'));
};

// 搜索歌曲
export const searchTracks = (tracks: MusicTrack[], query: string): MusicTrack[] => {
  if (!query.trim()) return tracks;
  
  const lowerQuery = query.toLowerCase();
  return tracks.filter(track =>
    track.title.toLowerCase().includes(lowerQuery) ||
    track.artist.toLowerCase().includes(lowerQuery) ||
    track.album.toLowerCase().includes(lowerQuery)
  );
};

// 获取歌手的代表色（根据歌手名生成）
export const getArtistColor = (artist: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#ABEBC6',
  ];
  const hash = artist.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};
