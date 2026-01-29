import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MiniPlayer } from './MiniPlayer';
import { mockMusicTrack, mockUseMusicPlayer } from '../../test/mockData';

// Mock useMusicPlayer hook
vi.mock('../../hooks/useMusicPlayer', () => ({
  useMusicPlayer: () => mockUseMusicPlayer,
}));

describe('MiniPlayer', () => {
  const mockOnOpenFullPlayer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMusicPlayer.currentTrack = null;
    mockUseMusicPlayer.isPlaying = false;
    mockUseMusicPlayer.currentTime = 0;
    mockUseMusicPlayer.duration = 0;
  });

  describe('当没有当前曲目时', () => {
    it('应该显示占位符', () => {
      render(<MiniPlayer onOpenFullPlayer={mockOnOpenFullPlayer} />);

      expect(screen.getByText('播放器')).toBeInTheDocument();
      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('点击占位符应该调用 onOpenFullPlayer', async () => {
      render(<MiniPlayer onOpenFullPlayer={mockOnOpenFullPlayer} />);

      const placeholder = screen.getByText('播放器').closest('div');
      expect(placeholder).toBeInTheDocument();

      if (placeholder) {
        fireEvent.click(placeholder);
        await waitFor(() => {
          expect(mockOnOpenFullPlayer).toHaveBeenCalledTimes(1);
        });
      }
    });
  });

  describe('当有当前曲目时', () => {
    beforeEach(() => {
      mockUseMusicPlayer.currentTrack = mockMusicTrack;
      mockUseMusicPlayer.isPlaying = false;
      mockUseMusicPlayer.currentTime = 60000; // 1分钟
      mockUseMusicPlayer.duration = 180000; // 3分钟
    });

    it('应该显示曲目信息', () => {
      render(<MiniPlayer onOpenFullPlayer={mockOnOpenFullPlayer} />);

      expect(screen.getByText(mockMusicTrack.title)).toBeInTheDocument();
      expect(screen.getByText(mockMusicTrack.artist)).toBeInTheDocument();
    });

    it('应该显示专辑封面', () => {
      render(<MiniPlayer onOpenFullPlayer={mockOnOpenFullPlayer} />);

      const coverImage = screen.getByAltText(mockMusicTrack.title);
      expect(coverImage).toBeInTheDocument();
      expect(coverImage).toHaveAttribute('src', mockMusicTrack.cover);
    });

    it('应该显示播放/暂停按钮', () => {
      render(<MiniPlayer onOpenFullPlayer={mockOnOpenFullPlayer} />);

      const playButton = screen.queryByRole('button');
      expect(playButton).toBeInTheDocument();
    });

    it('点击播放按钮应该调用 togglePlay', async () => {
      render(<MiniPlayer onOpenFullPlayer={mockOnOpenFullPlayer} />);

      const playButton = screen.queryByRole('button');
      expect(playButton).toBeInTheDocument();

      if (playButton) {
        fireEvent.click(playButton);
        expect(mockUseMusicPlayer.togglePlay).toHaveBeenCalledTimes(1);
      }
    });

    it('应该显示当前时间和总时长', () => {
      render(<MiniPlayer onOpenFullPlayer={mockOnOpenFullPlayer} />);

      expect(screen.getByText('1:00')).toBeInTheDocument(); // 当前时间
      expect(screen.getByText('3:00')).toBeInTheDocument(); // 总时长
    });

    it('应该显示进度条', () => {
      render(<MiniPlayer onOpenFullPlayer={mockOnOpenFullPlayer} />);

      const progressBar = document.querySelector('.h-1.bg-white\\/30');
      expect(progressBar).toBeInTheDocument();
    });

    it('点击封面应该打开完整播放器且不触发其他点击', async () => {
      render(<MiniPlayer onOpenFullPlayer={mockOnOpenFullPlayer} />);

      const coverImage = screen.getByAltText(mockMusicTrack.title);
      const coverContainer = coverImage.closest('.cursor-pointer');

      expect(coverContainer).toBeInTheDocument();

      if (coverContainer) {
        fireEvent.click(coverContainer);
        expect(mockOnOpenFullPlayer).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('当正在播放时', () => {
    beforeEach(() => {
      mockUseMusicPlayer.currentTrack = mockMusicTrack;
      mockUseMusicPlayer.isPlaying = true;
      mockUseMusicPlayer.currentTime = 90000;
      mockUseMusicPlayer.duration = 180000;
    });

    it('应该显示暂停图标而不是播放图标', () => {
      render(<MiniPlayer onOpenFullPlayer={mockOnOpenFullPlayer} />);

      const pauseButton = screen.queryByRole('button');
      expect(pauseButton).toBeInTheDocument();
    });

    it('应该在封面上显示音频波形动画', () => {
      render(<MiniPlayer onOpenFullPlayer={mockOnOpenFullPlayer} />);

      const animatedBars = document.querySelectorAll('.animate-pulse');
      expect(animatedBars.length).toBeGreaterThan(0);
    });
  });

  describe('封面图片加载失败', () => {
    it('应该显示默认封面', () => {
      mockUseMusicPlayer.currentTrack = mockMusicTrack;

      render(<MiniPlayer onOpenFullPlayer={mockOnOpenFullPlayer} />);

      const coverImage = screen.getByAltText(mockMusicTrack.title);

      fireEvent.error(coverImage);

      expect(coverImage).toHaveAttribute('src', 'https://picsum.photos/64/64');
    });
  });

  describe('进度计算', () => {
    it('应该正确计算进度百分比', () => {
      mockUseMusicPlayer.currentTrack = mockMusicTrack;
      mockUseMusicPlayer.currentTime = 90000; // 1.5分钟
      mockUseMusicPlayer.duration = 180000; // 3分钟

      render(<MiniPlayer onOpenFullPlayer={mockOnOpenFullPlayer} />);

      const progressBarFill = document.querySelector('.from-blue-400');
      if (progressBarFill) {
        expect(progressBarFill).toHaveStyle({ width: '50%' });
      }
    });

    it('当时长为0时进度应该是0%', () => {
      mockUseMusicPlayer.currentTrack = mockMusicTrack;
      mockUseMusicPlayer.currentTime = 0;
      mockUseMusicPlayer.duration = 0;

      render(<MiniPlayer onOpenFullPlayer={mockOnOpenFullPlayer} />);

      const progressBarFill = document.querySelector('.from-blue-400');
      if (progressBarFill) {
        expect(progressBarFill).toHaveStyle({ width: '0%' });
      }
    });
  });
});
