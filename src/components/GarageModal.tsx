import React from 'react';
import { BikeSetup, TrackCondition } from '../types/speedway';
import { evaluateBikeSetup } from '../game/physics';
import { Wrench, X, Sparkles, Check, Thermometer, Droplets, Info } from 'lucide-react';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  bikeSetup: BikeSetup;
  onSaveSetup: (newSetup: BikeSetup) => void;
  trackCondition: TrackCondition;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  bikeSetup,
  onSaveSetup,
  trackCondition,
}) => {
  if (!isOpen) return null;

  const currentEval = evaluateBikeSetup(bikeSetup, trackCondition);

  const applyPreset = (preset: 'hard_slick' | 'deep_cushion' | 'balanced') => {
    if (preset === 'hard_slick') {
      onSaveSetup({
        carburetorJet: 182,
        ignitionTiming: 29,
        rearSprocket: 56,
        tireCompound: 'soft',
        tirePressure: 1.05,
      });
    } else if (preset === 'deep_cushion') {
      onSaveSetup({
        carburetorJet: 190,
        ignitionTiming: 33,
        rearSprocket: 59,
        tireCompound: 'hard',
        tirePressure: 0.88,
      });
    } else {
      onSaveSetup({
        carburetorJet: 185,
        ignitionTiming: 31,
        rearSprocket: 57,
        tireCompound: 'medium',
        tirePressure: 0.95,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide font-sans">
                Park Maszyn & Warsztat Żużlowy
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Dopasowanie motocykla 500cc do aktualnych warunków toru
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

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Track Condition Telemetry Ribbon */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div>
              <span className="text-zinc-500 block text-[10px]">NAWIERZCHNIA TORU:</span>
              <span className="font-bold text-amber-400 uppercase">
                {trackCondition.trackGrip === 'hard'
                  ? 'Twarda / Wyślizgana'
                  : trackCondition.trackGrip === 'grippy'
                  ? 'Przyczepna / Głęboka kopa'
                  : 'Średnia / Standardowa'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-sky-400" />
              <span className="text-zinc-300 font-bold">{trackCondition.temperature}°C</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-sky-400" />
              <span className="text-zinc-300 font-bold">{Math.round(trackCondition.moisture * 100)}% wilgotności</span>
            </div>
          </div>

          {/* Presets */}
          <div>
            <div className="text-xs font-mono text-zinc-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Gotowe nastawy mechanika:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => applyPreset('hard_slick')}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 rounded-xl text-left transition-all active:scale-95 cursor-pointer"
              >
                <div className="text-xs font-bold text-zinc-200">Twardy tor</div>
                <div className="text-[10px] text-zinc-400 font-mono">Miękka guma, 29° zapłon</div>
              </button>
              <button
                onClick={() => applyPreset('balanced')}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 rounded-xl text-left transition-all active:scale-95 cursor-pointer"
              >
                <div className="text-xs font-bold text-amber-400">Uniwersalny</div>
                <div className="text-[10px] text-zinc-400 font-mono">13/57 zębatka, 185 dysza</div>
              </button>
              <button
                onClick={() => applyPreset('deep_cushion')}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 rounded-xl text-left transition-all active:scale-95 cursor-pointer"
              >
                <div className="text-xs font-bold text-emerald-400">Głęboka kopa</div>
                <div className="text-[10px] text-zinc-400 font-mono">13/59, 33° punchy zapłon</div>
              </button>
            </div>
          </div>

          {/* Tuning Sliders */}
          <div className="space-y-4 pt-1">
            {/* 1. Carburetor Jet */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5">
              <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                <span className="text-zinc-300 font-bold">Dysza główna gaźnika:</span>
                <span className="text-amber-400 font-bold text-sm">{bikeSetup.carburetorJet} mm</span>
              </div>
              <input
                type="range"
                min="175"
                max="195"
                step="1"
                value={bikeSetup.carburetorJet}
                onChange={(e) => onSaveSetup({ ...bikeSetup, carburetorJet: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>175 (Uboga / Sucho i ciepło)</span>
                <span>195 (Bogata / Wilgotno i chłodno)</span>
              </div>
            </div>

            {/* 2. Ignition Timing */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5">
              <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                <span className="text-zinc-300 font-bold">Wyprzedzenie zapłonu:</span>
                <span className="text-amber-400 font-bold text-sm">{bikeSetup.ignitionTiming}° BTDC</span>
              </div>
              <input
                type="range"
                min="28"
                max="34"
                step="1"
                value={bikeSetup.ignitionTiming}
                onChange={(e) => onSaveSetup({ ...bikeSetup, ignitionTiming: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>28° (Łagodne oddawanie mocy na śliskim)</span>
                <span>34° (Agresywny strzał ze startu i łuku)</span>
              </div>
            </div>

            {/* 3. Rear Sprocket (Zębatka) */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5">
              <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                <span className="text-zinc-300 font-bold">Przełożenie napędu (Zębatka tył):</span>
                <span className="text-amber-400 font-bold text-sm">13 / {bikeSetup.rearSprocket}T</span>
              </div>
              <input
                type="range"
                min="54"
                max="60"
                step="1"
                value={bikeSetup.rearSprocket}
                onChange={(e) => onSaveSetup({ ...bikeSetup, rearSprocket: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>54T (Długie: wysoka prędkość na prostych)</span>
                <span>60T (Krótkie: atomowy start i wyjście z wirażu)</span>
              </div>
            </div>

            {/* 4. Tire Compound & Pressure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5">
                <label className="text-xs font-bold text-zinc-300 font-mono block mb-2">
                  Mieszanka opony tylnej:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['soft', 'medium', 'hard'] as const).map((compound) => (
                    <button
                      key={compound}
                      onClick={() => onSaveSetup({ ...bikeSetup, tireCompound: compound })}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer capitalize ${
                        bikeSetup.tireCompound === compound
                          ? 'bg-amber-500 text-zinc-950 border-amber-400'
                          : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60 hover:bg-zinc-700'
                      }`}
                    >
                      {compound === 'soft' ? 'Miękka' : compound === 'medium' ? 'Średnia' : 'Twarda'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5">
                <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                  <span className="text-zinc-300 font-bold">Ciśnienie w oponie:</span>
                  <span className="text-amber-400 font-bold text-sm">
                    {bikeSetup.tirePressure.toFixed(2)} bar
                  </span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.20"
                  step="0.02"
                  value={bikeSetup.tirePressure}
                  onChange={(e) => onSaveSetup({ ...bikeSetup, tirePressure: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>0.80 bar (Duży styk)</span>
                  <span>1.20 bar (Twarda opona)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mechanik / Tuner diagnostic feedback */}
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 font-mono leading-relaxed">
              <span className="font-bold text-amber-300 block mb-0.5">Ocena głównego tunera:</span>
              {currentEval.tunerFeedback}
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
            <span>Zatwierdź nastawy i wyjedź na tor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
