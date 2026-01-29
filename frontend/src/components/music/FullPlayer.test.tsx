import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FullPlayer } from './FullPlayer';
import { mockMusicTrack, mockMusicTracks, mockUseMusicPlayer, mockUseFavorites } from '../../test/mockData';

// Mock hooks
vi.mock('../../hooks/useMusicPlayer', () => ({
  useMusicPlayer: () => mockUseMusicPlayer,
}));

vi.mock('../../hooks/useFavorites', () => ({
  useFavorites: () => mockUseFavorites,
}));

// Mock 子组件
vi.mock('./PlayerControls', () => ({
  PlayerControls: () => <div data-testid="player-controls">PlayerControls</div>,
}));

vi.mock('./MusicList', () => ({
  MusicList: () => <div data-testid="music-list">MusicList</div>,
}));

vi.mock('./AllSongsView', () => ({
  AllSongsView: ({ tracks }: { tracks: any[] }) => (
    <div data-testid="all-songs-view">{tracks.length} songs</div>
  ),
}));

vi.mock('./ArtistView', () => ({
  ArtistView: ({ tracks }: { tracks: any[] }) => (
    <div data-testid="artist-view">{tracks.length} artists</div>
  ),
}));

vi.mock('./FavoriteView', () => ({
  FavoriteView: ({ tracks }: { tracks: any[] }) => (
    <div data-testid="favorite-view">{tracks.length} favorites</div>
  ),
}));

vi.mock('./LyricsView', () => ({
  LyricsView: () => <div data-testid="lyrics-view">LyricsView</div>,
}));

