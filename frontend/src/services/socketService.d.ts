import { Socket } from 'socket.io-client';
export declare const connectSocket: (serverUrl: string) => Promise<Socket>;
export declare const disconnectSocket: () => void;
export declare const getSocket: () => Socket | null;
export declare const emit: (event: string, data?: any, timeout?: number) => Promise<any>;
export declare const on: (event: string, callback: (data: any) => void) => void;
export declare const off: (event: string, callback?: (data: any) => void) => void;
export declare const clearEventListeners: (event: string) => void;
