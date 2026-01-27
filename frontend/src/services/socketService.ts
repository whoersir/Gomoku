import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
const eventHandlers = new Map<string, Set<Function>>(); // 追踪所有已注册的处理器
const pendingRegistrations = new Map<string, Set<Function>>(); // 存储等待 socket 初始化的监听器

export const connectSocket = (serverUrl: string): Promise<Socket> => {
  return new Promise((resolve, reject) => {
    if (socket?.connected) {
      resolve(socket);
      return;
    }

    // 规范化 URL 格式
    let normalizedUrl = serverUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `http://${normalizedUrl}`;
    }

    console.log('[Socket] Connecting to:', normalizedUrl);

    socket = io(normalizedUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      // Socket 连接后，注册所有等待的监听器
      registerPendingListeners();
      resolve(socket!);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      reject(error);
    });
  });
};

// 注册所有等待的监听器
const registerPendingListeners = () => {
  if (!socket) return;

  // 先清空所有已注册的监听器，避免重复
  eventHandlers.forEach((handlers, event) => {
    handlers.forEach((handler) => {
      socket?.off(event, handler as any);
    });
  });
  eventHandlers.clear();

  // 注册所有等待的监听器
  pendingRegistrations.forEach((handlers, event) => {
    console.log(
      `[Socket] Registering pending listeners for event: ${event}, count: ${handlers.size}`
    );
    handlers.forEach((handler) => {
      socket.on(event, handler as any);

      // 追踪该处理器
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, new Set());
      }
      eventHandlers.get(event)!.add(handler);
    });
  });

  pendingRegistrations.clear();
};

export const disconnectSocket = () => {
  if (socket) {
    // 清理所有事件监听器
    eventHandlers.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        socket?.off(event, handler as any);
      });
    });
    eventHandlers.clear();

    // 清理等待的监听器
    pendingRegistrations.clear();

    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const emit = (event: string, data?: any, timeout: number = 10000): Promise<any> => {
  return new Promise((resolve, reject) => {
    const performEmit = () => {
      console.log(`[socketService] emit event:`, event, data);
      let timeoutId: ReturnType<typeof setTimeout>;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      timeoutId = setTimeout(() => {
        cleanup();
        const errorMsg = `Timeout waiting for response to ${event}`;
        console.error(`[socketService] emit error - ${event}:`, errorMsg);
        reject(new Error(errorMsg));
      }, timeout);

      socket!.emit(event, data, (response: any) => {
        cleanup();
        console.log(`[socketService] received response for ${event}:`, response);
        resolve(response);
      });
    };

    // 等待 socket 连接
    if (!socket?.connected) {
      const errorMsg = 'Socket not connected';
      console.warn(
        `[socketService] emit warning - ${event}: ${errorMsg}, waiting for connection...`
      );

      // 设置一个定时器等待连接
      const waitForConnection = setInterval(() => {
        if (socket?.connected) {
          clearInterval(waitForConnection);
          performEmit();
        }
      }, 100);

      // 超时后取消
      setTimeout(() => {
        clearInterval(waitForConnection);
        if (!socket?.connected) {
          console.error(`[socketService] emit error - ${event}:`, errorMsg);
          reject(new Error(errorMsg));
        }
      }, timeout);

      return;
    }

    performEmit();
  });
};

export const on = (event: string, callback: (data: any) => void) => {
  // 移除频繁打印的日志，减少控制台噪音

  if (!socket) {
    // 存储handler以便socket连接后注册
    if (!pendingRegistrations.has(event)) {
      pendingRegistrations.set(event, new Set());
    }
    pendingRegistrations.get(event)!.add(callback);
    return;
  }

  // 追踪该处理器
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, new Set());
  }

  // 检查是否已经注册过相同的回调，避免重复注册
  const handlers = eventHandlers.get(event)!;
  if (handlers.has(callback)) {
    // 重复注册是正常的（组件重新渲染），不打印警告
    return;
  }
  handlers.add(callback);
  socket.on(event, callback);
};

export const off = (event: string, callback?: (data: any) => void) => {
  if (!socket) {
    console.warn(`[socketService] Tried to unlisten from '${event}' but socket is not initialized`);
    return;
  }

  console.log(`[socketService] Unlistening from event: ${event}`);

  if (callback) {
    // 移除特定的处理器
    socket.off(event, callback as any);
    eventHandlers.get(event)?.delete(callback);
  } else {
    // 移除该事件的所有处理器
    const handlers = eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        socket?.off(event, handler as any);
      });
      eventHandlers.delete(event);
    }
  }
};

// 强制清理某个事件的所有监听器（用于确保彻底清理）
export const clearEventListeners = (event: string) => {
  // 先清理 pendingRegistrations 中的监听器（无论 socket 是否初始化）
  const pendingHandlers = pendingRegistrations.get(event);
  if (pendingHandlers) {
    console.log(
      `[socketService] Clearing pending listeners for event: ${event}, count: ${pendingHandlers.size}`
    );
    pendingHandlers.clear();
  }

  // 如果 socket 已初始化，清理已注册的监听器
  if (socket) {
    const handlers = eventHandlers.get(event);
    if (handlers) {
      console.log(
        `[socketService] Force clearing all listeners for event: ${event}, count: ${handlers.size}`
      );
      handlers.forEach((handler) => {
        socket.off(event, handler as any);
      });
      eventHandlers.delete(event);
    }
  }
};
