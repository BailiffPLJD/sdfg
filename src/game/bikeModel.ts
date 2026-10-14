import * as THREE from 'three';
import { HelmetColor } from '../types/speedway';

export interface BikeMeshHandle {
  root: THREE.Group;
  frontFork: THREE.Group;
  frontWheel: THREE.Mesh;
  rearWheel: THREE.Mesh;
  rider: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  head: THREE.Group;
  helmetMesh: THREE.Mesh;
  exhaustGlow: THREE.PointLight;
  exhaustFlame: THREE.Mesh;
  exhaustHeaderMat: THREE.MeshStandardMaterial;
  dustEmitter: THREE.Vector3;
  shoeContactPoint: THREE.Vector3;
  setHelmetColor: (color: HelmetColor) => void;
  updateVisuals: (
    leanAngle: number,
    pitchAngle: number,
    steerAngle: number,
    speed: number,
    slideAngle: number,
    delta: number,
    isGrindingShoe: boolean,
    bodyTuck?: number,
    exhaustHeat?: number,
    throttle?: number
  ) => void;
  dispose: () => void;
}

const HELMET_COLORS: Record<HelmetColor, number> = {
  red: 0xdc2626,
  blue: 0x2563eb,
  white: 0xf8fafc,
  yellow: 0xeab308,
};

/**
 * Creates photorealistic 3D speedway motorcycle & rider.
 * Coordinate conventions:
 * +X = Forward (front wheel at +0.55, rear at -0.65)
 * +Y = Up
 * -Z = LEFT / INSIDE of turn (infield curb, left leg, steel shoe, clutch)
 * +Z = RIGHT / OUTSIDE of turn (safety fence, right leg on peg, exhaust pipe)
 * Leaning left into corners: chassisGroup.rotation.x = -leanAngle (tilts top toward -Z)
 * Rear sliding outward: chassisGroup.rotation.y = slideAngle * 0.48 (swings rear toward +Z)
 */
