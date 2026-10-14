export type HelmetColor = 'red' | 'blue' | 'white' | 'yellow';

export interface Rider {
  id: string;
  name: string;
  number: number;
  helmetColor: HelmetColor;
  isPlayer: boolean;
  teamId: string;
  skill: {
    reaction: number; // 0-1, start reaction speed
    aggression: number; // 0-1, bravery on outer cushion
    technique: number; // 0-1, curb precision and slide control
    speed: number; // 0-1, raw speed execution
  };
  preferredLine: 'curb' | 'cushion' | 'adaptive';
  currentPoints: number;
  totalPoints: number;
  bonusPoints: number;
}

export interface Team {
  id: string;
  name: string;
  city: string;
  shortName: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
  };
  riders: {
    number: number;
    name: string;
    avgPoints: number;
    isJunior?: boolean;
    style: 'curb' | 'cushion' | 'adaptive';
  }[];
}

export interface BikeSetup {
  carburetorJet: number; // 175 - 195 (main jet size)
  ignitionTiming: number; // 28 - 34 degrees BTDC
  rearSprocket: number; // 54 - 60 teeth (front is fixed at 13T)
  tireCompound: 'soft' | 'medium' | 'hard';
  tirePressure: number; // 0.80 - 1.20 bar
}

export type WeatherType = 'sunny' | 'overcast' | 'rainy';
export type TimeOfDay = 'day' | 'sunset' | 'night';
export type TrackGrip = 'hard' | 'medium' | 'grippy';

export interface TrackCondition {
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  trackGrip: TrackGrip;
  moisture: number; // 0 (dry/dusty) to 1 (muddy/wet)
  hardness: number; // 0 (deep loam) to 1 (slick hardpack)
  temperature: number; // °C, affects carburetion
}

export type RaceState = 
  | 'standby' // Bikes at pits / lining up
  | 'two_minutes' // 2 minute bell, riders approaching gates
  | 'ready' // At tapes, holding clutch, green light on
  | 'racing' // Tapes up, full gas, 4 laps
  | 'finished' // Checkered flag, heat complete
  | 'false_start'; // Rider jumped tape

export interface HeatResult {
  heatNumber: number;
  homeScore: number;
  awayScore: number;
  homeCumulative: number;
  awayCumulative: number;
  finishOrder: {
    riderId: string;
    riderName: string;
    helmet: HelmetColor;
    teamId: string;
    position: number;
    points: number;
    timeSeconds: number;
    disqualified?: boolean;
  }[];
}

export interface HeatDefinition {
  number: number;
  homeRiders: [number, number]; // rider index or numbers
  awayRiders: [number, number];
  gateAssignment: {
    A: HelmetColor; // Gate 1 (inside)
    B: HelmetColor; // Gate 2
    C: HelmetColor; // Gate 3
    D: HelmetColor; // Gate 4 (outside)
  };
  isJuniorHeat?: boolean;
  isNominatedHeat?: boolean; // Heats 14 & 15
}

export interface RaceTelemetry {
  speedKmh: number;
  engineRpm: number;
  gearRatio: string;
  driftAngleDeg: number;
  driftQuality: 'sweet' | 'shallow' | 'oversteer' | 'straight';
  driftSweetSpot: boolean;
  slipRatio: number;
  bodyTuck: number; // 0 (upright) to 1 (full tuck / weight footrest)
  clutchPercentage: number;
  isGrindingShoe: boolean;
  dirtOnVisor: number; // 0 to 1
  tearOffsRemaining: number;
  gForceLat: number;
  gForceLong: number;
}
