import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BikeState, TRACK_CONFIG, updateBikePhysics, updateRiderAI, getIdealTrackPoint } from './physics';
import { createSpeedwayBikeModel, BikeMeshHandle } from './bikeModel';
import { createSpeedwayStadium, StadiumSceneElements } from './trackBuilder';
import { soundEngine } from './soundEngine';
import { BikeSetup, TrackCondition, RaceState, HelmetColor, HeatResult } from '../types/speedway';

export type CameraMode = 'chase' | 'tv_tower' | 'helmet' | 'overhead';

export interface SceneCallbacks {
  onRaceStateChange: (state: RaceState, message?: string) => void;
  onLapChange: (lap: number, totalLaps: number) => void;
  onTelemetryUpdate: (telemetry: {
    speed: number;
    rpm: number;
    throttle: number;
    slideAngle: number;
    clutchHeld: boolean;
    driftEfficiency: number;
    isGrindingShoe: boolean;
    bodyTuck: number;
    slipRatio: number;
    gForceLat: number;
    gForceLong: number;
    dirtOnVisor: number;
    tearOffsRemaining: number;
    gearRatio: string;
    driftSweetSpot: boolean;
  }) => void;
  onPositionsChange: (positions: { id: string; name: string; helmet: HelmetColor; position: number; gap: string }[]) => void;
  onHeatFinished: (result: HeatResult) => void;
  onReactionTime: (timeMs: number, rating: 'Świetny!' | 'Dobry' | 'Spóźniony' | 'Falstart!') => void;
  onInvertToggle?: (inverted: boolean) => void;
  onTearOff?: (remaining: number) => void;
}