export function createSpeedwayBikeModel(initialHelmet: HelmetColor, isPlayer: boolean): BikeMeshHandle {
  const root = new THREE.Group();

  const createMirroredMesh = <T extends THREE.BufferGeometry>(
    geometry: T,
    material: THREE.Material,
    position: THREE.Vector3,
    parent: THREE.Object3D,
    rotation?: THREE.Euler,
    scale?: THREE.Vector3
  ) => {
    [-1, 1].forEach((side) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(position.x, position.y, Math.abs(position.z) * side);
      if (rotation) {
        mesh.rotation.set(rotation.x, rotation.y * side, rotation.z * side);
      }
      if (scale) {
        mesh.scale.copy(scale);
      }
      parent.add(mesh);
    });
  };

  // 1. PBR MATERIALS
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.98,
    roughness: 0.06,
  });

  const exhaustHeaderMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    metalness: 0.92,
    roughness: 0.22,
    emissive: 0xef4444,
    emissiveIntensity: 0.15,
  });

  const exhaustMufflerMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.88,
    roughness: 0.22,
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: isPlayer ? 0x0f172a : 0x1e293b,
    metalness: 0.85,
    roughness: 0.18,
  });

  const engineMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.84,
    roughness: 0.24,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.94,
    metalness: 0.05,
  });

  const sprocketMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.90,
    roughness: 0.18,
  });

  const suitMat = new THREE.MeshStandardMaterial({
    color: isPlayer ? 0x0284c7 : 0x334155,
    roughness: 0.55,
    metalness: 0.15,
  });

  const suitTrimMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.4,
    metalness: 0.1,
  });

  const suitAccentMat = new THREE.MeshStandardMaterial({
    color: isPlayer ? 0xf97316 : 0xef4444,
    roughness: 0.5,
    metalness: 0.2,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.42,
    metalness: 0.52,
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.68,
    metalness: 0.08,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xe7c2a1,
    roughness: 0.82,
    metalness: 0.02,
  });

  // Steel shoe (kapeć żużlowy z polerowaną blachą ze stali nierdzewnej)
  const steelShoeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.99,
    roughness: 0.04,
  });

  const helmetMat = new THREE.MeshStandardMaterial({
    color: HELMET_COLORS[initialHelmet],
    roughness: 0.12,
    metalness: 0.45,
  });

  const visorMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.03,
    metalness: 0.96,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  // 2. CHASSIS RIG
  const chassisGroup = new THREE.Group();
  root.add(chassisGroup);

  // Main tubular frame spine
  const spineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.52, 0.72, 0),
    new THREE.Vector3(0.24, 0.68, 0),
    new THREE.Vector3(-0.15, 0.48, 0),
    new THREE.Vector3(-0.42, 0.32, 0),
  ]);
  const spineGeo = new THREE.TubeGeometry(spineCurve, 20, 0.028, 12, false);
  const spine = new THREE.Mesh(spineGeo, frameMat);
  chassisGroup.add(spine);

  // Twin cradle downtubes wrapping around the engine
  const cradleLCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.48, 0.68, -0.04),
    new THREE.Vector3(0.38, 0.32, -0.06),
    new THREE.Vector3(0.02, 0.16, -0.06),
    new THREE.Vector3(-0.35, 0.16, -0.05),
    new THREE.Vector3(-0.42, 0.32, 0),
  ]);
  const cradleL = new THREE.Mesh(new THREE.TubeGeometry(cradleLCurve, 24, 0.018, 10, false), frameMat);
  chassisGroup.add(cradleL);

  const cradleRCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.48, 0.68, 0.04),
    new THREE.Vector3(0.38, 0.32, 0.06),
    new THREE.Vector3(0.02, 0.16, 0.06),
    new THREE.Vector3(-0.35, 0.16, 0.05),
    new THREE.Vector3(-0.42, 0.32, 0),
  ]);
  const cradleR = new THREE.Mesh(new THREE.TubeGeometry(cradleRCurve, 24, 0.018, 10, false), frameMat);
  chassisGroup.add(cradleR);

  // Rigid speedway rear stays triangulated to rear wheel axle
  const rearStayLCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.12, 0.54, -0.05),
    new THREE.Vector3(-0.40, 0.40, -0.07),
    new THREE.Vector3(-0.64, 0.33, -0.075),
  ]);
  const rearStayL = new THREE.Mesh(new THREE.TubeGeometry(rearStayLCurve, 16, 0.018, 10, false), frameMat);
  chassisGroup.add(rearStayL);

  const rearStayRCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.12, 0.54, 0.05),
    new THREE.Vector3(-0.40, 0.40, 0.07),
    new THREE.Vector3(-0.64, 0.33, 0.075),
  ]);
  const rearStayR = new THREE.Mesh(new THREE.TubeGeometry(rearStayRCurve, 16, 0.018, 10, false), frameMat);
  chassisGroup.add(rearStayR);

  // 3. 500cc GM / JAWA SPEEDWAY ENGINE
  const engineGroup = new THREE.Group();
  engineGroup.position.set(0.05, 0.28, 0);
  chassisGroup.add(engineGroup);

  // Crankcase
  const crankGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.16, 16);
  crankGeo.rotateZ(Math.PI / 2);
  const crank = new THREE.Mesh(crankGeo, engineMat);
  engineGroup.add(crank);

  // Upright / laydown 500cc Cylinder Head
  const cylinderGeo = new THREE.CylinderGeometry(0.088, 0.095, 0.26, 16);
  cylinderGeo.rotateZ(-0.35);
  const cylinder = new THREE.Mesh(cylinderGeo, engineMat);
  cylinder.position.set(0.10, 0.16, 0);
  engineGroup.add(cylinder);

  // Cooling fins
  const finGeo = new THREE.CylinderGeometry(0.115, 0.115, 0.008, 16);
  finGeo.rotateZ(-0.35);
  for (let f = 0; f < 8; f++) {
    const fin = new THREE.Mesh(finGeo, chromeMat);
    fin.position.set(0.05 + f * 0.015, 0.08 + f * 0.024, 0);
    engineGroup.add(fin);
  }

  // Dell'Orto 34mm Speedway Carburetor with intake velocity stack
  const carbGeo = new THREE.BoxGeometry(0.09, 0.11, 0.09);
  const carb = new THREE.Mesh(carbGeo, chromeMat);
  carb.position.set(-0.12, 0.30, 0);
  engineGroup.add(carb);

  const stackGeo = new THREE.ConeGeometry(0.07, 0.12, 16, 1, true);
  stackGeo.rotateZ(Math.PI / 2);
  const stackMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.92, roughness: 0.12 });
  const stack = new THREE.Mesh(stackGeo, stackMat);
  stack.position.set(-0.22, 0.30, 0);
  engineGroup.add(stack);

  // Spark plug with red silicone high-tension wire
  const plugGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.06, 8);
  const plugMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
  const plug = new THREE.Mesh(plugGeo, plugMat);
  plug.position.set(0.28, 0.38, 0);
  engineGroup.add(plug);

  // 4. EXHAUST SYSTEM ON RIGHT SIDE (+Z) - never scrapes dirt when leaning left!
  const exhaustCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.18, 0.34, 0.04),
    new THREE.Vector3(0.30, 0.22, 0.09),
    new THREE.Vector3(0.20, 0.08, 0.11),
    new THREE.Vector3(-0.15, 0.06, 0.11),
    new THREE.Vector3(-0.55, 0.12, 0.11),
    new THREE.Vector3(-0.95, 0.16, 0.11),
  ]);
  const exhaustGeo = new THREE.TubeGeometry(exhaustCurve, 32, 0.032, 12, false);
  const exhaust = new THREE.Mesh(exhaustGeo, exhaustHeaderMat);
  chassisGroup.add(exhaust);

  // Megaphone silencer
  const mufflerGeo = new THREE.CylinderGeometry(0.052, 0.032, 0.52, 16);
  mufflerGeo.rotateZ(Math.PI / 2);
  const muffler = new THREE.Mesh(mufflerGeo, exhaustMufflerMat);
  muffler.position.set(-0.74, 0.14, 0.11);
  chassisGroup.add(muffler);

  // Dynamic backfire flame mesh at exhaust tip
  const flameGeo = new THREE.ConeGeometry(0.05, 0.24, 12);
  flameGeo.rotateZ(-Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const exhaustFlame = new THREE.Mesh(flameGeo, flameMat);
  exhaustFlame.position.set(-1.08, 0.16, 0.11);
  chassisGroup.add(exhaustFlame);

  const exhaustGlow = new THREE.PointLight(0xff4411, 0.6, 2.5);
  exhaustGlow.position.set(-0.95, 0.16, 0.13);
  chassisGroup.add(exhaustGlow);

  // 5. FUEL TANK & SEAT
  const tankGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.46, 16);
  tankGeo.rotateZ(Math.PI / 2.7);
  const tankMat = new THREE.MeshPhysicalMaterial({
    color: isPlayer ? 0x0284c7 : 0xeab308,
    metalness: 0.65,
    roughness: 0.16,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
  });
  const tank = new THREE.Mesh(tankGeo, tankMat);
  tank.position.set(0.16, 0.68, 0);
  chassisGroup.add(tank);

  const tankPadGeo = new THREE.BoxGeometry(0.18, 0.04, 0.14);
  const tankPad = new THREE.Mesh(tankPadGeo, leatherMat);
  tankPad.position.set(0.19, 0.76, 0);
  tankPad.rotation.z = -0.35;
  chassisGroup.add(tankPad);

  // Speedway seat pad
  const seatGeo = new THREE.BoxGeometry(0.38, 0.065, 0.16);
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.95 });
  const seat = new THREE.Mesh(seatGeo, seatMat);
  seat.position.set(-0.25, 0.63, 0);
  chassisGroup.add(seat);

  const tailGeo = new THREE.BoxGeometry(0.18, 0.08, 0.18);
  const tail = new THREE.Mesh(tailGeo, carbonMat);
  tail.position.set(-0.49, 0.62, 0);
  tail.rotation.z = -0.18;
  chassisGroup.add(tail);

  const frontPlateGeo = new THREE.BoxGeometry(0.05, 0.24, 0.22);
  const frontPlateMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    roughness: 0.24,
    metalness: 0.18,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  });

  const rearMudguardGeo = new THREE.BoxGeometry(0.34, 0.03, 0.16);
  const rearMudguard = new THREE.Mesh(rearMudguardGeo, carbonMat);
  rearMudguard.position.set(-0.72, 0.56, 0);
  rearMudguard.rotation.z = -0.16;
  chassisGroup.add(rearMudguard);

  const sidePanelGeo = new THREE.BoxGeometry(0.24, 0.16, 0.03);
  createMirroredMesh(
    sidePanelGeo,
    frontPlateMat,
    new THREE.Vector3(-0.08, 0.49, 0.13),
    chassisGroup,
    new THREE.Euler(0, 0.08, -0.08)
  );

  const numberPanelGeo = new THREE.BoxGeometry(0.18, 0.09, 0.016);
  createMirroredMesh(
    numberPanelGeo,
    suitAccentMat,
    new THREE.Vector3(-0.10, 0.50, 0.145),
    chassisGroup,
    new THREE.Euler(0, 0.06, -0.08)
  );

  const pegGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.14, 10);
  pegGeo.rotateX(Math.PI / 2);
  createMirroredMesh(
    pegGeo,
    chromeMat,
    new THREE.Vector3(-0.04, 0.20, 0.16),
    chassisGroup,
    new THREE.Euler(0, 0, 0.1)
  );

  // FIM safety mud deflector behind rear wheel
  const deflectorGeo = new THREE.BoxGeometry(0.32, 0.14, 0.016);
  deflectorGeo.rotateY(Math.PI / 2);
  const deflectorMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
  const deflector = new THREE.Mesh(deflectorGeo, deflectorMat);
  deflector.position.set(-0.92, 0.15, 0);
  chassisGroup.add(deflector);

  // 6. WHEELS: 23" FRONT & 19" REAR WITH WIRE SPOKES & MITAS DIRT TREAD
  const createSpeedwayWheel = (radius: number, width: number, spokeCount: number) => {
    const wheelGroup = new THREE.Group();
    // Torus tire
    const tireGeo = new THREE.TorusGeometry(radius, width, 14, 36);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    wheelGroup.add(tire);

    // 3D Tread Knobs around perimeter
    const knobGeo = new THREE.BoxGeometry(width * 0.7, 0.016, width * 0.45);
    const knobCount = 28;
    for (let k = 0; k < knobCount; k++) {
      const knobAngle = (k / knobCount) * Math.PI * 2;
      const knob = new THREE.Mesh(knobGeo, tireMat);
      knob.position.set(Math.cos(knobAngle) * (radius + width * 0.95), Math.sin(knobAngle) * (radius + width * 0.95), 0);
      knob.rotation.z = knobAngle;
      wheelGroup.add(knob);
    }

    // Chrome rim
    const rimGeo = new THREE.CylinderGeometry(radius - width * 0.72, radius - width * 0.72, width * 0.82, 24, 1, true);
    rimGeo.rotateX(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, chromeMat);
    wheelGroup.add(rim);

    // Hub
    const hubGeo = new THREE.CylinderGeometry(0.042, 0.042, width * 1.5, 16);
    hubGeo.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, chromeMat);
    wheelGroup.add(hub);

    // Crossed stainless steel spokes
    const spokeGeo = new THREE.CylinderGeometry(0.0028, 0.0028, radius * 1.88, 4);
    for (let i = 0; i < spokeCount; i++) {
      const spoke = new THREE.Mesh(spokeGeo, chromeMat);
      spoke.rotation.z = (i / spokeCount) * Math.PI;
      spoke.rotation.x = ((i % 2) - 0.5) * 0.14;
      wheelGroup.add(spoke);
    }

    return { wheelGroup, tire };
  };

  // Rear 19" Wheel
  const { wheelGroup: rearWheelGroup, tire: rearWheel } = createSpeedwayWheel(0.33, 0.075, 16);
  rearWheelGroup.position.set(-0.64, 0.33, 0);
  chassisGroup.add(rearWheelGroup);

  // Gold 58T rear sprocket on left side (-Z)
  const sprocketGeo = new THREE.CylinderGeometry(0.165, 0.165, 0.016, 24);
  sprocketGeo.rotateX(Math.PI / 2);
  const sprocket = new THREE.Mesh(sprocketGeo, sprocketMat);
  sprocket.position.set(0, 0, -0.06);
  rearWheelGroup.add(sprocket);

  // Gold Drive Chain on left side (-Z)
  const chainCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.64, 0.33, -0.06),
    new THREE.Vector3(-0.35, 0.32, -0.06),
    new THREE.Vector3(-0.10, 0.32, -0.06),
    new THREE.Vector3(-0.35, 0.30, -0.06),
  ]);
  const chainGeo = new THREE.TubeGeometry(chainCurve, 16, 0.008, 6, true);
  const chainMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
  const chain = new THREE.Mesh(chainGeo, chainMat);
  chassisGroup.add(chain);

  // 7. FRONT FORK, HANDLEBARS & 23" FRONT WHEEL
  const frontFork = new THREE.Group();
  frontFork.position.set(0.50, 0.46, 0);
  chassisGroup.add(frontFork);

  // Fork stanchions
  const forkGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.76, 12);
  const forkL = new THREE.Mesh(forkGeo, chromeMat);
  forkL.position.set(0.08, -0.16, -0.085);
  forkL.rotation.z = -0.38;
  frontFork.add(forkL);

  const forkR = new THREE.Mesh(forkGeo, chromeMat);
  forkR.position.set(0.08, -0.16, 0.085);
  forkR.rotation.z = -0.38;
  frontFork.add(forkR);

  // Suspension springs
  const springGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.24, 10);
  const springL = new THREE.Mesh(springGeo, chromeMat);
  springL.position.set(0.12, -0.12, -0.085);
  frontFork.add(springL);

  const springR = new THREE.Mesh(springGeo, chromeMat);
  springR.position.set(0.12, -0.12, 0.085);
  frontFork.add(springR);

  const frontPlate = new THREE.Mesh(frontPlateGeo, frontPlateMat);
  frontPlate.position.set(0.33, 0.26, 0);
  frontPlate.rotation.z = -0.32;
  frontFork.add(frontPlate);

  const plateStripeGeo = new THREE.BoxGeometry(0.054, 0.05, 0.2);
  const plateStripe = new THREE.Mesh(plateStripeGeo, suitAccentMat);
  plateStripe.position.set(0.335, 0.22, 0);
  plateStripe.rotation.z = -0.32;
  frontFork.add(plateStripe);

  const frontMudguardGeo = new THREE.BoxGeometry(0.24, 0.028, 0.12);
  const frontMudguard = new THREE.Mesh(frontMudguardGeo, carbonMat);
  frontMudguard.position.set(0.25, -0.02, 0);
  frontMudguard.rotation.z = -0.18;
  frontFork.add(frontMudguard);

  // Front 23" Wheel
  const { wheelGroup: frontWheelGroup, tire: frontWheel } = createSpeedwayWheel(0.38, 0.055, 18);
  frontWheelGroup.position.set(0.18, -0.38, 0);
  frontFork.add(frontWheelGroup);

  // Wide Renthal speedway handlebars
  const barGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.88, 12);
  barGeo.rotateX(Math.PI / 2);
  const handlebars = new THREE.Mesh(barGeo, chromeMat);
  handlebars.position.set(-0.04, 0.38, 0);
  handlebars.rotation.z = 0.15;
  frontFork.add(handlebars);

  // Handlebar crossbar pad
  const barPadGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.32, 12);
  barPadGeo.rotateX(Math.PI / 2);
  const barPadMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  const barPad = new THREE.Mesh(barPadGeo, barPadMat);
  barPad.position.set(-0.04, 0.38, 0);
  frontFork.add(barPad);

  // Rubber handgrips
  const gripGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.14, 10);
  gripGeo.rotateX(Math.PI / 2);
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  const gripL = new THREE.Mesh(gripGeo, gripMat);
  gripL.position.set(-0.04, 0.38, -0.37);
  frontFork.add(gripL);

  const gripR = new THREE.Mesh(gripGeo, gripMat);
  gripR.position.set(-0.04, 0.38, 0.37);
  frontFork.add(gripR);

  // 8. SCULPTED SPEEDWAY RIDER
  const rider = new THREE.Group();
  rider.position.set(-0.16, 0.68, 0);
  chassisGroup.add(rider);

  // PELVIS & HIPS
  const pelvisGeo = new THREE.SphereGeometry(0.13, 14, 12);
  pelvisGeo.scale(1.0, 0.75, 1.1);
  const pelvis = new THREE.Mesh(pelvisGeo, suitMat);
  pelvis.position.set(0, 0.06, 0);
  rider.add(pelvis);

  const lowerBackGeo = new THREE.BoxGeometry(0.18, 0.12, 0.18);
  const lowerBack = new THREE.Mesh(lowerBackGeo, suitTrimMat);
  lowerBack.position.set(-0.02, 0.12, 0);
  rider.add(lowerBack);

  // ARTICULATED TORSO & SPINE
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0.04, 0.14, 0);
  rider.add(torsoGroup);

  // Sculpted anatomical chest & abdomen
  const chestCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.08, 0.16, 0),
    new THREE.Vector3(0.18, 0.32, 0),
  ]);
  const chestGeo = new THREE.TubeGeometry(chestCurve, 16, 0.13, 12, false);
  const chest = new THREE.Mesh(chestGeo, suitMat);
  chest.scale.set(1.0, 1.0, 1.35);
  torsoGroup.add(chest);

  const shoulderGeo = new THREE.SphereGeometry(0.07, 10, 8);
  createMirroredMesh(
    shoulderGeo,
    suitAccentMat,
    new THREE.Vector3(0.12, 0.27, 0.17),
    torsoGroup
  );

  const neckGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.08, 10);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.set(0.17, 0.39, 0);
  neck.rotation.z = -0.28;
  torsoGroup.add(neck);

  // Racing Plastron Bib with Poland / Team emblem on chest
  const bibGeo = new THREE.BoxGeometry(0.03, 0.22, 0.26);
  const bibMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const bib = new THREE.Mesh(bibGeo, bibMat);
  bib.position.set(0.24, 0.20, 0);
  bib.rotation.z = -0.45;
  torsoGroup.add(bib);

  const bibNumberGeo = new THREE.BoxGeometry(0.032, 0.14, 0.14);
  const bibNumberMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
  const bibNumber = new THREE.Mesh(bibNumberGeo, bibNumberMat);
  bibNumber.position.set(0.245, 0.20, 0);
  bibNumber.rotation.z = -0.45;
  torsoGroup.add(bibNumber);

  // RACING HELMET WITH AERO SPOILER & VISOR
  const head = new THREE.Group();
  head.position.set(0.24, 0.46, 0);
  torsoGroup.add(head);

  // Organic oval helmet shell
  const helmetGeo = new THREE.SphereGeometry(0.155, 18, 16);
  helmetGeo.scale(1.15, 1.0, 0.95);
  const helmetMesh = new THREE.Mesh(helmetGeo, helmetMat);
  head.add(helmetMesh);

  const helmetAccentGeo = new THREE.TorusGeometry(0.12, 0.014, 8, 18);
  const helmetAccent = new THREE.Mesh(helmetAccentGeo, suitTrimMat);
  helmetAccent.rotation.y = Math.PI / 2;
  helmetAccent.position.set(-0.01, 0.02, 0);
  head.add(helmetAccent);

  // Helmet chin bar
  const chinGeo = new THREE.BoxGeometry(0.12, 0.08, 0.14);
  const chin = new THREE.Mesh(chinGeo, helmetMat);
  chin.position.set(0.09, -0.06, 0);
  head.add(chin);

  // Aero peak / visor sunshade
  const peakGeo = new THREE.ConeGeometry(0.15, 0.18, 12, 1, false, -Math.PI / 2, Math.PI);
  peakGeo.rotateX(Math.PI / 2);
  peakGeo.rotateZ(-Math.PI / 6);
  const peak = new THREE.Mesh(peakGeo, helmetMat);
  peak.position.set(0.08, 0.11, 0);
  head.add(peak);

  // Mirrored Visor
  const visorGeo = new THREE.CylinderGeometry(0.138, 0.138, 0.085, 16, 1, false, -Math.PI / 2.5, Math.PI / 1.25);
  visorGeo.rotateZ(Math.PI / 2);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  head.add(visor);

  // Visor tear-off pull tab (zrywka)
  const tearOffGeo = new THREE.BoxGeometry(0.012, 0.022, 0.05);
  const tearOffMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const tearOff = new THREE.Mesh(tearOffGeo, tearOffMat);
  tearOff.position.set(0.12, 0.02, -0.14);
  head.add(tearOff);

  // Goggle strap wrapping helmet
  const strapGeo = new THREE.CylinderGeometry(0.162, 0.162, 0.032, 20, 1, true);
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  const strap = new THREE.Mesh(strapGeo, strapMat);
  head.add(strap);

  const neckBraceGeo = new THREE.TorusGeometry(0.105, 0.02, 10, 18);
  const neckBrace = new THREE.Mesh(neckBraceGeo, suitTrimMat);
  neckBrace.rotation.x = Math.PI / 2;
  neckBrace.position.set(0.02, -0.13, 0);
  head.add(neckBrace);

  // ARTICULATED ARMS GRIPPING HANDLEBARS
  const gloveGeo = new THREE.SphereGeometry(0.052, 10, 8);
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.75 });

  // Left arm (clutch side at -Z)
  const armLGroup = new THREE.Group();
  armLGroup.position.set(0.18, 0.32, -0.20);
  torsoGroup.add(armLGroup);

  const armLCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.16, 0.06, -0.08),
    new THREE.Vector3(0.42, 0.04, -0.14),
  ]);
  const armL = new THREE.Mesh(new THREE.TubeGeometry(armLCurve, 12, 0.042, 8, false), suitMat);
  armLGroup.add(armL);

  const elbowPadGeo = new THREE.SphereGeometry(0.05, 10, 8);
  const elbowPadL = new THREE.Mesh(elbowPadGeo, suitAccentMat);
  elbowPadL.position.set(0.25, 0.05, -0.09);
  armLGroup.add(elbowPadL);

  const gloveL = new THREE.Mesh(gloveGeo, gloveMat);
  gloveL.position.set(0.44, 0.04, -0.15);
  armLGroup.add(gloveL);

  // Right arm (throttle side at +Z)
  const armRGroup = new THREE.Group();
  armRGroup.position.set(0.18, 0.32, 0.20);
  torsoGroup.add(armRGroup);

  const armRCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.16, 0.06, 0.08),
    new THREE.Vector3(0.42, 0.04, 0.14),
  ]);
  const armR = new THREE.Mesh(new THREE.TubeGeometry(armRCurve, 12, 0.042, 8, false), suitMat);
  armRGroup.add(armR);

  const elbowPadR = new THREE.Mesh(elbowPadGeo, suitAccentMat);
  elbowPadR.position.set(0.25, 0.05, 0.09);
  armRGroup.add(elbowPadR);

  const gloveR = new THREE.Mesh(gloveGeo, gloveMat);
  gloveR.position.set(0.44, 0.04, 0.15);
  armRGroup.add(gloveR);

  // ARTICULATED LEGS & STEEL SHOE
  // LEFT LEG: Equipped with speedway STEEL SHOE (kapeć żużlowy z blachą) on inside of turn (-Z)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(0.02, 0.08, -0.16);
  rider.add(leftLeg);

  // Left Thigh
  const thighLCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.16, -0.12, -0.06),
    new THREE.Vector3(0.24, -0.28, -0.10),
  ]);
  const thighL = new THREE.Mesh(new THREE.TubeGeometry(thighLCurve, 12, 0.062, 10, false), suitMat);
  leftLeg.add(thighL);

  // Knee slider pad
  const kneeSliderGeo = new THREE.SphereGeometry(0.058, 10, 8);
  const kneeSliderL = new THREE.Mesh(kneeSliderGeo, suitAccentMat);
  kneeSliderL.position.set(0.24, -0.28, -0.10);
  leftLeg.add(kneeSliderL);

  // Left Shin / Boot
  const shinLCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.24, -0.28, -0.10),
    new THREE.Vector3(0.32, -0.46, -0.14),
  ]);
  const shinL = new THREE.Mesh(new THREE.TubeGeometry(shinLCurve, 10, 0.052, 10, false), suitMat);
  leftLeg.add(shinL);

  // Left Boot
  const bootGeo = new THREE.BoxGeometry(0.18, 0.10, 0.10);
  const bootL = new THREE.Mesh(bootGeo, suitMat);
  bootL.position.set(0.36, -0.50, -0.14);
  leftLeg.add(bootL);

  const bootLToeGeo = new THREE.BoxGeometry(0.08, 0.06, 0.11);
  const bootLToe = new THREE.Mesh(bootLToeGeo, leatherMat);
  bootLToe.position.set(0.43, -0.51, -0.14);
  leftLeg.add(bootLToe);

  // POLISHED STAINLESS STEEL SHOE SKID PLATE (BLACHA ŻUŻLOWA)
  const skidPlateGeo = new THREE.BoxGeometry(0.22, 0.022, 0.12);
  const skidPlate = new THREE.Mesh(skidPlateGeo, steelShoeMat);
  skidPlate.position.set(0.36, -0.56, -0.14);
  leftLeg.add(skidPlate);

  // Curved steel toe cap
  const toeCapGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12, 1, false, 0, Math.PI);
  toeCapGeo.rotateZ(Math.PI / 2);
  toeCapGeo.rotateY(Math.PI / 2);
  const toeCap = new THREE.Mesh(toeCapGeo, steelShoeMat);
  toeCap.position.set(0.46, -0.52, -0.14);
  leftLeg.add(toeCap);

  // RIGHT LEG (outside of turn at +Z, resting firmly on footpeg)
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.02, 0.08, 0.16);
  rider.add(rightLeg);

  const thighRCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.12, -0.14, 0.04),
    new THREE.Vector3(0.20, -0.28, 0.06),
  ]);
  const thighR = new THREE.Mesh(new THREE.TubeGeometry(thighRCurve, 12, 0.062, 10, false), suitMat);
  rightLeg.add(thighR);

  const shinRCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.20, -0.28, 0.06),
    new THREE.Vector3(0.14, -0.44, 0.05),
  ]);
  const shinR = new THREE.Mesh(new THREE.TubeGeometry(shinRCurve, 10, 0.052, 10, false), suitMat);
  rightLeg.add(shinR);

  const bootR = new THREE.Mesh(bootGeo, suitMat);
  bootR.position.set(0.22, -0.48, 0.05);
  rightLeg.add(bootR);

  const bootRToe = new THREE.Mesh(bootLToeGeo, leatherMat);
  bootRToe.position.set(0.29, -0.49, 0.05);
  rightLeg.add(bootRToe);

  // Dust & Spark Emitters (inside of the turn at -Z)
  const dustEmitter = new THREE.Vector3(-0.72, 0.1, 0);
  const shoeContactPoint = new THREE.Vector3(0.16, 0.02, -0.38);

  // Cast and receive shadows across entire hierarchy
  chassisGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  let frontForkVisual = 0;
  let riderTwist = 0;
  let legBlend = 0;
  let flameStretch = 0;
  let wheelSpinVisual = 0;
  let idlePhase = Math.random() * Math.PI * 2;

  return {
    root,
    frontFork,
    frontWheel,
    rearWheel,
    rider,
    leftLeg,
    rightLeg,
    head,
    helmetMesh,
    exhaustGlow,
    exhaustFlame,
    exhaustHeaderMat,
    dustEmitter,
    shoeContactPoint,
    setHelmetColor: (color: HelmetColor) => {
      helmetMat.color.setHex(HELMET_COLORS[color]);
    },
    updateVisuals: (
      leanAngle: number,
      pitchAngle: number,
      steerAngle: number,
      speed: number,
      slideAngle: number,
      delta: number,
      isGrindingShoe: boolean,
      bodyTuck: number = 0,
      exhaustHeat: number = 0.2,
      throttle: number = 0
    ) => {
      idlePhase += delta * (1.5 + speed * 0.03);
      const idlePulse = Math.sin(idlePhase) * (speed > 1 ? 1 : 0.35);

      // 1. LEAN & SLIDE DYNAMICS
      // Leaning INWARD into corner:
      // In Three.js with root.rotation.y = -bike.rotation:
      // Local -Z is the inside of the turn (infield curb).
      // Negative rotation around X tilts +Y toward -Z (LEFT into turn!)
      chassisGroup.rotation.x = -leanAngle - idlePulse * 0.01;

      // 2. REAR SLIDE OUTWARD ("tył ucieka na zewnątrz, delikatnie"):
      // In local coordinates: +X is forward, -X is rear.
      // Positive rotation around Y swings rear (-X) toward +Z (OUTWARD to the fence)
      // and points the front wheel (+X) toward -Z (INWARD toward the apex)!
      riderTwist += (((slideAngle * 0.46) + steerAngle * 0.08) - riderTwist) * Math.min(1, delta * 8);
      chassisGroup.rotation.y = riderTwist;

      // 3. Wheelie Pitch (front wheel lifts on heavy acceleration)
      chassisGroup.rotation.z = pitchAngle + idlePulse * 0.015;

      // 4. Wheel Spin
      const spinDelta = (speed / 0.33) * delta;
      wheelSpinVisual += spinDelta;
      rearWheel.rotation.z = -wheelSpinVisual;
      frontWheel.rotation.z = -wheelSpinVisual;

      // 5. Front Handlebar & Fork Steering
      // Steer left (steerAngle < 0): turns front wheel toward -Z (LEFT into turn)
      // Counter-steer right (steerAngle > 0): turns front wheel toward +Z (RIGHT to hold slide)
      frontForkVisual += ((steerAngle * 0.45) - frontForkVisual) * Math.min(1, delta * 10);
      frontFork.rotation.y = frontForkVisual;
      frontFork.rotation.z = -0.02 + idlePulse * 0.01;

      // 6. Rider Left Leg Dynamic Articulation (extending steel shoe down to shale)
      // Left leg reaches down and out toward -Z (the inside track shale)
      const legExtension = Math.min(1.0, Math.max(0, (leanAngle * 0.95) + (slideAngle * 0.65)));
      legBlend += (legExtension - legBlend) * Math.min(1, delta * 8);
      leftLeg.position.y = 0.08 - legBlend * 0.26;
      leftLeg.position.z = -0.16 - legBlend * 0.24;
      leftLeg.rotation.x = -legBlend * 0.48;
      leftLeg.rotation.z = -legBlend * 0.12;
      rightLeg.rotation.x = 0.08 + Math.min(0.35, speed * 0.008) - legBlend * 0.06;
      rightLeg.rotation.z = 0.03 + idlePulse * 0.01;

      // 7. Rider Body Posture & Weight Transfer
      // Body tuck forward over tank on straights/acceleration
      rider.position.y = 0.68 + Math.sin(idlePhase * 2.2) * 0.01;
      rider.rotation.z = Math.PI / 16 + bodyTuck * 0.28 - Math.abs(slideAngle) * 0.05;
      // Upper body leans into turn apex (toward -Z)
      rider.rotation.x = -leanAngle * 0.34 + idlePulse * 0.02;
      // Head looks ahead through the corner curve
      head.rotation.y = (steerAngle * 0.25) - (leanAngle > 0.1 ? 0.32 : 0);
      head.rotation.z = -leanAngle * 0.08 + idlePulse * 0.03;
      head.position.y = 0.46 + Math.sin(idlePhase * 1.8) * 0.01;

      // 8. Exhaust header heat glow (on right side +Z)
      exhaustHeaderMat.emissiveIntensity = 0.12 + exhaustHeat * 1.85;
      exhaustGlow.intensity = 0.4 + exhaustHeat * 2.2 + (throttle > 0.8 ? 0.8 : 0);

      // 9. Backfire flame pops on throttle lift
      if (throttle < 0.1 && speed > 10 && Math.random() > 0.92) {
        flameStretch = 1.2;
        exhaustFlame.material.opacity = 0.9;
      } else {
        exhaustFlame.material.opacity = Math.max(0, exhaustFlame.material.opacity - 8 * delta);
        flameStretch += (0.65 + throttle * 0.9 - flameStretch) * Math.min(1, delta * 10);
      }
      exhaustFlame.scale.set(0.8 + throttle * 0.7, flameStretch, 0.8 + throttle * 0.45);
    },
    dispose: () => {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
    },
  };
}
