import { Team, HeatDefinition, BikeSetup, TrackCondition } from '../types/speedway';

export const EKSTRALIGA_TEAMS: Team[] = [
  {
    id: 'gorzow',
    name: 'ebut.pl Stal Gorzów',
    city: 'Gorzów Wielkopolski',
    shortName: 'GOR',
    colors: {
      primary: '#0284c7', // Sky blue
      secondary: '#facc15', // Yellow
      text: '#ffffff',
    },
    riders: [
      { number: 9, name: 'Martin Vaculik', avgPoints: 2.35, style: 'curb' },
      { number: 10, name: 'Szymon Woźniak', avgPoints: 1.85, style: 'adaptive' },
      { number: 11, name: 'Oskar Fajfer', avgPoints: 1.70, style: 'curb' },
      { number: 12, name: 'Jakub Miśkowiak', avgPoints: 1.55, style: 'cushion' },
      { number: 13, name: 'Anders Thomsen', avgPoints: 2.15, style: 'cushion' },
      { number: 14, name: 'Oskar Paluch', avgPoints: 1.60, isJunior: true, style: 'cushion' },
      { number: 15, name: 'Jakub Stojanowski', avgPoints: 1.30, isJunior: true, style: 'adaptive' },
    ],
  },
  {
    id: 'zielona_gora',
    name: 'NovyHotel Falubaz Zielona Góra',
    city: 'Zielona Góra',
    shortName: 'ZIE',
    colors: {
      primary: '#15803d', // Green
      secondary: '#facc15', // Yellow
      text: '#ffffff',
    },
    riders: [
      { number: 1, name: 'Jarosław Hampel', avgPoints: 2.10, style: 'curb' },
      { number: 2, name: 'Jan Kvech', avgPoints: 1.45, style: 'adaptive' },
      { number: 3, name: 'Rasmus Jensen', avgPoints: 1.85, style: 'cushion' },
      { number: 4, name: 'Przemysław Pawlicki', avgPoints: 1.95, style: 'cushion' },
      { number: 5, name: 'Piotr Pawlicki', avgPoints: 2.05, style: 'cushion' },
      { number: 6, name: 'Krzysztof Sadurski', avgPoints: 1.25, isJunior: true, style: 'adaptive' },
      { number: 7, name: 'Oskar Hurysz', avgPoints: 1.35, isJunior: true, style: 'cushion' },
    ],
  },
  {
    id: 'lublin',
    name: 'Orlen Oil Motor Lublin',
    city: 'Lublin',
    shortName: 'LUB',
    colors: {
      primary: '#1e3a8a', // Dark blue
      secondary: '#f59e0b', // Amber
      text: '#ffffff',
    },
    riders: [
      { number: 9, name: 'Bartosz Zmarzlik', avgPoints: 2.60, style: 'cushion' },
      { number: 10, name: 'Mateusz Cierniak', avgPoints: 1.70, style: 'adaptive' },
      { number: 11, name: 'Jack Holder', avgPoints: 2.15, style: 'curb' },
      { number: 12, name: 'Fredrik Lindgren', avgPoints: 2.05, style: 'cushion' },
      { number: 13, name: 'Dominik Kubera', avgPoints: 2.20, style: 'cushion' },
      { number: 14, name: 'Wiktor Przyjemski', avgPoints: 1.90, isJunior: true, style: 'curb' },
      { number: 15, name: 'Bartosz Bańbor', avgPoints: 1.40, isJunior: true, style: 'adaptive' },
    ],
  },
  {
    id: 'wroclaw',
    name: 'Betard Sparta Wrocław',
    city: 'Wrocław',
    shortName: 'WRO',
    colors: {
      primary: '#b91c1c', // Crimson Red
      secondary: '#fbbf24', // Yellow
      text: '#ffffff',
    },
    riders: [
      { number: 1, name: 'Artem Łaguta', avgPoints: 2.45, style: 'cushion' },
      { number: 2, name: 'Daniel Bewley', avgPoints: 2.10, style: 'cushion' },
      { number: 3, name: 'Bartłomiej Kowalski', avgPoints: 1.80, style: 'curb' },
      { number: 4, name: 'Francis Gusts', avgPoints: 1.35, style: 'adaptive' },
      { number: 5, name: 'Maciej Janowski', avgPoints: 2.05, style: 'adaptive' },
      { number: 6, name: 'Marcel Kowolik', avgPoints: 1.25, isJunior: true, style: 'curb' },
      { number: 7, name: 'Nikodem Mikołajczyk', avgPoints: 1.15, isJunior: true, style: 'cushion' },
    ],
  },
  {
    id: 'torun',
    name: 'KS Apator Toruń',
    city: 'Toruń',
    shortName: 'TOR',
    colors: {
      primary: '#2563eb', // Blue
      secondary: '#ffffff', // White
      text: '#ffffff',
    },
    riders: [
      { number: 9, name: 'Patryk Dudek', avgPoints: 2.15, style: 'adaptive' },
      { number: 10, name: 'Robert Lambert', avgPoints: 2.30, style: 'cushion' },
      { number: 11, name: 'Wiktor Lampart', avgPoints: 1.40, style: 'curb' },
      { number: 12, name: 'Paweł Przedpełski', avgPoints: 1.65, style: 'cushion' },
      { number: 13, name: 'Emil Sajfutdinow', avgPoints: 2.40, style: 'cushion' },
      { number: 14, name: 'Krzysztof Lewandowski', avgPoints: 1.30, isJunior: true, style: 'curb' },
      { number: 15, name: 'Mateusz Affelt', avgPoints: 1.10, isJunior: true, style: 'adaptive' },
    ],
  },
];

