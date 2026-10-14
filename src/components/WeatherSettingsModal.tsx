import React from 'react';
import { TrackCondition, WeatherType, TimeOfDay, TrackGrip } from '../types/speedway';
import { CloudSun, Sun, Sunset, Moon, CloudRain, Cloud, Check, X, Shield, User } from 'lucide-react';
import { EKSTRALIGA_TEAMS } from '../data/teamsData';

interface WeatherSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  condition: TrackCondition;
  onUpdateCondition: (newCondition: TrackCondition) => void;
  isTrainingMode: boolean;
  onToggleTrainingMode: (training: boolean) => void;
  homeTeamId: string;
  awayTeamId: string;
  onChangeTeams: (home: string, away: string) => void;
}

export const WeatherSettingsModal: React.FC<WeatherSettingsModalProps> = ({
  isOpen,
  onClose,
  condition,
  onUpdateCondition,
  isTrainingMode,
  onToggleTrainingMode,
  homeTeamId,
  awayTeamId,
  onChangeTeams,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-sans">
                Warunki Toru, Pogoda i Tryb Gry
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Cykl dobowy, opady oraz przygotowanie nawierzchni żużlowej
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* 1. Game Mode Selector */}
          <div>
            <label className="text-xs font-bold text-zinc-300 font-mono block mb-2">
              TRYB ROZGRYWKI:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onToggleTrainingMode(false)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  !isTrainingMode
                    ? 'bg-amber-500/20 border-amber-500/80 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Szybki Mecz Ekstraligi</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-1">
                  4 zawodników w biegu, tabela 15 biegów, punkty ligowe
                </div>
              </button>

              <button
                onClick={() => onToggleTrainingMode(true)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isTrainingMode
                    ? 'bg-amber-500/20 border-amber-500/80 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>Trening Solo</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-1">
                  Sam na torze, testy przełożeń, ćwiczenie startów
                </div>
              </button>
            </div>
          </div>

          {/* 2. Teams Selection (If match mode) */}
          {!isTrainingMode && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 space-y-3">
              <label className="text-xs font-bold text-zinc-300 font-mono block">
                DOBÓR DRUŻYN (DERBY EKSTRALIGI):
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono block mb-1">Gospodarze:</span>
                  <select
                    value={homeTeamId}
                    onChange={(e) => onChangeTeams(e.target.value, awayTeamId)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white font-medium cursor-pointer"
                  >
                    {EKSTRALIGA_TEAMS.map((t) => (
                      <option key={t.id} value={t.id} disabled={t.id === awayTeamId}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 font-mono block mb-1">Goście:</span>
                  <select
                    value={awayTeamId}
                    onChange={(e) => onChangeTeams(homeTeamId, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white font-medium cursor-pointer"
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
          )}

          {/* 3. Time of Day (Cykl Dobowy) */}
          <div>
            <label className="text-xs font-bold text-zinc-300 font-mono block mb-2">
              CYKL DOBOWY (OŚWIETLENIE STADIONU):
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdateCondition({ ...condition, timeOfDay: 'day' })}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  condition.timeOfDay === 'day'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <Sun className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                <div className="text-xs font-bold">Dzień (15:00)</div>
                <div className="text-[9px] text-zinc-500 font-mono">Jasne słońce</div>
              </button>

              <button
                onClick={() => onUpdateCondition({ ...condition, timeOfDay: 'sunset' })}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  condition.timeOfDay === 'sunset'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <Sunset className="w-5 h-5 mx-auto mb-1 text-orange-400" />
                <div className="text-xs font-bold">Zmierzch (19:30)</div>
                <div className="text-[9px] text-zinc-500 font-mono">Złota godzina</div>
              </button>

              <button
                onClick={() => onUpdateCondition({ ...condition, timeOfDay: 'night' })}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  condition.timeOfDay === 'night'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <Moon className="w-5 h-5 mx-auto mb-1 text-sky-400" />
                <div className="text-xs font-bold">Noc (21:00)</div>
                <div className="text-[9px] text-zinc-500 font-mono">Mocne jupitery</div>
              </button>
            </div>
          </div>

          {/* 4. Weather (Pogoda) */}
          <div>
            <label className="text-xs font-bold text-zinc-300 font-mono block mb-2">
              WARUNKI ATMOSFERYCZNE:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdateCondition({ ...condition, weather: 'sunny', moisture: 0.15 })}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  condition.weather === 'sunny'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <Sun className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                <div className="text-xs font-bold">Sucho / Słońce</div>
                <div className="text-[9px] text-zinc-500 font-mono">Kurz & pył</div>
              </button>

              <button
                onClick={() => onUpdateCondition({ ...condition, weather: 'overcast', moisture: 0.40 })}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  condition.weather === 'overcast'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <Cloud className="w-5 h-5 mx-auto mb-1 text-zinc-300" />
                <div className="text-xs font-bold">Pochmurno</div>
                <div className="text-[9px] text-zinc-500 font-mono">Wilgotna nawierzchnia</div>
              </button>

              <button
                onClick={() => onUpdateCondition({ ...condition, weather: 'rainy', moisture: 0.85 })}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  condition.weather === 'rainy'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <CloudRain className="w-5 h-5 mx-auto mb-1 text-sky-400" />
                <div className="text-xs font-bold">Deszcz</div>
                <div className="text-[9px] text-zinc-500 font-mono">Błotnisty śliski tor</div>
              </button>
            </div>
          </div>

          {/* 5. Track Grip (Przygotowanie nawierzchni) */}
          <div>
            <label className="text-xs font-bold text-zinc-300 font-mono block mb-2">
              STAN PRZYGOTOWANIA NAWIERZCHNI (TRAKTOR & BRONA):
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdateCondition({ ...condition, trackGrip: 'hard', hardness: 0.85 })}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  condition.trackGrip === 'hard'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <div className="text-xs font-bold">Twardy (Slick)</div>
                <div className="text-[9px] text-zinc-500 font-mono">Kreda wyślizgana, mały opór</div>
              </button>

              <button
                onClick={() => onUpdateCondition({ ...condition, trackGrip: 'medium', hardness: 0.50 })}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  condition.trackGrip === 'medium'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <div className="text-xs font-bold">Uniwersalny</div>
                <div className="text-[9px] text-zinc-500 font-mono">Optymalny żużel ligowy</div>
              </button>

              <button
                onClick={() => onUpdateCondition({ ...condition, trackGrip: 'grippy', hardness: 0.20 })}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  condition.trackGrip === 'grippy'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                }`}
              >
                <div className="text-xs font-bold">Przyczepny (Kopa)</div>
                <div className="text-[9px] text-zinc-500 font-mono">Dużo materiału, trzyma koło</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer font-mono"
          >
            <Check className="w-4 h-4" />
            <span>Zastosuj warunki torowe</span>
          </button>
        </div>
      </div>
    </div>
  );
};
