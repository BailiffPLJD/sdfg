import { BikeSetup, TrackCondition, HelmetColor } from '../types/speedway';

export interface BikeState {
  id: string;
  name: string;
  number: number;
  helmetColor: HelmetColor;
  isPlayer: boolean;
  teamId: string;
  preferredLine: 'curb' | 'cushion' | 'adaptive';

  // World coordinates (metres)
  x: number;
  z: number;
  rotation: number; // yaw angle in radians (faces movement tangent)
  speed: number; // m/s
  steerAngle: number; // front wheel turn angle (-1 to +1)
  slideAngle: number; // drift angle (radians)
  leanAngle: number; // roll angle (banking left into corner)
  pitchAngle: number; // pitch (wheelie on acceleration)

  // Track progress
  lapProgress: number; // 0 to 1 along track perimeter
  totalDistance: number;
  currentLap: number;
  lapTimes: number[];
  currentLapStartTime: number;
  finished: boolean;
  finishTime: number;

  // Controls
  throttle: number; // 0 to 1
  steerInput: number; // -1 to +1
  clutchHeld: boolean; // true during start procedure
  engineRpm: number;
  wheelSpin: number; // 0 to 1

  // Advanced dynamics
  isGrindingShoe: boolean; // true when left foot steel shoe scrapes track
  driftEfficiency: number; // 0 to 1 (1.0 = optimal power slide sweet spot)
  bodyTuck: number; // 0 (upright) to 1 (full tuck forward on handlebars)
  slipRatio: number; // 0 to 1+
  gForceLat: number; // lateral Gs
  gForceLong: number; // longitudinal Gs
  exhaustHeat: number; // 0 to 1 (glows red hot under high throttle)
  dirtOnVisor: number; // 0 to 1 (roost accumulation on helmet visor)
  tearOffs: number; // number of tear-offs remaining (e.g. 5)

  // AI properties
  targetLineOffset: number; // -1 (curb) to +1 (fence)
  aiAggression: number;
  aiReaction: number;
  aiTechnique: number;
}

// Track dimensions (Standard Polish Ekstraliga: ~375m oval)
export const TRACK_CONFIG = {
  straightLength: 85, // Length of straights (m)
  turnRadius: 34, // Radius to track centerline in corners (m)
  trackWidth: 14, // Width from inner curb to outer air fence (m)
  totalLength: 85 * 2 + 2 * Math.PI * 34, // ~383.6 meters
  turn1Center: { x: -42.5, z: 0 },
  turn2Center: { x: 42.5, z: 0 },
};

/**
 * Continuous track coordinate conversion.
 * Direction of racing: Counter-Clockwise
 * Home straight: X from +L/2 to -L/2 at Z ≈ -R. Heading = PI (facing -X).
 * Turn 1: Arc around (-L/2, 0) from Z ≈ -R to Z ≈ +R via apex at X ≈ -L/2 - R.
 * Back straight: X from -L/2 to +L/2 at Z ≈ +R. Heading = 0 (facing +X).
 * Turn 2: Arc around (+L/2, 0) from Z ≈ +R to Z ≈ -R via apex at X ≈ +L/2 + R.
 */
