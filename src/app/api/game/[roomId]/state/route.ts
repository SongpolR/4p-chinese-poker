// GET /api/game/[roomId]/state?playerId=xxx - Get game state for a specific player
import { NextResponse } from 'next/server';
import { getRoom } from '@/lib/roomStore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('playerId');

  const state = getRoom(roomId);
  if (!state) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const currentPlayer = state.players.find(p => p.id === playerId);
  if (!currentPlayer) {
    return NextResponse.json({ error: 'Player not in room' }, { status: 403 });
  }

  // Return player-specific view: own hand + all boards
  return NextResponse.json({
    roomId: state.roomId,
    roomCode: state.roomCode,
    phase: state.phase,
    currentRound: state.currentRound,
    totalRounds: state.config.totalRounds,
    turnNumber: state.turnNumber,
    turnStartTime: state.turnStartTime,
    turnTimeLimit: state.config.turnTimeLimit,
    gameStartTime: state.gameStartTime,
    gameTimeLimit: state.config.gameTimeLimit,
    amountPerPoint: state.config.amountPerPoint,
    autoStartNextRound: state.config.autoStartNextRound,
    myHand: currentPlayer.hand,
    myId: currentPlayer.id,
    players: state.players.map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      isReady: p.isReady,
      isConnected: p.isConnected,
      totalScore: p.totalScore,
      roundScores: p.roundScores,
      board: p.board,
      cardCount: p.hand.length, // how many cards others still have
    })),
    roundSummaries: state.roundSummaries,
  });
}
