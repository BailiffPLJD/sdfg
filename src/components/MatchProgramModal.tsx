import React from 'react';
import { Team, HeatDefinition, HeatResult, HelmetColor } from '../types/speedway';
import { Trophy, X, Play, RotateCcw, Award } from 'lucide-react';

interface MatchProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeTeam: Team;
  awayTeam: Team;
  heats: HeatDefinition[];
  heatResults: Record<number, HeatResult>;
  currentHeatIndex: number;
  onSelectHeatToRide: (heatNum: number) => void;
  onSimulateHeat: (heatNum: number) => void;
  onResetMatch: () => void;
  homeTotalScore: number;
  awayTotalScore: number;
}

const HELMET_COLORS_CSS: Record<HelmetColor, string> = {
  red: 'bg-red-600 text-white border-red-400',
  blue: 'bg-blue-600 text-white border-blue-400',
  white: 'bg-white text-zinc-950 border-zinc-300',
  yellow: 'bg-amber-400 text-zinc-950 border-amber-300',
};

export const MatchProgramModal: React.FC<MatchProgramModalProps> = ({
  isOpen,
  onClose,
  homeTeam,
  awayTeam,
  heats,
  heatResults,
  currentHeatIndex,
  onSelectHeatToRide,
  onSimulateHeat,
  onResetMatch,
  homeTotalScore,
  awayTotalScore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header with Teams & Big Score */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-md"
                style={{ backgroundColor: homeTeam.colors.primary, color: homeTeam.colors.text }}
              >
                {homeTeam.shortName}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{homeTeam.name}</div>
                <div className="text-[10px] text-zinc-400 font-mono">Gospodarze</div>
              </div>
            </div>

            {/* Match Score Box */}
            <div className="bg-zinc-950 border-2 border-amber-500/80 px-4 py-1.5 rounded-xl text-center shadow-lg mx-2">
              <div className="text-[9px] text-zinc-400 font-mono tracking-widest uppercase">PGE Ekstraliga</div>
              <div className="text-2xl font-black text-amber-400 font-mono tracking-wider">
                {homeTotalScore} : {awayTotalScore}
              </div>
            </div>

            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="text-sm font-bold text-white">{awayTeam.name}</div>
                <div className="text-[10px] text-zinc-400 font-mono">Goście</div>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-md"
                style={{ backgroundColor: awayTeam.colors.primary, color: awayTeam.colors.text }}
              >
                {awayTeam.shortName}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer self-end sm:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 15 Heats Table */}
        <div className="p-4 overflow-y-auto space-y-2">
          <div className="text-xs font-mono text-zinc-400 mb-2 flex items-center justify-between">
            <span>OFICJALNY PROGRAM ZAWODÓW (15 BIEGÓW):</span>
            <span className="text-amber-400">Stan meczu: 45 pkt gwarantuje remis, 46 pkt zwycięstwo</span>
          </div>

          <div className="divide-y divide-zinc-850 border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/30">
            {heats.map((heat) => {
              const res = heatResults[heat.number];
              const isCurrent = heat.number === currentHeatIndex;

              const homeRider1 = homeTeam.riders[heat.homeRiders[0]] || homeTeam.riders[0];
              const homeRider2 = homeTeam.riders[heat.homeRiders[1]] || homeTeam.riders[1];
              const awayRider1 = awayTeam.riders[heat.awayRiders[0]] || awayTeam.riders[0];
              const awayRider2 = awayTeam.riders[heat.awayRiders[1]] || awayTeam.riders[1];

              return (
                <div
                  key={heat.number}
                  className={`p-2.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono transition-colors ${
                    isCurrent ? 'bg-amber-500/10 border-l-4 border-l-amber-500' : 'hover:bg-zinc-900/60'
                  }`}
                >
                  {/* Heat Label & Meta */}
                  <div className="flex items-center gap-2 min-w-[90px]">
                    <span className="font-bold text-amber-400">BIEG {heat.number}</span>
                    {heat.isJuniorHeat && (
                      <span className="bg-sky-950 text-sky-400 text-[9px] px-1.5 py-0.5 rounded border border-sky-800">
                        JUNIORZY
                      </span>
                    )}
                    {heat.isNominatedHeat && (
                      <span className="bg-purple-950 text-purple-400 text-[9px] px-1.5 py-0.5 rounded border border-purple-800">
                        NOMINOWANY
                      </span>
                    )}
                  </div>

                  {/* Riders participating */}
                  <div className="flex-1 grid grid-cols-2 gap-2 w-full md:w-auto text-[11px]">
                    {/* Home Riders */}
                    <div className="flex items-center gap-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full border text-[9px] font-bold flex items-center justify-center ${HELMET_COLORS_CSS[heat.gateAssignment.A]}`}>
                        A
                      </span>
                      <span className="text-zinc-200 truncate">{homeRider1.name}</span>
                      <span className="text-zinc-500">/</span>
                      <span className={`w-3.5 h-3.5 rounded-full border text-[9px] font-bold flex items-center justify-center ${HELMET_COLORS_CSS[heat.gateAssignment.C]}`}>
                        C
                      </span>
                      <span className="text-zinc-200 truncate">{homeRider2.name}</span>
                    </div>

                    {/* Away Riders */}
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-zinc-200 truncate">{awayRider1.name}</span>
                      <span className={`w-3.5 h-3.5 rounded-full border text-[9px] font-bold flex items-center justify-center ${HELMET_COLORS_CSS[heat.gateAssignment.B]}`}>
                        B
                      </span>
                      <span className="text-zinc-500">/</span>
                      <span className="text-zinc-200 truncate">{awayRider2.name}</span>
                      <span className={`w-3.5 h-3.5 rounded-full border text-[9px] font-bold flex items-center justify-center ${HELMET_COLORS_CSS[heat.gateAssignment.D]}`}>
                        D
                      </span>
                    </div>
                  </div>

                  {/* Heat Result Score */}
                  <div className="flex items-center gap-3">
                    {res ? (
                      <div className="flex items-center gap-2">
                        <span className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-amber-400 font-bold">
                          {res.homeScore} : {res.awayScore}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          ({res.homeCumulative}:{res.awayCumulative})
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-[11px]">- : -</span>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSelectHeatToRide(heat.number);
                          onClose();
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{res ? 'Powtórz' : 'Jedź bieg'}</span>
                      </button>

                      {!res && (
                        <button
                          onClick={() => onSimulateHeat(heat.number)}
                          className="px-2 py-1 rounded-lg text-[10px] bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="Szybka symulacja biegu"
                        >
                          Symuluj
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with Reset */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <button
            onClick={onResetMatch}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 transition-colors font-mono cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Zresetuj cały mecz (0:0)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer font-mono"
          >
            Wróć na tor
          </button>
        </div>
      </div>
    </div>
  );
};
