import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useMusicPlayer as useMusicPlayerHook, UseMusicPlayerReturn } from '../hooks/useMusicPlayer';

/**
 * 音乐播放器 Context 类型
 * 直接使用 useMusicPlayer 的返回类型
 */
type MusicPlayerContextType = UseMusicPlayerReturn;

/**
 * 创建 Context
 */
const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(
  undefined
);

/**
 * MusicProvider 属性
 */
interface MusicProviderProps {
  children: ReactNode;
}

/**
 * 音乐播放器 Provider 组件
 *
 * 在应用顶层使用，确保音乐播放器状态在全局范围内共享
 * 避免多个组件独立初始化导致重复加载数据
 */
export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
  const musicPlayer = useMusicPlayerHook();

  // 使用 useMemo 缓存 context value，避免不必要的重新渲染
  const contextValue = useMemo(() => musicPlayer, [musicPlayer]);

  return (
    <MusicPlayerContext.Provider value={contextValue}>
      {children}
    </MusicPlayerContext.Provider>
  );
};

/**
 * 使用音乐播放器 Context 的 Hook
 *
 * 替代直接使用 useMusicPlayer，确保所有组件共享同一个播放器实例
 */
export const useMusicPlayerContext = (): MusicPlayerContextType => {
  const context = useContext(MusicPlayerContext);

  if (context === undefined) {
    throw new Error('useMusicPlayerContext must be used within a MusicProvider');
  }

  return context;
};

// 为了向后兼容，导出 useMusicPlayer 别名
export { useMusicPlayerContext as useMusicPlayer };
