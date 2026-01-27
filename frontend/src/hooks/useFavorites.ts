import { useState, useEffect } from 'react';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const FAVORITES_KEY = 'music_favorites';

  // 初始化收藏列表
  useEffect(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  // 保存收藏到本地存储
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (trackId: string) => {
    setFavorites((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  const isFavorite = (trackId: string) => favorites.includes(trackId);

  const addFavorite = (trackId: string) => {
    if (!isFavorite(trackId)) {
      setFavorites((prev) => [...prev, trackId]);
    }
  };

  const removeFavorite = (trackId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== trackId));
  };

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    addFavorite,
    removeFavorite,
    favoritesCount: favorites.length,
  };
};
