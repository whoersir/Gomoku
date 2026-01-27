import { Socket } from 'socket.io';
import { BaseHandler } from './BaseHandler';

/**
 * 聊天相关操作的处理器
 */
export class ChatHandler extends BaseHandler {
  /**
   * 处理聊天消息发送请求
   */
  handleChat(
    socket: Socket,
    data: { roomId: string; message: string },
    io: any,
    callback: any
  ): void {
    // 速率限制检查
    if (!this.checkRateLimit(socket.id)) {
      callback({ success: false, message: 'Rate limit exceeded. Please wait a moment.' });
      return;
    }

    const roomId = data.roomId;
    // 清理聊天消息，防止XSS
    const message = this.sanitizeInput(data.message, 500);

    if (!message || message.length < 1) {
      callback({ success: false, message: 'Message cannot be empty' });
      return;
    }

    const room = this.roomManager.getRoom(roomId);

    if (!room) {
      callback({ success: false, message: 'Room not found' });
      return;
    }

    const playerName = socket.data.playerName || 'Anonymous';
    const chatMessage = room.addMessage(socket.id, playerName, message);
    io.to(roomId).emit('newMessage', chatMessage);
    callback({ success: true });
  }
}