export function getTrackCoordinates(x: number, z: number): {
  progress: number;
  offset: number;
  isTurn: boolean;
  centerDist: number;
} {
  const { straightLength: L, turnRadius: R, trackWidth: W, turn1Center, turn2Center, totalLength } = TRACK_CONFIG;
  const halfL = L / 2;
  const halfW = W / 2;

  let progressDist = 0;
  let offset = 0;
  let isTurn = false;
  let centerDist = 0;

  if (x >= -halfL && x <= halfL && z < 0) {
    // 1. Home Straight (traveling in -X direction)
    const distOnStraight = halfL - x;
    progressDist = distOnStraight;
    offset = (-R - z) / halfW;
    centerDist = Math.abs(z - (-R));
    isTurn = false;
  } else if (x < -halfL) {
    // 2. Turn 1 (Western bend)
    isTurn = true;
    const dx = x - turn1Center.x;
    const dz = z;
    const r = Math.hypot(dx, dz);
    offset = (r - R) / halfW;
    centerDist = Math.abs(r - R);

    const alpha = Math.atan2(dz, -dx); // -PI/2 at entrance, 0 at apex, +PI/2 at exit
    const turnDist = (alpha + Math.PI / 2) * R;
    progressDist = L + Math.max(0, Math.min(Math.PI * R, turnDist));
  } else if (x >= -halfL && x <= halfL && z >= 0) {
    // 3. Back Straight (traveling in +X direction)
    const distOnStraight = x + halfL;
    progressDist = L + Math.PI * R + distOnStraight;
    offset = (z - R) / halfW;
    centerDist = Math.abs(z - R);
    isTurn = false;
  } else {
    // 4. Turn 2 (Eastern bend)
    isTurn = true;
    const dx = x - turn2Center.x;
    const dz = z;
    const r = Math.hypot(dx, dz);
    offset = (r - R) / halfW;
    centerDist = Math.abs(r - R);

    const beta = Math.atan2(-dz, dx);
    const turnDist = (beta + Math.PI / 2) * R;
    progressDist = L * 2 + Math.PI * R + Math.max(0, Math.min(Math.PI * R, turnDist));
  }

  const progress = ((progressDist % totalLength) + totalLength) % totalLength / totalLength;
  return { progress, offset, isTurn, centerDist };
}

/**
 * Get ideal position and heading at given progress (0 to 1) and offset (-1 to 1)
 */
export function getIdealTrackPoint(progress: number, offset: number = 0): { x: number; z: number; heading: number } {
  const { straightLength: L, turnRadius: R, trackWidth: W, turn1Center, turn2Center, totalLength } = TRACK_CONFIG;
  const halfL = L / 2;
  const halfW = W / 2;
  const clampedOffset = Math.max(-0.95, Math.min(0.95, offset));
  const rEff = R + clampedOffset * halfW;

  const dist = ((progress % 1) + 1) % 1 * totalLength;
  const t1Entrance = L;
  const t1Exit = L + Math.PI * R;
  const t2Entrance = L * 2 + Math.PI * R;

  if (dist < t1Entrance) {
    // 1. Home straight (traveling -X)
    const frac = dist / L;
    return {
      x: halfL - frac * L,
      z: -rEff,
      heading: Math.PI,
    };
  } else if (dist < t1Exit) {
    // 2. Turn 1
    const turnDist = dist - t1Entrance;
    const alpha = -Math.PI / 2 + (turnDist / (Math.PI * R)) * Math.PI;
    return {
      x: turn1Center.x - rEff * Math.cos(alpha),
      z: rEff * Math.sin(alpha),
      heading: Math.PI / 2 - alpha,
    };
  } else if (dist < t2Entrance) {
    // 3. Back straight (traveling +X)
    const straightDist = dist - t1Exit;
    const frac = straightDist / L;
    return {
      x: -halfL + frac * L,
      z: rEff,
      heading: 0,
    };
  } else {
    // 4. Turn 2
    const turnDist = dist - t2Entrance;
    const beta = -Math.PI / 2 + (turnDist / (Math.PI * R)) * Math.PI;
    return {
      x: turn2Center.x + rEff * Math.cos(beta),
      z: -rEff * Math.sin(beta),
      heading: -Math.PI / 2 - beta,
    };
  }
}

/**
 * Calculate bike performance multiplier from bike setup & track condition
 */