export class SpeedwaySceneManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private stadium: StadiumSceneElements;
  private clock: THREE.Clock;

  // Bikes
  private bikeStates: BikeState[] = [];
  private bikeMeshes: Map<string, BikeMeshHandle> = new Map();

  // Roost Particle System
  private roostParticles: THREE.Points;
  private roostPositions: Float32Array;
  private roostVelocities: Float32Array;
  private roostLifetimes: Float32Array;
  private maxRoostParticles = 1200;
  private roostCursor = 0;

  // Sparks Particle System (Iskry z metalowego kapcia)
  private sparkParticles: THREE.Points;
  private sparkPositions: Float32Array;
  private sparkVelocities: Float32Array;
  private sparkLifetimes: Float32Array;
  private maxSparkParticles = 500;
  private sparkCursor = 0;

  // Steering configuration (false = intuitive/direct: Left=Turn Left, Right=Turn Right)
  private invertSteering: boolean = false;

  // Rain Particle System
  private rainParticles: THREE.Points | null = null;
  private rainPositions: Float32Array | null = null;

  // Race Management
  private raceState: RaceState = 'standby';
  private currentHeatNumber = 1;
  private greenLightTime = 0;
  private tapesReleaseTime = 0;
  private playerClutchReleased = false;
  private playerReactionRecorded = false;
  private homeTeamId = 'gorzow';
  private awayTeamId = 'zielona_gora';
  private heatDuration = 0;

  // Camera & View
  private cameraMode: CameraMode = 'chase';
  private isMenuMode: boolean = true;
  private currentBikeSetup: BikeSetup;
  private currentTrackCondition: TrackCondition;
  private callbacks: SceneCallbacks;

  // Input state
  private inputKeys = {
    steerLeft: false,
    steerRight: false,
    throttle: false,
    clutch: false,
    bodyTuck: false,
  };

  private animationFrameId: number | null = null;
  private isDestroyed = false;

  constructor(
    container: HTMLElement,
    bikeSetup: BikeSetup,
    trackCondition: TrackCondition,
    callbacks: SceneCallbacks
  ) {
    this.container = container;
    this.currentBikeSetup = bikeSetup;
    this.currentTrackCondition = trackCondition;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. Scene & Renderer setup conforming to threejs skill directives
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);
    this.scene.fog = new THREE.FogExp2(0x090d16, 0.0035);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Camera
    this.camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.2, 450);
    this.camera.position.set(0, 15, -60);

    // Procedural Studio Environment Reflection
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 2. Stadium & Shaders
    this.stadium = createSpeedwayStadium();
    this.scene.add(this.stadium.group);
    this.stadium.updateEnvironment(this.currentTrackCondition);

    // 3. Roost Particles
    const { particles, positions, velocities, lifetimes } = this.initRoostParticles();
    this.roostParticles = particles;
    this.roostPositions = positions;
    this.roostVelocities = velocities;
    this.roostLifetimes = lifetimes;
    this.scene.add(this.roostParticles);

    // 4. Shoe Sparks Particles
    const sparks = this.initSparkParticles();
    this.sparkParticles = sparks.particles;
    this.sparkPositions = sparks.positions;
    this.sparkVelocities = sparks.velocities;
    this.sparkLifetimes = sparks.lifetimes;
    this.scene.add(this.sparkParticles);

    // 5. Setup Rain if initial condition is rainy
    if (this.currentTrackCondition.weather === 'rainy') {
      this.initRainParticles();
    }

    // 5. Setup Window resize & input listeners
    this.setupEventListeners();

    // 6. Start Loop
    this.animate();
  }

  private initRoostParticles() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxRoostParticles * 3);
    const velocities = new Float32Array(this.maxRoostParticles * 3);
    const lifetimes = new Float32Array(this.maxRoostParticles);

    for (let i = 0; i < this.maxRoostParticles; i++) {
      positions[i * 3 + 1] = -100; // start off-screen
      lifetimes[i] = -1;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Dirt particle texture (procedural dark gravel dot)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d')!;
    pCtx.fillStyle = '#453224';
    pCtx.beginPath();
    pCtx.arc(16, 16, 14, 0, Math.PI * 2);
    pCtx.fill();
    const pTex = new THREE.CanvasTexture(pCanvas);

    const mat = new THREE.PointsMaterial({
      size: 0.35,
      map: pTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    const particles = new THREE.Points(geo, mat);
    return { particles, positions, velocities, lifetimes };
  }

  private initSparkParticles() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxSparkParticles * 3);
    const velocities = new Float32Array(this.maxSparkParticles * 3);
    const lifetimes = new Float32Array(this.maxSparkParticles);

    for (let i = 0; i < this.maxSparkParticles; i++) {
      positions[i * 3 + 1] = -100;
      lifetimes[i] = -1;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const sCanvas = document.createElement('canvas');
    sCanvas.width = 16;
    sCanvas.height = 16;
    const sCtx = sCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#fbbf24');
    grad.addColorStop(1, 'rgba(234, 88, 12, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 16, 16);
    const sTex = new THREE.CanvasTexture(sCanvas);

    const mat = new THREE.PointsMaterial({
      size: 0.28,
      map: sTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geo, mat);
    return { particles, positions, velocities, lifetimes };
  }

  private initRainParticles() {
    const rainCount = 1800;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
    });
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainPositions = positions;
    this.scene.add(this.rainParticles);
  }

  public setupHeat(
    heatNumber: number,
    homeTeam: string,
    awayTeam: string,
    riders: {
      id: string;
      name: string;
      number: number;
      helmet: HelmetColor;
      gate: 'A' | 'B' | 'C' | 'D';
      isPlayer: boolean;
      teamId: string;
      skill: { reaction: number; aggression: number; technique: number; speed: number };
      preferredLine: 'curb' | 'cushion' | 'adaptive';
    }[]
  ) {
    this.currentHeatNumber = heatNumber;
    this.homeTeamId = homeTeam;
    this.awayTeamId = awayTeam;

    // Clear existing bikes
    this.bikeMeshes.forEach((mesh) => {
      this.scene.remove(mesh.root);
      mesh.dispose();
    });
    this.bikeMeshes.clear();
    this.bikeStates = [];

    // Gate offsets across the 14m track width at the start line (x = 0, z = -turnRadius)
    // Gate A: inside (curb), Gate B: inside-mid, Gate C: outside-mid, Gate D: outside (fence)
    const gateOffsets: Record<'A' | 'B' | 'C' | 'D', number> = {
      A: -0.70, // nearest curb
      B: -0.25,
      C: 0.25,
      D: 0.70, // nearest fence
    };

    riders.forEach((r) => {
      const offset = gateOffsets[r.gate];
      const startPoint = getIdealTrackPoint(0.005, offset);

      const state: BikeState = {
        id: r.id,
        name: r.name,
        number: r.number,
        helmetColor: r.helmet,
        isPlayer: r.isPlayer,
        teamId: r.teamId,
        preferredLine: r.preferredLine,
        x: startPoint.x + 2.5, // 2.5m behind the tapes initially
        z: startPoint.z,
        rotation: Math.PI, // Facing -X along home straight
        speed: 0,
        steerAngle: 0,
        slideAngle: 0,
        leanAngle: 0,
        pitchAngle: 0,
        lapProgress: 0.005,
        totalDistance: 0,
        currentLap: 1,
        lapTimes: [],
        currentLapStartTime: 0,
        finished: false,
        finishTime: 0,
        throttle: 0,
        steerInput: 0,
        clutchHeld: false,
        engineRpm: 3500,
        wheelSpin: 0,
        isGrindingShoe: false,
        driftEfficiency: 0,
        bodyTuck: 0,
        slipRatio: 0,
        gForceLat: 0,
        gForceLong: 0,
        exhaustHeat: 0.1,
        dirtOnVisor: 0,
        tearOffs: 5,
        targetLineOffset: offset,
        aiAggression: r.skill.aggression,
        aiReaction: r.skill.reaction,
        aiTechnique: r.skill.technique,
      };

      const mesh = createSpeedwayBikeModel(r.helmet, r.isPlayer);
      mesh.root.position.set(state.x, 0, state.z);
      mesh.root.rotation.y = -state.rotation;
      this.scene.add(mesh.root);

      this.bikeStates.push(state);
      this.bikeMeshes.set(r.id, mesh);
    });

    this.raceState = 'standby';
    this.stadium.setTapesUp(false);
    this.stadium.setStartLights('off');
    this.callbacks.onRaceStateChange('standby');
    this.callbacks.onLapChange(1, 4);

    // Only begin start sequence if not in main menu
    if (!this.isMenuMode) {
      this.startStartProcedure();
    }
  }

  public startStartProcedure() {
    this.raceState = 'two_minutes';
    this.callbacks.onRaceStateChange('two_minutes', 'Zegar 2 minut – zawodnicy podjeżdżają pod taśmę!');
    soundEngine.playTwoMinuteHorn();

    // Roll up to tapes
    setTimeout(() => {
      if (this.isDestroyed) return;
      this.bikeStates.forEach((b) => {
        b.x -= 2.0; // move directly up to start line
      });

      this.raceState = 'ready';
      this.stadium.setStartLights('green');
      this.callbacks.onRaceStateChange('ready', 'ZIELONE ŚWIATŁO! Trzymaj SPRZĘGŁO (Spacja) i daj gaz!');

      this.greenLightTime = performance.now();
      this.playerClutchReleased = false;
      this.playerReactionRecorded = false;

      // Random delay before tapes fly up (1.8s - 3.4s)
      const tapesDelay = 1800 + Math.random() * 1600;
      setTimeout(() => {
        if (this.isDestroyed || this.raceState !== 'ready') return;
        this.triggerTapesUp();
      }, tapesDelay);
    }, 2200);
  }

  private triggerTapesUp() {
    this.tapesReleaseTime = performance.now();
    this.stadium.setTapesUp(true);
    soundEngine.playTapesUp();

    // Check player clutch release
    const player = this.bikeStates.find((b) => b.isPlayer);
    if (player) {
      if (!this.inputKeys.clutch) {
        // Player wasn't holding clutch or released too early!
        if (this.playerClutchReleased) {
          // False start!
          this.raceState = 'false_start';
          this.stadium.setStartLights('red');
          this.callbacks.onReactionTime(0, 'Falstart!');
          this.callbacks.onRaceStateChange('false_start', 'FALSTART! Ostrzeżenie sędziego za zerwanie taśmy!');
          setTimeout(() => {
            this.resetHeat();
          }, 3500);
          return;
        }
      }
    }

    // Go racing!
    this.raceState = 'racing';
    this.heatDuration = 0;
    this.callbacks.onRaceStateChange('racing', 'START! Taśma w górę!');

    // Launch AI bikes with their individual reaction times
    this.bikeStates.forEach((b) => {
      if (!b.isPlayer) {
        const aiDelay = (1 - b.aiReaction) * 280 + 120 + (Math.random() - 0.5) * 60;
        setTimeout(() => {
          if (this.raceState === 'racing') {
            b.throttle = 1.0;
            b.clutchHeld = false;
          }
        }, aiDelay);
      }
      b.currentLapStartTime = performance.now();
    });
  }

  public setClutchInput(held: boolean) {
    this.inputKeys.clutch = held;
    const player = this.bikeStates.find((b) => b.isPlayer);
    if (!player) return;

    player.clutchHeld = held;

    if (this.raceState === 'ready') {
      if (!held && !this.playerReactionRecorded) {
        // Player released clutch
        this.playerClutchReleased = true;
        const now = performance.now();

        if (this.tapesReleaseTime === 0 || now < this.tapesReleaseTime) {
          // Falstart!
          this.raceState = 'false_start';
          this.stadium.setStartLights('red');
          this.callbacks.onReactionTime(0, 'Falstart!');
          this.callbacks.onRaceStateChange('false_start', 'FALSTART! Dotknięcie taśmy – powtórka biegu.');
          setTimeout(() => {
            this.resetHeat();
          }, 3500);
        }
      }
    } else if (this.raceState === 'racing' && !this.playerReactionRecorded && !held) {
      // Record clean reaction time
      const reactionMs = Math.round(performance.now() - this.tapesReleaseTime);
      this.playerReactionRecorded = true;
      let rating: 'Świetny!' | 'Dobry' | 'Spóźniony' | 'Falstart!' = 'Dobry';
      if (reactionMs < 190) rating = 'Świetny!';
      else if (reactionMs > 320) rating = 'Spóźniony';

      this.callbacks.onReactionTime(reactionMs, rating);
    }
  }

  public setSteerInput(steer: number) {
    this.inputKeys.steerLeft = steer < -0.2;
    this.inputKeys.steerRight = steer > 0.2;
    const player = this.bikeStates.find((b) => b.isPlayer);
    if (player) {
      const val = this.invertSteering ? -steer : steer;
      player.steerInput = Math.max(-1, Math.min(1, val));
    }
  }

  public setBodyTuckInput(tuck: boolean) {
    this.inputKeys.bodyTuck = tuck;
    const player = this.bikeStates.find((b) => b.isPlayer);
    if (player) {
      player.bodyTuck = tuck ? 1.0 : 0.0;
    }
  }

  public pullTearOff() {
    const player = this.bikeStates.find((b) => b.isPlayer);
    if (player) {
      const rem = player.tearOffs ?? 5;
      if (rem > 0) {
        player.tearOffs = rem - 1;
        player.dirtOnVisor = 0;
        soundEngine.playTearOff();
        this.callbacks.onTearOff?.(player.tearOffs);
      }
    }
  }

  public setThrottleInput(throttle: number) {
    this.inputKeys.throttle = throttle > 0.1;
    const player = this.bikeStates.find((b) => b.isPlayer);
    if (player) {
      player.throttle = Math.max(0, Math.min(1, throttle));
    }
  }

  private setupEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    soundEngine.init(); // Initialize audio on first keypress
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      this.inputKeys.steerLeft = true;
    } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      this.inputKeys.steerRight = true;
    } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      this.inputKeys.throttle = true;
    } else if (e.code === 'KeyS' || e.code === 'ArrowDown' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.inputKeys.bodyTuck = true;
    } else if (e.code === 'Space') {
      e.preventDefault();
      this.setClutchInput(true);
    } else if (e.code === 'KeyT') {
      this.pullTearOff();
    } else if (e.code === 'KeyI' || e.code === 'KeyQ') {
      const newInv = this.toggleInvertSteering();
      this.callbacks.onInvertToggle?.(newInv);
    } else if (e.code === 'KeyC') {
      // Cycle camera
      this.cycleCamera();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      this.inputKeys.steerLeft = false;
    } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      this.inputKeys.steerRight = false;
    } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      this.inputKeys.throttle = false;
    } else if (e.code === 'KeyS' || e.code === 'ArrowDown' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.inputKeys.bodyTuck = false;
    } else if (e.code === 'Space') {
      e.preventDefault();
      this.setClutchInput(false);
    }
  };

  private handleResize = () => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
  }

  public cycleCamera() {
    const modes: CameraMode[] = ['chase', 'tv_tower', 'helmet', 'overhead'];
    const nextIdx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
    this.setCameraMode(modes[nextIdx]);
  }

  public setMenuMode(inMenu: boolean) {
    this.isMenuMode = inMenu;
    if (!inMenu && this.raceState === 'standby') {
      this.startStartProcedure();
    }
  }

  public getMenuMode(): boolean {
    return this.isMenuMode;
  }

  public setInvertSteering(inv: boolean) {
    this.invertSteering = inv;
  }

  public toggleInvertSteering(): boolean {
    this.invertSteering = !this.invertSteering;
    return this.invertSteering;
  }

  public getInvertSteering(): boolean {
    return this.invertSteering;
  }

  public updateBikeSetup(setup: BikeSetup) {
    this.currentBikeSetup = { ...setup };
  }

  public updateTrackCondition(condition: TrackCondition) {
    this.currentTrackCondition = { ...condition };
    this.stadium.updateEnvironment(this.currentTrackCondition);
    if (condition.weather === 'rainy' && !this.rainParticles) {
      this.initRainParticles();
    } else if (condition.weather !== 'rainy' && this.rainParticles) {
      this.scene.remove(this.rainParticles);
      this.rainParticles.geometry.dispose();
      (this.rainParticles.material as THREE.Material).dispose();
      this.rainParticles = null;
    }
  }

  public resetHeat() {
    const currentRiders = this.bikeStates.map((b) => ({
      id: b.id,
      name: b.name,
      number: b.number,
      helmet: b.helmetColor,
      gate: (b.targetLineOffset < -0.5 ? 'A' : b.targetLineOffset < 0 ? 'B' : b.targetLineOffset < 0.5 ? 'C' : 'D') as 'A' | 'B' | 'C' | 'D',
      isPlayer: b.isPlayer,
      teamId: b.teamId,
      skill: { reaction: b.aiReaction, aggression: b.aiAggression, technique: b.aiTechnique, speed: 0.8 },
      preferredLine: b.preferredLine,
    }));
    this.setupHeat(this.currentHeatNumber, this.homeTeamId, this.awayTeamId, currentRiders);
  }

  private emitRoost(bike: BikeState, mesh: BikeMeshHandle, count: number) {
    const origin = new THREE.Vector3().copy(mesh.dustEmitter);
    origin.applyMatrix4(mesh.root.matrixWorld);

    // Particle direction is backwards from bike heading
    const backAngle = bike.rotation + Math.PI;

    for (let i = 0; i < count; i++) {
      const idx = this.roostCursor;
      this.roostCursor = (this.roostCursor + 1) % this.maxRoostParticles;

      this.roostPositions[idx * 3] = origin.x + (Math.random() - 0.5) * 0.2;
      this.roostPositions[idx * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.1;
      this.roostPositions[idx * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.2;

      // Roost trajectory: flying backward and upward in an arc
      const speed = bike.speed * 0.85 + 4 + Math.random() * 5;
      const spread = (Math.random() - 0.5) * 0.45;
      this.roostVelocities[idx * 3] = Math.cos(backAngle + spread) * speed;
      this.roostVelocities[idx * 3 + 1] = 2.5 + Math.random() * 3.5;
      this.roostVelocities[idx * 3 + 2] = Math.sin(backAngle + spread) * speed;

      this.roostLifetimes[idx] = 0.65; // ~0.65s lifespan
    }
  }

  private emitSparks(bike: BikeState, mesh: BikeMeshHandle, count: number) {
    const origin = new THREE.Vector3().copy(mesh.shoeContactPoint);
    origin.applyMatrix4(mesh.root.matrixWorld);

    // Sparks fly backward and slightly outward
    const backAngle = bike.rotation + Math.PI + 0.3;

    for (let i = 0; i < count; i++) {
      const idx = this.sparkCursor;
      this.sparkCursor = (this.sparkCursor + 1) % this.maxSparkParticles;

      this.sparkPositions[idx * 3] = origin.x + (Math.random() - 0.5) * 0.1;
      this.sparkPositions[idx * 3 + 1] = 0.05 + Math.random() * 0.08;
      this.sparkPositions[idx * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.1;

      const speed = bike.speed * 0.75 + 3 + Math.random() * 6;
      const spread = (Math.random() - 0.5) * 0.6;
      this.sparkVelocities[idx * 3] = Math.cos(backAngle + spread) * speed;
      this.sparkVelocities[idx * 3 + 1] = 0.8 + Math.random() * 2.2; // bouncing up
      this.sparkVelocities[idx * 3 + 2] = Math.sin(backAngle + spread) * speed;

      this.sparkLifetimes[idx] = 0.28 + Math.random() * 0.15; // fast spark flash
    }
  }

  private animate = () => {
    if (this.isDestroyed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.05);

    // 1. Process Player Input
    const player = this.bikeStates.find((b) => b.isPlayer);
    if (player) {
      // Normal: steerLeft = -1.0 (turn left & lean left), steerRight = 1.0 (turn right & stand up)
      const turnLeftVal = this.invertSteering ? 1.0 : -1.0;
      const turnRightVal = this.invertSteering ? -1.0 : 1.0;
      if (this.inputKeys.steerLeft && !this.inputKeys.steerRight) {
        player.steerInput = turnLeftVal;
      } else if (this.inputKeys.steerRight && !this.inputKeys.steerLeft) {
        player.steerInput = turnRightVal;
      } else {
        player.steerInput = 0;
      }

      if (this.raceState === 'racing') {
        player.throttle = this.inputKeys.throttle ? 1.0 : 0.0;
      } else if (this.raceState === 'ready') {
        // Can rev throttle while holding clutch at gate!
        player.throttle = this.inputKeys.throttle ? 1.0 : 0.35;
      }
    }

    // 2. Physics & AI Updates
    const isRacing = this.raceState === 'racing';
    if (isRacing) {
      this.heatDuration += delta;
    }

    this.bikeStates.forEach((bike) => {
      if (!bike.isPlayer && isRacing) {
        updateRiderAI(bike, delta, this.bikeStates, this.currentTrackCondition);
      }

      updateBikePhysics(
        bike,
        delta,
        bike.isPlayer ? this.currentBikeSetup : { ...this.currentBikeSetup, rearSprocket: 57, carburetorJet: 185 },
        this.currentTrackCondition,
        isRacing
      );

      // Update 3D Visual Mesh
      const mesh = this.bikeMeshes.get(bike.id);
      if (mesh) {
        mesh.root.position.set(bike.x, 0, bike.z);
        mesh.root.rotation.y = -bike.rotation;
        mesh.updateVisuals(
          bike.leanAngle,
          bike.pitchAngle,
          bike.steerAngle,
          bike.speed,
          bike.slideAngle,
          delta,
          bike.isGrindingShoe,
          bike.bodyTuck || 0,
          bike.exhaustHeat || 0.1,
          bike.throttle || 0
        );

        // Spawn dirt roost when on throttle and moving
        if (bike.speed > 4 && bike.throttle > 0.2) {
          const particlesToSpawn = Math.floor(bike.wheelSpin * 3 + 1);
          this.emitRoost(bike, mesh, particlesToSpawn);
        }

        // Spawn sparks from steel shoe scraping track in corner
        if (bike.isGrindingShoe) {
          this.emitSparks(bike, mesh, 3);
          if (bike.isPlayer && Math.random() > 0.5) {
            soundEngine.playSteelShoeScrape(Math.abs(bike.leanAngle));
          }
        }
      }
    });

    // Accumulate dirt roost on player's goggles when trailing opponent
    if (player && isRacing) {
      player.bodyTuck = this.inputKeys.bodyTuck ? 1.0 : 0.0;
      const opponentInFront = this.bikeStates.find(
        (b) => !b.isPlayer && b.totalDistance > player.totalDistance && b.totalDistance - player.totalDistance < 18
      );
      if (opponentInFront && opponentInFront.speed > 5) {
        player.dirtOnVisor = Math.min(1.0, (player.dirtOnVisor || 0) + delta * 0.09);
      }
    }

    // 3. Audio & Telemetry Update
    if (player) {
      soundEngine.updateEngine(
        player.throttle,
        player.speed * 3.6,
        player.clutchHeld,
        player.slideAngle
      );

      const driftDeg = Number((player.slideAngle * (180 / Math.PI)).toFixed(1));
      this.callbacks.onTelemetryUpdate({
        speed: Math.round(player.speed * 3.6),
        rpm: Math.round(player.engineRpm),
        throttle: player.throttle,
        slideAngle: driftDeg,
        clutchHeld: player.clutchHeld,
        driftEfficiency: player.driftEfficiency,
        isGrindingShoe: player.isGrindingShoe,
        bodyTuck: player.bodyTuck || 0,
        slipRatio: Math.round((player.slipRatio || 0) * 100),
        gForceLat: Number((player.gForceLat || 0).toFixed(2)),
        gForceLong: Number((player.gForceLong || 0).toFixed(2)),
        dirtOnVisor: player.dirtOnVisor || 0,
        tearOffsRemaining: player.tearOffs ?? 5,
        gearRatio: `13/${this.currentBikeSetup.rearSprocket}`,
        driftSweetSpot: driftDeg >= 26 && driftDeg <= 46,
      });

      this.callbacks.onLapChange(Math.min(4, player.currentLap), 4);
    }

    // 4. Update Roost Particles
    const posAttr = this.roostParticles.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.maxRoostParticles; i++) {
      if (this.roostLifetimes[i] > 0) {
        this.roostLifetimes[i] -= delta;
        this.roostPositions[i * 3] += this.roostVelocities[i * 3] * delta;
        this.roostPositions[i * 3 + 1] += this.roostVelocities[i * 3 + 1] * delta;
        this.roostPositions[i * 3 + 2] += this.roostVelocities[i * 3 + 2] * delta;

        // Gravity
        this.roostVelocities[i * 3 + 1] -= 9.8 * delta;

        // Hit ground
        if (this.roostPositions[i * 3 + 1] < 0.05) {
          this.roostPositions[i * 3 + 1] = 0.05;
          this.roostVelocities[i * 3] *= 0.5;
          this.roostVelocities[i * 3 + 2] *= 0.5;
        }

        if (this.roostLifetimes[i] <= 0) {
          this.roostPositions[i * 3 + 1] = -100;
        }
      }
    }
    posAttr.needsUpdate = true;

    // 5. Update Sparks Particles
    const sparkPosAttr = this.sparkParticles.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.maxSparkParticles; i++) {
      if (this.sparkLifetimes[i] > 0) {
        this.sparkLifetimes[i] -= delta;
        this.sparkPositions[i * 3] += this.sparkVelocities[i * 3] * delta;
        this.sparkPositions[i * 3 + 1] += this.sparkVelocities[i * 3 + 1] * delta;
        this.sparkPositions[i * 3 + 2] += this.sparkVelocities[i * 3 + 2] * delta;

        this.sparkVelocities[i * 3 + 1] -= 12 * delta;

        if (this.sparkPositions[i * 3 + 1] < 0.04) {
          this.sparkPositions[i * 3 + 1] = 0.04;
          this.sparkVelocities[i * 3 + 1] = -this.sparkVelocities[i * 3 + 1] * 0.4;
          this.sparkVelocities[i * 3] *= 0.7;
          this.sparkVelocities[i * 3 + 2] *= 0.7;
        }

        if (this.sparkLifetimes[i] <= 0) {
          this.sparkPositions[i * 3 + 1] = -100;
        }
      }
    }
    sparkPosAttr.needsUpdate = true;
    posAttr.needsUpdate = true;

    // 5. Update Rain Particles if active
    if (this.rainParticles && this.rainPositions) {
      const rAttr = this.rainParticles.geometry.attributes.position as THREE.BufferAttribute;
      const count = this.rainPositions.length / 3;
      for (let i = 0; i < count; i++) {
        this.rainPositions[i * 3 + 1] -= 42 * delta;
        if (this.rainPositions[i * 3 + 1] < 0) {
          this.rainPositions[i * 3 + 1] = 40;
        }
      }
      rAttr.needsUpdate = true;
    }

    // 6. Leaderboard / Race Positions & Finish Check
    this.updateRacePositions();

    // 7. Camera Positioning
    this.updateCamera(delta);

    // 8. Render
    this.renderer.render(this.scene, this.camera);
  };

  private updateRacePositions() {
    // Sort bikes by: finished order, or current lap * totalLength + totalDistance
    const sorted = [...this.bikeStates].sort((a, b) => {
      if (a.finished && b.finished) {
        return a.finishTime - b.finishTime;
      }
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.totalDistance - a.totalDistance;
    });

    const positions = sorted.map((b, idx) => {
      const leader = sorted[0];
      const gapMeters = Math.max(0, leader.totalDistance - b.totalDistance);
      const gapSec = (gapMeters / Math.max(1, b.speed)).toFixed(2);
      return {
        id: b.id,
        name: b.name,
        helmet: b.helmetColor,
        position: idx + 1,
        gap: idx === 0 ? 'LIDER' : `+${gapSec}s`,
      };
    });

    this.callbacks.onPositionsChange(positions);

    // Check if heat finished (all 4 finished or leader finished + 5 seconds)
    if (this.raceState === 'racing') {
      const leader = sorted[0];
      if (leader.finished) {
        const finishedCount = this.bikeStates.filter((b) => b.finished).length;
        if (finishedCount === 4 || (leader.finishTime > 0 && performance.now() - leader.finishTime > 5000)) {
          this.raceState = 'finished';
          soundEngine.playCheerRoar();
          this.callbacks.onRaceStateChange('finished', 'KONIEC BIEGU! Szachownica!');

          // Compute official Ekstraliga heat points: 3 - 2 - 1 - 0
          const pointsTable = [3, 2, 1, 0];
          let homeScore = 0;
          let awayScore = 0;

          const finishOrder = sorted.map((b, i) => {
            const pts = pointsTable[i] || 0;
            if (b.teamId === this.homeTeamId) {
              homeScore += pts;
            } else {
              awayScore += pts;
            }
            return {
              riderId: b.id,
              riderName: b.name,
              helmet: b.helmetColor,
              teamId: b.teamId,
              position: i + 1,
              points: pts,
              timeSeconds: Number((this.heatDuration).toFixed(2)),
            };
          });

          const result: HeatResult = {
            heatNumber: this.currentHeatNumber,
            homeScore,
            awayScore,
            homeCumulative: homeScore,
            awayCumulative: awayScore,
            finishOrder,
          };

          this.callbacks.onHeatFinished(result);
        }
      }
    }
  }

  private updateCamera(delta: number) {
    if (this.isMenuMode) {
      const time = performance.now() * 0.00015;
      const camX = Math.cos(time) * 75;
      const camZ = Math.sin(time) * 65;
      this.camera.position.set(camX, 28, camZ);
      this.camera.lookAt(0, 4, -15);
      return;
    }

    const player = this.bikeStates.find((b) => b.isPlayer) || this.bikeStates[0];
    if (!player) return;

    if (this.cameraMode === 'chase') {
      // Dynamic Chase Cam: placed behind and above, swinging smoothly with drift
      const speedRatio = player.speed / 33;
      const targetFov = 58 + speedRatio * 14 + (player.bodyTuck ? 4 : 0);
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, 6 * delta);
      this.camera.updateProjectionMatrix();

      const camDist = 5.8 - speedRatio * 0.8;
      const camHeight = 2.3 + Math.abs(player.slideAngle) * 0.35;
      const angle = player.rotation + Math.PI + (player.slideAngle * 0.45);
      const targetPos = new THREE.Vector3(
        player.x + Math.cos(angle) * camDist,
        camHeight,
        player.z + Math.sin(angle) * camDist
      );

      // Micro vibration when sliding or at high engine RPM
      if (player.speed > 5) {
        const shake = (player.wheelSpin * 0.025 + (player.isGrindingShoe ? 0.02 : 0.004));
        targetPos.x += (Math.random() - 0.5) * shake;
        targetPos.y += (Math.random() - 0.5) * shake;
      }

      // Smooth exponential damping
      this.camera.position.lerp(targetPos, Math.min(1, 10 * delta));
      const lookTarget = new THREE.Vector3(
        player.x + Math.cos(player.rotation) * 3.5,
        1.0,
        player.z + Math.sin(player.rotation) * 3.5
      );
      this.camera.lookAt(lookTarget);
    } else if (this.cameraMode === 'tv_tower') {
      // TV Tower camera located at the referee deck
      const towerPos = new THREE.Vector3(-6, 7.5, -(TRACK_CONFIG.turnRadius + TRACK_CONFIG.trackWidth / 2 + 5));
      this.camera.position.lerp(towerPos, Math.min(1, 4 * delta));
      this.camera.lookAt(player.x, 0.8, player.z);
    } else if (this.cameraMode === 'helmet') {
      // Helmet FPV: inside rider's goggles
      const headPos = new THREE.Vector3(player.x, 1.5, player.z);
      const forwardAngle = player.rotation - player.steerAngle * 0.25;
      const fwd = new THREE.Vector3(Math.cos(forwardAngle) * 5, 0.5, Math.sin(forwardAngle) * 5);
      this.camera.position.copy(headPos);
      this.camera.lookAt(headPos.clone().add(fwd));
    } else {
      // Overhead tactical aerial cam
      const overheadPos = new THREE.Vector3(player.x * 0.4, 65, player.z * 0.4);
      this.camera.position.lerp(overheadPos, Math.min(1, 5 * delta));
      this.camera.lookAt(0, 0, 0);
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);

    this.bikeMeshes.forEach((m) => m.dispose());
    this.stadium.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
