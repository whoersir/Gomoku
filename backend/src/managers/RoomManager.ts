import { Room } from '../game/Room';
import { v4 as uuidv4 } from 'uuid';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  createRoom(roomName: string): { roomId: string; room: Room } {
    const roomId = uuidv4().slice(0, 8);
    const room = new Room(roomId, roomName);
    this.rooms.set(roomId, room);
    return { roomId, room };
  }

  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  removeRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  getRoomList() {
    // Return all active rooms (both full and non-full) to allow spectators to find games
    const rooms = Array.from(this.rooms.values())
      .filter((room) => room.getStatus() !== 'finished') // Exclude finished games
      .map((room) => room.getRoomInfo());
    return rooms;
  }

  getAllRooms(): Map<string, Room> {
    return new Map(this.rooms);
  }

  cleanupEmptyRooms(): void {
    // 禁用房间清理功能
    // 房间不会被清理，除非手动删除
    return;
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}
