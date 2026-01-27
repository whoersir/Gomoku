/**
 * 获取后端 API URL
 * 优先使用环境变量配置的地址，否则根据当前页面 URL 动态生成
 */
export const getBackendUrl = (): string => {
  // 尝试访问环境变量
  // @ts-ignore - vite 会在构建时注入这个变量
  const envBackendUrl = import.meta?.env?.VITE_BACKEND_URL;

  // 如果构建时设置了 VITE_BACKEND_URL 环境变量，使用它
  if (envBackendUrl) {
    return envBackendUrl;
  }

  // 否则，根据当前页面 URL 动态生成后端 URL
  // 将前端端口号 (5173) 替换为后端端口号 (3000)
  const currentUrl = window.location.origin;
  if (currentUrl.includes(':5173')) {
    return currentUrl.replace(':5173', ':3000');
  }

  // 如果不是 5173 端口，则使用默认端口 3000
  const url = new URL(currentUrl);
  url.port = '3000';
  return url.toString();
};
