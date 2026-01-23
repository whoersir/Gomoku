import React, { useState, useRef, useEffect } from 'react';

interface BGMPlayerProps {
  isPlaying: boolean;
  volume?: number;
  loop?: boolean;
}

export const BGMPlayer: React.FC<BGMPlayerProps> = ({
  isPlaying,
  volume = 0.5,
  loop = true,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : currentVolume;
    audio.loop = loop;

    if (isPlaying && !isMuted) {
      audio.play().catch((err) => {
        console.warn('[BGMPlayer] Failed to play BGM:', err);
      });
    } else {
      audio.pause();
    }

    // 清理函数：组件卸载时暂停播放
    return () => {
      audio.pause();
    };
  }, [isPlaying, currentVolume, isMuted, loop]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setCurrentVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      setIsMuted(false);
      audio.play().catch((err) => {
        console.warn('[BGMPlayer] Failed to play BGM:', err);
      });
    } else {
      audio.pause();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? currentVolume : 0;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-dark-bg-primary/90 backdrop-blur-sm rounded-lg p-3 border border-dark-text-tertiary/30 shadow-lg">
      <audio ref={audioRef} src="/BGM.wav" preload="auto" />
      
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="text-dark-text-primary hover:text-primary transition-colors text-xl"
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? '🔊' : '🔇'}
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-dark-text-primary hover:text-primary transition-colors"
            title={isMuted ? '取消静音' : '静音'}
          >
            {isMuted ? '🔕' : '🔔'}
          </button>
          
          <span className="text-xs text-dark-text-secondary">🎵</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : currentVolume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-dark-text-tertiary rounded-lg appearance-none cursor-pointer accent-primary"
            title="音量控制"
          />
        </div>
      </div>
    </div>
  );
};
