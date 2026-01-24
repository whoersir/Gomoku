import { MusicTrack } from '../types/musicTypes';

export const presetPlaylist: MusicTrack[] = [
  {
    id: '1',
    title: 'Relaxing Piano',
    artist: 'Piano Dreams',
    album: 'Calm Moments',
    duration: 180,
    cover: 'https://picsum.photos/64/64?random=1',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3'
  },
  {
    id: '2',
    title: 'Peaceful Morning',
    artist: 'Nature Sounds',
    album: 'Morning Vibes',
    duration: 240,
    cover: 'https://picsum.photos/64/64?random=2',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Elisions.mp3'
  },
  {
    id: '3',
    title: 'Gaming Background',
    artist: 'Tech Beats',
    album: 'Electronic Dreams',
    duration: 200,
    cover: 'https://picsum.photos/64/64?random=3',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Ketsa/Raising_Frequency/Ketsa_-_01_-_Seeing_You_Again.mp3'
  },
  {
    id: '4',
    title: 'Soft Jazz',
    artist: 'Jazz Collective',
    album: 'Smooth Sessions',
    duration: 210,
    cover: 'https://picsum.photos/64/64?random=4',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Josh_Woodward/The_Wake/Josh_Woodward_-_The_Wake_-_01_-_Coffee.mp3'
  },
  {
    id: '5',
    title: 'Ambient Flow',
    artist: 'Ambient Lab',
    album: 'Ethereal',
    duration: 190,
    cover: 'https://picsum.photos/64/64?random=5',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Podington_Bear/Solstice/Podington_Bear_-_Starling.mp3'
  },
  {
    id: '6',
    title: 'Focus Mode',
    artist: 'Study Music',
    album: 'Concentration',
    duration: 220,
    cover: 'https://picsum.photos/64/64?random=6',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Ketsa/Sprightly/Ketsa_-_14_-_Elusive.mp3'
  },
  {
    id: '7',
    title: 'Game Victory',
    artist: 'Epic Sounds',
    album: 'Gaming Collection',
    duration: 170,
    cover: 'https://picsum.photos/64/64?random=7',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/BoxCat_Games/Nameless_The_Hackers_RPG_Soundtrack/BoxCat_Games_-_10_-_Epic_Song.mp3'
  },
  {
    id: '8',
    title: 'Meditation',
    artist: 'Zen Garden',
    album: 'Inner Peace',
    duration: 250,
    cover: 'https://picsum.photos/64/64?random=8',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Ketsa/Realigning/Ketsa_-_06_-_Meadows.mp3'
  }
];

export const STORAGE_KEY_PLAYLIST = 'music_player_playlist';
export const STORAGE_KEY_TRACK_INDEX = 'music_player_track_index';
export const STORAGE_KEY_VOLUME = 'music_player_volume';
export const STORAGE_KEY_MINI_MODE = 'music_player_mini_mode';
export const STORAGE_KEY_PLAY_MODE = 'music_player_play_mode';
