// In-memory room store (for development; replace with Redis/DB for production)

import { GameState, createGameState, RoomConfig } from './gameState';

const rooms = new Map<string, GameState>();

// Generate a 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createRoom(config: RoomConfig): GameState {
  const roomId = crypto.randomUUID();
  let roomCode = generateRoomCode();
  // Ensure uniqueness
  while (Array.from(rooms.values()).some(r => r.roomCode === roomCode)) {
    roomCode = generateRoomCode();
  }

  const state = createGameState(roomId, roomCode, config);
  rooms.set(roomId, state);
  return state;
}

export function getRoom(roomId: string): GameState | undefined {
  return rooms.get(roomId);
}

export function getRoomByCode(code: string): GameState | undefined {
  return Array.from(rooms.values()).find(r => r.roomCode === code.toUpperCase());
}

export function updateRoom(roomId: string, state: GameState): void {
  rooms.set(roomId, state);
}

export function deleteRoom(roomId: string): void {
  rooms.delete(roomId);
}

export function getAllRooms(): GameState[] {
  return Array.from(rooms.values());
}
