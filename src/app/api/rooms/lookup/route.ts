// GET /api/rooms/lookup?code=ABCDEF - Check if a room exists by code
import { NextResponse } from 'next/server';
import { getRoomByCode } from '@/lib/roomStore';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code')?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: 'Room code is required' }, { status: 400 });
  }

  const state = getRoomByCode(code);
  if (!state) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json({
    roomCode: state.roomCode,
    hostName: state.config.hostName,
    maxPlayers: state.config.maxPlayers,
    currentPlayers: state.players.length,
    requiresPin: !!state.config.pinCode,
    phase: state.phase,
  });
}