describe('FullPlayer', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMusicPlayer.currentTrack = null;
    mockUseMusicPlayer.isLoading = false;
    mockUseMusicPlayer.musicList = mockMusicTracks;
  });

  describe('基础渲染', () => {
    it('应该渲染半透明遮罩背景', () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const backdrop = document.querySelector('[style*="backdropFilter: blur(8px)"]');
      expect(backdrop).toBeInTheDocument();
    });

    it('应该渲染主容器', () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const mainContainer = document.querySelector('[style*="backdropFilter: blur(20px)"]');
      expect(mainContainer).toBeInTheDocument();
    });

    it('应该渲染关闭按钮', () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('点击关闭按钮应该调用 onClose', async () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('当没有曲目时', () => {
    it('应该显示"暂无音乐"提示', () => {
      render(<FullPlayer onClose={mockOnClose} />);

      expect(screen.getByText('暂无音乐')).toBeInTheDocument();
      expect(screen.getByText('请稍后刷新')).toBeInTheDocument();
    });
  });

  describe('当有曲目时', () => {
    beforeEach(() => {
      mockUseMusicPlayer.currentTrack = mockMusicTrack;
    });

    it('应该显示曲目信息', () => {
      render(<FullPlayer onClose={mockOnClose} />);

      expect(screen.getByText(mockMusicTrack.title)).toBeInTheDocument();
      expect(screen.getByText(mockMusicTrack.artist)).toBeInTheDocument();
    });

    it('应该显示曲目封面', () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const coverImage = screen.getByAltText(mockMusicTrack.title);
      expect(coverImage).toBeInTheDocument();
      expect(coverImage).toHaveAttribute('src', mockMusicTrack.cover);
    });

    it('应该渲染 PlayerControls 组件', () => {
      render(<FullPlayer onClose={mockOnClose} />);

      expect(screen.getByTestId('player-controls')).toBeInTheDocument();
    });

    it('应该显示播放列表切换按钮', () => {
      render(<FullPlayer onClose={mockOnClose} />);

      expect(screen.getByText('显示列表')).toBeInTheDocument();
    });

    it('点击播放列表按钮应该切换播放列表显示', async () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const toggleButton = screen.getByText('显示列表');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('隐藏列表')).toBeInTheDocument();
        expect(screen.getByTestId('music-list')).toBeInTheDocument();
      });
    });
  });

  describe('播放视图模式切换', () => {
    beforeEach(() => {
      mockUseMusicPlayer.currentTrack = mockMusicTrack;
    });

    it('默认应该显示封面视图', () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const coverButton = screen.getByText('封面');
      const lyricsButton = screen.getByText('歌词');

      expect(coverButton.parentElement).toHaveClass('bg-white');
      expect(lyricsButton.parentElement).not.toHaveClass('bg-white');
    });

    it('点击歌词按钮应该切换到歌词视图', async () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const lyricsButton = screen.getByText('歌词');
      fireEvent.click(lyricsButton);

      await waitFor(() => {
        expect(lyricsButton.parentElement).toHaveClass('bg-white');
      });

      expect(screen.getByTestId('lyrics-view')).toBeInTheDocument();
    });

    it('点击封面按钮应该切换回封面视图', async () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const coverButton = screen.getByText('封面');
      const lyricsButton = screen.getByText('歌词');

      fireEvent.click(lyricsButton);
      await waitFor(() => {
        expect(lyricsButton.parentElement).toHaveClass('bg-white');
      });

      fireEvent.click(coverButton);
      await waitFor(() => {
        expect(coverButton.parentElement).toHaveClass('bg-white');
      });
    });
  });

  describe('曲库视图模式', () => {
    beforeEach(() => {
      mockUseMusicPlayer.currentTrack = mockMusicTrack;
    });

    it('默认应该显示全部歌曲视图', () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const allButton = screen.getByText('全部歌曲');
      const artistButton = screen.getByText('歌手视图');
      const favoriteButton = screen.getByText('收藏音乐');

      expect(allButton.parentElement).toHaveClass('bg-white');
      expect(artistButton.parentElement).not.toHaveClass('bg-white');
      expect(favoriteButton.parentElement).not.toHaveClass('bg-white');

      expect(screen.getByTestId('all-songs-view')).toBeInTheDocument();
    });

    it('点击歌手视图应该切换到歌手视图', async () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const artistButton = screen.getByText('歌手视图');
      fireEvent.click(artistButton);

      await waitFor(() => {
        expect(artistButton.parentElement).toHaveClass('bg-white');
      });

      expect(screen.getByTestId('artist-view')).toBeInTheDocument();
    });

    it('点击收藏音乐应该切换到收藏视图', async () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const favoriteButton = screen.getByText('收藏音乐');
      fireEvent.click(favoriteButton);

      await waitFor(() => {
        expect(favoriteButton.parentElement).toHaveClass('bg-white');
      });

      expect(screen.getByTestId('favorite-view')).toBeInTheDocument();
    });

    it('收藏音乐按钮应该显示收藏数量', () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const favoriteButton = screen.getByText('收藏音乐');
      const badge = favoriteButton.parentElement?.querySelector('.rounded-full');

      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toBe('1');
    });
  });

  describe('加载状态', () => {
    it('当 isLoading 为 true 时应该显示加载动画', () => {
      mockUseMusicPlayer.isLoading = true;
      mockUseMusicPlayer.currentTrack = null;

      render(<FullPlayer onClose={mockOnClose} />);

      expect(screen.getByText('加载音乐中...')).toBeInTheDocument();

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('布局和响应式', () => {
    it('应该使用固定的定位和居中', () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const mainContainer = document.querySelector('.fixed.flex');

      expect(mainContainer).toBeInTheDocument();
      if (mainContainer) {
        const styles = window.getComputedStyle(mainContainer);
        expect(styles.position).toBe('fixed');
      }
    });

    it('zIndex 应该足够高以显示在其他内容之上', () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const backdrop = document.querySelector('[style*="z-index: 9999"]');
      const mainContainer = document.querySelector('[style*="z-index: 10000"]');

      expect(backdrop).toBeInTheDocument();
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('交互测试', () => {
    beforeEach(() => {
      mockUseMusicPlayer.currentTrack = mockMusicTrack;
    });

    it('封面按钮应该正确切换播放视图模式', async () => {
      render(<FullPlayer onClose={mockOnClose} />);

      const coverButton = screen.getByText('封面');

      expect(coverButton.parentElement).toHaveClass('bg-white');

      const lyricsButton = screen.getByText('歌词');
      fireEvent.click(lyricsButton);
      await waitFor(() => {
        expect(coverButton.parentElement).not.toHaveClass('bg-white');
      });

      fireEvent.click(coverButton);
      await waitFor(() => {
        expect(coverButton.parentElement).toHaveClass('bg-white');
      });
    });
  });
});
