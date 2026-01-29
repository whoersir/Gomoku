/**
 * API 配置工具函数
 */

/**
 * 获取后端基础 URL
 * @returns 后端基础 URL
 */
export const getBackendUrl = (): string => {
  if (window.location.origin.includes(':5173')) {
    return window.location.origin.replace(':5173', ':3000');
  }
  return `${window.location.protocol}//${window.location.hostname}:3000`;
};
