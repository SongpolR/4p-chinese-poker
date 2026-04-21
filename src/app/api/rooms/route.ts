// POST /api/rooms - Create a new room
import { NextResponse } from 'next/server';
import { createRoom } from '@/lib/roomStore';
import { addPlayer, RoomConfig } from '@/lib/gameState';
import { updateRoom } from '@/lib/roomStore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hostName, maxPlayers, totalRounds, turnTimeLimit, gameTimeLimit, amountPerPoint, pinCode, autoStartNextRound } = body;

    if (!hostName?.trim()) {
      return NextResponse.json({ error: 'Host name is required' }, { status: 400 });
    }

    const config: RoomConfig = {
      maxPlayers: Math.min(4, Math.max(2, maxPlayers || 2)) as 2 | 3 | 4,
      totalRounds: Math.max(1, totalRounds || 6),
      turnTimeLimit: Math.max(0, turnTimeLimit || 0),
      gameTimeLimit: Math.max(0, gameTimeLimit || 0),
      amountPerPoint: Math.max(0, amountPerPoint || 0),
      pinCode: (pinCode || '').toString().slice(0, 4),
      hostName: hostName.trim(),
      autoStartNextRound: autoStartNextRound !== false,
    };

    let state = createRoom(config);
    const hostId = crypto.randomUUID();
    state = addPlayer(state, hostId, config.hostName, true);
    updateRoom(state.roomId, state);

    return NextResponse.json({
      roomId: state.roomId,
      roomCode: state.roomCode,
      playerId: hostId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create room';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