// Official 15-heat race chart for Polish Speedway Ekstraliga
// Gate A (inner), B (inner-mid), C (outer-mid), D (outside cushion)
export const OFFICIAL_EKSTRALIGA_HEATS: HeatDefinition[] = [
  // Seria 1
  {
    number: 1,
    homeRiders: [0, 2], // 9, 11
    awayRiders: [0, 2], // 1, 3
    gateAssignment: { A: 'red', B: 'blue', C: 'white', D: 'yellow' },
  },
  {
    number: 2, // Bieg młodzieżowy (Junior heat)
    homeRiders: [5, 6], // 14, 15
    awayRiders: [5, 6], // 6, 7
    gateAssignment: { A: 'blue', B: 'white', C: 'yellow', D: 'red' },
    isJuniorHeat: true,
  },
  {
    number: 3,
    homeRiders: [1, 4], // 10, 13
    awayRiders: [1, 4], // 2, 5
    gateAssignment: { A: 'white', B: 'yellow', C: 'red', D: 'blue' },
  },
  {
    number: 4,
    homeRiders: [3, 5], // 12, 14
    awayRiders: [2, 5], // 3, 6
    gateAssignment: { A: 'yellow', B: 'red', C: 'blue', D: 'white' },
  },
  // Seria 2
  {
    number: 5,
    homeRiders: [2, 3], // 11, 12
    awayRiders: [0, 1], // 1, 2
    gateAssignment: { A: 'blue', B: 'white', C: 'yellow', D: 'red' },
  },
  {
    number: 6,
    homeRiders: [0, 6], // 9, 15
    awayRiders: [3, 4], // 4, 5
    gateAssignment: { A: 'white', B: 'yellow', C: 'red', D: 'blue' },
  },
  {
    number: 7,
    homeRiders: [1, 4], // 10, 13
    awayRiders: [2, 6], // 3, 7
    gateAssignment: { A: 'yellow', B: 'red', C: 'blue', D: 'white' },
  },
  // Seria 3
  {
    number: 8,
    homeRiders: [0, 1], // 9, 10
    awayRiders: [1, 4], // 2, 5
    gateAssignment: { A: 'red', B: 'blue', C: 'white', D: 'yellow' },
  },
  {
    number: 9,
    homeRiders: [2, 4], // 11, 13
    awayRiders: [0, 3], // 1, 4
    gateAssignment: { A: 'blue', B: 'white', C: 'yellow', D: 'red' },
  },
  {
    number: 10,
    homeRiders: [3, 5], // 12, 14
    awayRiders: [2, 5], // 3, 6
    gateAssignment: { A: 'white', B: 'yellow', C: 'red', D: 'blue' },
  },
  // Seria 4
  {
    number: 11,
    homeRiders: [0, 3], // 9, 12
    awayRiders: [0, 4], // 1, 5
    gateAssignment: { A: 'yellow', B: 'red', C: 'blue', D: 'white' },
  },
  {
    number: 12,
    homeRiders: [1, 6], // 10, 15
    awayRiders: [1, 6], // 2, 7
    gateAssignment: { A: 'red', B: 'blue', C: 'white', D: 'yellow' },
  },
  {
    number: 13,
    homeRiders: [2, 4], // 11, 13
    awayRiders: [2, 3], // 3, 4
    gateAssignment: { A: 'blue', B: 'white', C: 'yellow', D: 'red' },
  },
  // Seria 5 (Biegi nominowane / Nominated heats)
  {
    number: 14,
    homeRiders: [1, 2],
    awayRiders: [1, 2],
    gateAssignment: { A: 'white', B: 'yellow', C: 'red', D: 'blue' },
    isNominatedHeat: true,
  },
  {
    number: 15,
    homeRiders: [0, 4], // Najlepsi zawodnicy
    awayRiders: [0, 4],
    gateAssignment: { A: 'yellow', B: 'red', C: 'blue', D: 'white' },
    isNominatedHeat: true,
  },
];

export const DEFAULT_BIKE_SETUP: BikeSetup = {
  carburetorJet: 185, // Standard jet (175 lean - 195 rich)
  ignitionTiming: 31, // Standard advance (28° smooth - 34° punchy)
  rearSprocket: 57, // 13/57 balanced ratio
  tireCompound: 'medium',
  tirePressure: 0.95, // 0.95 bar standard
};

export const DEFAULT_TRACK_CONDITION: TrackCondition = {
  weather: 'sunny',
  timeOfDay: 'sunset', // Golden hour speedway atmosphere
  trackGrip: 'medium',
  moisture: 0.35,
  hardness: 0.50,
  temperature: 21,
};