export function evaluateBikeSetup(setup: BikeSetup, track: TrackCondition): {
  topSpeedMult: number;
  accelMult: number;
  gripMult: number;
  slideStability: number;
  tunerFeedback: string;
} {
  const optimalJet = Math.round(185 - (track.temperature - 20) * 0.35 + track.moisture * 5);
  const jetDiff = Math.abs(setup.carburetorJet - optimalJet);
  const jetEfficiency = Math.max(0.75, 1 - jetDiff * 0.025);

  const optimalIgnition = track.trackGrip === 'grippy' ? 33 : track.trackGrip === 'hard' ? 29 : 31;
  const ignitionDiff = Math.abs(setup.ignitionTiming - optimalIgnition);
  const ignitionEfficiency = Math.max(0.8, 1 - ignitionDiff * 0.035);

  const idealSprocket = track.trackGrip === 'grippy' ? 59 : track.trackGrip === 'hard' ? 56 : 57;
  const sprocketDiff = setup.rearSprocket - idealSprocket;
  const accelFromGearing = 1.0 + sprocketDiff * 0.03;
  const topSpeedFromGearing = 1.0 - sprocketDiff * 0.025;

  let compoundGrip = 1.0;
  if (track.trackGrip === 'hard') {
    compoundGrip = setup.tireCompound === 'soft' ? 1.15 : setup.tireCompound === 'medium' ? 1.0 : 0.88;
  } else if (track.trackGrip === 'grippy') {
    compoundGrip = setup.tireCompound === 'hard' ? 1.12 : setup.tireCompound === 'medium' ? 1.05 : 0.92;
  }

  const idealPressure = track.trackGrip === 'grippy' ? 0.88 : track.trackGrip === 'hard' ? 1.1 : 0.96;
  const pressureDiff = Math.abs(setup.tirePressure - idealPressure);
  const pressureEfficiency = Math.max(0.85, 1 - pressureDiff * 0.4);

  const totalGrip = compoundGrip * pressureEfficiency;
  const totalAccel = jetEfficiency * ignitionEfficiency * accelFromGearing;
  const totalTopSpeed = jetEfficiency * topSpeedFromGearing;

  let tunerFeedback = "Ustawienia motocykla optymalne. Silnik dobrze reaguje na otwarcie gazu.";
  if (jetDiff > 5) {
    tunerFeedback = setup.carburetorJet > optimalJet
      ? "Za duża dysza! Silnik może zalewać na wilgotnym powietrzu."
      : "Za uboga mieszanka! Silnikowi brakuje mocy w szczycie.";
  } else if (Math.abs(ignitionDiff) > 2) {
    tunerFeedback = setup.ignitionTiming > optimalIgnition
      ? "Za wczesny zapłon – tylne koło za mocno buksuje na twardym torze."
      : "Za późny zapłon – motocykl ospale wyjeżdża z łuków.";
  } else if (Math.abs(sprocketDiff) >= 2) {
    tunerFeedback = sprocketDiff > 0
      ? "Krótkie przełożenie: świetne wyjście z wirażu, ale brakuje prędkości na prostej."
      : "Długie przełożenie: wysoka prędkość na końcu prostej, trudniejsze rozpędzanie.";
  }

  return {
    topSpeedMult: Math.max(0.8, Math.min(1.2, totalTopSpeed)),
    accelMult: Math.max(0.75, Math.min(1.25, totalAccel)),
    gripMult: Math.max(0.75, Math.min(1.25, totalGrip)),
    slideStability: Math.max(0.8, 1 - Math.abs(setup.tirePressure - 0.95) * 0.3),
    tunerFeedback,
  };
}

/**
 * Advanced Speedway Physics Engine:
 * - Real throttle-steer power sliding
 * - Natural counter-steering stability
 * - Steel shoe road grinding & spark contact detection
 * - Inverted/intuitive steering feel (Left = inside, Right = counter/outside)
 */
