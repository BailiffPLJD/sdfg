import React from 'react';
import { Eye, ShieldAlert } from 'lucide-react';

interface TouchControlsProps {
  onSteer: (steer: number) => void;
  onThrottle: (throttle: number) => void;
  onClutch: (held: boolean) => void;
  onBodyTuck?: (tuck: boolean) => void;
  onTearOff?: () => void;
  tearOffsRemaining?: number;
  visible: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onSteer,
  onThrottle,
  onClutch,
  onBodyTuck,
  onTearOff,
  tearOffsRemaining = 5,
  visible,
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-20 pointer-events-none flex justify-between px-3 sm:px-8 select-none">
      {/* Steering Controls (Left) */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onSteer(-1.0);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onSteer(0);
          }}
          onMouseDown={() => onSteer(-1.0)}
          onMouseUp={() => onSteer(0)}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900/90 active:bg-amber-500/90 border-2 border-zinc-700 active:border-amber-400 text-white font-bold text-xl flex flex-col items-center justify-center shadow-2xl backdrop-blur-md active:scale-90 transition-transform cursor-pointer"
        >
          <span>◄</span>
          <span className="text-[8px] uppercase tracking-tighter text-zinc-400">Lewo</span>
        </button>
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onSteer(1.0);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onSteer(0);
          }}
          onMouseDown={() => onSteer(1.0)}
          onMouseUp={() => onSteer(0)}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900/90 active:bg-amber-500/90 border-2 border-zinc-700 active:border-amber-400 text-white font-bold text-xl flex flex-col items-center justify-center shadow-2xl backdrop-blur-md active:scale-90 transition-transform cursor-pointer"
        >
          <span>►</span>
          <span className="text-[8px] uppercase tracking-tighter text-zinc-400">Prawo</span>
        </button>

        {/* Body tuck button on touch */}
        {onBodyTuck && (
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onBodyTuck(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onBodyTuck(false);
            }}
            onMouseDown={() => onBodyTuck(true)}
            onMouseUp={() => onBodyTuck(false)}
            className="w-12 h-16 sm:w-14 sm:h-20 rounded-2xl bg-sky-950/85 active:bg-sky-500 border border-sky-600/60 text-sky-200 active:text-zinc-950 text-[10px] font-bold flex flex-col items-center justify-center shadow-xl backdrop-blur-md active:scale-90 transition-transform cursor-pointer"
            title="Dociąż hak / złóż się do przodu"
          >
            <span>TUCK</span>
            <span className="text-[7px] opacity-75">Ciężar</span>
          </button>
        )}
      </div>

      {/* Throttle, Clutch & Tear-Off Controls (Right) */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
        {/* Tear-off Goggles button */}
        {onTearOff && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onTearOff();
            }}
            className="w-12 h-16 sm:w-14 sm:h-20 rounded-2xl bg-zinc-900/85 active:bg-sky-500 border border-zinc-750 text-zinc-300 active:text-white text-[10px] font-bold flex flex-col items-center justify-center shadow-xl backdrop-blur-md active:scale-90 transition-transform cursor-pointer"
            title="Zrywka gogli"
          >
            <Eye className="w-4 h-4 text-sky-400 mb-0.5" />
            <span className="text-[8px]">{tearOffsRemaining}</span>
          </button>
        )}

        {/* Clutch Launch Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onClutch(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onClutch(false);
          }}
          onMouseDown={() => onClutch(true)}
          onMouseUp={() => onClutch(false)}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-950/90 active:bg-emerald-500 border-2 border-emerald-600 text-emerald-200 active:text-zinc-950 font-bold text-xs flex flex-col items-center justify-center shadow-2xl backdrop-blur-md active:scale-90 transition-transform cursor-pointer uppercase tracking-tight"
        >
          <span>Sprzęgło</span>
          <span className="text-[9px] opacity-75 font-mono">Puszczaj</span>
        </button>

        {/* Throttle Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onThrottle(1.0);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onThrottle(0);
          }}
          onMouseDown={() => onThrottle(1.0)}
          onMouseUp={() => onThrottle(0)}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500 active:bg-amber-400 border-2 border-amber-300 text-zinc-950 font-black text-sm flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform cursor-pointer uppercase tracking-tight"
        >
          <span className="text-xl">▲</span>
          <span>GAZ</span>
        </button>
      </div>
    </div>
  );
};
