import React from 'react';
import { EKSTRALIGA_TEAMS } from '../data/teamsData';
import { TrackCondition, BikeSetup } from '../types/speedway';
import {
  CloudSun,
  Flame,
  Gauge,
  HelpCircle,
  Play,
  Shield,
  Swords,
  TimerReset,
  Trophy,
  User,
  Wrench,
  Zap,
} from 'lucide-react';

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

  const timeOfDayLabel: Record<TrackCondition['timeOfDay'], string> = {
    day: 'Dzień',
    sunset: 'Zachód słońca',
    night: 'Noc',
  };

  const gripLabel: Record<TrackCondition['trackGrip'], string> = {
    hard: 'Twardy',
    medium: 'Średni',
    grippy: 'Przyczepny',
  };

  const weatherLabel: Record<TrackCondition['weather'], string> = {
    sunny: 'Słonecznie',
    overcast: 'Pochmurno',
    rainy: 'Deszcz',
  };

  const featureCards = [
    {
      title: 'Start spod taśmy',
      value: 'Sprzęgło + reakcja',
      icon: TimerReset,
      accent: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10',
    },
    {
      title: 'Motocykl 500cc',
      value: `13/${bikeSetup.rearSprocket} • ${bikeSetup.carburetorJet}`,
      icon: Gauge,
      accent: 'text-amber-300 border-amber-500/20 bg-amber-500/10',
    },
    {
      title: 'Warunki toru',
      value: `${timeOfDayLabel[trackCondition.timeOfDay]} • ${gripLabel[trackCondition.trackGrip]}`,
      icon: CloudSun,
      accent: 'text-sky-300 border-sky-500/20 bg-sky-500/10',
    },
  ];

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_22%),linear-gradient(180deg,rgba(9,9,11,0.62),rgba(9,9,11,0.88))] px-4 py-4 sm:px-6 sm:py-6 select-none">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-10 h-52 w-52 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-40 w-72 rounded-full bg-red-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-zinc-950/60 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-300 to-amber-500 text-2xl font-black text-zinc-950 shadow-[0_0_35px_rgba(245,158,11,0.25)]">
              S
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.35em] text-amber-300">
                <Flame className="h-3.5 w-3.5 fill-current text-amber-400" />
                Speedway Simulator
              </div>
              <h1 className="text-2xl font-black uppercase tracking-[0.16em] text-white sm:text-3xl">
                Speedway Grand Prix
              </h1>
              <div className="text-xs font-mono text-zinc-400">
                3D żużel, tuning motocykla i start spod taśmy
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-300">
              {weatherLabel[trackCondition.weather]} • {timeOfDayLabel[trackCondition.timeOfDay]}
            </div>
            <button
              onClick={onOpenHelp}
              className="flex items-center gap-2 rounded-2xl border border-zinc-700/80 bg-zinc-900/75 px-4 py-2 text-xs font-mono text-zinc-200 transition-all hover:border-amber-500/40 hover:text-white active:scale-95 cursor-pointer"
            >
              <HelpCircle className="h-4 w-4 text-amber-400" />
              <span>Zasady i Sterowanie</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/60 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="flex rounded-2xl border border-zinc-800 bg-zinc-900/80 p-1.5 shadow-inner">
                <button
                  onClick={() => onToggleTrainingMode(false)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all cursor-pointer sm:px-5 ${
                    !isTrainingMode
                      ? 'bg-amber-500 text-zinc-950 shadow-lg'
                      : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-white'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>Mecz Ligowy</span>
                </button>
                <button
                  onClick={() => onToggleTrainingMode(true)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all cursor-pointer sm:px-5 ${
                    isTrainingMode
                      ? 'bg-amber-500 text-zinc-950 shadow-lg'
                      : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-white'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Trening Solo</span>
                </button>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs font-mono uppercase tracking-[0.25em] text-zinc-400">
                {isTrainingMode ? 'Tryb rozgrzewki' : 'Mecz 15 biegów'}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.25em] text-amber-300">
                    <Trophy className="h-3.5 w-3.5" />
                    Wieczór na stadionie
                  </div>
                  <h2 className="max-w-xl text-3xl font-black uppercase leading-tight text-white sm:text-4xl">
                    {isTrainingMode ? 'Wyjedź sam na tor i dopracuj technikę jazdy.' : 'Zbuduj własne derby i wygrywaj biegi jeden po drugim.'}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                    {isTrainingMode
                      ? 'Trening pozwala sprawdzić reakcję spod taśmy, pracę motocykla w łuku i ustawienia gaźnika bez presji wyniku.'
                      : 'Ustaw gospodarzy i gości, wybierz derby albo hit kolejki, a potem ruszaj do pełnego meczu w klimacie Ekstraligi.'}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {featureCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.title} className="rounded-2xl border border-white/10 bg-zinc-900/75 p-4">
                        <div className={`mb-3 inline-flex rounded-xl border p-2 ${card.accent}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                          {card.title}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white">
                          {card.value}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    onClick={onOpenGarage}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/85 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-amber-500/30 hover:bg-zinc-900 cursor-pointer"
                  >
                    <div className="mb-3 inline-flex rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-amber-300">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-bold text-white">Garaż i tuning</div>
                    <div className="mt-1 text-[11px] font-mono text-zinc-400">
                      13/{bikeSetup.rearSprocket}T • zapłon {bikeSetup.ignitionTiming}° • dysza {bikeSetup.carburetorJet}
                    </div>
                  </button>

                  <button
                    onClick={onOpenWeather}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/85 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-sky-500/30 hover:bg-zinc-900 cursor-pointer"
                  >
                    <div className="mb-3 inline-flex rounded-xl border border-sky-500/20 bg-sky-500/10 p-2 text-sky-300">
                      <CloudSun className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-bold text-white">Toru i pogoda</div>
                    <div className="mt-1 text-[11px] font-mono text-zinc-400">
                      {weatherLabel[trackCondition.weather]} • {gripLabel[trackCondition.trackGrip]} • {trackCondition.temperature}°C
                    </div>
                  </button>

                  <button
                    onClick={onStartGame}
                    className="rounded-2xl border border-amber-300/50 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 p-4 text-left text-zinc-950 shadow-[0_10px_40px_rgba(245,158,11,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_55px_rgba(245,158,11,0.32)] active:scale-[0.99] cursor-pointer"
                  >
                    <div className="mb-3 inline-flex rounded-xl bg-zinc-950/10 p-2">
                      <Play className="h-5 w-5 fill-current" />
                    </div>
                    <div className="text-sm font-black uppercase tracking-[0.18em]">
                      Wyjedź na tor
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-zinc-900/75">
                      Start biegu, kamera chase i pełne sterowanie zawodnikiem
                    </div>
                  </button>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-zinc-900/80 p-4 shadow-inner">
                {!isTrainingMode ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-zinc-500">
                          Konfiguracja biegu
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
                          <Swords className="h-4 w-4 text-amber-300" />
                          {homeTeam.shortName} vs {awayTeam.shortName}
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-mono text-zinc-400">
                        15 biegów
                        <br />
                        4 okrążenia
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-center">
                        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300">
                          Gospodarze
                        </div>
                        <div
                          className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/20 text-xl font-black shadow-lg"
                          style={{ backgroundColor: homeTeam.colors.primary, color: homeTeam.colors.text }}
                        >
                          {homeTeam.shortName}
                        </div>
                        <div className="mt-3 text-base font-bold text-white">{homeTeam.name}</div>
                        <div className="mt-1 text-[11px] font-mono text-zinc-400">
                          Lider: {homeTeam.riders[0].name} • {homeTeam.riders[0].avgPoints} pkt/b
                        </div>
                        <select
                          value={homeTeamId}
                          onChange={(e) => onSelectTeams(e.target.value, awayTeamId)}
                          className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-white cursor-pointer"
                        >
                          {EKSTRALIGA_TEAMS.map((t) => (
                            <option key={t.id} value={t.id} disabled={t.id === awayTeamId}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-center">
                        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-sky-300">
                          Goście
                        </div>
                        <div
                          className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/20 text-xl font-black shadow-lg"
                          style={{ backgroundColor: awayTeam.colors.primary, color: awayTeam.colors.text }}
                        >
                          {awayTeam.shortName}
                        </div>
                        <div className="mt-3 text-base font-bold text-white">{awayTeam.name}</div>
                        <div className="mt-1 text-[11px] font-mono text-zinc-400">
                          Lider: {awayTeam.riders[0].name} • {awayTeam.riders[0].avgPoints} pkt/b
                        </div>
                        <select
                          value={awayTeamId}
                          onChange={(e) => onSelectTeams(homeTeamId, e.target.value)}
                          className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-white cursor-pointer"
                        >
                          {EKSTRALIGA_TEAMS.map((t) => (
                            <option key={t.id} value={t.id} disabled={t.id === homeTeamId}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                      <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500">
                        Szybkie gotowe starcia
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {DERBY_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => onSelectTeams(preset.home, preset.away)}
                            className={`rounded-xl border px-3 py-2 text-[11px] font-mono transition-all cursor-pointer ${
                              homeTeamId === preset.home && awayTeamId === preset.away
                                ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                                : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-white'
                            }`}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col justify-between gap-4">
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                      <div className="mb-3 inline-flex rounded-xl border border-amber-500/20 bg-zinc-950/30 p-2 text-amber-300">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="text-xl font-bold text-white">Sesja treningowa</div>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                        Trenuj wyjście spod taśmy, balans motocykla i utrzymanie slajdu bez presji wyniku drużynowego.
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500">
                          Scenariusz treningu
                        </div>
                        <div className="mt-2 text-sm font-semibold text-white">
                          Samotny przejazd po pełnym owalu
                        </div>
                        <div className="mt-1 text-[11px] font-mono text-zinc-400">
                          Idealny do testu przełożenia, zapłonu i zachowania motocykla na wejściu w łuk.
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500">
                          Zalecenie
                        </div>
                        <div className="mt-2 text-sm font-semibold text-white">
                          Zacznij od średniego toru i dyszy {bikeSetup.carburetorJet}
                        </div>
                        <div className="mt-1 text-[11px] font-mono text-zinc-400">
                          Potem zmień warunki i sprawdź, jak reaguje przy większej wilgotności oraz innym docisku ciała.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-white/10 bg-zinc-950/60 p-5 shadow-2xl backdrop-blur-xl">
              <div className="mb-3 text-[11px] font-mono uppercase tracking-[0.28em] text-zinc-500">
                Przed startem
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                    <Zap className="h-4 w-4 text-emerald-300" />
                    Procedura startowa
                  </div>
                  <div className="text-[12px] leading-relaxed text-zinc-300">
                    Trzymaj `SPACJĘ` przy zielonym świetle, utrzymaj obroty i puść sprzęgło dokładnie przy wystrzale taśmy.
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/75 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                    <Gauge className="h-4 w-4 text-amber-300" />
                    Najważniejsze sterowanie
                  </div>
                  <div className="text-[12px] leading-relaxed text-zinc-300">
                    `A / D` skręt i kontra, `W` gaz, `Shift` dociążenie, `T` zrywka, `I` odwrócenie skrętu, `C` zmiana kamery.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-zinc-950/60 p-5 shadow-2xl backdrop-blur-xl">
              <div className="mb-3 text-[11px] font-mono uppercase tracking-[0.28em] text-zinc-500">
                Klimat biegu
              </div>
              <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-red-200">
                  <Flame className="h-3.5 w-3.5 text-red-300" />
                  Showroom 3D
                </div>
                <div className="mt-4 text-2xl font-black uppercase leading-tight text-white">
                  Lepsze modele, płynniejsza kamera i żywsza prezentacja toru.
                </div>
                <div className="mt-3 text-sm leading-relaxed text-zinc-300">
                  Menu pokazuje teraz scenę bardziej jak ekran gry: z wyraźną ekspozycją motocykli, konfiguracją biegu i szybką drogą do startu.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/65 px-4 py-3 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-2 text-xs font-mono text-zinc-400 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-zinc-300">
              <Zap className="h-4 w-4 text-emerald-300" />
              <span>Start: trzymaj sprzęgło, pilnuj reakcji i nie zerwij taśmy.</span>
            </div>
            <div className="text-[11px] text-zinc-500">
              Sterowanie: A / D • W • Shift / S • T • I • C
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
