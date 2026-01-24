import { io } from 'socket.io-client';
let socket = null;
const eventHandlers = new Map(); // 追踪所有已注册的处理器
const pendingRegistrations = new Map(); // 存储等待 socket 初始化的监听器
export const connectSocket = (serverUrl) => {
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
            resolve(socket);
        });
        socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error);
            reject(error);
        });
    });
};
// 注册所有等待的监听器
const registerPendingListeners = () => {
    if (!socket)
        return;
    // 先清空所有已注册的监听器，避免重复
    eventHandlers.forEach((handlers, event) => {
        handlers.forEach(handler => {
            socket?.off(event, handler);
        });
    });
    eventHandlers.clear();
    // 注册所有等待的监听器
    pendingRegistrations.forEach((handlers, event) => {
        console.log(`[Socket] Registering pending listeners for event: ${event}, count: ${handlers.size}`);
        handlers.forEach(handler => {
            socket.on(event, handler);
            // 追踪该处理器
            if (!eventHandlers.has(event)) {
                eventHandlers.set(event, new Set());
            }
            eventHandlers.get(event).add(handler);
        });
    });
    pendingRegistrations.clear();
};
export const disconnectSocket = () => {
    if (socket) {
        // 清理所有事件监听器
        eventHandlers.forEach((handlers, event) => {
            handlers.forEach(handler => {
                socket?.off(event, handler);
            });
        });
        eventHandlers.clear();
        // 清理等待的监听器
        pendingRegistrations.clear();
        socket.disconnect();
        socket = null;
    }
};
export const getSocket = () => {
    return socket;
};
export const emit = (event, data, timeout = 10000) => {
    return new Promise((resolve, reject) => {
        if (!socket?.connected) {
            const errorMsg = 'Socket not connected';
            console.error(`[socketService] emit error - ${event}:`, errorMsg);
            reject(new Error(errorMsg));
            return;
        }
        console.log(`[socketService] emit event:`, event, data);
        let timeoutId;
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
        socket.emit(event, data, (response) => {
            cleanup();
            console.log(`[socketService] received response for ${event}:`, response);
            resolve(response);
        });
    });
};
export const on = (event, callback) => {
    console.log(`[socketService] Attempting to listen to event: ${event}`);
    if (!socket) {
        console.warn(`[socketService] Socket not initialized, storing ${event} handler for later registration`);
        // 存储 handler 以便 socket 连接后注册
        if (!pendingRegistrations.has(event)) {
            pendingRegistrations.set(event, new Set());
        }
        pendingRegistrations.get(event).add(callback);
        return;
    }
    // 追踪该处理器
    if (!eventHandlers.has(event)) {
        eventHandlers.set(event, new Set());
    }
    // 检查是否已经注册过相同的回调，避免重复注册
    const handlers = eventHandlers.get(event);
    if (handlers.has(callback)) {
        console.warn(`[socketService] Handler for event '${event}' already registered, skipping duplicate registration`);
        return;
    }
    console.log(`[socketService] Listening to event: ${event}`);
    handlers.add(callback);
    socket.on(event, callback);
};
export const off = (event, callback) => {
    if (!socket) {
        console.warn(`[socketService] Tried to unlisten from '${event}' but socket is not initialized`);
        return;
    }
    console.log(`[socketService] Unlistening from event: ${event}`);
    if (callback) {
        // 移除特定的处理器
        socket.off(event, callback);
        eventHandlers.get(event)?.delete(callback);
    }
    else {
        // 移除该事件的所有处理器
        const handlers = eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                socket?.off(event, handler);
            });
            eventHandlers.delete(event);
        }
    }
};
// 强制清理某个事件的所有监听器（用于确保彻底清理）
export const clearEventListeners = (event) => {
    // 先清理 pendingRegistrations 中的监听器（无论 socket 是否初始化）
    const pendingHandlers = pendingRegistrations.get(event);
    if (pendingHandlers) {
        console.log(`[socketService] Clearing pending listeners for event: ${event}, count: ${pendingHandlers.size}`);
        pendingHandlers.clear();
    }
    // 如果 socket 已初始化，清理已注册的监听器
    if (socket) {
        const handlers = eventHandlers.get(event);
        if (handlers) {
            console.log(`[socketService] Force clearing all listeners for event: ${event}, count: ${handlers.size}`);
            handlers.forEach(handler => {
                socket.off(event, handler);
            });
            eventHandlers.delete(event);
        }
    }
};
