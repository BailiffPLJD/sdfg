import React, { useState } from 'react';
import { HelmetColor, RaceState } from '../types/speedway';
import { Gauge, Zap, Flame, Trophy, AlertTriangle, Sparkles, Eye, ArrowLeftRight, ChevronRight, Activity } from 'lucide-react';

interface HUDProps {
  heatNumber: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  currentLap: number;
  totalLaps: number;
  raceState: RaceState;
  raceMessage?: string;
  reactionInfo: { timeMs: number; rating: string } | null;
  telemetry: {
    speed: number;
    rpm: number;
    throttle: number;
    slideAngle: number;
    clutchHeld: boolean;
    driftEfficiency?: number;
    isGrindingShoe?: boolean;
    bodyTuck?: number;
    slipRatio?: number;
    gForceLat?: number;
    gForceLong?: number;
    dirtOnVisor?: number;
    tearOffsRemaining?: number;
    gearRatio?: string;
    driftSweetSpot?: boolean;
  };
  positions: {
    id: string;
    name: string;
    helmet: HelmetColor;
    position: number;
    gap: string;
  }[];
  invertSteering: boolean;
  onToggleInvertSteering?: () => void;
  onTearOff?: () => void;
  isTrainingMode?: boolean;
}

const HELMET_BADGE_COLORS: Record<HelmetColor, { bg: string; text: string; border: string; label: string }> = {
  red: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-400', label: 'CZER' },
  blue: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-400', label: 'NIEB' },
  white: { bg: 'bg-white', text: 'text-zinc-900', border: 'border-zinc-300', label: 'BIAŁ' },
  yellow: { bg: 'bg-amber-400', text: 'text-zinc-950', border: 'border-amber-300', label: 'ŻÓŁ' },
};

