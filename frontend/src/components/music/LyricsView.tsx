import React, { useState, useEffect, useRef } from 'react';
import { useMusicPlayer } from '../../hooks/useMusicPlayer';

interface LyricLine {
  time: number;
  text: string;
}

export const LyricsView: React.FC = () => {
  const { currentTrack, currentTime, seekTo } = useMusicPlayer();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('[LyricsView] COMPONENT MOUNTED');
  }, []);

  // 加载并解析LRC歌词
  useEffect(() => {
    console.log('[LyricsView] Effect triggered, currentTrack:', currentTrack);

    if (!currentTrack?.lyrics) {
      console.log('[LyricsView] No lyrics URL found, clearing lyrics');
      setLyrics([]);
      return;
    }

    console.log('[LyricsView] Loading lyrics from:', currentTrack.lyrics);

    fetch(currentTrack.lyrics)
      .then((res) => {
        console.log('[LyricsView] Fetch response status:', res.status);
        return res.text();
      })
      .then((text) => {
        console.log(
          '[LyricsView] Fetched text length:',
          text.length,
          'content:',
          text.substring(0, 100)
        );
        const parsed = parseLRC(text);
        console.log('[LyricsView] Parsed lyrics count:', parsed.length);
        return parsed;
      })
      .then(setLyrics)
      .catch((err) => {
        console.error('[LyricsView] Failed to load lyrics:', err);
        setLyrics([]);
      });
  }, [currentTrack]);

  // 查找当前应该高亮的歌词行
  const getCurrentIndex = (): number => {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        return i;
      }
    }
    return -1;
  };

  // 自动滚动到当前歌词
  useEffect(() => {
    const currentIndex = getCurrentIndex();
    if (currentIndex >= 0 && containerRef.current) {
      const lines = containerRef.current.querySelectorAll('.lyrics-line');
      if (lines[currentIndex]) {
        lines[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, lyrics]);

  // 处理歌词行点击
  const handleLineClick = (time: number) => {
    seekTo(time);
  };

  if (lyrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/50 text-lg">暂无歌词</p>
      </div>
    );
  }

  const currentIndex = getCurrentIndex();

  return (
    <div className="h-full overflow-y-auto" ref={containerRef}>
      {/* 添加一些上下文空白，方便滚动 */}
      <div className="h-32" />

      {lyrics.map((line, index) => {
        const isCurrent = index === currentIndex;
        const isPast = index < currentIndex;

        return (
          <div
            key={index}
            className={`lyrics-line py-3 px-4 text-center cursor-pointer transition-all ${
              isCurrent
                ? 'text-white text-xl font-bold scale-110'
                : isPast
                  ? 'text-white/40 text-base'
                  : 'text-white/70 text-base'
            }`}
            onClick={() => handleLineClick(line.time)}
          >
            {line.text}
          </div>
        );
      })}

      {/* 添加一些上下文空白，方便滚动 */}
      <div className="h-32" />
    </div>
  );
};

// LRC解析函数
function parseLRC(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n');
  const lyrics: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  lines.forEach((line) => {
    const matches = [...line.matchAll(timeRegex)];
    if (matches.length > 0) {
      const match = matches[0];
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const centiseconds = parseInt(match[3].padEnd(3, '0'));
      const time = minutes * 60 + seconds + centiseconds / 1000;
      const text = line.replace(timeRegex, '').trim();

      if (text) {
        lyrics.push({ time, text });
      }
    }
  });

  return lyrics.sort((a, b) => a.time - b.time);
}
