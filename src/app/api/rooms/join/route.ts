// POST /api/rooms/join - Join a room by code
import { NextResponse } from 'next/server';
import { getRoomByCode, updateRoom } from '@/lib/roomStore';
import { addPlayer } from '@/lib/gameState';

export async function POST(request: Request) {
  try {
    const { roomCode, playerName, pinCode } = await request.json();

    if (!roomCode?.trim() || !playerName?.trim()) {
      return NextResponse.json({ error: 'Room code and player name are required' }, { status: 400 });
    }

    const state = getRoomByCode(roomCode.trim().toUpperCase());
    if (!state) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (state.config.pinCode) {
      const provided = (pinCode || '').toString();
      if (!provided) {
        return NextResponse.json({ error: 'PIN code is required to join this room' }, { status: 403 });
      }
      if (state.config.pinCode !== provided) {
        return NextResponse.json({ error: 'Incorrect PIN code' }, { status: 403 });
      }
    }

    if (state.phase !== 'waiting') {
      return NextResponse.json({ error: 'Game already in progress' }, { status: 400 });
    }

    if (state.players.length >= state.config.maxPlayers) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 });
    }

    const playerId = crypto.randomUUID();
    const updated = addPlayer(state, playerId, playerName.trim(), false);
    updateRoom(state.roomId, updated);

    return NextResponse.json({
      roomId: state.roomId,
      roomCode: state.roomCode,
      playerId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to join room';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
