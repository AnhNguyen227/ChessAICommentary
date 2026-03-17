import { IGame } from "../models/Game";

export interface RoomTimer {
  hostMs: number;
  awayMs: number;
  interval: NodeJS.Timeout | null;
}

export interface Room {
  game: IGame;
  hostSocketId: string;
  awaySocketId: string | null;
  timer: RoomTimer;
  drawOfferedBy: "host" | "away" | null;
}

const rooms = new Map<string, Room>();

export const createRoom = (roomId: string, room: Room): void => {
  rooms.set(roomId, room);
};

export const getRoom = (roomId: string): Room | undefined => {
  return rooms.get(roomId);
};

export const updateRoom = (roomId: string, updates: Partial<Room>): void => {
  const room = rooms.get(roomId);
  if (room) rooms.set(roomId, { ...room, ...updates });
};

export const deleteRoom = (roomId: string): void => {
  const room = rooms.get(roomId);
  if (room?.timer.interval) clearInterval(room.timer.interval);
  rooms.delete(roomId);
};

export const getRoomBySocketId = (socketId: string): [string, Room] | null => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.hostSocketId === socketId || room.awaySocketId === socketId) {
      return [roomId, room];
    }
  }
  return null;
};

export default rooms;