-- 添加专辑封面字段到 music_tracks 表
-- 执行顺序：请在 Supabase SQL Editor 中执行

-- 添加封面数据字段
ALTER TABLE music_tracks
ADD COLUMN IF NOT EXISTS cover_data TEXT;

-- 添加封面 MIME 类型字段
ALTER TABLE music_tracks
ADD COLUMN IF NOT EXISTS cover_mime_type TEXT;

-- 为新字段添加注释
COMMENT ON COLUMN music_tracks.cover_data IS '封面图片的 Base64 编码数据（data URI 格式）';
COMMENT ON COLUMN music_tracks.cover_mime_type IS '封面图片的 MIME 类型（如 image/jpeg, image/png）';

-- 更新现有记录：如果 has_cover 为 true，但封面数据为空，则将 has_cover 设为 false
UPDATE music_tracks
SET has_cover = false
WHERE has_cover = true
  AND (cover_data IS NULL OR cover_data = '');

-- 验证字段已添加
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'music_tracks'
  AND column_name IN ('cover_data', 'cover_mime_type')
ORDER BY column_name;
