import React, { useState } from 'react';
import { Camera, Wrench, Calendar, CloudSun, RotateCcw, Volume2, VolumeX, ChevronDown, ChevronUp, Smartphone, Play, Menu, ArrowLeftRight } from 'lucide-react';
import { CameraMode } from '../game/SpeedwayScene';

interface BottomDockProps {
  cameraMode: CameraMode;
  onCameraChange: (mode: CameraMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGarage: () => void;
  onOpenProgram: () => void;
  onOpenWeather: () => void;
  onOpenMenu: () => void;
  onResetHeat: () => void;
  onNextHeat: () => void;
  isHeatFinished: boolean;
  touchControlsActive: boolean;
  onToggleTouchControls: () => void;
  invertSteering: boolean;
  onToggleInvertSteering: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  cameraMode,
  onCameraChange,
  isMuted,
  onToggleMute,
  onOpenGarage,
  onOpenProgram,
  onOpenWeather,
  onOpenMenu,
  onResetHeat,
  onNextHeat,
  isHeatFinished,
  touchControlsActive,
  onToggleTouchControls,
  invertSteering,
  onToggleInvertSteering,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const cameraLabels: Record<CameraMode, string> = {
    chase: 'Zza pleców',
    tv_tower: 'Trybuna TV',
    helmet: 'Kask FPV',
    overhead: 'Taktyczna',
  };

  const nextCameraMode = () => {
    const modes: CameraMode[] = ['chase', 'tv_tower', 'helmet', 'overhead'];
    const nextIdx = (modes.indexOf(cameraMode) + 1) % modes.length;
    onCameraChange(modes[nextIdx]);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center max-w-[94vw] w-max select-none">
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mb-1.5 px-3 py-1 bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-800/80 rounded-full text-zinc-300 hover:text-white text-[11px] font-mono flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        title="Schowaj / Pokaż dolny panel sterowania"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Pokaż panel sterowania</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            <span>Tryb kinowy (Schowaj)</span>
          </>
        )}
      </button>

      {/* Main Glassmorphic Dock */}
      <div
        className={`transition-all duration-300 transform ${
          isCollapsed ? 'translate-y-28 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        } bg-zinc-950/90 backdrop-blur-md border border-zinc-800/90 rounded-2xl px-3 sm:px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-center gap-2 sm:gap-3`}
      >
        {/* Next Heat button if finished */}
        {isHeatFinished ? (
          <button
            onClick={onNextHeat}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Następny bieg</span>
          </button>
        ) : (
          <button
            onClick={onResetHeat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-medium rounded-xl transition-all active:scale-95 cursor-pointer"
            title="Powtórz start biegu"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Powtórz bieg</span>
          </button>
        )}

        <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

        {/* Camera mode switcher */}
        <button
          onClick={nextCameraMode}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-medium rounded-xl transition-all active:scale-95 cursor-pointer"
          title="Przełącz kamerę (Klawisz C)"
        >
          <Camera className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden xs:inline">Kamera:</span>
          <span className="font-semibold text-white">{cameraLabels[cameraMode]}</span>
        </button>

        {/* Garage & Tuning */}
        <button
          onClick={onOpenGarage}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-medium rounded-xl transition-all active:scale-95 cursor-pointer"
        >
          <Wrench className="w-3.5 h-3.5 text-amber-400" />
          <span>Garaż i Tuning</span>
        </button>

        {/* Match Program / Heats */}
        <button
          onClick={onOpenProgram}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-medium rounded-xl transition-all active:scale-95 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>Program meczu (15 biegów)</span>
        </button>

        {/* Weather & Day/Night */}
        <button
          onClick={onOpenWeather}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-medium rounded-xl transition-all active:scale-95 cursor-pointer"
        >
          <CloudSun className="w-3.5 h-3.5 text-yellow-400" />
          <span>Pogoda i Tor</span>
        </button>

        <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

        {/* Sound toggle */}
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
            isMuted
              ? 'bg-red-950/70 border-red-800/80 text-red-300 hover:bg-red-900/80'
              : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-200 hover:bg-zinc-800'
          }`}
          title={isMuted ? 'Włącz dźwięk silnika' : 'Wycisz dźwięk'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
        </button>

        {/* Touch controls toggle */}
        <button
          onClick={onToggleTouchControls}
          className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
            touchControlsActive
              ? 'bg-sky-950/80 border-sky-600/80 text-sky-300'
              : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-400 hover:bg-zinc-800'
          }`}
          title="Przyciski ekranowe dla ekranów dotykowych"
        >
          <Smartphone className="w-3.5 h-3.5" />
        </button>

        {/* Invert Steering toggle */}
        <button
          onClick={onToggleInvertSteering}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer text-xs ${
            invertSteering
              ? 'bg-amber-950/80 border-amber-600/80 text-amber-300'
              : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-400 hover:bg-zinc-800'
          }`}
          title="Przełącz kierunek skręcania (A/D normalny vs odwrócony)"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">{invertSteering ? 'Skręt: Odwrócony' : 'Skręt: Normalny'}</span>
        </button>

        {/* Return to Main Menu */}
        <button
          onClick={onOpenMenu}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-medium rounded-xl transition-all active:scale-95 cursor-pointer"
          title="Powrót do menu głównego"
        >
          <Menu className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Menu</span>
        </button>
      </div>
    </div>
  );
};
