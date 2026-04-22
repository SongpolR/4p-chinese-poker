'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Lang = 'en' | 'th';

const translations = {
  en: {
    // Home
    'home.title': 'Chinese Poker',
    'home.subtitle': '2-4 Players | Real-time Multiplayer',
    'home.createGame': 'Create Game',
    'home.joinGame': 'Join Game',
    'home.enterCode': 'Enter 6-digit room code',
    'home.cancel': 'Cancel',
    'home.join': 'Join',
    'home.checking': 'Checking...',
    'home.viewHistory': 'View Game History',
    'home.roomNotFound': 'Room not found. Please check the code and try again.',
    'home.gameInProgress': 'This game is already in progress.',
    'home.roomFull': 'This room is full.',
    'home.connectionError': 'Could not connect to server. Please try again.',

    // Create Room
    'create.title': 'Create Game Room',
    'create.back': 'Back',
    'create.yourName': 'Your Name',
    'create.enterName': 'Enter your name',
    'create.players': 'Players',
    'create.rounds': 'Rounds',
    'create.turnTimeLimit': 'Turn Time Limit',
    'create.unlimited': 'Unlimited',
    'create.noLimit': 'No limit',
    'create.gameTimeLimit': 'Game Time Limit',
    'create.hours': 'hr',
    'create.amountPerPoint': 'Amount per Point ($)',
    'create.justForFun': '0 = just for fun',
    'create.pinCode': 'PIN Code (optional)',
    'create.pinPlaceholder': '4-digit PIN',
    'create.autoStart': 'Auto-start next round',
    'create.autoStartDesc': 'Automatically starts next round after 10 seconds',
    'create.creating': 'Creating...',
    'create.createRoom': 'Create Room',
    'create.nameRequired': 'Please enter your name',

    // Join Room
    'join.title': 'Join Game',
    'join.room': 'Room',
    'join.host': 'Host',
    'join.playerCount': 'Players',
    'join.pinRequired': 'This room requires a PIN to join',
    'join.accessPin': 'Access PIN',
    'join.enterPin': 'Enter 4-digit PIN',
    'join.incorrectPin': 'Incorrect PIN code. Please try again.',
    'join.enterPinFull': 'Please enter the 4-digit PIN',
    'join.joining': 'Joining...',
    'join.joinRoom': 'Join Room',
    'join.roomNotFound': 'Room Not Found',
    'join.roomNotFoundDesc': 'No room exists with code',
    'join.checkCode': 'Please check the code and try again.',
    'join.backToHome': 'Back to Home',
    'join.checkingRoom': 'Checking room...',

    // Lobby
    'lobby.title': 'Game Lobby',
    'lobby.roomCode': 'Room Code',
    'lobby.copyCode': 'Copy Code',
    'lobby.copyLink': 'Copy Link',
    'lobby.copied': 'Copied!',
    'lobby.waitingForPlayer': 'Waiting for player...',
    'lobby.startGame': 'Start Game',
    'lobby.waitingForPlayers': 'Waiting for players...',
    'lobby.waitingForHost': 'Waiting for host to start the game...',
    'lobby.endGame': 'End Game',
    'lobby.leaveGame': 'Leave Game',

    // Game
    'game.round': 'Round',
    'game.cardsInHand': 'cards in hand',
    'game.loading': 'Loading game...',
    'game.endGame': 'End Game',
    'game.leaveGame': 'Leave Game',
    'game.cancel': 'Cancel',
    'game.sortRank': 'Rank',
    'game.sortSuit': 'Suit',
    'game.sortRankSuit': 'Rank\u2192Suit',
    'game.autoSortLabel': 'Auto (Rank\u2192Suit)',
    'game.selectedCard': 'Selected',
    'game.tapRowToPlace': 'tap a row to place, or tap card again to deselect',
    'game.tapOrDrag': 'Tap or drag cards to place them in rows. Tap placed cards to return them.',
    'game.allPlaced': 'All cards placed! Review and confirm.',
    'game.clearAll': 'Clear All',
    'game.confirmPlacement': 'Confirm Placement',
    'game.waitingForOthers': 'Waiting for other players...',
    'game.you': 'You',
    'game.ready': 'Ready',
    'game.foul': 'FOUL',
    'game.pts': 'pts',

    // Round Summary
    'round.results': 'Round {n} Results',
    'round.payments': 'Payments',
    'round.roundPoints': 'Round Points',
    'round.nextRound': 'Next Round',
    'round.waitingForHost': 'Waiting for host to start next round...',
    'round.autoStart': 'Auto-starting in {n}s...',
    'round.cancelAutoStart': 'Cancel',

    // Game Summary
    'summary.gameOver': 'Game Over',
    'summary.wins': 'wins!',
    'summary.totalPoints': 'total points',
    'summary.finalStandings': 'Final Standings',
    'summary.roundBreakdown': 'Round Breakdown',
    'summary.player': 'Player',
    'summary.total': 'Total',
    'summary.settlement': 'Settlement',
    'summary.receives': 'Receives',
    'summary.pays': 'Pays',
    'summary.keepPlaying': 'Want to keep playing?',
    'summary.rounds': 'Rounds',
    'summary.backToHome': 'Back to Home',

    // History
    'history.title': 'Game History',
    'history.noGames': 'No games played yet',
    'history.noGamesDesc': 'Your completed games will appear here',
    'history.winner': 'Winner',
    'history.rounds': 'rounds',
    'history.clearHistory': 'Clear History',

    // Common
    'common.currency': '$',
    'common.host': 'HOST',
    'common.confirmEndGame': 'Are you sure you want to end the game?',
    'common.confirmLeaveGame': 'Are you sure you want to leave the game?',
  },
  th: {
    // Home
    'home.title': 'โป๊กเกอร์จีน',
    'home.subtitle': '2-4 ผู้เล่น | เล่นออนไลน์แบบเรียลไทม์',
    'home.createGame': 'สร้างห้อง',
    'home.joinGame': 'เข้าร่วมห้อง',
    'home.enterCode': 'ใส่รหัสห้อง 6 ตัว',
    'home.cancel': 'ยกเลิก',
    'home.join': 'เข้าร่วม',
    'home.checking': 'กำลังตรวจสอบ...',
    'home.viewHistory': 'ดูประวัติเกม',
    'home.roomNotFound': 'ไม่พบห้อง กรุณาตรวจสอบรหัสแล้วลองอีกครั้ง',
    'home.gameInProgress': 'เกมนี้กำลังดำเนินอยู่',
    'home.roomFull': 'ห้องเต็มแล้ว',
    'home.connectionError': 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองอีกครั้ง',

    // Create Room
    'create.title': 'สร้างห้องเกม',
    'create.back': 'กลับ',
    'create.yourName': 'ชื่อของคุณ',
    'create.enterName': 'ใส่ชื่อของคุณ',
    'create.players': 'จำนวนผู้เล่น',
    'create.rounds': 'จำนวนรอบ',
    'create.turnTimeLimit': 'เวลาต่อรอบ',
    'create.unlimited': 'ไม่จำกัด',
    'create.noLimit': 'ไม่จำกัด',
    'create.gameTimeLimit': 'เวลาจำกัดเกม',
    'create.hours': 'ชม.',
    'create.amountPerPoint': 'จำนวนเงินต่อแต้ม (฿)',
    'create.justForFun': '0 = เล่นเพื่อความสนุก',
    'create.pinCode': 'รหัส PIN (ไม่บังคับ)',
    'create.pinPlaceholder': 'รหัส PIN 4 หลัก',
    'create.autoStart': 'เริ่มรอบถัดไปอัตโนมัติ',
    'create.autoStartDesc': 'เริ่มรอบถัดไปอัตโนมัติหลังจาก 10 วินาที',
    'create.creating': 'กำลังสร้าง...',
    'create.createRoom': 'สร้างห้อง',
    'create.nameRequired': 'กรุณาใส่ชื่อของคุณ',

    // Join Room
    'join.title': 'เข้าร่วมเกม',
    'join.room': 'ห้อง',
    'join.host': 'เจ้าของห้อง',
    'join.playerCount': 'ผู้เล่น',
    'join.pinRequired': 'ห้องนี้ต้องใช้รหัส PIN ในการเข้าร่วม',
    'join.accessPin': 'รหัส PIN',
    'join.enterPin': 'ใส่รหัส PIN 4 หลัก',
    'join.incorrectPin': 'รหัส PIN ไม่ถูกต้อง กรุณาลองอีกครั้ง',
    'join.enterPinFull': 'กรุณาใส่รหัส PIN 4 หลัก',
    'join.joining': 'กำลังเข้าร่วม...',
    'join.joinRoom': 'เข้าร่วมห้อง',
    'join.roomNotFound': 'ไม่พบห้อง',
    'join.roomNotFoundDesc': 'ไม่มีห้องที่ใช้รหัส',
    'join.checkCode': 'กรุณาตรวจสอบรหัสแล้วลองอีกครั้ง',
    'join.backToHome': 'กลับหน้าหลัก',
    'join.checkingRoom': 'กำลังตรวจสอบห้อง...',

    // Lobby
    'lobby.title': 'ล็อบบี้',
    'lobby.roomCode': 'รหัสห้อง',
    'lobby.copyCode': 'คัดลอกรหัส',
    'lobby.copyLink': 'คัดลอกลิงก์',
    'lobby.copied': 'คัดลอกแล้ว!',
    'lobby.waitingForPlayer': 'รอผู้เล่น...',
    'lobby.startGame': 'เริ่มเกม',
    'lobby.waitingForPlayers': 'รอผู้เล่น...',
    'lobby.waitingForHost': 'รอเจ้าของห้องเริ่มเกม...',
    'lobby.endGame': 'จบเกม',
    'lobby.leaveGame': 'ออกจากเกม',

    // Game
    'game.round': 'รอบ',
    'game.cardsInHand': 'ไพ่ในมือ',
    'game.loading': 'กำลังโหลดเกม...',
    'game.endGame': 'จบเกม',
    'game.leaveGame': 'ออกจากเกม',
    'game.cancel': 'ยกเลิก',
    'game.sortRank': 'แรงค์',
    'game.sortSuit': 'ดอก',
    'game.sortRankSuit': 'แรงค์\u2192ดอก',
    'game.autoSortLabel': 'อัตโนมัติ (แรงค์\u2192ดอก)',
    'game.selectedCard': 'เลือกแล้ว',
    'game.tapRowToPlace': 'แตะแถวเพื่อวาง หรือแตะไพ่อีกครั้งเพื่อยกเลิก',
    'game.tapOrDrag': 'แตะหรือลากไพ่ไปวางในแถว แตะไพ่ที่วางเพื่อนำกลับ',
    'game.allPlaced': 'วางไพ่ครบแล้ว! ตรวจสอบและยืนยัน',
    'game.clearAll': 'ล้างทั้งหมด',
    'game.confirmPlacement': 'ยืนยันการวาง',
    'game.waitingForOthers': 'รอผู้เล่นคนอื่น...',
    'game.you': 'คุณ',
    'game.ready': 'พร้อม',
    'game.foul': 'ฟาวล์',
    'game.pts': 'แต้ม',

    // Round Summary
    'round.results': 'ผลรอบที่ {n}',
    'round.payments': 'การจ่ายเงิน',
    'round.roundPoints': 'แต้มรอบนี้',
    'round.nextRound': 'รอบถัดไป',
    'round.waitingForHost': 'รอเจ้าของห้องเริ่มรอบถัดไป...',
    'round.autoStart': 'เริ่มอัตโนมัติใน {n} วินาที...',
    'round.cancelAutoStart': 'ยกเลิก',

    // Game Summary
    'summary.gameOver': 'จบเกม',
    'summary.wins': 'ชนะ!',
    'summary.totalPoints': 'แต้มรวม',
    'summary.finalStandings': 'อันดับสุดท้าย',
    'summary.roundBreakdown': 'สรุปรายรอบ',
    'summary.player': 'ผู้เล่น',
    'summary.total': 'รวม',
    'summary.settlement': 'สรุปยอด',
    'summary.receives': 'ได้รับ',
    'summary.pays': 'จ่าย',
    'summary.keepPlaying': 'เล่นต่อไหม?',
    'summary.rounds': 'รอบ',
    'summary.backToHome': 'กลับหน้าหลัก',

    // History
    'history.title': 'ประวัติเกม',
    'history.noGames': 'ยังไม่มีเกมที่เล่น',
    'history.noGamesDesc': 'เกมที่เล่นจบแล้วจะแสดงที่นี่',
    'history.winner': 'ผู้ชนะ',
    'history.rounds': 'รอบ',
    'history.clearHistory': 'ล้างประวัติ',

    // Common
    'common.currency': '฿',
    'common.host': 'เจ้าของห้อง',
    'common.confirmEndGame': 'คุณแน่ใจหรือไม่ว่าต้องการจบเกม?',
    'common.confirmLeaveGame': 'คุณแน่ใจหรือไม่ว่าต้องการออกจากเกม?',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Lang | null;
    if (stored && (stored === 'en' || stored === 'th')) {
      setLangState(stored);
    } else {
      // Auto-detect from browser
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('th')) {
        setLangState('th');
      }
    }
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
  }, []);

  const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>): string => {
    let text = (translations[lang]?.[key] || translations.en[key] || key) as string;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
