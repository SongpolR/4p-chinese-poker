// GET /api/rooms/[roomId] - Get room info
import { NextResponse } from 'next/server';
import { getRoom } from '@/lib/roomStore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const state = getRoom(roomId);
  if (!state) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  // Return room info without sensitive data (deck, other players' hands)
  return NextResponse.json({
    roomId: state.roomId,
    roomCode: state.roomCode,
    config: {
      ...state.config,
      pinCode: state.config.pinCode ? '****' : '',
    },
    players: state.players.map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      isConnected: p.isConnected,
      isReady: p.isReady,
      totalScore: p.totalScore,
      roundScores: p.roundScores,
    })),
    phase: state.phase,
    currentRound: state.currentRound,
    turnNumber: state.turnNumber,
    turnStartTime: state.turnStartTime,
    gameStartTime: state.gameStartTime,
    roundSummaries: state.roundSummaries,
    hasPinCode: !!state.config.pinCode,
  });
}
