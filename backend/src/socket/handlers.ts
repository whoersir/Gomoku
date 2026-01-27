import { RoomManager } from '../managers/RoomManager';
import { HistoryManager } from '../managers/HistoryManager';
import { PlayerManager } from '../managers/PlayerManager';
import { BaseHandler } from './BaseHandler';
import { RoomHandler } from './RoomHandler';
import { GameHandler } from './GameHandler';
import { SpectatorHandler } from './SpectatorHandler';
import { ChatHandler } from './ChatHandler';
import { DataHandler } from './DataHandler';
import { HistoryRecord } from '../types/game';
import { log } from '../utils/logger';
import { Socket } from 'socket.io';

/**
 * Socket事件处理器主类
 * 协调各个专门处理器处理不同类型的Socket事件
 */
export class SocketHandlers extends BaseHandler {
  private historyManager: HistoryManager;
  private roomHandler: RoomHandler;
  private gameHandler: GameHandler;
  private spectatorHandler: SpectatorHandler;
  private chatHandler: ChatHandler;
  private dataHandler: DataHandler;

  constructor(
    roomManager: RoomManager,
    historyManager: HistoryManager,
    playerManager: PlayerManager
  ) {
    super(roomManager, playerManager);
    this.historyManager = historyManager;

    // 初始化各个专门处理器
    this.roomHandler = new RoomHandler(roomManager, playerManager);
    this.gameHandler = new GameHandler(roomManager, playerManager);
    this.spectatorHandler = new SpectatorHandler(roomManager, playerManager);
    this.chatHandler = new ChatHandler(roomManager, playerManager);
    this.dataHandler = new DataHandler(historyManager);

    // 设置DataHandler的依赖
    this.dataHandler.setDependencies(roomManager, playerManager);

    // 为GameHandler注入saveGameToHistory方法
    (this.gameHandler as any).saveGameToHistory = async (historyRecord: HistoryRecord) => {
      await this.historyManager.saveRecord(historyRecord);
    };
  }

  /**
   * 处理新的Socket连接
   */
  async handleConnection(socket: Socket, io: any): Promise<void> {
    log.info(`[Socket] Player connected: ${socket.id}`);

    // 房间相关事件
    socket.on('createRoom', (data, callback) => {
      this.roomHandler.handleCreateRoom(socket, data, io, callback);
    });

    socket.on('joinRoom', (data, callback) => {
      this.roomHandler.handleJoinRoom(socket, data, io, callback);
    });

    socket.on('closeRoom', (data, callback) => {
      this.roomHandler.handleCloseRoom(socket, data, io, callback);
    });

    socket.on('leaveRoom', (_data, callback) => {
      this.roomHandler.handleLeaveRoom(socket, io, callback);
    });

    socket.on('getRoomList', (data, callback) => {
      // Handle both cases: with or without data parameter
      const actualCallback = typeof data === 'function' ? data : callback;
      this.roomHandler.handleGetRoomList(actualCallback);
    });

    // 观战相关事件
    socket.on('watchRoom', (data, callback) => {
      this.spectatorHandler.handleWatchRoom(socket, data, io, callback);
    });

    socket.on('switchToSpectator', (data, callback) => {
      this.spectatorHandler.handleSwitchToSpectator(socket, data, io, callback);
    });

    // 游戏相关事件
    socket.on('move', (data, callback) => {
      this.gameHandler.handleMove(socket, data, io, callback);
    });

    socket.on('restartGame', (data, callback) => {
      this.gameHandler.handleRestartGame(socket, data, io, callback);
    });

    // 聊天相关事件
    socket.on('chat', (data, callback) => {
      this.chatHandler.handleChat(socket, data, io, callback);
    });

    // 数据获取相关事件
    socket.on('getHistory', (data, callback) => {
      // Handle both cases: with or without data parameter
      let actualData = {};
      let actualCallback = callback;

      if (typeof data === 'function') {
        actualCallback = data;
      } else if (typeof data === 'object') {
        actualData = data;
      }

      this.dataHandler.handleGetHistory(actualData, actualCallback);
    });

    socket.on('getLeaderboard', (data, callback) => {
      // Handle both cases: with or without data parameter
      const actualCallback = typeof data === 'function' ? data : callback;
      this.dataHandler.handleGetLeaderboard(actualCallback);
    });

    // 断开连接事件
    socket.on('disconnect', () => {
      this.roomHandler.handleDisconnect(socket, io);
    });
  }
}