export function updateBikePhysics(
  bike: BikeState,
  delta: number,
  setup: BikeSetup,
  track: TrackCondition,
  isRacingActive: boolean
) {
  if (bike.finished) {
    bike.throttle = 0;
    bike.speed = Math.max(0, bike.speed - 14 * delta);
    bike.leanAngle *= 0.9;
    bike.slideAngle *= 0.85;
    bike.isGrindingShoe = false;
    return;
  }

  const { isTurn, offset, progress } = getTrackCoordinates(bike.x, bike.z);
  const tuning = evaluateBikeSetup(setup, track);

  let surfaceFriction = 0.88;
  if (track.trackGrip === 'hard') {
    surfaceFriction = 0.72;
  } else if (track.trackGrip === 'grippy') {
    surfaceFriction = 1.08;
  }

  // Cushion vs Curb line dynamics
  if (offset > 0.35 && offset < 1.0) {
    surfaceFriction *= 1.15; // Drive cushion bonus near outer air fence
  } else if (offset < -0.55) {
    surfaceFriction *= 0.90; // Slick inside curb
  }

  surfaceFriction *= 1.0 - track.moisture * 0.22;
  const effectiveGrip = surfaceFriction * tuning.gripMult;

  // Start Gate Handling
  if (!isRacingActive) {
    if (bike.clutchHeld) {
      bike.engineRpm = Math.min(10800, bike.engineRpm + 14500 * delta * bike.throttle);
    } else {
      bike.engineRpm = Math.max(3500, bike.engineRpm - 8000 * delta);
    }
    bike.speed = 0;
    bike.isGrindingShoe = false;
    return;
  }

  // 1. Throttle & Top Speed
  const maxStraightSpeed = 33.0 * tuning.topSpeedMult;
  const maxCornerSpeed = 26.5 * tuning.topSpeedMult * (offset > 0.2 ? 1.1 : 0.95);
  const targetMaxSpeed = isTurn ? maxCornerSpeed : maxStraightSpeed;

  const enginePower = 12.8 * tuning.accelMult;
  const rollingDrag = (0.30 + (1 - effectiveGrip) * 0.25) * bike.speed;
  // Aerodynamic tuck reduces drag by ~28%
  const airDragCoeff = 0.0085 * (1 - (bike.bodyTuck || 0) * 0.28);
  const airDrag = airDragCoeff * bike.speed * bike.speed;

  let accel = 0;
  if (bike.throttle > 0.05) {
    const powerDelivery = Math.max(0.18, 1 - bike.speed / targetMaxSpeed);
    accel = bike.throttle * enginePower * powerDelivery;
  }

  // Drift scrubbing resistance: high when over-rotated
  const driftDegCheck = Math.abs(bike.slideAngle) * (180 / Math.PI);
  const scrubMult = driftDegCheck > 48 ? 0.65 : 0.28;
  const driftScrub = Math.abs(bike.slideAngle) * (bike.speed * scrubMult);
  const totalDecel = rollingDrag + airDrag + driftScrub;
  bike.speed = Math.max(0, bike.speed + (accel - totalDecel) * delta);

  // 2. Advanced Speedway Steering & Slide Mechanics
  // Responsiveness: rapid handlebar response
  bike.steerAngle += (bike.steerInput - bike.steerAngle) * Math.min(1, 10.0 * delta);

  if (isTurn && bike.speed > 4) {
    // In corners: speedway bikes slide with power!
    const cornerYawRate = (bike.speed / TRACK_CONFIG.turnRadius) * 0.98;

    // Power-slide calculation: throttle breaks rear tire loose
    const throttleSlip = bike.throttle * 0.58;
    // Steering left into turn initiates slide flick
    const steerFlick = Math.max(0, -bike.steerAngle) * 0.46;
    // Counter-steering (steering right) catches and controls the slide
    const counterSteerTame = Math.max(0, bike.steerAngle) * 0.36;

    // Rear kicks out outward progressively and delicately with speed & throttle
    const speedFactor = Math.min(1.08, Math.max(0.45, bike.speed / 16));
    const targetSlide = Math.min(1.08, Math.max(0.20, (0.34 + throttleSlip + steerFlick - counterSteerTame) * speedFactor));
    
    // Smooth transition into slide - progressive rear breakout
    const slideRate = bike.throttle > 0.8 ? 6.5 : 4.8;
    bike.slideAngle += (targetSlide - bike.slideAngle) * Math.min(1, slideRate * delta);

    // Dynamic lean banking LEFT into the dirt (+leanAngle = lean left toward apex)
    const baseLean = (0.58 + bike.slideAngle * 0.42) * Math.min(1.15, bike.speed / 20);
    // Steering into turn deepens lean; counter-steering / right stands the bike up
    const steerLeanMod = -bike.steerAngle * 0.22;
    const targetLean = Math.max(0.12, Math.min(1.05, baseLean + steerLeanMod));
    bike.leanAngle += (targetLean - bike.leanAngle) * Math.min(1, 9.0 * delta);

    // Yaw rotation:
    // Left turn decreases rotation in counter-clockwise space!
    // Steer input: negative is steer left (increases turn rate), positive is steer right (decreases turn rate)
    const steerTurnRate = -bike.steerAngle * 1.8;
    bike.rotation -= (cornerYawRate + bike.slideAngle * 0.78 + steerTurnRate) * delta;

    // Calculate optimal drift sweet spot: 28° to 48° (0.48 to 0.84 rad)
    const driftDeg = bike.slideAngle * (180 / Math.PI);
    if (driftDeg >= 28 && driftDeg <= 48) {
      bike.driftEfficiency = 1.0;
      // Bonus acceleration out of corner when perfectly sideways in sweet spot!
      bike.speed = Math.min(targetMaxSpeed, bike.speed + 2.5 * delta);
    } else {
      bike.driftEfficiency = Math.max(0, 1 - Math.abs(driftDeg - 38) / 22);
    }

    // Steel shoe is grinding on the dirt when banked over 14 degrees to the left!
    bike.isGrindingShoe = bike.leanAngle > 0.24 && bike.speed > 6;
  } else {
    // On straights: bike rights itself rapidly
    bike.slideAngle *= Math.exp(-7.0 * delta);
    // Leaning on straights responds directly to handlebar steering (steer left -> lean left)
    const targetStraightLean = -bike.steerAngle * 0.32 * Math.min(1, bike.speed / 18);
    bike.leanAngle += (targetStraightLean - bike.leanAngle) * Math.min(1, 9.0 * delta);
    bike.driftEfficiency = 0;
    bike.isGrindingShoe = false;

    // Direct steering on straights: steer left (-steerAngle) decreases rotation (turns left)
    bike.rotation -= (-bike.steerAngle) * 2.4 * (bike.speed / 24) * delta;
  }

  // Pitch wheelie on hard acceleration (suppressed by rider body tuck!)
  const tuckSuppression = 1 - (bike.bodyTuck || 0) * 0.85;
  const targetPitch = accel > 5 && bike.speed > 4 ? Math.min(0.24, (accel / 12) * 0.22 * tuckSuppression) : 0;
  bike.pitchAngle += (targetPitch - bike.pitchAngle) * Math.min(1, 8.5 * delta);

  // Exhaust manifold heat accumulation
  bike.exhaustHeat = Math.max(0.1, Math.min(1.0, (bike.exhaustHeat || 0.1) + (bike.throttle * 1.4 - 0.45) * delta));

  // G-Force calculations
  bike.gForceLat = isTurn ? ((bike.speed * bike.speed) / TRACK_CONFIG.turnRadius) / 9.81 : (bike.steerAngle * bike.speed * 0.1);
  bike.gForceLong = (accel - totalDecel) / 9.81;

  // 3. Movement integration
  const travelAngle = bike.rotation + bike.slideAngle * 0.72;
  const vx = Math.cos(travelAngle) * bike.speed;
  const vz = Math.sin(travelAngle) * bike.speed;

  bike.x += vx * delta;
  bike.z += vz * delta;

  // 4. Strict Track Boundary Protection
  const updatedCoord = getTrackCoordinates(bike.x, bike.z);

  // Outer Safety Air Fence (offset > 0.98)
  if (updatedCoord.offset > 0.98) {
    bike.speed *= 0.88;
    const safeInside = getIdealTrackPoint(updatedCoord.progress, 0.92);
    bike.x = safeInside.x;
    bike.z = safeInside.z;
    bike.rotation = safeInside.heading;
    bike.slideAngle *= 0.5;
  } else if (updatedCoord.offset < -0.98) {
    // Inner Curb (offset < -0.98)
    bike.speed *= 0.82;
    const safeOutside = getIdealTrackPoint(updatedCoord.progress, -0.88);
    bike.x = safeOutside.x;
    bike.z = safeOutside.z;
    bike.rotation = safeOutside.heading;
  }

  // 5. Lap Counting
  const prevProgress = bike.lapProgress;
  bike.lapProgress = updatedCoord.progress;
  bike.totalDistance += bike.speed * delta;

  if (prevProgress > 0.85 && updatedCoord.progress < 0.15 && bike.speed > 5) {
    const lapTime = (performance.now() - bike.currentLapStartTime) / 1000;
    if (bike.currentLap > 0) {
      bike.lapTimes.push(lapTime);
    }
    bike.currentLapStartTime = performance.now();
    bike.currentLap += 1;

    if (bike.currentLap > 4) {
      bike.finished = true;
      bike.finishTime = performance.now();
    }
  }

  const idealRpm = 3500 + (bike.speed / maxStraightSpeed) * 6500;
  bike.wheelSpin = Math.min(1, Math.max(0, accel / 10 + bike.slideAngle * 0.55));
  bike.engineRpm = idealRpm + bike.wheelSpin * 1600;
  bike.slipRatio = Math.min(1.8, bike.wheelSpin * 0.8 + Math.abs(bike.slideAngle) * 0.65);
}

