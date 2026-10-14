/**
 * Speedway GP & Ekstraliga Simulator
 * 3D Speedway simulator with drift physics, clutch start procedure, bike tuning, and Polish Ekstraliga league matches.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { SpeedwaySceneManager, CameraMode } from './game/SpeedwayScene';
import { HUD } from './components/HUD';
import { BottomDock } from './components/BottomDock';
import { TouchControls } from './components/TouchControls';
import { GarageModal } from './components/GarageModal';
import { MatchProgramModal } from './components/MatchProgramModal';
import { WeatherSettingsModal } from './components/WeatherSettingsModal';
import { MainMenu } from './components/MainMenu';
import { soundEngine } from './game/soundEngine';
import {
  EKSTRALIGA_TEAMS,
  OFFICIAL_EKSTRALIGA_HEATS,
  DEFAULT_BIKE_SETUP,
  DEFAULT_TRACK_CONDITION,
} from './data/teamsData';
import {
  BikeSetup,
  TrackCondition,
  RaceState,
  HelmetColor,
  HeatResult,
} from './types/speedway';
import { HelpCircle, X, Trophy } from 'lucide-react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SpeedwaySceneManager | null>(null);

  // Match & Teams
  const [homeTeamId, setHomeTeamId] = useState('gorzow'); // Stal Gorzów
  const [awayTeamId, setAwayTeamId] = useState('zielona_gora'); // Falubaz Zielona Góra
  const [currentHeatIndex, setCurrentHeatIndex] = useState(1);
  const [heatResults, setHeatResults] = useState<Record<number, HeatResult>>({});
  const [isTrainingMode, setIsTrainingMode] = useState(false);

  // Simulation State
  const [bikeSetup, setBikeSetup] = useState<BikeSetup>(DEFAULT_BIKE_SETUP);
  const [trackCondition, setTrackCondition] = useState<TrackCondition>(DEFAULT_TRACK_CONDITION);
  const [raceState, setRaceState] = useState<RaceState>('standby');
  const [raceMessage, setRaceMessage] = useState<string>('Oczekiwanie na start biegu');
  const [reactionInfo, setReactionInfo] = useState<{ timeMs: number; rating: string } | null>(null);
  const [currentLap, setCurrentLap] = useState(1);
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [isMuted, setIsMuted] = useState(false);
  const [touchControlsActive, setTouchControlsActive] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isInMainMenu, setIsInMainMenu] = useState(true);
  const [invertSteering, setInvertSteering] = useState(false);

  // Modals
  const [isGarageOpen, setIsGarageOpen] = useState(false);
  const [isProgramOpen, setIsProgramOpen] = useState(false);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);

  // Telemetry & Leaderboard
  const [telemetry, setTelemetry] = useState<{
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
  }>({
    speed: 0,
    rpm: 3500,
    throttle: 0,
    slideAngle: 0,
    clutchHeld: false,
    driftEfficiency: 0,
    isGrindingShoe: false,
    bodyTuck: 0,
    slipRatio: 0,
    gForceLat: 0,
    gForceLong: 0,
    dirtOnVisor: 0,
    tearOffsRemaining: 5,
    gearRatio: '13/58',
    driftSweetSpot: false,
  });

  const [positions, setPositions] = useState<
    { id: string; name: string; helmet: HelmetColor; position: number; gap: string }[]
  >([]);

  const homeTeam = EKSTRALIGA_TEAMS.find((t) => t.id === homeTeamId) || EKSTRALIGA_TEAMS[0];
  const awayTeam = EKSTRALIGA_TEAMS.find((t) => t.id === awayTeamId) || EKSTRALIGA_TEAMS[1];

  // Calculate Cumulative Scores
  let homeTotalScore = 0;
  let awayTotalScore = 0;
  Object.values(heatResults).forEach((res) => {
    homeTotalScore += res.homeScore;
    awayTotalScore += res.awayScore;
  });

  // Check touch device on mount
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      setTouchControlsActive(true);
    }
  }, []);

  // Initialize or reload heat in 3D scene
  const loadHeatInScene = useCallback(
    (heatNum: number) => {
      if (!sceneManagerRef.current) return;

      const heatDef = OFFICIAL_EKSTRALIGA_HEATS[heatNum - 1] || OFFICIAL_EKSTRALIGA_HEATS[0];

      if (isTrainingMode) {
        // Solo training: Player only on track
        const playerRider = homeTeam.riders[0];
        sceneManagerRef.current.setupHeat(heatNum, homeTeam.id, awayTeam.id, [
          {
            id: 'player_solo',
            name: `${playerRider.name} (TY)`,
            number: playerRider.number,
            helmet: 'red',
            gate: 'A',
            isPlayer: true,
            teamId: homeTeam.id,
            skill: { reaction: 0.9, aggression: 0.85, technique: 0.9, speed: 0.9 },
            preferredLine: playerRider.style,
          },
        ]);
        return;
      }

      // League Match: 4 riders according to official heat draw
      const homeR1 = homeTeam.riders[heatDef.homeRiders[0]] || homeTeam.riders[0];
      const homeR2 = homeTeam.riders[heatDef.homeRiders[1]] || homeTeam.riders[1];
      const awayR1 = awayTeam.riders[heatDef.awayRiders[0]] || awayTeam.riders[0];
      const awayR2 = awayTeam.riders[heatDef.awayRiders[1]] || awayTeam.riders[1];

      // Assign helmets & gates: Gate A (red), Gate B (blue), Gate C (white), Gate D (yellow)
      const ridersConfig = [
        {
          id: `h1_${homeR1.number}`,
          name: `${homeR1.name} (TY)`,
          number: homeR1.number,
          helmet: heatDef.gateAssignment.A,
          gate: 'A' as const,
          isPlayer: true, // User rides as home team's key rider!
          teamId: homeTeam.id,
          skill: { reaction: 0.92, aggression: 0.85, technique: 0.9, speed: 0.88 },
          preferredLine: homeR1.style,
        },
        {
          id: `a1_${awayR1.number}`,
          name: awayR1.name,
          number: awayR1.number,
          helmet: heatDef.gateAssignment.B,
          gate: 'B' as const,
          isPlayer: false,
          teamId: awayTeam.id,
          skill: {
            reaction: 0.75 + (awayR1.avgPoints / 3) * 0.2,
            aggression: 0.8,
            technique: 0.85,
            speed: 0.82,
          },
          preferredLine: awayR1.style,
        },
        {
          id: `h2_${homeR2.number}`,
          name: homeR2.name,
          number: homeR2.number,
          helmet: heatDef.gateAssignment.C,
          gate: 'C' as const,
          isPlayer: false,
          teamId: homeTeam.id,
          skill: {
            reaction: 0.7 + (homeR2.avgPoints / 3) * 0.25,
            aggression: 0.75,
            technique: 0.8,
            speed: 0.8,
          },
          preferredLine: homeR2.style,
        },
        {
          id: `a2_${awayR2.number}`,
          name: awayR2.name,
          number: awayR2.number,
          helmet: heatDef.gateAssignment.D,
          gate: 'D' as const,
          isPlayer: false,
          teamId: awayTeam.id,
          skill: {
            reaction: 0.72 + (awayR2.avgPoints / 3) * 0.22,
            aggression: 0.82,
            technique: 0.82,
            speed: 0.83,
          },
          preferredLine: awayR2.style,
        },
      ];

      sceneManagerRef.current.setupHeat(heatNum, homeTeam.id, awayTeam.id, ridersConfig);
    },
    [homeTeam, awayTeam, isTrainingMode]
  );

  // Initialize Scene on Mount
  useEffect(() => {
    if (!containerRef.current) return;

    const manager = new SpeedwaySceneManager(
      containerRef.current,
      bikeSetup,
      trackCondition,
      {
        onRaceStateChange: (state, message) => {
          setRaceState(state);
          if (message) setRaceMessage(message);
        },
        onLapChange: (lap, total) => {
          setCurrentLap(lap);
        },
        onPositionsChange: (pos) => {
          setPositions(pos);
        },
        onTelemetryUpdate: (telem) => {
          setTelemetry(telem);
        },
        onHeatFinished: (result) => {
          setHeatResults((prev) => {
            const next = { ...prev, [result.heatNumber]: result };
            return next;
          });

          // Trigger victory confetti if home team wins heat!
          if (result.homeScore > result.awayScore) {
            confetti({
              particleCount: 70,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#facc15', '#0284c7', '#ffffff'],
            });
          }
        },
        onReactionTime: (timeMs, rating) => {
          setReactionInfo({ timeMs, rating });
        },
        onInvertToggle: (inv) => {
          setInvertSteering(inv);
        },
      }
    );

    sceneManagerRef.current = manager;

    // Load initial Heat 1
    loadHeatInScene(1);

    return () => {
      manager.destroy();
      sceneManagerRef.current = null;
    };
  }, []);

  // Update bike setup in 3D scene
  const handleSaveSetup = (newSetup: BikeSetup) => {
    setBikeSetup(newSetup);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.updateBikeSetup(newSetup);
    }
  };

  // Update track condition in 3D scene
  const handleUpdateCondition = (newCondition: TrackCondition) => {
    setTrackCondition(newCondition);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.updateTrackCondition(newCondition);
    }
  };

  // Switch camera
  const handleCameraChange = (mode: CameraMode) => {
    setCameraMode(mode);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraMode(mode);
    }
  };

  // Toggle audio
  const handleToggleMute = () => {
    soundEngine.init();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundEngine.setMuted(newMuted);
  };

  // Reset current heat
  const handleResetHeat = () => {
    setReactionInfo(null);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.resetHeat();
    }
  };

  // Next heat
  const handleNextHeat = () => {
    const nextHeat = Math.min(15, currentHeatIndex + 1);
    setCurrentHeatIndex(nextHeat);
    setReactionInfo(null);
    loadHeatInScene(nextHeat);
  };

  // Select heat from match program
  const handleSelectHeatToRide = (heatNum: number) => {
    setCurrentHeatIndex(heatNum);
    setReactionInfo(null);
    loadHeatInScene(heatNum);
  };

  // Simulate a heat
  const handleSimulateHeat = (heatNum: number) => {
    const heatDef = OFFICIAL_EKSTRALIGA_HEATS[heatNum - 1];
    if (!heatDef) return;

    // Realistic Ekstraliga heat score probabilities (3-3, 4-2, 5-1, 2-4, 1-5)
    const outcomes = [
      { h: 3, a: 3 },
      { h: 4, a: 2 },
      { h: 5, a: 1 },
      { h: 2, a: 4 },
      { h: 1, a: 5 },
    ];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    const simResult: HeatResult = {
      heatNumber: heatNum,
      homeScore: outcome.h,
      awayScore: outcome.a,
      homeCumulative: homeTotalScore + outcome.h,
      awayCumulative: awayTotalScore + outcome.a,
      finishOrder: [],
    };

    setHeatResults((prev) => ({
      ...prev,
      [heatNum]: simResult,
    }));
  };

  const handleResetMatch = () => {
    setHeatResults({});
    setCurrentHeatIndex(1);
    handleResetHeat();
  };

  // Change teams
  const handleChangeTeams = (home: string, away: string) => {
    setHomeTeamId(home);
    setAwayTeamId(away);
    setHeatResults({});
    setCurrentHeatIndex(1);
    setTimeout(() => {
      loadHeatInScene(1);
    }, 50);
  };

  // Toggle training mode
  const handleToggleTrainingMode = (training: boolean) => {
    setIsTrainingMode(training);
    setTimeout(() => {
      loadHeatInScene(currentHeatIndex);
    }, 50);
  };

  const handleStartGame = () => {
    soundEngine.init();
    setIsInMainMenu(false);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setMenuMode(false);
      sceneManagerRef.current.resetHeat();
    }
  };

  const handleOpenMenu = () => {
    setIsInMainMenu(true);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setMenuMode(true);
    }
  };

  const handleToggleInvertSteering = () => {
    const next = !invertSteering;
    setInvertSteering(next);
    sceneManagerRef.current?.setInvertSteering(next);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950 font-sans">
      {/* 3D Scene Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Main Menu Screen */}
      {isInMainMenu ? (
        <MainMenu
          homeTeamId={homeTeamId}
          awayTeamId={awayTeamId}
          onSelectTeams={handleChangeTeams}
          isTrainingMode={isTrainingMode}
          onToggleTrainingMode={handleToggleTrainingMode}
          onStartGame={handleStartGame}
          onOpenGarage={() => setIsGarageOpen(true)}
          onOpenWeather={() => setIsWeatherOpen(true)}
          onOpenHelp={() => setShowHelpModal(true)}
          trackCondition={trackCondition}
          bikeSetup={bikeSetup}
        />
      ) : (
        <>
          {/* Top HUD with Telemetry, Scoreboard, and Lap Counter */}
          <HUD
            heatNumber={currentHeatIndex}
            homeTeamName={homeTeam.name}
            awayTeamName={awayTeam.name}
            homeScore={homeTotalScore}
            awayScore={awayTotalScore}
            currentLap={currentLap}
            totalLaps={4}
            raceState={raceState}
            raceMessage={raceMessage}
            reactionInfo={reactionInfo}
            telemetry={telemetry}
            positions={positions}
            invertSteering={invertSteering}
            onToggleInvertSteering={handleToggleInvertSteering}
            onTearOff={() => sceneManagerRef.current?.pullTearOff()}
            isTrainingMode={isTrainingMode}
          />

          {/* Touch Controls (for mobile/tablet) */}
          <TouchControls
            visible={touchControlsActive}
            onSteer={(val) => sceneManagerRef.current?.setSteerInput(val)}
            onThrottle={(val) => sceneManagerRef.current?.setThrottleInput(val)}
            onClutch={(held) => sceneManagerRef.current?.setClutchInput(held)}
            onBodyTuck={(tuck) => sceneManagerRef.current?.setBodyTuckInput(tuck)}
            onTearOff={() => sceneManagerRef.current?.pullTearOff()}
            tearOffsRemaining={telemetry.tearOffsRemaining ?? 5}
          />

          {/* Ergonomic Collapsible Bottom Dock */}
          <BottomDock
            cameraMode={cameraMode}
            onCameraChange={handleCameraChange}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onOpenGarage={() => setIsGarageOpen(true)}
            onOpenProgram={() => setIsProgramOpen(true)}
            onOpenWeather={() => setIsWeatherOpen(true)}
            onOpenMenu={handleOpenMenu}
            onResetHeat={handleResetHeat}
            onNextHeat={handleNextHeat}
            isHeatFinished={raceState === 'finished'}
            touchControlsActive={touchControlsActive}
            onToggleTouchControls={() => setTouchControlsActive(!touchControlsActive)}
            invertSteering={invertSteering}
            onToggleInvertSteering={handleToggleInvertSteering}
          />

          {/* Help / Speedway Rules Quick Button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="fixed top-16 right-4 z-20 p-2 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-amber-400 transition-colors shadow-lg cursor-pointer"
            title="Jak grać i sterować w żużlu"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Garage / Bike Tuning Modal */}
      <GarageModal
        isOpen={isGarageOpen}
        onClose={() => setIsGarageOpen(false)}
        bikeSetup={bikeSetup}
        onSaveSetup={handleSaveSetup}
        trackCondition={trackCondition}
      />

      {/* Official 15-Heat Match Program Modal */}
      <MatchProgramModal
        isOpen={isProgramOpen}
        onClose={() => setIsProgramOpen(false)}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        heats={OFFICIAL_EKSTRALIGA_HEATS}
        heatResults={heatResults}
        currentHeatIndex={currentHeatIndex}
        onSelectHeatToRide={handleSelectHeatToRide}
        onSimulateHeat={handleSimulateHeat}
        onResetMatch={handleResetMatch}
        homeTotalScore={homeTotalScore}
        awayTotalScore={awayTotalScore}
      />

      {/* Weather, Track & Day/Night Settings Modal */}
      <WeatherSettingsModal
        isOpen={isWeatherOpen}
        onClose={() => setIsWeatherOpen(false)}
        condition={trackCondition}
        onUpdateCondition={handleUpdateCondition}
        isTrainingMode={isTrainingMode}
        onToggleTrainingMode={handleToggleTrainingMode}
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
        onChangeTeams={handleChangeTeams}
      />

      {/* Quick Start / Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-sans">
                  Zasady Gry & Sterowanie w Żużlu
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 font-mono leading-relaxed">
              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <div className="font-bold text-amber-400 mb-1 font-sans text-sm">
                  1. PROCEDURA STARTOWA NA SPRZĘGŁO:
                </div>
                Gdy zapali się <span className="text-emerald-400 font-bold">ZIELONE ŚWIATŁO</span>,
                WCIŚNIJ I TRZYMAJ <span className="text-white font-bold bg-zinc-800 px-1 py-0.5 rounded">SPACJĘ</span> (lub przycisk Sprzęgło).
                Silnik wejdzie na wysokie obroty. W momencie gdy taśma wystrzeli w górę,
                <span className="text-amber-400 font-bold"> NATYCHMIAST PUŚĆ SPRZĘGŁO</span>! Zbyt wczesne puszczenie to falstart!
              </div>

              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <div className="font-bold text-amber-400 mb-1 font-sans text-sm">
                  2. PROWADZENIE, POŚLIZG I PRACA CIAŁEM:
                </div>
                <div className="space-y-1">
                  <div>• <span className="text-white font-bold bg-zinc-800 px-1 py-0.5 rounded">A / ◄</span> – Skręt w lewo (w wiraż, złożenie motocykla i lewa noga na tor)</div>
                  <div>• <span className="text-white font-bold bg-zinc-800 px-1 py-0.5 rounded">D / ►</span> – Skręt w prawo (kontra kierownicą, prostowanie)</div>
                  <div>• <span className="text-white font-bold bg-zinc-800 px-1 py-0.5 rounded">W / ▲</span> – Gaz na pełny uślizg tylnego koła</div>
                  <div>• <span className="text-white font-bold bg-zinc-800 px-1 py-0.5 rounded">SHIFT</span> – Złożenie aerodynamiczne (dociążenie przodu, mniejszy opór powietrza)</div>
                  <div>• <span className="text-white font-bold bg-zinc-800 px-1 py-0.5 rounded">T</span> – Zrywka z gogli (oczyszczenie szybki z szprycy żużlowej)</div>
                  <div>• <span className="text-white font-bold bg-zinc-800 px-1 py-0.5 rounded">I</span> – Przełącznik odwracania kierunku skrętu</div>
                  <div>• <span className="text-white font-bold bg-zinc-800 px-1 py-0.5 rounded">C</span> – Zmiana kamery (Zza pleców, Kask FPV, Trybuna TV, Taktyczna)</div>
                </div>
              </div>

              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <div className="font-bold text-amber-400 mb-1 font-sans text-sm">
                  3. TUNING I POGODA (GARAŻ):
                </div>
                Dopasowuj dysze gaźnika, zapłon, zębatki (np. 13/58) i opony w menu Garażu w zależności
                od tego, czy tor jest twardy, mokry po deszczu czy przyczepny w nocy.
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer font-mono"
            >
              Rozumiem, ruszajmy do walki!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
