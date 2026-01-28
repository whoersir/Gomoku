-- 音乐播放器数据库表结构
-- 执行顺序：请在 Supabase SQL Editor 中按顺序执行以下 SQL

-- ============================================
-- 1. 音乐曲目表
-- ============================================
CREATE TABLE IF NOT EXISTS music_tracks (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  title TEXT,
  artist TEXT,
  album TEXT,
  duration INTEGER, -- 时长（秒）
  has_cover BOOLEAN DEFAULT FALSE,
  cover_data TEXT, -- 封面图片的 Base64 编码数据
  cover_mime_type TEXT, -- 封面图片的 MIME 类型（如 image/jpeg, image/png）
  file_hash TEXT, -- 文件哈希值（用于检测变化）
  file_size INTEGER, -- 文件大小（字节）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 为常用查询字段创建索引
CREATE INDEX IF NOT EXISTS idx_music_tracks_file_path ON music_tracks(file_path);
CREATE INDEX IF NOT EXISTS idx_music_tracks_title ON music_tracks(title);
CREATE INDEX IF NOT EXISTS idx_music_tracks_artist ON music_tracks(artist);
CREATE INDEX IF NOT EXISTS idx_music_tracks_album ON music_tracks(album);
CREATE INDEX IF NOT EXISTS idx_music_tracks_updated_at ON music_tracks(updated_at);

-- 添加表注释
COMMENT ON TABLE music_tracks IS '本地音乐文件元数据表';
COMMENT ON COLUMN music_tracks.id IS '唯一标识符（UUID）';
COMMENT ON COLUMN music_tracks.file_path IS '本地文件系统中的完整路径';
COMMENT ON COLUMN music_tracks.file_hash IS '文件内容的哈希值，用于检测文件变化';
COMMENT ON COLUMN music_tracks.duration IS '音乐时长（秒）';

-- ============================================
-- 2. 用户播放历史表
-- ============================================
CREATE TABLE IF NOT EXISTS user_play_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, -- 用户标识（socket_id 或自定义）
  track_id TEXT NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  play_duration INTEGER, -- 播放时长（秒）
  completed BOOLEAN DEFAULT FALSE -- 是否完整播放
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_play_history_user_id ON user_play_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_play_history_track_id ON user_play_history(track_id);
CREATE INDEX IF NOT EXISTS idx_user_play_history_played_at ON user_play_history(played_at DESC);

-- 添加表注释
COMMENT ON TABLE user_play_history IS '用户播放历史记录';
COMMENT ON COLUMN user_play_history.user_id IS '用户唯一标识';
COMMENT ON COLUMN user_play_history.track_id IS '播放的音乐曲目ID';
COMMENT ON COLUMN user_play_history.played_at IS '播放时间';
COMMENT ON COLUMN user_play_history.play_duration IS '实际播放时长（秒）';

-- ============================================
-- 3. 用户收藏表
-- ============================================
CREATE TABLE IF NOT EXISTS user_favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, -- 用户标识（socket_id 或自定义）
  track_id TEXT NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, track_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_track_id ON user_favorites(track_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at DESC);

-- 添加表注释
COMMENT ON TABLE user_favorites IS '用户收藏的音乐列表';
COMMENT ON COLUMN user_favorites.user_id IS '用户唯一标识';
COMMENT ON COLUMN user_favorites.track_id IS '收藏的音乐曲目ID';

-- ============================================
-- 4. 自动更新 updated_at 触发器
-- ============================================
-- 创建更新时间戳函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 music_tracks 表创建触发器
DROP TRIGGER IF EXISTS update_music_tracks_updated_at ON music_tracks;
CREATE TRIGGER update_music_tracks_updated_at
    BEFORE UPDATE ON music_tracks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. 启用行级安全（可选，如需多用户隔离）
-- ============================================
-- ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_play_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. 示例查询
-- ============================================
-- 获取所有音乐曲目（按标题排序）
-- SELECT * FROM music_tracks ORDER BY title;

-- 获取指定用户的播放历史
-- SELECT h.*, t.title, t.artist, t.album
-- FROM user_play_history h
-- JOIN music_tracks t ON h.track_id = t.id
-- WHERE h.user_id = 'user_socket_id'
-- ORDER BY h.played_at DESC
-- LIMIT 20;

-- 获取指定用户的收藏列表
-- SELECT f.*, t.title, t.artist, t.album
-- FROM user_favorites f
-- JOIN music_tracks t ON f.track_id = t.id
-- WHERE f.user_id = 'user_socket_id'
-- ORDER BY f.created_at DESC;

-- 获取最常播放的曲目
-- SELECT t.*, COUNT(h.id) as play_count
-- FROM music_tracks t
-- LEFT JOIN user_play_history h ON t.id = h.track_id
-- GROUP BY t.id
-- ORDER BY play_count DESC, t.title
-- LIMIT 20;
