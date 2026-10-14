import * as THREE from 'three';
import { TRACK_CONFIG } from './physics';
import { TrackCondition } from '../types/speedway';

export interface StadiumSceneElements {
  group: THREE.Group;
  trackMesh: THREE.Mesh;
  trackMaterial: THREE.MeshStandardMaterial;
  tapesGroup: THREE.Group;
  greenStartLight: THREE.PointLight;
  greenLampMesh: THREE.Mesh;
  redLampMesh: THREE.Mesh;
  floodlights: THREE.SpotLight[];
  volumetricCones: THREE.Mesh[];
  sunLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  setTapesUp: (isUp: boolean) => void;
  setStartLights: (state: 'off' | 'red' | 'green') => void;
  updateEnvironment: (condition: TrackCondition) => void;
  dispose: () => void;
}

/**
 * Creates photorealistic Unreal Engine-grade speedway stadium and procedural dirt shader
 */
export function createSpeedwayStadium(): StadiumSceneElements {
  const group = new THREE.Group();

  const { straightLength, turnRadius, trackWidth, turn1Center, turn2Center } = TRACK_CONFIG;
  const halfStraight = straightLength / 2;
  const rInner = turnRadius - trackWidth / 2;
  const rOuter = turnRadius + trackWidth / 2;

  // 1. PROCEDURAL 2048x2048 ULTRA-DETAILED DIRT TRACK TEXTURES
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  // Deep rich shale/granulate base (prawdziwy żużel z Gorzowa i Zielonej Góry)
  ctx.fillStyle = '#2e231c';
  ctx.fillRect(0, 0, 2048, 2048);

  // Micro-granulate speckles & quartz flecks that glint in the floodlights
  const imgData = ctx.getImageData(0, 0, 2048, 2048);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 60;
    // Glinting shale quartz pebble
    const glint = Math.random() > 0.99 ? 85 : 0;
    data[i] = Math.max(0, Math.min(255, data[i] + noise + glint));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise * 0.8 + glint * 0.95));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 0.65 + glint * 0.85));
  }
  ctx.putImageData(imgData, 0, 0);

  // Deep tire rut grooves (koleiny i wyjeżdżony tor)
  ctx.strokeStyle = 'rgba(20, 14, 10, 0.45)';
  ctx.lineWidth = 6;
  for (let y = 0; y < 2048; y += 14) {
    ctx.beginPath();
    ctx.moveTo(0, y + (Math.random() - 0.5) * 8);
    ctx.bezierCurveTo(
      680,
      y + (Math.random() - 0.5) * 16,
      1360,
      y + (Math.random() - 0.5) * 16,
      2048,
      y + (Math.random() - 0.5) * 8
    );
    ctx.stroke();
  }

  // Dark polished inside groove (odbetonowana czarna kreda)
  const grooveGrad = ctx.createLinearGradient(0, 0, 0, 2048);
  grooveGrad.addColorStop(0, 'rgba(15, 10, 7, 0.55)');
  grooveGrad.addColorStop(0.25, 'rgba(15, 10, 7, 0.15)');
  grooveGrad.addColorStop(0.7, 'rgba(55, 40, 28, 0.25)'); // loose brown cushion near wall
  grooveGrad.addColorStop(1, 'rgba(75, 50, 32, 0.5)');
  ctx.fillStyle = grooveGrad;
  ctx.fillRect(0, 0, 2048, 2048);

  // White chalk start lines & gate boxes A, B, C, D
  ctx.fillStyle = 'rgba(240, 240, 245, 0.95)';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(120 + i * 460, 1920, 380, 24);
  }

  const dirtTexture = new THREE.CanvasTexture(canvas);
  dirtTexture.wrapS = THREE.RepeatWrapping;
  dirtTexture.wrapT = THREE.RepeatWrapping;
  dirtTexture.repeat.set(16, 2);
  dirtTexture.colorSpace = THREE.SRGBColorSpace;
  dirtTexture.anisotropy = 16;

  // Bump Map for granular gravel depth
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 1024;
  bumpCanvas.height = 1024;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 1024, 1024);
  const bData = bCtx.getImageData(0, 0, 1024, 1024);
  for (let i = 0; i < bData.data.length; i += 4) {
    const val = 128 + (Math.random() - 0.5) * 95;
    bData.data[i] = val;
    bData.data[i + 1] = val;
    bData.data[i + 2] = val;
  }
  bCtx.putImageData(bData, 0, 0);

  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  bumpTexture.wrapS = THREE.RepeatWrapping;
  bumpTexture.wrapT = THREE.RepeatWrapping;
  bumpTexture.repeat.set(32, 4);

  // Advanced PBR Track Material with custom shader for dynamic wetness, sheen, and roughness
  const trackMaterial = new THREE.MeshStandardMaterial({
    map: dirtTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.09,
    roughness: 0.82,
    metalness: 0.12,
  });

  trackMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uWetness = { value: 0.2 };
    shader.uniforms.uHardness = { value: 0.5 };

    shader.fragmentShader = `
      uniform float uWetness;
      uniform float uHardness;
      ${shader.fragmentShader}
    `;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `
      #include <roughnessmap_fragment>
      roughnessFactor = mix(roughnessFactor, 0.22, uWetness);
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>
      diffuseColor.rgb *= mix(1.0, 0.62, uWetness);
      `
    );

    trackMaterial.userData.shader = shader;
  };

  // 2. BUILD TRACK OVAL MESH
  const trackGeo = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const addQuad = (
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number],
    p4: [number, number, number],
    uv1: [number, number],
    uv2: [number, number],
    uv3: [number, number],
    uv4: [number, number]
  ) => {
    const baseIdx = vertices.length / 3;
    vertices.push(...p1, ...p2, ...p3, ...p4);
    uvs.push(...uv1, ...uv2, ...uv3, ...uv4);
    normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
    indices.push(baseIdx, baseIdx + 1, baseIdx + 2, baseIdx, baseIdx + 2, baseIdx + 3);
  };

  const segments = 56;

  // Turn 1 (Western bend)
  for (let i = 0; i < segments; i++) {
    const a1 = -Math.PI / 2 - (i / segments) * Math.PI;
    const a2 = -Math.PI / 2 - ((i + 1) / segments) * Math.PI;

    const x1_in = turn1Center.x + Math.cos(a1) * rInner;
    const z1_in = Math.sin(a1) * rInner;
    const x1_out = turn1Center.x + Math.cos(a1) * rOuter;
    const z1_out = Math.sin(a1) * rOuter;

    const x2_in = turn1Center.x + Math.cos(a2) * rInner;
    const z2_in = Math.sin(a2) * rInner;
    const x2_out = turn1Center.x + Math.cos(a2) * rOuter;
    const z2_out = Math.sin(a2) * rOuter;

    const u1 = i / segments;
    const u2 = (i + 1) / segments;

    addQuad(
      [x1_in, 0, z1_in],
      [x1_out, 0, z1_out],
      [x2_out, 0, z2_out],
      [x2_in, 0, z2_in],
      [u1, 0],
      [u1, 1],
      [u2, 1],
      [u2, 0]
    );
  }

  // Turn 2 (Eastern bend)
  for (let i = 0; i < segments; i++) {
    const a1 = Math.PI / 2 - (i / segments) * Math.PI;
    const a2 = Math.PI / 2 - ((i + 1) / segments) * Math.PI;

    const x1_in = turn2Center.x + Math.cos(a1) * rInner;
    const z1_in = Math.sin(a1) * rInner;
    const x1_out = turn2Center.x + Math.cos(a1) * rOuter;
    const z1_out = Math.sin(a1) * rOuter;

    const x2_in = turn2Center.x + Math.cos(a2) * rInner;
    const z2_in = Math.sin(a2) * rInner;
    const x2_out = turn2Center.x + Math.cos(a2) * rOuter;
    const z2_out = Math.sin(a2) * rOuter;

    const u1 = i / segments;
    const u2 = (i + 1) / segments;

    addQuad(
      [x1_in, 0, z1_in],
      [x1_out, 0, z1_out],
      [x2_out, 0, z2_out],
      [x2_in, 0, z2_in],
      [u1, 0],
      [u1, 1],
      [u2, 1],
      [u2, 0]
    );
  }

  // Home Straight (z < 0)
  const straightSegs = 28;
  for (let i = 0; i < straightSegs; i++) {
    const x1 = halfStraight - (i / straightSegs) * straightLength;
    const x2 = halfStraight - ((i + 1) / straightSegs) * straightLength;

    const u1 = i / straightSegs;
    const u2 = (i + 1) / straightSegs;

    addQuad(
      [x1, 0, -rInner],
      [x1, 0, -rOuter],
      [x2, 0, -rOuter],
      [x2, 0, -rInner],
      [u1, 0],
      [u1, 1],
      [u2, 1],
      [u2, 0]
    );
  }

  // Back Straight (z > 0)
  for (let i = 0; i < straightSegs; i++) {
    const x1 = -halfStraight + (i / straightSegs) * straightLength;
    const x2 = -halfStraight + ((i + 1) / straightSegs) * straightLength;

    const u1 = i / straightSegs;
    const u2 = (i + 1) / straightSegs;

    addQuad(
      [x1, 0, rInner],
      [x1, 0, rOuter],
      [x2, 0, rOuter],
      [x2, 0, rInner],
      [u1, 0],
      [u1, 1],
      [u2, 1],
      [u2, 0]
    );
  }

  trackGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  trackGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  trackGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  trackGeo.setIndex(indices);

  const trackMesh = new THREE.Mesh(trackGeo, trackMaterial);
  trackMesh.receiveShadow = true;
  group.add(trackMesh);

  // 3. INNER INFIELD & CURB
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x166534,
    roughness: 0.92,
    metalness: 0.04,
  });
  const infieldShape = new THREE.Shape();
  infieldShape.absarc(turn1Center.x, 0, rInner - 0.1, -Math.PI / 2, Math.PI / 2, false);
  infieldShape.lineTo(turn2Center.x, rInner - 0.1);
  infieldShape.absarc(turn2Center.x, 0, rInner - 0.1, Math.PI / 2, -Math.PI / 2, false);
  infieldShape.lineTo(turn1Center.x, -(rInner - 0.1));

  const infieldGeo = new THREE.ShapeGeometry(infieldShape, 36);
  infieldGeo.rotateX(-Math.PI / 2);
  const infieldMesh = new THREE.Mesh(infieldGeo, grassMat);
  infieldMesh.position.y = -0.02;
  infieldMesh.receiveShadow = true;
  group.add(infieldMesh);

  // Inner curb barrier with high-contrast white paint
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const curbPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = -Math.PI / 2 - (i / 64) * Math.PI;
    curbPoints.push(new THREE.Vector3(turn1Center.x + Math.cos(a) * rInner, 0.08, Math.sin(a) * rInner));
  }
  for (let i = 0; i <= 16; i++) {
    const x = -halfStraight + (i / 16) * straightLength;
    curbPoints.push(new THREE.Vector3(x, 0.08, rInner));
  }
  for (let i = 0; i <= 64; i++) {
    const a = Math.PI / 2 - (i / 64) * Math.PI;
    curbPoints.push(new THREE.Vector3(turn2Center.x + Math.cos(a) * rInner, 0.08, Math.sin(a) * rInner));
  }
  for (let i = 0; i <= 16; i++) {
    const x = halfStraight - (i / 16) * straightLength;
    curbPoints.push(new THREE.Vector3(x, 0.08, -rInner));
  }
  const curbCurve = new THREE.CatmullRomCurve3(curbPoints, true);
  const curbGeo = new THREE.TubeGeometry(curbCurve, 128, 0.1, 8, true);
  const curbMesh = new THREE.Mesh(curbGeo, curbMat);
  group.add(curbMesh);

  // 4. BULBOUS PNEUMATIC AIR FENCE (Bandy pneumatyczne z logami Ekstraligi)
  const airFenceMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8, // Ekstraliga Blue glossy vinyl
    roughness: 0.28,
    metalness: 0.3,
  });

  const fencePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = -Math.PI / 2 - (i / 64) * Math.PI;
    fencePoints.push(new THREE.Vector3(turn1Center.x + Math.cos(a) * (rOuter + 0.1), 0.65, Math.sin(a) * (rOuter + 0.1)));
  }
  for (let i = 0; i <= 16; i++) {
    const x = -halfStraight + (i / 16) * straightLength;
    fencePoints.push(new THREE.Vector3(x, 0.65, rOuter + 0.1));
  }
  for (let i = 0; i <= 64; i++) {
    const a = Math.PI / 2 - (i / 64) * Math.PI;
    fencePoints.push(new THREE.Vector3(turn2Center.x + Math.cos(a) * (rOuter + 0.1), 0.65, Math.sin(a) * (rOuter + 0.1)));
  }
  for (let i = 0; i <= 16; i++) {
    const x = halfStraight - (i / 16) * straightLength;
    fencePoints.push(new THREE.Vector3(x, 0.65, -(rOuter + 0.1)));
  }
  const fenceCurve = new THREE.CatmullRomCurve3(fencePoints, true);
  const fenceGeo = new THREE.TubeGeometry(fenceCurve, 140, 0.62, 12, true);
  const fenceMesh = new THREE.Mesh(fenceGeo, airFenceMat);
  fenceMesh.castShadow = true;
  fenceMesh.receiveShadow = true;
  group.add(fenceMesh);

  // Yellow safety base trim on air fence
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  const trimGeo = new THREE.TubeGeometry(fenceCurve, 140, 0.18, 8, true);
  const trimMesh = new THREE.Mesh(trimGeo, trimMat);
  trimMesh.position.y = -0.45;
  group.add(trimMesh);

  // 5. STARTING GATE GANTRY & MECHANICAL TAPES
  const tapesGroup = new THREE.Group();
  tapesGroup.position.set(0, 0, -turnRadius);
  group.add(tapesGroup);

  const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
  const postGeo = new THREE.CylinderGeometry(0.14, 0.14, 5.2, 10);
  const postInner = new THREE.Mesh(postGeo, postMat);
  postInner.position.set(0, 2.6, trackWidth / 2 + 0.5);
  postInner.castShadow = true;
  tapesGroup.add(postInner);

  const postOuter = new THREE.Mesh(postGeo, postMat);
  postOuter.position.set(0, 2.6, -(trackWidth / 2 + 0.5));
  postOuter.castShadow = true;
  tapesGroup.add(postOuter);

  const beamGeo = new THREE.CylinderGeometry(0.09, 0.09, trackWidth + 1.8, 10);
  beamGeo.rotateX(Math.PI / 2);
  const beam = new THREE.Mesh(beamGeo, postMat);
  beam.position.set(0, 5.0, 0);
  tapesGroup.add(beam);

  const tapeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const tapeGeo = new THREE.BoxGeometry(0.05, 0.045, trackWidth + 0.6);

  const lowerTape = new THREE.Mesh(tapeGeo, tapeMat);
  lowerTape.position.set(0, 0.42, 0);
  tapesGroup.add(lowerTape);

  const upperTape = new THREE.Mesh(tapeGeo, tapeMat);
  upperTape.position.set(0, 0.78, 0);
  tapesGroup.add(upperTape);

  // Start Light Box (Zielone i czerwone światło startowe)
  const lightBoxGeo = new THREE.BoxGeometry(0.5, 1.3, 0.35);
  const lightBoxMat = new THREE.MeshStandardMaterial({ color: 0x09090b });
  const lightBox = new THREE.Mesh(lightBoxGeo, lightBoxMat);
  lightBox.position.set(-1.8, 3.6, 0);
  tapesGroup.add(lightBox);

  const redLampMat = new THREE.MeshStandardMaterial({ color: 0x330000, roughness: 0.2 });
  const lampGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.09, 14);
  lampGeo.rotateZ(Math.PI / 2);
  const redLampMesh = new THREE.Mesh(lampGeo, redLampMat);
  redLampMesh.position.set(0.2, 0.28, 0);
  lightBox.add(redLampMesh);

  const greenLampMat = new THREE.MeshStandardMaterial({ color: 0x003300, roughness: 0.2 });
  const greenLampMesh = new THREE.Mesh(lampGeo, greenLampMat);
  greenLampMesh.position.set(0.2, -0.28, 0);
  lightBox.add(greenLampMesh);

  const greenStartLight = new THREE.PointLight(0x22c55e, 0, 18);
  greenStartLight.position.set(-1.2, 3.2, 0);
  tapesGroup.add(greenStartLight);

  // 6. VOLUMETRIC FLOODLIGHTS & LATTICE TOWERS (Unreal Engine Stadium Atmosphere)
  const floodlights: THREE.SpotLight[] = [];
  const volumetricCones: THREE.Mesh[] = [];

  const mastPositions = [
    { x: -halfStraight - 30, z: -rOuter - 20 },
    { x: halfStraight + 30, z: -rOuter - 20 },
    { x: -halfStraight - 30, z: rOuter + 20 },
    { x: halfStraight + 30, z: rOuter + 20 },
  ];

  const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });

  mastPositions.forEach((pos) => {
    // Lattice Tower
    const towerGeo = new THREE.CylinderGeometry(0.8, 1.6, 42, 8);
    const tower = new THREE.Mesh(towerGeo, mastMat);
    tower.position.set(pos.x, 21, pos.z);
    tower.castShadow = true;
    group.add(tower);

    // Floodlight Panel Head
    const headGeo = new THREE.BoxGeometry(7, 4.5, 1.4);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(pos.x, 41.5, pos.z);
    head.lookAt(pos.x * 0.35, 0, pos.z * 0.35);
    group.add(head);

    // Blinding glowing light face
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const bulb = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 4.1), bulbMat);
    bulb.position.set(pos.x, 41.5, pos.z);
    bulb.lookAt(pos.x * 0.35, 0, pos.z * 0.35);
    bulb.translateZ(0.75);
    group.add(bulb);

    // Dynamic Spotlight casting high-res shadow map
    const spot = new THREE.SpotLight(0xf8fafc, 3.2, 160, Math.PI / 3.8, 0.45, 1.2);
    spot.position.set(pos.x, 41.5, pos.z);
    spot.target.position.set(pos.x * 0.35, 0, pos.z * 0.35);
    spot.castShadow = true;
    spot.shadow.mapSize.width = 1024;
    spot.shadow.mapSize.height = 1024;
    spot.shadow.camera.near = 10;
    spot.shadow.camera.far = 170;
    spot.shadow.bias = -0.0006;

    group.add(spot);
    group.add(spot.target);
    floodlights.push(spot);

    // Volumetric Light Beam Cone (promienie świetlne rozcinające nocny kurz!)
    const coneGeo = new THREE.ConeGeometry(24, 75, 16, 1, true);
    coneGeo.rotateX(Math.PI / 2);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.045,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(pos.x, 41.5, pos.z);
    cone.lookAt(pos.x * 0.35, 0, pos.z * 0.35);
    cone.translateZ(37.5);
    group.add(cone);
    volumetricCones.push(cone);
  });

  // 7. SUN & AMBIENT
  const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.7);
  hemiLight.position.set(0, 50, 0);
  group.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xffedd5, 2.0);
  sunLight.position.set(65, 50, -45);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  const d = 85;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0005;
  group.add(sunLight);

  // 8. 360-DEGREE TIERED OVAL CONCRETE STADIUM BOWL & SEATING
  const stadiumGroup = new THREE.Group();
  group.add(stadiumGroup);

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.85,
    metalness: 0.15,
  });

  const seatBlueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 });
  const seatYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.6 });
  const seatRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
  const seatWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const seatMats = [seatBlueMat, seatYellowMat, seatRedMat, seatWhiteMat];

  // Build 8 stepped concrete tiers around the entire oval
  const tiersCount = 7;
  const baseOffset = rOuter + 2.5;

  for (let t = 0; t < tiersCount; t++) {
    const tierR = baseOffset + t * 2.8;
    const tierY = 0.8 + t * 1.5;
    const tierShape = new THREE.Shape();
    
    // Outer boundary of tier
    const tOut = tierR + 2.6;
    const tIn = tierR;

    // Curved ends
    // Turn 1
    const segmentsT = 32;
    const tierPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= segmentsT; i++) {
      const a = -Math.PI / 2 - (i / segmentsT) * Math.PI;
      tierPoints.push(new THREE.Vector3(turn1Center.x + Math.cos(a) * tIn, tierY, Math.sin(a) * tIn));
    }
    for (let i = 0; i <= 8; i++) {
      const x = -halfStraight + (i / 8) * straightLength;
      tierPoints.push(new THREE.Vector3(x, tierY, tIn));
    }
    for (let i = 0; i <= segmentsT; i++) {
      const a = Math.PI / 2 - (i / segmentsT) * Math.PI;
      tierPoints.push(new THREE.Vector3(turn2Center.x + Math.cos(a) * tIn, tierY, Math.sin(a) * tIn));
    }
    for (let i = 0; i <= 8; i++) {
      const x = halfStraight - (i / 8) * straightLength;
      tierPoints.push(new THREE.Vector3(x, tierY, -tIn));
    }

    const tierCurve = new THREE.CatmullRomCurve3(tierPoints, true);
    const stepMesh = new THREE.Mesh(new THREE.TubeGeometry(tierCurve, 96, 0.75, 6, true), concreteMat);
    stepMesh.receiveShadow = true;
    stadiumGroup.add(stepMesh);

    // Colored seat blocks on each tier
    const seatMesh = new THREE.Mesh(
      new THREE.TubeGeometry(tierCurve, 96, 0.28, 6, true),
      seatMats[t % seatMats.length]
    );
    seatMesh.position.y = 0.5;
    stadiumGroup.add(seatMesh);
  }

  // Backing stadium wall / roof canopy
  const outerWallRadius = baseOffset + tiersCount * 2.8 + 1.5;
  const wallPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = -Math.PI / 2 - (i / 48) * Math.PI;
    wallPoints.push(new THREE.Vector3(turn1Center.x + Math.cos(a) * outerWallRadius, 6.0, Math.sin(a) * outerWallRadius));
  }
  for (let i = 0; i <= 12; i++) {
    const x = -halfStraight + (i / 12) * straightLength;
    wallPoints.push(new THREE.Vector3(x, 6.0, outerWallRadius));
  }
  for (let i = 0; i <= 48; i++) {
    const a = Math.PI / 2 - (i / 48) * Math.PI;
    wallPoints.push(new THREE.Vector3(turn2Center.x + Math.cos(a) * outerWallRadius, 6.0, Math.sin(a) * outerWallRadius));
  }
  for (let i = 0; i <= 12; i++) {
    const x = halfStraight - (i / 12) * straightLength;
    wallPoints.push(new THREE.Vector3(x, 6.0, -outerWallRadius));
  }
  const wallCurve = new THREE.CatmullRomCurve3(wallPoints, true);
  const backWall = new THREE.Mesh(new THREE.TubeGeometry(wallCurve, 120, 6.0, 6, true), concreteMat);
  backWall.receiveShadow = true;
  stadiumGroup.add(backWall);

  // 9. CROWD & SPEEDWAY FAN BANNERS (Sektor gości, Żyleta, flagi)
  const bannerMat1 = new THREE.MeshBasicMaterial({ color: 0x1d4ed8 });
  const bannerMat2 = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const bannerMat3 = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
  const bannerMats = [bannerMat1, bannerMat2, bannerMat3];

  for (let b = 0; b < 16; b++) {
    const bannerAngle = (b / 16) * Math.PI * 2;
    const bannerR = baseOffset + 6;
    const bx = Math.cos(bannerAngle) * (turnRadius + 22);
    const bz = Math.sin(bannerAngle) * (turnRadius + 22);
    const bannerGeo = new THREE.PlaneGeometry(6.5, 1.2);
    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMats[b % bannerMats.length]);
    bannerMesh.position.set(bx, 4.2, bz);
    bannerMesh.lookAt(0, 4.2, 0);
    stadiumGroup.add(bannerMesh);
  }

  // 10. STEEL CATCH FENCE WITH WIRE MESH (Siatka bezpieczeństwa)
  const catchFencePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = -Math.PI / 2 - (i / 64) * Math.PI;
    catchFencePoints.push(new THREE.Vector3(turn1Center.x + Math.cos(a) * (rOuter + 0.35), 2.4, Math.sin(a) * (rOuter + 0.35)));
  }
  for (let i = 0; i <= 16; i++) {
    const x = -halfStraight + (i / 16) * straightLength;
    catchFencePoints.push(new THREE.Vector3(x, 2.4, rOuter + 0.35));
  }
  for (let i = 0; i <= 64; i++) {
    const a = Math.PI / 2 - (i / 64) * Math.PI;
    catchFencePoints.push(new THREE.Vector3(turn2Center.x + Math.cos(a) * (rOuter + 0.35), 2.4, Math.sin(a) * (rOuter + 0.35)));
  }
  for (let i = 0; i <= 16; i++) {
    const x = halfStraight - (i / 16) * straightLength;
    catchFencePoints.push(new THREE.Vector3(x, 2.4, -(rOuter + 0.35)));
  }
  const catchCurve = new THREE.CatmullRomCurve3(catchFencePoints, true);
  const catchMeshMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.9,
    roughness: 0.3,
    wireframe: true,
  });
  const catchFence = new THREE.Mesh(new THREE.TubeGeometry(catchCurve, 140, 1.8, 4, true), catchMeshMat);
  stadiumGroup.add(catchFence);

  // 11. REFEREE TOWER & DIGITAL TIMING SCREEN (Wieżyczka sędziowska na prostej)
  const refTower = new THREE.Group();
  refTower.position.set(-6, 0, -(rOuter + 4.5));
  stadiumGroup.add(refTower);

  // Steel support pillars
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.2 });
  const pGeo = new THREE.CylinderGeometry(0.18, 0.18, 6.5, 8);
  for (let px of [-2.2, 2.2]) {
    for (let pz of [-1.5, 1.5]) {
      const p = new THREE.Mesh(pGeo, pillarMat);
      p.position.set(px, 3.25, pz);
      refTower.add(p);
    }
  }

  // Glass observation cabin
  const cabinGeo = new THREE.BoxGeometry(4.8, 2.8, 3.4);
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.2 });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 7.2, 0);
  refTower.add(cabin);

  // Glass front facing track
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.05, transmission: 0.7, transparent: true, opacity: 0.8 });
  const glassWindow = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.8), glassMat);
  glassWindow.position.set(0, 7.3, 1.72);
  refTower.add(glassWindow);

  // Big digital LED score / heat clock board
  const screenMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.2), screenMat);
  screen.position.set(0, 9.2, 1.72);
  refTower.add(screen);

  // 12. INFIELD PARKED SPEEDWAY TRACTOR (Ciągnik do równania toru)
  const tractorGroup = new THREE.Group();
  tractorGroup.position.set(15, 0, -10);
  tractorGroup.rotation.y = 0.5;
  stadiumGroup.add(tractorGroup);

  const tractorBodyMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 }); // John Deere Green
  const tractorBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 1.3), tractorBodyMat);
  tractorBody.position.set(0, 1.2, 0);
  tractorGroup.add(tractorBody);

  const tractorWheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });
  const tWheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.35, 12);
  tWheelGeo.rotateZ(Math.PI / 2);
  for (let tx of [-0.8, 0.8]) {
    for (let tz of [-0.75, 0.75]) {
      const tw = new THREE.Mesh(tWheelGeo, tractorWheelMat);
      tw.position.set(tx, 0.55, tz);
      tractorGroup.add(tw);
    }
  }

  // Set tapes animated up/down
  const setTapesUp = (isUp: boolean) => {
    lowerTape.position.y = isUp ? 4.6 : 0.42;
    upperTape.position.y = isUp ? 4.8 : 0.78;
  };

  const setStartLights = (state: 'off' | 'red' | 'green') => {
    if (state === 'green') {
      (redLampMesh.material as THREE.MeshStandardMaterial).color.setHex(0x330000);
      (greenLampMesh.material as THREE.MeshStandardMaterial).color.setHex(0x22c55e);
      (greenLampMesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x22c55e);
      (greenLampMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.5;
      greenStartLight.intensity = 4.0;
    } else if (state === 'red') {
      (redLampMesh.material as THREE.MeshStandardMaterial).color.setHex(0xef4444);
      (redLampMesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0xef4444);
      (redLampMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.5;
      (greenLampMesh.material as THREE.MeshStandardMaterial).color.setHex(0x003300);
      (greenLampMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
      greenStartLight.intensity = 0;
    } else {
      (redLampMesh.material as THREE.MeshStandardMaterial).color.setHex(0x330000);
      (redLampMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
      (greenLampMesh.material as THREE.MeshStandardMaterial).color.setHex(0x003300);
      (greenLampMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
      greenStartLight.intensity = 0;
    }
  };

  const updateEnvironment = (condition: TrackCondition) => {
    if (condition.timeOfDay === 'day') {
      sunLight.intensity = condition.weather === 'rainy' ? 0.7 : 2.5;
      sunLight.position.set(55, 65, -35);
      sunLight.color.setHex(0xfffbeb);
      hemiLight.intensity = 0.85;
      floodlights.forEach((fl) => {
        fl.intensity = 0.2;
      });
      volumetricCones.forEach((cone) => {
        (cone.material as THREE.MeshBasicMaterial).opacity = 0;
      });
    } else if (condition.timeOfDay === 'sunset') {
      sunLight.intensity = 1.6;
      sunLight.position.set(75, 24, -50);
      sunLight.color.setHex(0xfb923c);
      hemiLight.intensity = 0.55;
      floodlights.forEach((fl) => {
        fl.intensity = 2.2;
        fl.color.setHex(0xffedd5);
      });
      volumetricCones.forEach((cone) => {
        (cone.material as THREE.MeshBasicMaterial).opacity = 0.035;
      });
    } else {
      // Night: Maximum stadium illumination & volumetric beams
      sunLight.intensity = 0.08;
      sunLight.color.setHex(0x1e293b);
      hemiLight.intensity = 0.3;
      hemiLight.color.setHex(0x38bdf8);
      floodlights.forEach((fl) => {
        fl.intensity = 4.2;
        fl.color.setHex(0xf8fafc);
      });
      volumetricCones.forEach((cone) => {
        (cone.material as THREE.MeshBasicMaterial).opacity = 0.06;
      });
    }

    let moistureVal = 0.15;
    if (condition.weather === 'rainy') {
      moistureVal = 0.85;
    } else if (condition.weather === 'overcast') {
      moistureVal = 0.42;
    } else {
      moistureVal = condition.trackGrip === 'grippy' ? 0.4 : 0.15;
    }

    if (trackMaterial.userData.shader) {
      trackMaterial.userData.shader.uniforms.uWetness.value = moistureVal;
      trackMaterial.userData.shader.uniforms.uHardness.value = condition.hardness;
    }
  };

  return {
    group,
    trackMesh,
    trackMaterial,
    tapesGroup,
    greenStartLight,
    greenLampMesh,
    redLampMesh,
    floodlights,
    volumetricCones,
    sunLight,
    hemiLight,
    setTapesUp,
    setStartLights,
    updateEnvironment,
    dispose: () => {
      trackGeo.dispose();
      trackMaterial.dispose();
      dirtTexture.dispose();
      bumpTexture.dispose();
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    },
  };
}
