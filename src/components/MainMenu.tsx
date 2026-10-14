import React from 'react';
import { EKSTRALIGA_TEAMS } from '../data/teamsData';
import { TrackCondition, BikeSetup } from '../types/speedway';
import { Play, Wrench, CloudSun, Trophy, Shield, User, Zap, Flame, Volume2, HelpCircle } from 'lucide-react';

interface MainMenuProps {
  homeTeamId: string;
  awayTeamId: string;
  onSelectTeams: (home: string, away: string) => void;
  isTrainingMode: boolean;
  onToggleTrainingMode: (training: boolean) => void;
  onStartGame: () => void;
  onOpenGarage: () => void;
  onOpenWeather: () => void;
  onOpenHelp: () => void;
  trackCondition: TrackCondition;
  bikeSetup: BikeSetup;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  homeTeamId,
  awayTeamId,
  onSelectTeams,
  isTrainingMode,
  onToggleTrainingMode,
  onStartGame,
  onOpenGarage,
  onOpenWeather,
  onOpenHelp,
  trackCondition,
  bikeSetup,
}) => {
  const homeTeam = EKSTRALIGA_TEAMS.find((t) => t.id === homeTeamId) || EKSTRALIGA_TEAMS[0];
  const awayTeam = EKSTRALIGA_TEAMS.find((t) => t.id === awayTeamId) || EKSTRALIGA_TEAMS[1];

  const DERBY_PRESETS = [
    { name: 'Lubuskie Derby', home: 'gorzow', away: 'zielona_gora' },
    { name: 'Starcie Mistrzów', home: 'lublin', away: 'wroclaw' },
    { name: 'Derby Pomorza i Kujaw', home: 'torun', away: 'gorzow' },
  ];

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/40 select-none overflow-y-auto">
      {/* Top Brand Bar */}
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center font-black text-zinc-950 text-xl shadow-lg border-2 border-amber-300">
            S
          </div>
          <div>
            <div className="text-[10px] text-amber-400 font-mono tracking-widest uppercase font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-current" />
              PGE Ekstraliga 3D Simulator
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase font-sans">
              SPEEDWAY GRAND PRIX
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHelp}
            className="px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-zinc-200 text-xs font-mono flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Zasady & Sterowanie</span>
          </button>
        </div>
      </div>

      {/* Center Main Card */}
      <div className="max-w-4xl mx-auto w-full my-auto py-6 space-y-6">
        {/* Mode Selector (Tabs) */}
        <div className="flex justify-center">
          <div className="bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-2xl flex gap-1 shadow-2xl backdrop-blur-md">
            <button
              onClick={() => onToggleTrainingMode(false)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                !isTrainingMode
                  ? 'bg-amber-500 text-zinc-950 shadow-lg'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>MECZ LIGOWY (DERBY)</span>
            </button>
            <button
              onClick={() => onToggleTrainingMode(true)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                isTrainingMode
                  ? 'bg-amber-500 text-zinc-950 shadow-lg'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>TRENING SOLO (TESTY)</span>
            </button>
          </div>
        </div>

        {/* Team Matchup Card (If League Match) */}
        {!isTrainingMode ? (
          <div className="bg-zinc-900/85 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
              {/* Home Team */}
              <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col items-center text-center space-y-2">
                <div className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider">
                  GOSPODARZE
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-md border-2 border-white/20"
                  style={{ backgroundColor: homeTeam.colors.primary, color: homeTeam.colors.text }}
                >
                  {homeTeam.shortName}
                </div>
                <div className="font-bold text-white text-base font-sans">{homeTeam.name}</div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Lider: {homeTeam.riders[0].name} ({homeTeam.riders[0].avgPoints} pkt/b)
                </div>

                <select
                  value={homeTeamId}
                  onChange={(e) => onSelectTeams(e.target.value, awayTeamId)}
                  className="mt-2 w-full bg-zinc-900 border border-zinc-750 text-white rounded-lg p-2 text-xs font-mono cursor-pointer"
                >
                  {EKSTRALIGA_TEAMS.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.id === awayTeamId}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* VS & Derby Badge */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-zinc-800/90 border border-zinc-700 flex items-center justify-center font-black text-amber-400 text-base shadow-inner">
                  VS
                </div>
                <div className="text-xs font-mono text-zinc-300 font-bold uppercase tracking-widest">
                  15 Biegów • 4 Okrążenia
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  Zasady PGE Speedway Ekstraliga
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                  {DERBY_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => onSelectTeams(preset.home, preset.away)}
                      className={`px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all cursor-pointer ${
                        homeTeamId === preset.home && awayTeamId === preset.away
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                          : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50 hover:bg-zinc-700/60'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Away Team */}
              <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col items-center text-center space-y-2">
                <div className="text-[10px] text-sky-400 font-mono font-bold uppercase tracking-wider">
                  GOŚCIE
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-md border-2 border-white/20"
                  style={{ backgroundColor: awayTeam.colors.primary, color: awayTeam.colors.text }}
                >
                  {awayTeam.shortName}
                </div>
                <div className="font-bold text-white text-base font-sans">{awayTeam.name}</div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Lider: {awayTeam.riders[0].name} ({awayTeam.riders[0].avgPoints} pkt/b)
                </div>

                <select
                  value={awayTeamId}
                  onChange={(e) => onSelectTeams(homeTeamId, e.target.value)}
                  className="mt-2 w-full bg-zinc-900 border border-zinc-750 text-white rounded-lg p-2 text-xs font-mono cursor-pointer"
                >
                  {EKSTRALIGA_TEAMS.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.id === homeTeamId}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          /* Training Mode Details */
          <div className="bg-zinc-900/85 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center space-y-3">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
              <User className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white font-sans">
              Sesja Treningowa Solo
            </h2>
            <p className="text-xs text-zinc-300 font-mono max-w-lg mx-auto leading-relaxed">
              Wyjedź na tor samemu. Sprawdź zachowanie motocykla na wejściu w łuk, dopasuj
              zębatki i zapłon w garażu oraz trenuj perfekcyjny start na zwolnienie sprzęgła
              przy zielonym świetle maszyny startowej.
            </p>
          </div>
        )}

        {/* Quick Launch Buttons & Modals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={onOpenGarage}
            className="p-3.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-left flex items-center gap-3 transition-all cursor-pointer backdrop-blur-md active:scale-98"
          >
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Garaż & Tuning</div>
              <div className="text-[10px] text-zinc-400 font-mono">
                13/{bikeSetup.rearSprocket}T • {bikeSetup.carburetorJet}mm • {bikeSetup.ignitionTiming}°
              </div>
            </div>
          </button>

          <button
            onClick={onOpenWeather}
            className="p-3.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-left flex items-center gap-3 transition-all cursor-pointer backdrop-blur-md active:scale-98"
          >
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Warunki Toru</div>
              <div className="text-[10px] text-zinc-400 font-mono uppercase">
                {trackCondition.timeOfDay} • {trackCondition.trackGrip}
              </div>
            </div>
          </button>

          {/* START BUTTON */}
          <button
            onClick={onStartGame}
            className="p-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-2xl transition-all cursor-pointer active:scale-95 text-sm uppercase tracking-wider"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>WYJEDŹ NA TOR (START)</span>
          </button>
        </div>
      </div>

      {/* Bottom Hint Banner */}
      <div className="max-w-4xl mx-auto w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>START: Trzymaj SPACJĘ (Sprzęgło) przy zielonym świetle i puść w momencie startu taśmy!</span>
        </div>
        <div className="text-zinc-400 text-[11px]">
          Sterowanie: A / D (Skręt / Kontra) • W (Gaz) • Shift/S (Dociążenie) • T (Zrywka) • I (Odwróć skręt)
        </div>
      </div>
    </div>
  );
};
