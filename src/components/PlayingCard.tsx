'use client';

import { DragEvent } from 'react';
import { SUIT_SYMBOLS } from '@/lib/cards';

// Pip positions for number cards as [x%, y%] within center area
const PIP_POSITIONS: Record<string, [number, number][]> = {
  '2': [[50, 20], [50, 80]],
  '3': [[50, 15], [50, 50], [50, 85]],
  '4': [[33, 20], [67, 20], [33, 80], [67, 80]],
  '5': [[33, 20], [67, 20], [50, 50], [33, 80], [67, 80]],
  '6': [[33, 18], [67, 18], [33, 50], [67, 50], [33, 82], [67, 82]],
  '7': [[33, 18], [67, 18], [50, 34], [33, 50], [67, 50], [33, 82], [67, 82]],
  '8': [[33, 18], [67, 18], [50, 34], [33, 50], [67, 50], [50, 66], [33, 82], [67, 82]],
  '9': [[33, 15], [67, 15], [33, 37], [67, 37], [50, 50], [33, 63], [67, 63], [33, 85], [67, 85]],
  '10': [[33, 12], [67, 12], [50, 27], [33, 37], [67, 37], [33, 63], [67, 63], [50, 73], [33, 88], [67, 88]],
};

interface PlayingCardProps {
  rank: string;
  suit: string;
  selected?: boolean;
  onClick?: () => void;
  small?: boolean;
  faceDown?: boolean;
  draggable?: boolean;
  onDragStart?: (e: DragEvent) => void;
}

export default function PlayingCard({ rank, suit, selected, onClick, small, faceDown, draggable, onDragStart }: PlayingCardProps) {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const symbol = SUIT_SYMBOLS[suit as keyof typeof SUIT_SYMBOLS] || suit;
  const colorClass = isRed ? 'text-red-600' : 'text-gray-900';

  if (faceDown) {
    return (
      <div className={`
        ${small ? 'w-8 h-11' : 'w-12 h-16 sm:w-14 sm:h-20'}
        rounded-lg border-2 border-gray-500 bg-gradient-to-br from-gray-400 to-gray-600
        flex items-center justify-center shadow-md select-none shrink-0
      `}>
        <div
          className={`${small ? 'w-[65%] h-[70%]' : 'w-[70%] h-[75%]'} rounded-sm border border-gray-300/30 flex items-center justify-center`}
          style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)' }}
        >
          <span className={`text-gray-200/40 ${small ? 'text-xs' : 'text-base'}`}>&#9824;</span>
        </div>
      </div>
    );
  }

  const isFace = rank === 'J' || rank === 'Q' || rank === 'K';
  const isAce = rank === 'A';

  const sizeClasses = small
    ? 'w-8 h-11 rounded border-[1.5px]'
    : 'w-12 h-16 sm:w-14 sm:h-20 rounded-lg border-2';

  return (
    <button
      onClick={onClick}
      disabled={!onClick && !draggable}
      draggable={draggable}
      onDragStart={onDragStart}
      className={`
        ${sizeClasses} bg-white shadow-md
        font-bold transition-all duration-150 select-none touch-none shrink-0 relative overflow-hidden
        ${selected ? 'border-yellow-400 ring-2 ring-yellow-300 -translate-y-1 scale-105' : 'border-gray-300'}
        ${onClick || draggable ? 'cursor-pointer hover:border-blue-400 hover:-translate-y-0.5 active:scale-95' : 'cursor-default'}
      `}
    >
      {/* Top-left corner index */}
      <div className={`absolute ${small ? 'top-px left-[1px]' : 'top-[1px] left-[2px] sm:top-[2px] sm:left-[3px]'} flex flex-col items-center leading-none ${colorClass}`}>
        <span className={`${small ? 'text-[9px]' : 'text-[11px] sm:text-[13px]'} font-bold`}>{rank}</span>
        <span className={`${small ? 'text-[8px]' : 'text-[10px] sm:text-xs'} -mt-px`}>{symbol}</span>
      </div>

      {/* Bottom-right corner index (rotated 180deg) */}
      <div className={`absolute ${small ? 'bottom-px right-[1px]' : 'bottom-[1px] right-[2px] sm:bottom-[2px] sm:right-[3px]'} flex flex-col items-center leading-none rotate-180 ${colorClass}`}>
        <span className={`${small ? 'text-[9px]' : 'text-[11px] sm:text-[13px]'} font-bold`}>{rank}</span>
        <span className={`${small ? 'text-[8px]' : 'text-[10px] sm:text-xs'} -mt-px`}>{symbol}</span>
      </div>

      {/* Center: Ace — large suit symbol */}
      {isAce && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${small ? 'text-xl' : 'text-2xl sm:text-4xl'} ${colorClass}`}>{symbol}</span>
        </div>
      )}

      {/* Center: Face card — stylized face area */}
      {isFace && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${small ? 'w-[58%] h-[50%]' : 'w-[62%] h-[55%]'} rounded-sm border flex flex-col items-center justify-center ${
            isRed ? 'bg-red-50 border-red-200' : 'bg-gray-100 border-gray-300'
          }`}>
            <span className={`${small ? 'text-xs' : 'text-base sm:text-xl'} leading-none ${
              isRed ? 'text-red-600' : 'text-gray-800'
            }`}>
              {rank === 'K' ? '\u265A' : rank === 'Q' ? '\u265B' : '\u265E'}
            </span>
            <span className={`${small ? 'text-[7px]' : 'text-[10px] sm:text-xs'} ${colorClass} opacity-60 leading-none`}>{symbol}</span>
          </div>
        </div>
      )}

      {/* Center: Number card — pip layout */}
      {!isFace && !isAce && (
        <div className={`absolute ${small ? 'top-[22%] bottom-[22%] left-[18%] right-[18%]' : 'top-[18%] bottom-[18%] left-[14%] right-[14%]'}`}>
          {(PIP_POSITIONS[rank] || []).map(([x, y], i) => (
            <span
              key={i}
              className={`absolute ${small ? 'text-[7px]' : 'text-xs sm:text-sm'} ${colorClass} leading-none`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {symbol}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export function EmptySlot({ label, small, highlight, onDrop, onDragOver }: {
  label?: string;
  small?: boolean;
  highlight?: boolean;
  onDrop?: (e: DragEvent) => void;
  onDragOver?: (e: DragEvent) => void;
}) {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      className={`
        ${small ? 'w-8 h-11' : 'w-12 h-16 sm:w-14 sm:h-20'}
        rounded-lg border-2 border-dashed
        flex items-center justify-center text-xs transition-all
        ${highlight
          ? 'border-yellow-400 bg-yellow-50 text-yellow-500 scale-105'
          : 'border-gray-300 bg-gray-50 text-gray-400'}
      `}
    >
      {label}
    </div>
  );
}