export const HUD: React.FC<HUDProps> = ({
  heatNumber,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  currentLap,
  totalLaps,
  raceState,
  raceMessage,
  reactionInfo,
  telemetry,
  positions,
  invertSteering,
  onToggleInvertSteering,
  onTearOff,
  isTrainingMode,
}) => {
  const [tearOffFlash, setTearOffFlash] = useState(false);

  const handleTearOffClick = () => {
    setTearOffFlash(true);
    setTimeout(() => setTearOffFlash(false), 240);
    onTearOff?.();
  };

  const driftDeg = telemetry.slideAngle;
  const isSweetSpot = telemetry.driftSweetSpot || (driftDeg >= 26 && driftDeg <= 46);
  const isOversteer = driftDeg > 48;
  const dirtOpacity = Math.min(0.75, telemetry.dirtOnVisor || 0);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 select-none">
      {/* 1. VISOR DIRT OVERLAY & TEAR-OFF FLASH */}
      {dirtOpacity > 0.05 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-10"
          style={{
            opacity: dirtOpacity,
            backgroundImage: `radial-gradient(circle at 35% 45%, rgba(46, 35, 28, 0.85) 0%, rgba(30, 22, 16, 0.4) 60%, transparent 80%),
                              radial-gradient(circle at 75% 65%, rgba(60, 42, 30, 0.75) 0%, transparent 55%),
                              radial-gradient(circle at 20% 75%, rgba(50, 36, 25, 0.9) 0%, transparent 40%)`,
          }}
        />
      )}

      {tearOffFlash && (
        <div className="absolute inset-0 bg-sky-200/50 pointer-events-none z-50 animate-pulse transition-opacity duration-200" />
      )}

      {/* 2. TOP HEADER: League Scoreboard, Lap Counter, Steering Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full z-20">
        {/* Match Header / Scoreboard */}
        <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold px-2 py-0.5 rounded tracking-wider uppercase font-mono">
              {isTrainingMode ? 'TRENING SOLO' : `BIEG ${heatNumber} / 15`}
            </span>
          </div>

          {!isTrainingMode && (
            <div className="flex items-center gap-3 font-semibold text-sm">
              <span className="text-zinc-200 font-bold">{homeTeamName}</span>
              <div className="bg-zinc-900 border border-zinc-700 px-2.5 py-0.5 rounded text-amber-400 font-mono text-base font-extrabold tracking-widest shadow-inner">
                {homeScore} : {awayScore}
              </div>
              <span className="text-zinc-200 font-bold">{awayTeamName}</span>
            </div>
          )}

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          {/* Lap Counter */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-zinc-400">OKRĄŻENIE:</span>
            <span className="text-lg font-black text-amber-400">{currentLap}</span>
            <span className="text-zinc-500">/{totalLaps}</span>
          </div>
        </div>

        {/* Start Procedure & Alerts */}
        {raceState === 'ready' && (
          <div className="bg-emerald-950/95 border-2 border-emerald-500 rounded-xl px-5 py-2.5 shadow-2xl text-center animate-pulse">
            <div className="flex items-center justify-center gap-2 text-emerald-300 font-black text-sm tracking-wide">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span>ZIELONE ŚWIATŁO! TRZYMAJ SPRZĘGŁO (SPACJA)</span>
            </div>
            <div className="text-[11px] text-emerald-200/90 font-mono mt-0.5">
              Puść klawisz natychmiast, gdy taśma ruszy w górę!
            </div>
          </div>
        )}

        {raceState === 'false_start' && (
          <div className="bg-red-950/95 border-2 border-red-500 rounded-xl px-5 py-2.5 shadow-2xl text-center animate-bounce">
            <div className="flex items-center justify-center gap-2 text-red-400 font-black text-sm">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>FALSTART! OSTRZEŻENIE SĘDZIEGO</span>
            </div>
            <div className="text-[11px] text-red-200/90 font-mono">
              Dotknięcie taśmy – powtórka biegu w 4-osobowym składzie
            </div>
          </div>
        )}

        {reactionInfo && raceState === 'racing' && (
          <div className="bg-amber-950/85 border border-amber-500/60 rounded-xl px-4 py-1.5 text-center shadow-lg">
            <div className="text-xs text-amber-300 font-bold">
              CZAS REAKCJI: <span className="font-mono text-sm text-white">{reactionInfo.timeMs} ms</span>
            </div>
            <div className="text-[10px] text-amber-200/80 font-mono">
              {reactionInfo.rating}
            </div>
          </div>
        )}

        {/* 3. STEERING INVERSION TOGGLE BUTTON */}
        <div className="flex items-center gap-2">
          {onToggleInvertSteering && (
            <button
              onClick={onToggleInvertSteering}
              className={`pointer-events-auto px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 backdrop-blur-md shadow-xl transition-all cursor-pointer active:scale-95 ${
                invertSteering
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-zinc-900/90 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
              title="Przełącz kierunek skręcania (Klawisz I)"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
              <span>SKRĘCANIE: {invertSteering ? 'ODWRÓCONE' : 'KLASYCZNE'}</span>
              <span className="text-[9px] bg-zinc-800 px-1 py-0.2 rounded text-zinc-400">[Q / I]</span>
            </button>
          )}

          {/* Goggle Tear-Off Button */}
          <button
            onClick={handleTearOffClick}
            className="pointer-events-auto px-3 py-1.5 bg-zinc-900/90 hover:bg-sky-950/80 border border-zinc-750 hover:border-sky-500 text-zinc-300 hover:text-sky-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 backdrop-blur-md shadow-xl transition-all cursor-pointer active:scale-95"
            title="Zerwij zabrudzoną zrywkę z gogli (Klawisz T)"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>ZRYWKA</span>
            <span className="text-[10px] text-sky-400 font-extrabold">{telemetry.tearOffsRemaining ?? 5}/5</span>
            <span className="text-[9px] bg-zinc-800 px-1 py-0.2 rounded text-zinc-400">[T]</span>
          </button>
        </div>
      </div>

      {/* 4. MID SECTION: Drift & Posture Status Banners */}
      <div className="flex flex-col items-center gap-2 my-auto pointer-events-none z-20">
        {/* Sweet spot indicator */}
        {isSweetSpot && raceState === 'racing' && (
          <div className="bg-gradient-to-r from-emerald-950/90 via-emerald-900/95 to-emerald-950/90 border border-emerald-400/80 text-emerald-200 px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-black tracking-wider uppercase animate-pulse">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>IDEALNY UŚLIZG! +TRAKCJA Z WIRAŻU</span>
          </div>
        )}

        {/* Oversteer spin risk warning */}
        {isOversteer && raceState === 'racing' && (
          <div className="bg-red-950/95 border-2 border-red-500 text-red-200 px-5 py-2 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-black tracking-wider uppercase animate-bounce">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>UWAGA: PRZEGIĘCIE ({driftDeg}°)! DAJ KONTRĘ W PRAWO I UJMIJ GAZU</span>
          </div>
        )}

        {/* Steel shoe grinding notification */}
        {telemetry.isGrindingShoe && raceState === 'racing' && (
          <div className="bg-zinc-950/80 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full text-[10px] font-mono flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-amber-400 animate-spin" />
            <span>BLACHA BUTA NA TORZE (ŚLIZGACZ)</span>
          </div>
        )}
      </div>

      {/* 5. BOTTOM SECTION: Leaderboard & Advanced Telemetry Console */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-3 max-w-7xl mx-auto w-full z-20">
        {/* RUNNING LEADERBOARD */}
        <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl p-2.5 shadow-2xl max-w-xs w-full">
          <div className="text-[10px] font-mono text-zinc-400 mb-1.5 flex items-center justify-between font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1 text-amber-400">
              <Trophy className="w-3 h-3 text-amber-400" /> Stawka biegu
            </span>
            <span className="text-[9px] text-zinc-500">PGE Ekstraliga</span>
          </div>
          <div className="space-y-1">
            {positions.map((p) => {
              const badge = HELMET_BADGE_COLORS[p.helmet];
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs bg-zinc-900/70 rounded px-2 py-1 font-mono border border-zinc-800/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-400 w-3">{p.position}.</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-zinc-200 truncate max-w-[120px] font-sans font-medium">
                      {p.name}
                    </span>
                  </div>
                  <span className="text-amber-400 text-[11px] font-mono font-bold">{p.gap}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ADVANCED UNREAL-GRADE SPEEDWAY TELEMETRY DASHBOARD */}
        <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-3 shadow-2xl flex flex-wrap items-center gap-4 text-xs font-mono">
          {/* Speedometer */}
          <div className="text-center min-w-[70px]">
            <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 font-bold">
              <Gauge className="w-3.5 h-3.5 text-sky-400" /> KM/H
            </div>
            <div className="text-2xl font-black text-white tracking-wider">
              {telemetry.speed}
            </div>
            <div className="text-[9px] text-zinc-500 font-mono">
              PRZEŁ: {telemetry.gearRatio || '13/58T'}
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          {/* Tachometer RPM */}
          <div className="text-center min-w-[80px]">
            <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-500" /> RPM 500cc
            </div>
            <div className="text-base font-extrabold text-amber-400">
              {telemetry.rpm}
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  telemetry.rpm > 9500 ? 'bg-red-500 animate-pulse' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, (telemetry.rpm / 10800) * 100)}%` }}
              />
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          {/* Drift Angle Sweet Spot Gauge */}
          <div className="text-center min-w-[85px]">
            <div className="text-[10px] text-zinc-400 font-bold">KĄT UŚLIZGU</div>
            <div className={`text-base font-black flex items-center justify-center gap-1 ${
              isOversteer
                ? 'text-red-400 animate-pulse'
                : isSweetSpot
                ? 'text-emerald-400'
                : telemetry.slideAngle > 10
                ? 'text-amber-400'
                : 'text-zinc-400'
            }`}>
              <span>{telemetry.slideAngle}°</span>
              {telemetry.isGrindingShoe && <Sparkles className="w-3 h-3 text-amber-400 animate-ping" />}
            </div>
            <div className="text-[8px] font-bold uppercase mt-0.5">
              {isOversteer ? (
                <span className="text-red-400">PRZEGIĘCIE</span>
              ) : isSweetSpot ? (
                <span className="text-emerald-400">SWEET SPOT</span>
              ) : (
                <span className="text-zinc-500">26°-46° CEL</span>
              )}
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          {/* Rider Weight Balance (Body Tuck) */}
          <div className="text-center min-w-[65px]">
            <div className="text-[10px] text-zinc-400 font-bold">BALANS</div>
            <div className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
              (telemetry.bodyTuck || 0) > 0.5
                ? 'bg-sky-500 text-zinc-950 font-black'
                : 'bg-zinc-800 text-zinc-400'
            }`}>
              {(telemetry.bodyTuck || 0) > 0.5 ? 'TUCK (AERO)' : 'NORMALNY'}
            </div>
            <span className="text-[8px] text-zinc-500 block mt-0.5">[SHIFT/S]</span>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          {/* G-Forces & Slip Ratio */}
          <div className="text-center min-w-[65px]">
            <div className="text-[10px] text-zinc-400 font-bold">PRZECIĄŻENIE</div>
            <div className="text-[11px] font-mono text-zinc-200 font-bold">
              {Math.abs(telemetry.gForceLat || 0).toFixed(1)}G <span className="text-zinc-500">LAT</span>
            </div>
            <div className="text-[9px] text-zinc-400 font-mono">
              SLIP: {telemetry.slipRatio || 0}%
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          {/* Clutch Launch Status */}
          <div className="text-center min-w-[70px]">
            <div className="text-[10px] text-zinc-400 font-bold">SPRZĘGŁO</div>
            <div className={`text-[10px] font-black px-2 py-0.5 rounded ${
              telemetry.clutchHeld ? 'bg-emerald-500 text-zinc-950 shadow-lg' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {telemetry.clutchHeld ? 'TRZYMASZ' : 'PUSZCZONE'}
            </div>
            <span className="text-[8px] text-zinc-500 block mt-0.5">[SPACJA]</span>
          </div>
        </div>
      </div>

      {/* 6. HEAT FINISH VICTORY BANNER */}
      {raceState === 'finished' && (
        <div className="self-center my-auto bg-zinc-950/95 border-2 border-amber-500 rounded-3xl p-6 shadow-2xl text-center pointer-events-auto backdrop-blur-xl max-w-md w-full z-30">
          <div className="text-amber-400 font-black text-2xl tracking-wider uppercase font-mono flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
            BIEG UKOŃCZONY!
          </div>
          <p className="text-zinc-200 text-sm mt-2 font-medium">
            Wszyscy zawodnicy minęli szachownicę. Punkty zostały dopisane do programu zawodów.
          </p>
          <div className="mt-4 pt-3 border-t border-zinc-800/80 text-xs text-zinc-400 font-mono">
            Kliknij ikonę <span className="text-amber-400 font-bold">Tabeli</span> na dolnym pasku, aby zobaczyć oficjalny protokół meczowy.
          </div>
        </div>
      )}

      {/* Spacer to avoid bottom dock overlap */}
      <div className="h-16" />
    </div>
  );
};