/**
 * AI Rider Driver Logic
 */
export function updateRiderAI(
  aiBike: BikeState,
  delta: number,
  allBikes: BikeState[],
  track: TrackCondition
) {
  if (aiBike.finished) return;

  const { progress, offset, isTurn } = getTrackCoordinates(aiBike.x, aiBike.z);

  let targetOffset = 0;
  if (aiBike.preferredLine === 'curb') {
    targetOffset = isTurn ? -0.7 : -0.55;
  } else if (aiBike.preferredLine === 'cushion') {
    targetOffset = isTurn ? 0.72 : 0.45;
  } else {
    targetOffset = isTurn ? (progress > 0.2 && progress < 0.35 ? 0.65 : -0.45) : 0.0;
  }

  for (const other of allBikes) {
    if (other.id === aiBike.id) continue;
    const dist = Math.hypot(other.x - aiBike.x, other.z - aiBike.z);
    if (dist < 4.2 && other.speed <= aiBike.speed) {
      if (other.z > aiBike.z) {
        targetOffset -= 0.3;
      } else {
        targetOffset += 0.3;
      }
    }
  }

  targetOffset = Math.max(-0.85, Math.min(0.85, targetOffset));

  const lookAheadFrac = isTurn ? 0.04 : 0.055;
  const targetPoint = getIdealTrackPoint(progress + lookAheadFrac, targetOffset);

  const dx = targetPoint.x - aiBike.x;
  const dz = targetPoint.z - aiBike.z;
  const desiredHeading = Math.atan2(dz, dx);

  let angleDiff = desiredHeading - aiBike.rotation;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  // In our inverted/refined steering: steerInput > 0 turns left (decreases rotation)
  // If angleDiff < 0, desired is to the left, so steerInput should be positive!
  aiBike.steerInput = Math.max(-1, Math.min(1, -angleDiff * 3.2));

  if (!isTurn) {
    aiBike.throttle = 1.0;
  } else {
    if (offset > 0.8) {
      aiBike.throttle = 0.75;
      aiBike.steerInput = Math.max(aiBike.steerInput, 0.3); // steer left (inward)
    } else {
      aiBike.throttle = 0.92 + aiBike.aiAggression * 0.08;
    }
  }
}
