import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { RobotPart } from '../../types';
import type { ArenaGameMode, ArenaPlayer } from '../../types/arena';
import {
  createGrassPitchTexture,
  createSoccerBallTexture,
  createLedBannerTexture,
  createCleanroomFloorTexture,
  createWarehouseConcreteTexture,
  createCrateTexture,
  createAsphaltTexture,
  createBoostPadTexture,
  createShojiWallTexture,
  createNoboriBannerTexture,
  createCornerFlagTexture,
  createOscilloscopeTexture,
  createServerRackTexture,
  createCheckeredLineTexture,
  createHazardStripeTexture,
} from './arenaTextures';

interface ArenaCanvas3DProps {
  parts: RobotPart[];
  isAutonomous: boolean;
  gameMode: ArenaGameMode;
  onUpdateTelemetry: (data: { hp: number; speed: number; energy: number; x: number; z: number; angle: number }) => void;
  onCollisionImpact: (damage: number, impactPoint: { x: number; z: number }) => void;
  onGameEvent: (event: { type: 'goal' | 'ringout' | 'crate' | 'lap'; title: string; subtitle: string; scoreAdd: number }) => void;
  cameraMode: 'chase' | 'top' | 'fpv';
  players?: ArenaPlayer[];
}

export const ArenaCanvas3D: React.FC<ArenaCanvas3DProps> = ({
  parts,
  isAutonomous,
  gameMode,
  onUpdateTelemetry,
  onCollisionImpact,
  onGameEvent,
  cameraMode,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const [, setPlayerPos] = useState<{ x: number; z: number; angle: number }>({ x: 0, z: 0, angle: 0 });

  const hasUltrasonic = parts.find(p => p.iconType === 'ultrasonic')?.enabled ?? true;
  const hasLidar = parts.find(p => p.iconType === 'lidar')?.enabled ?? false;
  const hasWedge = parts.find(p => p.iconType === 'wedge')?.enabled ?? false;

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    const rect = container.getBoundingClientRect();
    const width = rect.width > 50 ? rect.width : (container.clientWidth || window.innerWidth || 1000);
    const height = rect.height > 50 ? rect.height : (container.clientHeight || 520);

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.2, 500);
    const startCamX = gameMode === 'line' ? -16 : (gameMode === 'warehouse' ? -12 : 0);
    const startCamZ = gameMode === 'sumo' ? 9.5 : (gameMode === 'football' ? 17.5 : (gameMode === 'line' ? -18.5 : (gameMode === 'warehouse' ? -17.5 : (gameMode === 'racing' ? 21.5 : -5.5))));
    camera.position.set(startCamX, 3.2, startCamZ);
    camera.lookAt(startCamX, 0.8, startCamZ + (gameMode === 'sumo' || gameMode === 'football' || gameMode === 'racing' ? -5.5 : 5.5));

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls (Blender & CAD 360° Sichqoncha Boshqaruvi)
    const initialTargetZ = gameMode === 'sumo' ? 4 : (gameMode === 'football' ? 12 : (gameMode === 'line' ? -12 : (gameMode === 'warehouse' ? -12 : (gameMode === 'racing' ? 16 : 0))));
    const initialTargetX = gameMode === 'line' ? -16 : (gameMode === 'warehouse' ? -12 : 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.02; // Yer ostiga tushib ketmaslik
    controls.minDistance = 1.0;
    controls.maxDistance = 85.0;
    controls.target.set(initialTargetX, 0.8, initialTargetZ);

    // EXACT user requested mouse mapping:
    // - O'rta tugma (g'ildirak bosish): Modelni barcha burchaklardan 360° erkin aylantirish (Blender/CAD)
    // - Chap tugma (LMB): Standart uslubda aylantirish
    // - G'ildirak aylantirish (Scroll): Yaqinlashtirish / Uzoqlashtirish (Zoom In / Out)
    // - O'ng tugma (RMB): Kamerani maydon bo'ylab tekis siljitish (Pan)
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.ROTATE,
      RIGHT: THREE.MOUSE.PAN,
    };

    // Interactive elements refs
    let ballMesh: THREE.Mesh | null = null;
    let ballVelocity = new THREE.Vector3(0, 0, 0);
    const crates: THREE.Mesh[] = [];
    const boostPads: THREE.Mesh[] = [];
    let arenaBoundary = 35; // Default boundary
    let sumoWarningRingMat: THREE.MeshBasicMaterial | null = null;
    let lineTrackCurve: THREE.CatmullRomCurve3 | null = null;
    let currentLap = 1;
    let lastLapCrossTime = 0;

    // =========================================================================
    // 🥋 1 & 2-BOSQICH: ROBOSUMO (Ultra-Realistic Cyber Dojo Arena)
    // =========================================================================
    if (gameMode === 'sumo') {
      scene.background = new THREE.Color(0x060913); // High-tech deep cyber void
      arenaBoundary = 25;

      // Dramatic Arena Studio Lighting (High Contrast PBR)
      const hemiDojo = new THREE.HemisphereLight(0x38bdf8, 0x090d16, 1.2);
      scene.add(hemiDojo);

      const dirDojo = new THREE.DirectionalLight(0xffffff, 2.8);
      dirDojo.position.set(12, 28, 12);
      dirDojo.castShadow = true;
      dirDojo.shadow.mapSize.width = 2048;
      dirDojo.shadow.mapSize.height = 2048;
      scene.add(dirDojo);

      // Central High-Power Cyber Spotlight illuminating Dohyo
      const dojoSpot = new THREE.SpotLight(0x00f0ff, 4.5, 50, Math.PI / 3, 0.35);
      dojoSpot.position.set(0, 22, 0);
      dojoSpot.target.position.set(0, 0, 0);
      scene.add(dojoSpot);
      scene.add(dojoSpot.target);

      // Dual High-Energy Rim Lights (Cyan & Purple Neon)
      const ringLight1 = new THREE.PointLight(0x00f0ff, 3.5, 25);
      ringLight1.position.set(-11, 4, -11);
      const ringLight2 = new THREE.PointLight(0xec4899, 3.5, 25);
      ringLight2.position.set(11, 4, 11);
      scene.add(ringLight1, ringLight2);

      // Ultra-Polished Obsidian Cyber Floor (Deep Reflective Floor)
      const floorGeo = new THREE.PlaneGeometry(64, 64);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x080d1a,
        roughness: 0.2,
        metalness: 0.85,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      // Cyber Grid Over Floor
      const gridHelper = new THREE.GridHelper(64, 32, 0x1d4ed8, 0x0e172a);
      gridHelper.position.y = 0.005;
      scene.add(gridHelper);

      // Heavy Overhead Cyber Gantry Truss Beams
      const beamMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.3 });
      const beamGeoX = new THREE.BoxGeometry(52, 0.8, 0.8);
      const beamGeoZ = new THREE.BoxGeometry(0.8, 0.8, 52);

      [-14, -6, 6, 14].forEach((coord) => {
        const beamX = new THREE.Mesh(beamGeoX, beamMat);
        beamX.position.set(0, 11, coord);
        beamX.castShadow = true;
        scene.add(beamX);

        const beamZ = new THREE.Mesh(beamGeoZ, beamMat);
        beamZ.position.set(coord, 11, 0);
        beamZ.castShadow = true;
        scene.add(beamZ);

        // Hanging Cyber Lantern with Blue Glow
        const lanternMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 0.8, 8),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        lanternMesh.position.set(coord, 8.2, coord);
        const lanternLight = new THREE.PointLight(0x00f0ff, 1.8, 14);
        lanternLight.position.set(coord, 8.2, coord);
        scene.add(lanternMesh, lanternLight);
      });

      // High-Tech Graphite Titanium Dohyo Platform (Replaces ugly orange clay)
      const dohyoBaseGeo = new THREE.CylinderGeometry(12.5, 12.5, 0.05, 64);
      const dohyoBaseMat = new THREE.MeshStandardMaterial({
        color: 0x111827, // Sleek dark titanium
        metalness: 0.8,
        roughness: 0.35,
      });
      const dohyoBase = new THREE.Mesh(dohyoBaseGeo, dohyoBaseMat);
      dohyoBase.position.y = 0.025;
      dohyoBase.receiveShadow = true;
      scene.add(dohyoBase);

      // 32 Futuristic Cyber Perimeter Dampers (Replaces yellow straw bales)
      const damperMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.25,
      });
      const damperGroup = new THREE.Group();
      const numBales = 32;
      const dohyoRadius = 12.0;

      for (let i = 0; i < numBales; i++) {
        const theta = (i / numBales) * Math.PI * 2;
        const isTokudawara = i % 8 === 0;
        const radius = isTokudawara ? dohyoRadius + 0.3 : dohyoRadius;

        const bx = Math.sin(theta) * radius;
        const bz = Math.cos(theta) * radius;

        const baleGeo = new THREE.BoxGeometry(0.35, 0.22, 2.2);
        const bale = new THREE.Mesh(baleGeo, damperMat);
        bale.position.set(bx, 0.1, bz);
        bale.rotation.y = -theta;
        bale.castShadow = true;
        bale.receiveShadow = true;

        // Cyan Neon Strip on Damper
        const neonGeo = new THREE.BoxGeometry(0.04, 0.06, 2.1);
        const neonMat = new THREE.MeshBasicMaterial({ color: isTokudawara ? 0xec4899 : 0x00f0ff });
        const neon = new THREE.Mesh(neonGeo, neonMat);
        neon.position.set(0.18, 0.05, 0);
        bale.add(neon);

        damperGroup.add(bale);
      }
      scene.add(damperGroup);

      // Brilliant Holographic Perimeter Ring (r = 11.8 - 12.2m)
      const warningRingGeo = new THREE.RingGeometry(11.8, 12.2, 64);
      warningRingGeo.rotateX(-Math.PI / 2);
      sumoWarningRingMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const warningRing = new THREE.Mesh(warningRingGeo, sumoWarningRingMat);
      warningRing.position.y = 0.052;
      scene.add(warningRing);

      // Dual High-Voltage Starting Lines (Shikiri-sen) in vibrant laser red
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const line1 = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.25), lineMat);
      line1.rotation.x = -Math.PI / 2;
      line1.position.set(0, 0.054, 1.4);
      scene.add(line1);

      const line2 = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.25), lineMat);
      line2.rotation.x = -Math.PI / 2;
      line2.position.set(0, 0.054, -1.4);
      scene.add(line2);

      // Authentic Shoji Paper Screen Walls around the Dojo with Kumiko Texture
      const wallWoodMat = new THREE.MeshStandardMaterial({ color: 0x5c2b14, roughness: 0.5 });
      const shojiPaperMat = new THREE.MeshStandardMaterial({
        map: createShojiWallTexture(),
        roughness: 0.6,
        metalness: 0.05,
      });

      [-25, 25].forEach((zPos) => {
        const wallGroup = new THREE.Group();
        wallGroup.position.set(0, 4, zPos);
        const backing = new THREE.Mesh(new THREE.BoxGeometry(50, 8, 0.4), shojiPaperMat);
        const frame = new THREE.Mesh(new THREE.BoxGeometry(50.4, 0.6, 0.6), wallWoodMat);
        frame.position.y = 4;
        const base = new THREE.Mesh(new THREE.BoxGeometry(50.4, 0.6, 0.6), wallWoodMat);
        base.position.y = -4;
        wallGroup.add(backing, frame, base);
        scene.add(wallGroup);
      });
      [-25, 25].forEach((xPos) => {
        const wallGroup = new THREE.Group();
        wallGroup.position.set(xPos, 4, 0);
        wallGroup.rotation.y = Math.PI / 2;
        const backing = new THREE.Mesh(new THREE.BoxGeometry(50, 8, 0.4), shojiPaperMat);
        const frame = new THREE.Mesh(new THREE.BoxGeometry(50.4, 0.6, 0.6), wallWoodMat);
        frame.position.y = 4;
        const base = new THREE.Mesh(new THREE.BoxGeometry(50.4, 0.6, 0.6), wallWoodMat);
        base.position.y = -4;
        wallGroup.add(backing, frame, base);
        scene.add(wallGroup);
      });

      // Suspended Japanese Shinto Shrine Roof (釣屋根 - Tsuriyane) above Dohyo
      const roofGroup = new THREE.Group();
      roofGroup.position.set(0, 13, 0);

      const roofGeo = new THREE.ConeGeometry(14, 3.5, 4);
      roofGeo.rotateY(Math.PI / 4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
      const roofMesh = new THREE.Mesh(roofGeo, roofMat);
      roofMesh.position.y = 1.75;
      roofGroup.add(roofMesh);

      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.6, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 })
      );
      ridge.position.y = 3.6;
      roofGroup.add(ridge);

      // 4 Hanging Sacred Tassels (房 - Fusa: Blue/East, Red/South, White/West, Black/North)
      const fusaColors = [
        { color: 0x38bdf8, pos: { x: 9, z: 9 } },   // Blue (East)
        { color: 0xef4444, pos: { x: -9, z: 9 } },  // Red (South)
        { color: 0xf8fafc, pos: { x: -9, z: -9 } }, // White (West)
        { color: 0x1e293b, pos: { x: 9, z: -9 } },  // Black (North)
      ];
      fusaColors.forEach(fc => {
        const fusaMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.35, 2.5, 12),
          new THREE.MeshStandardMaterial({ color: fc.color, roughness: 0.8 })
        );
        fusaMesh.position.set(fc.pos.x, -1.2, fc.pos.z);
        roofGroup.add(fusaMesh);
      });
      scene.add(roofGroup);

      // Authentic 3D Torii Gates at North and South Entrances
      const createToriiGate = (x: number, z: number, rotY: number) => {
        const torii = new THREE.Group();
        torii.position.set(x, 0, z);
        torii.rotation.y = rotY;

        const redMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.35 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 });

        // 2 Stone bases (Kamebara)
        const baseGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.6, 16);
        const base1 = new THREE.Mesh(baseGeo, blackMat);
        base1.position.set(-4.5, 0.3, 0);
        const base2 = new THREE.Mesh(baseGeo, blackMat);
        base2.position.set(4.5, 0.3, 0);
        torii.add(base1, base2);

        // 2 Main Upright Pillars (Hashira)
        const pillarGeo = new THREE.CylinderGeometry(0.42, 0.5, 9.5, 20);
        const pillar1 = new THREE.Mesh(pillarGeo, redMat);
        pillar1.position.set(-4.5, 5.0, 0);
        pillar1.castShadow = true;
        const pillar2 = new THREE.Mesh(pillarGeo, redMat);
        pillar2.position.set(4.5, 5.0, 0);
        pillar2.castShadow = true;
        torii.add(pillar1, pillar2);

        // Lower tie beam (Nuki)
        const nuki = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.45, 0.35), redMat);
        nuki.position.set(0, 7.4, 0);
        nuki.castShadow = true;
        torii.add(nuki);

        // Upper main beam (Kasagi & Shimaki) with elegant curved tips
        const shimaki = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.5, 0.6), redMat);
        shimaki.position.set(0, 9.2, 0);
        shimaki.castShadow = true;
        torii.add(shimaki);

        const kasagiTop = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.4, 0.7), blackMat);
        kasagiTop.position.set(0, 9.6, 0);
        kasagiTop.castShadow = true;
        torii.add(kasagiTop);

        // Upward curved wingtips (Sorizori) on ends of Kasagi
        const wingtipGeo = new THREE.BoxGeometry(0.8, 0.5, 0.7);
        const leftWing = new THREE.Mesh(wingtipGeo, blackMat);
        leftWing.position.set(-6.8, 9.75, 0);
        leftWing.rotation.z = Math.PI / 8;
        const rightWing = new THREE.Mesh(wingtipGeo, blackMat);
        rightWing.position.set(6.8, 9.75, 0);
        rightWing.rotation.z = -Math.PI / 8;
        torii.add(leftWing, rightWing);

        // Central Name Plaque (Gakuzuka) with gold border
        const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.25), blackMat);
        plaque.position.set(0, 8.3, 0);
        const plaqueRim = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.22), goldMat);
        plaqueRim.position.set(0, 8.3, 0);
        torii.add(plaqueRim, plaque);

        // Torii entrance spotlight
        const tLight = new THREE.PointLight(0xef4444, 2.5, 18);
        tLight.position.set(0, 6, 0);
        torii.add(tLight);

        scene.add(torii);
      };

      createToriiGate(0, -23.5, 0);
      createToriiGate(0, 23.5, Math.PI);

      // Ceremonial Japanese Nobori Banners ("勝" - Victory & "力" - Strength)
      const createNobori = (x: number, z: number, kanji: string, subtitle: string, rotY: number) => {
        const noboriGroup = new THREE.Group();
        noboriGroup.position.set(x, 0, z);
        noboriGroup.rotation.y = rotY;

        const poleMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
        const vPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 8.5, 12), poleMat);
        vPole.position.set(0, 4.25, 0);
        vPole.castShadow = true;

        const hPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 12), poleMat);
        hPole.rotation.z = Math.PI / 2;
        hPole.position.set(1.0, 8.2, 0);

        const bannerMat = new THREE.MeshStandardMaterial({
          map: createNoboriBannerTexture(kanji, subtitle),
          side: THREE.DoubleSide,
          roughness: 0.7,
        });
        const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 5.8), bannerMat);
        cloth.position.set(1.0, 5.2, 0);
        cloth.castShadow = true;

        noboriGroup.add(vPole, hPole, cloth);
        scene.add(noboriGroup);
      };

      createNobori(-16, -16, '勝', 'VICTORY', Math.PI / 4);
      createNobori(16, -16, '力', 'STRENGTH', -Math.PI / 4);
      createNobori(-16, 16, '力', 'STRENGTH', (3 * Math.PI) / 4);
      createNobori(16, 16, '勝', 'VICTORY', (-3 * Math.PI) / 4);

      // Japanese Taiko Drums on Wooden X-Stands with Drumsticks
      const drumMat = new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.5 });
      const drumSkinMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 });
      const standMat = new THREE.MeshStandardMaterial({ color: 0x271306, roughness: 0.8 });

      const createTaikoStation = (x: number, z: number, rotY: number) => {
        const station = new THREE.Group();
        station.position.set(x, 0, z);
        station.rotation.y = rotY;

        // X-Stand Legs
        const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.15), standMat);
        leg1.position.set(0, 1.0, 0.4);
        leg1.rotation.x = Math.PI / 8;
        const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.15), standMat);
        leg2.position.set(0, 1.0, -0.4);
        leg2.rotation.x = -Math.PI / 8;
        station.add(leg1, leg2);

        // Barrel drum body
        const drumGeo = new THREE.CylinderGeometry(1.3, 1.3, 2.0, 24);
        drumGeo.rotateZ(Math.PI / 2);
        const drum = new THREE.Mesh(drumGeo, drumMat);
        drum.position.set(0, 1.7, 0);
        drum.castShadow = true;

        // Drumheads
        const headGeo = new THREE.CircleGeometry(1.28, 24);
        const head1 = new THREE.Mesh(headGeo, drumSkinMat);
        head1.rotation.y = Math.PI / 2;
        head1.position.set(1.01, 1.7, 0);
        const head2 = new THREE.Mesh(headGeo, drumSkinMat);
        head2.rotation.y = -Math.PI / 2;
        head2.position.set(-1.01, 1.7, 0);
        station.add(drum, head1, head2);

        scene.add(station);
      };

      createTaikoStation(0, -21, 0);
      createTaikoStation(0, 21, Math.PI);
    }

    // =========================================================================
    // ⚽ 3 & 4-BOSQICH: ROBOFOOTBALL (Jahon Chempionati Grand Stadioni & To'p Fizikasi)
    // =========================================================================
    else if (gameMode === 'football') {
      scene.background = new THREE.Color(0x1e3a8a); // Rich outdoor stadium sky
      arenaBoundary = 32;

      // Daylight Stadium Global Illumination
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x15803d, 1.8);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.9);
      sunLight.position.set(30, 48, 20);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      scene.add(sunLight);

      // Stadium Turf Floor with Realistic Mowed Lawn Stripes Texture
      const turfGeo = new THREE.PlaneGeometry(84, 84);
      const turfMat = new THREE.MeshStandardMaterial({
        map: createGrassPitchTexture(),
        roughness: 0.85,
        metalness: 0.05,
      });
      const turf = new THREE.Mesh(turfGeo, turfMat);
      turf.rotation.x = -Math.PI / 2;
      turf.receiveShadow = true;
      scene.add(turf);

      // White Pitch Markings (Regulation Field Geometry)
      const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      // Outer Perimeter Touchlines (60m x 44m)
      const touchlineX = new THREE.Mesh(new THREE.PlaneGeometry(44.4, 0.35), whiteLineMat);
      touchlineX.rotation.x = -Math.PI / 2;
      touchlineX.position.set(0, 0.02, -30);
      scene.add(touchlineX);

      const touchlineXSouth = touchlineX.clone();
      touchlineXSouth.position.set(0, 0.02, 30);
      scene.add(touchlineXSouth);

      const touchlineZ = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 60.4), whiteLineMat);
      touchlineZ.rotation.x = -Math.PI / 2;
      touchlineZ.position.set(-22, 0.02, 0);
      scene.add(touchlineZ);

      const touchlineZEast = touchlineZ.clone();
      touchlineZEast.position.set(22, 0.02, 0);
      scene.add(touchlineZEast);

      // Center Line
      const halfLine = new THREE.Mesh(new THREE.PlaneGeometry(44, 0.35), whiteLineMat);
      halfLine.rotation.x = -Math.PI / 2;
      halfLine.position.y = 0.02;
      scene.add(halfLine);

      // Center Circle & Center Spot
      const centerCircle = new THREE.Mesh(new THREE.RingGeometry(6.8, 7.15, 64), whiteLineMat);
      centerCircle.rotation.x = -Math.PI / 2;
      centerCircle.position.y = 0.02;
      scene.add(centerCircle);

      const centerSpot = new THREE.Mesh(new THREE.CircleGeometry(0.35, 24), whiteLineMat);
      centerSpot.rotation.x = -Math.PI / 2;
      centerSpot.position.y = 0.022;
      scene.add(centerSpot);

      // Penalty Boxes (16.5m Regulation Boxes)
      const createPenaltyBox = (zCenter: number, isNorth: boolean) => {
        const boxGroup = new THREE.Group();
        const zFront = isNorth ? -19 : 19;
        const frontLine = new THREE.Mesh(new THREE.PlaneGeometry(26, 0.35), whiteLineMat);
        frontLine.rotation.x = -Math.PI / 2;
        frontLine.position.set(0, 0.02, zFront);

        const sideLine1 = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 11), whiteLineMat);
        sideLine1.rotation.x = -Math.PI / 2;
        sideLine1.position.set(-13, 0.02, (zFront + zCenter) / 2);

        const sideLine2 = sideLine1.clone();
        sideLine2.position.set(13, 0.02, (zFront + zCenter) / 2);

        // Goal Area (Six yard box)
        const zSixFront = isNorth ? -24.5 : 24.5;
        const sixFront = new THREE.Mesh(new THREE.PlaneGeometry(13, 0.35), whiteLineMat);
        sixFront.rotation.x = -Math.PI / 2;
        sixFront.position.set(0, 0.022, zSixFront);

        const sixSide1 = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 5.5), whiteLineMat);
        sixSide1.rotation.x = -Math.PI / 2;
        sixSide1.position.set(-6.5, 0.022, (zSixFront + zCenter) / 2);

        const sixSide2 = sixSide1.clone();
        sixSide2.position.set(6.5, 0.022, (zSixFront + zCenter) / 2);

        // Penalty spot
        const penSpot = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), whiteLineMat);
        penSpot.rotation.x = -Math.PI / 2;
        penSpot.position.set(0, 0.024, isNorth ? -22.5 : 22.5);

        boxGroup.add(frontLine, sideLine1, sideLine2, sixFront, sixSide1, sixSide2, penSpot);
        scene.add(boxGroup);
      };

      createPenaltyBox(-30, true);
      createPenaltyBox(30, false);

      // 4 Corner Arcs & Checkered Flags
      const flagClothMat = new THREE.MeshBasicMaterial({
        map: createCornerFlagTexture(),
        side: THREE.DoubleSide,
      });

      const cornerCoords = [
        { x: -22, z: -30, rot: 0 },
        { x: 22, z: -30, rot: Math.PI / 2 },
        { x: -22, z: 30, rot: -Math.PI / 2 },
        { x: 22, z: 30, rot: Math.PI },
      ];

      cornerCoords.forEach((cc) => {
        // Corner Arc
        const arc = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.45, 16, 1, 0, Math.PI / 2), whiteLineMat);
        arc.rotation.x = -Math.PI / 2;
        arc.rotation.z = cc.rot;
        arc.position.set(cc.x, 0.02, cc.z);
        scene.add(arc);

        // Flag Pole & Spring
        const flagGroup = new THREE.Group();
        flagGroup.position.set(cc.x, 0, cc.z);

        const flagBase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.15, 0.2, 12),
          new THREE.MeshStandardMaterial({ color: 0x18181b })
        );
        flagBase.position.y = 0.1;

        const flagPole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.2 })
        );
        flagPole.position.y = 1.0;

        const flagCloth = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.45), flagClothMat);
        flagCloth.position.set(0.33, 1.75, 0);

        flagGroup.add(flagBase, flagPole, flagCloth);
        scene.add(flagGroup);
      });

      // 3D Regulation Goals with Metal Posts & Netting (North & South)
      const goalPostMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.85, roughness: 0.15 });
      const goalNetMat = new THREE.MeshBasicMaterial({
        color: 0xf8fafc,
        wireframe: true,
        transparent: true,
        opacity: 0.45,
      });

      const createGoal = (zPos: number, isNorth: boolean) => {
        const goal = new THREE.Group();
        goal.position.set(0, 0, zPos);
        goal.rotation.y = isNorth ? 0 : Math.PI;

        const postR = 0.14;
        const goalW = 10.0;
        const goalH = 3.6;
        const goalD = 2.6;

        // Uprights
        const postGeo = new THREE.CylinderGeometry(postR, postR, goalH, 16);
        const pLeft = new THREE.Mesh(postGeo, goalPostMat);
        pLeft.position.set(-goalW / 2, goalH / 2, 0);
        pLeft.castShadow = true;

        const pRight = new THREE.Mesh(postGeo, goalPostMat);
        pRight.position.set(goalW / 2, goalH / 2, 0);
        pRight.castShadow = true;

        // Top Crossbar
        const barGeo = new THREE.CylinderGeometry(postR, postR, goalW, 16);
        barGeo.rotateZ(Math.PI / 2);
        const crossbar = new THREE.Mesh(barGeo, goalPostMat);
        crossbar.position.set(0, goalH, 0);
        crossbar.castShadow = true;

        // Curved Elbows
        const elbowGeo = new THREE.SphereGeometry(postR * 1.15, 12, 12);
        const eb1 = new THREE.Mesh(elbowGeo, goalPostMat);
        eb1.position.set(-goalW / 2, goalH, 0);
        const eb2 = new THREE.Mesh(elbowGeo, goalPostMat);
        eb2.position.set(goalW / 2, goalH, 0);

        // Rear Ground Tubes & Support Struts
        const rearTubeGeo = new THREE.CylinderGeometry(0.08, 0.08, goalD, 12);
        rearTubeGeo.rotateX(Math.PI / 2);
        const rTube1 = new THREE.Mesh(rearTubeGeo, goalPostMat);
        rTube1.position.set(-goalW / 2, 0.08, -goalD / 2);
        const rTube2 = new THREE.Mesh(rearTubeGeo, goalPostMat);
        rTube2.position.set(goalW / 2, 0.08, -goalD / 2);

        const rBackBar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, goalW, 12), goalPostMat);
        rBackBar.rotation.z = Math.PI / 2;
        rBackBar.position.set(0, 0.08, -goalD);

        // 3D Goal Netting (Encloses back, top, and both sides)
        const netBack = new THREE.Mesh(new THREE.PlaneGeometry(goalW, goalH), goalNetMat);
        netBack.position.set(0, goalH / 2, -goalD);

        const netTop = new THREE.Mesh(new THREE.PlaneGeometry(goalW, goalD), goalNetMat);
        netTop.rotation.x = Math.PI / 2;
        netTop.position.set(0, goalH, -goalD / 2);

        const netSide1 = new THREE.Mesh(new THREE.PlaneGeometry(goalD, goalH), goalNetMat);
        netSide1.rotation.y = Math.PI / 2;
        netSide1.position.set(-goalW / 2, goalH / 2, -goalD / 2);

        const netSide2 = new THREE.Mesh(new THREE.PlaneGeometry(goalD, goalH), goalNetMat);
        netSide2.rotation.y = -Math.PI / 2;
        netSide2.position.set(goalW / 2, goalH / 2, -goalD / 2);

        goal.add(pLeft, pRight, crossbar, eb1, eb2, rTube1, rTube2, rBackBar, netBack, netTop, netSide1, netSide2);
        scene.add(goal);
      };

      createGoal(-30, true);
      createGoal(30, false);

      // Soccer Ball with Hexagonal Pattern Texture
      const ballGeo = new THREE.SphereGeometry(0.85, 32, 32);
      const ballMat = new THREE.MeshStandardMaterial({
        map: createSoccerBallTexture(),
        roughness: 0.35,
        metalness: 0.1,
      });
      ballMesh = new THREE.Mesh(ballGeo, ballMat);
      ballMesh.position.set(0, 0.85, 0);
      ballMesh.castShadow = true;
      scene.add(ballMesh);

      // 4 Towering 26m Truss Floodlight Pylons
      const pylonCoords = [
        { x: -28, z: -35 },
        { x: 28, z: -35 },
        { x: -28, z: 35 },
        { x: 28, z: 35 },
      ];
      const pylonMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
      const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });

      pylonCoords.forEach((pc) => {
        const pylonGroup = new THREE.Group();
        pylonGroup.position.set(pc.x, 0, pc.z);

        // 4 Tapering Steel Truss Legs
        const legGeo = new THREE.CylinderGeometry(0.2, 0.35, 26, 8);
        const legOffsets = [
          { x: -0.7, z: -0.7 },
          { x: 0.7, z: -0.7 },
          { x: -0.7, z: 0.7 },
          { x: 0.7, z: 0.7 },
        ];
        legOffsets.forEach(lo => {
          const leg = new THREE.Mesh(legGeo, pylonMat);
          leg.position.set(lo.x, 13, lo.z);
          pylonGroup.add(leg);
        });

        // Horizontal Truss Rings
        for (let h = 4; h <= 24; h += 4) {
          const ring = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.6), pylonMat);
          ring.position.y = h;
          pylonGroup.add(ring);
        }

        // Floodlight Pylon Head Rack
        const headRack = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.2, 0.8), pylonMat);
        headRack.position.set(0, 26, 0);
        pylonGroup.add(headRack);

        // 8 Powerful Rectangular Floodlight Lamps
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 4; col++) {
            const lampFace = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.3), lampGlowMat);
            lampFace.position.set((col - 1.5) * 1.1, 26 + (row - 0.5) * 0.9, 0.4);
            pylonGroup.add(lampFace);
          }
        }

        // Stadium SpotLight casting focused illumination
        const spotLight = new THREE.SpotLight(0xfffbeb, 2.8, 70, Math.PI / 4, 0.4);
        spotLight.position.set(pc.x, 26, pc.z);
        spotLight.target.position.set(0, 0, 0);
        scene.add(spotLight);
        scene.add(spotLight.target);

        scene.add(pylonGroup);
      });

      // LED Electronic Perimeter Advertising Hoardings (Enclosing touchlines)
      const ledMat = new THREE.MeshBasicMaterial({ map: createLedBannerTexture() });
      const ledGeoNorthSouth = new THREE.BoxGeometry(48, 1.2, 0.3);
      const ledNorth = new THREE.Mesh(ledGeoNorthSouth, ledMat);
      ledNorth.position.set(0, 0.6, -32.5);
      scene.add(ledNorth);

      const ledSouth = new THREE.Mesh(ledGeoNorthSouth, ledMat);
      ledSouth.position.set(0, 0.6, 32.5);
      scene.add(ledSouth);

      const ledGeoEastWest = new THREE.BoxGeometry(0.3, 1.2, 64);
      const ledWest = new THREE.Mesh(ledGeoEastWest, ledMat);
      ledWest.position.set(-24.5, 0.6, 0);
      scene.add(ledWest);

      const ledEast = new THREE.Mesh(ledGeoEastWest, ledMat);
      ledEast.position.set(24.5, 0.6, 0);
      scene.add(ledEast);

      // Multi-Tier Spectator Grandstands (Tribunas with Stadium Seats)
      const concreteMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
      const seatColors = [0x2563eb, 0xef4444, 0xfacc15, 0x2563eb, 0xef4444];

      const createGrandstand = (xBase: number, isWest: boolean) => {
        const standGroup = new THREE.Group();
        standGroup.position.set(xBase, 0, 0);
        const dir = isWest ? -1 : 1;

        // 5 Ascending Riser Tiers
        for (let t = 0; t < 5; t++) {
          const tierMesh = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 1.0, 64),
            concreteMat
          );
          tierMesh.position.set(dir * (t * 2.2 + 1.2), t * 1.0 + 0.5, 0);
          standGroup.add(tierMesh);

          // Stadium Seats on each tier
          const seatMat = new THREE.MeshStandardMaterial({ color: seatColors[t % seatColors.length], roughness: 0.5 });
          const seatGeo = new THREE.BoxGeometry(0.8, 0.6, 1.4);
          for (let z = -28; z <= 28; z += 2.2) {
            const seat = new THREE.Mesh(seatGeo, seatMat);
            seat.position.set(dir * (t * 2.2 + 1.2), t * 1.0 + 1.1, z);
            standGroup.add(seat);
          }
        }

        // Cantilever Roof Canopy
        const roofCanopy = new THREE.Mesh(
          new THREE.BoxGeometry(13, 0.4, 66),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
        );
        roofCanopy.position.set(dir * 6.5, 9.5, 0);
        standGroup.add(roofCanopy);

        scene.add(standGroup);
      };

      createGrandstand(-26, true);
      createGrandstand(26, false);
    }

    // =========================================================================
    // 〰️ 5 & 6-BOSQICH: LINE FOLLOWER (Kremniy Vodiysi R&D Cleanroom & Trassa)
    // =========================================================================
    else if (gameMode === 'line') {
      scene.background = new THREE.Color(0xf8fafc); // Cleanroom pristine white sky
      arenaBoundary = 30;

      // Bright Overhead Sterile Laboratory Lighting (5500K Cleanroom Illumination)
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcfd8dc, 2.2);
      scene.add(hemiLight);

      const labDir = new THREE.DirectionalLight(0xffffff, 2.6);
      labDir.position.set(15, 32, 15);
      labDir.castShadow = true;
      labDir.shadow.mapSize.width = 2048;
      labDir.shadow.mapSize.height = 2048;
      scene.add(labDir);

      // Cleanroom Epoxy Anti-Static Floor with Tile Grid Texture
      const labFloorGeo = new THREE.PlaneGeometry(64, 64);
      const labFloorMat = new THREE.MeshStandardMaterial({
        map: createCleanroomFloorTexture(),
        roughness: 0.18,
        metalness: 0.12,
      });
      const labFloor = new THREE.Mesh(labFloorGeo, labFloorMat);
      labFloor.rotation.x = -Math.PI / 2;
      labFloor.receiveShadow = true;
      scene.add(labFloor);

      // Modular Cleanroom Enclosure Walls with Observation Glass Windows
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.35,
      });
      const accentMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });

      [-30, 30].forEach((zCoord) => {
        const wallGroup = new THREE.Group();
        wallGroup.position.set(0, 4, zCoord);

        const solidWall = new THREE.Mesh(new THREE.BoxGeometry(60, 8, 0.5), wallMat);
        const blueStripe = new THREE.Mesh(new THREE.BoxGeometry(60.2, 0.4, 0.52), accentMat);
        blueStripe.position.y = -2.5;

        // Observation glass window in center
        const windowPane = new THREE.Mesh(new THREE.BoxGeometry(24, 3.2, 0.6), glassMat);
        windowPane.position.y = 0.5;

        wallGroup.add(solidWall, blueStripe, windowPane);
        scene.add(wallGroup);
      });

      [-30, 30].forEach((xCoord) => {
        const wallGroup = new THREE.Group();
        wallGroup.position.set(xCoord, 4, 0);
        wallGroup.rotation.y = Math.PI / 2;

        const solidWall = new THREE.Mesh(new THREE.BoxGeometry(60, 8, 0.5), wallMat);
        const blueStripe = new THREE.Mesh(new THREE.BoxGeometry(60.2, 0.4, 0.52), accentMat);
        blueStripe.position.y = -2.5;

        const windowPane = new THREE.Mesh(new THREE.BoxGeometry(24, 3.2, 0.6), glassMat);
        windowPane.position.y = 0.5;

        wallGroup.add(solidWall, blueStripe, windowPane);
        scene.add(wallGroup);
      });

      // Recessed Ceiling Cleanroom LED Light Troffers
      const trofferMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      for (let x = -20; x <= 20; x += 10) {
        for (let z = -20; z <= 20; z += 10) {
          const troffer = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 1.8), trofferMat);
          troffer.position.set(x, 8.8, z);
          scene.add(troffer);
        }
      }

      // Continuous Grand Prix Style Jet-Black Vinyl Race Track (Elevation y = 0.025m)
      const trackPoints = [
        new THREE.Vector3(-16, 0.025, -16),
        new THREE.Vector3(-16, 0.025, 0),
        new THREE.Vector3(-16, 0.025, 14),
        new THREE.Vector3(-8, 0.025, 20),
        new THREE.Vector3(4, 0.025, 20),
        new THREE.Vector3(12, 0.025, 12),
        new THREE.Vector3(6, 0.025, 4),
        new THREE.Vector3(14, 0.025, -4),
        new THREE.Vector3(20, 0.025, 6),
        new THREE.Vector3(22, 0.025, 18),
        new THREE.Vector3(14, 0.025, 22),
        new THREE.Vector3(2, 0.025, 14),
        new THREE.Vector3(-2, 0.025, -6),
        new THREE.Vector3(8, 0.025, -16),
        new THREE.Vector3(20, 0.025, -18),
        new THREE.Vector3(22, 0.025, -6),
        new THREE.Vector3(14, 0.025, 0),
        new THREE.Vector3(0, 0.025, -20),
        new THREE.Vector3(-10, 0.025, -22),
      ];
      const curve = new THREE.CatmullRomCurve3(trackPoints, true);
      lineTrackCurve = curve;
      const trackGeo = new THREE.TubeGeometry(curve, 240, 0.55, 8, true);
      const trackMat = new THREE.MeshBasicMaterial({ color: 0x090d16 }); // High contrast black vinyl
      const trackMesh = new THREE.Mesh(trackGeo, trackMat);
      scene.add(trackMesh);

      // F1 Carbon Fiber Start / Finish Line Checkered Gantry Arch
      const archGroup = new THREE.Group();
      archGroup.position.set(-16, 0, -14);

      // Checkered Start Line Decal on the floor
      const checkLine = new THREE.Mesh(
        new THREE.PlaneGeometry(6.5, 1.4),
        new THREE.MeshBasicMaterial({ map: createCheckeredLineTexture() })
      );
      checkLine.rotation.x = -Math.PI / 2;
      checkLine.position.y = 0.028;
      archGroup.add(checkLine);

      // Gantry Truss Pillars (Carbon Fiber style)
      const carbonMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9, roughness: 0.25 });
      const pLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.2, 0.5), carbonMat);
      pLeft.position.set(-3.5, 2.6, 0);
      const pRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.2, 0.5), carbonMat);
      pRight.position.set(3.5, 2.6, 0);

      const topBar = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.9, 0.8), carbonMat);
      topBar.position.set(0, 5.2, 0);

      // Digital Lap Timing Display Screen on Gantry
      const timerCanvas = document.createElement('canvas');
      timerCanvas.width = 384;
      timerCanvas.height = 80;
      const tctx = timerCanvas.getContext('2d');
      if (tctx) {
        tctx.fillStyle = '#020617';
        tctx.fillRect(0, 0, 384, 80);
        tctx.strokeStyle = '#0284c7';
        tctx.lineWidth = 4;
        tctx.strokeRect(4, 4, 376, 72);
        tctx.fillStyle = '#22c55e';
        tctx.font = 'bold 32px monospace';
        tctx.fillText('LAP 1/3 • 00:14.28', 20, 52);
      }
      const timerPlate = new THREE.Mesh(
        new THREE.PlaneGeometry(4.2, 0.8),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(timerCanvas) })
      );
      timerPlate.position.set(0, 5.2, 0.42);

      // F1 5-Light Starting Array (Red and Green LEDs)
      for (let sl = -1.5; sl <= 1.5; sl += 0.75) {
        const lightHousing = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.6, 0.2),
          carbonMat
        );
        lightHousing.position.set(sl, 4.4, 0.42);

        const redLed = new THREE.Mesh(
          new THREE.CircleGeometry(0.12, 12),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        redLed.position.set(sl, 4.55, 0.53);

        const greenLed = new THREE.Mesh(
          new THREE.CircleGeometry(0.12, 12),
          new THREE.MeshBasicMaterial({ color: 0x22c55e })
        );
        greenLed.position.set(sl, 4.25, 0.53);

        archGroup.add(lightHousing, redLed, greenLed);
      }

      archGroup.add(pLeft, pRight, topBar, timerPlate);
      scene.add(archGroup);

      // Laboratory Workbenches with Active CRT Oscilloscopes
      const benchMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
      const scopeScreenMat = new THREE.MeshBasicMaterial({ map: createOscilloscopeTexture() });

      for (let b = 0; b < 4; b++) {
        const benchGroup = new THREE.Group();
        benchGroup.position.set(-20 + b * 13, 0, -25);

        // Heavy steel lab bench
        const bench = new THREE.Mesh(new THREE.BoxGeometry(8, 1.8, 2.6), benchMat);
        bench.position.y = 0.9;
        bench.castShadow = true;

        // Dual CRT Oscilloscopes on bench
        const scopeGeo = new THREE.BoxGeometry(1.8, 1.2, 1.2);
        const scopeMesh = new THREE.Mesh(scopeGeo, carbonMat);
        scopeMesh.position.set(-1.8, 2.4, 0);

        const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), scopeScreenMat);
        screenMesh.position.set(-1.8, 2.4, 0.61);

        const scopeMesh2 = scopeMesh.clone();
        scopeMesh2.position.set(1.8, 2.4, 0);
        const screenMesh2 = screenMesh.clone();
        screenMesh2.position.set(1.8, 2.4, 0.61);

        benchGroup.add(bench, scopeMesh, screenMesh, scopeMesh2, screenMesh2);
        scene.add(benchGroup);
      }

      // High-Density Telemetry Server Racks (Blinking LEDs)
      const serverRackMat = new THREE.MeshBasicMaterial({ map: createServerRackTexture() });
      for (let r = 0; r < 3; r++) {
        const rackMesh = new THREE.Mesh(
          new THREE.BoxGeometry(2.0, 4.5, 1.5),
          serverRackMat
        );
        rackMesh.position.set(24, 2.25, -20 + r * 3.5);
        rackMesh.castShadow = true;
        scene.add(rackMesh);
      }

      // 6-Axis Articulated Industrial Robotic Arms (KUKA / Fanuc Industrial Orange)
      const kukaOrangeMat = new THREE.MeshStandardMaterial({
        color: 0xf97316, // Vibrant KUKA industrial orange
        metalness: 0.85,
        roughness: 0.25,
      });
      const robotBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });

      const createIndustrialRobot = (x: number, z: number, rotY: number) => {
        const robotGroup = new THREE.Group();
        robotGroup.position.set(x, 0, z);
        robotGroup.rotation.y = rotY;

        // Heavy Pedestal Base
        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 0.8, 16), robotBaseMat);
        pedestal.position.y = 0.4;
        pedestal.castShadow = true;

        // Turntable Joint (J1)
        const j1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16), kukaOrangeMat);
        j1.position.y = 1.0;

        // Shoulder Link (J2)
        const j2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.6, 0.65), kukaOrangeMat);
        j2.position.set(0.2, 2.4, 0);
        j2.rotation.z = Math.PI / 8;
        j2.castShadow = true;

        // Forearm Link (J3)
        const j3 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.5), kukaOrangeMat);
        j3.position.set(1.2, 3.8, 0);
        j3.rotation.z = -Math.PI / 4;
        j3.castShadow = true;

        // Wrist & 2-Finger Pneumatic Gripper (J4-J6)
        const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.4, 12), robotBaseMat);
        wrist.position.set(2.0, 3.0, 0);
        wrist.rotation.z = Math.PI / 2;

        const finger1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.15), robotBaseMat);
        finger1.position.set(2.3, 3.15, 0);
        const finger2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.15), robotBaseMat);
        finger2.position.set(2.3, 2.85, 0);

        // Yellow and Black Hazard Tape Perimeter
        const hazardTape = new THREE.Mesh(
          new THREE.RingGeometry(2.4, 2.7, 32),
          new THREE.MeshBasicMaterial({ color: 0xeab308, side: THREE.DoubleSide })
        );
        hazardTape.rotation.x = -Math.PI / 2;
        hazardTape.position.y = 0.026;

        robotGroup.add(pedestal, j1, j2, j3, wrist, finger1, finger2, hazardTape);
        scene.add(robotGroup);
      };

      createIndustrialRobot(-24, 10, Math.PI / 3);
      createIndustrialRobot(22, 10, -Math.PI / 3);
    }

    // =========================================================================
    // 📦 7 & 8-BOSQICH: WAREHOUSE CHALLENGE (Smart Amazon/Alibaba Logistika Deposi)
    // =========================================================================
    else if (gameMode === 'warehouse') {
      scene.background = new THREE.Color(0x18181b); // Industrial depot dark ambience
      arenaBoundary = 32;

      // Industrial High-Bay Sodium Ambient Illumination (Warm Amber 2200K)
      const hemiLight = new THREE.HemisphereLight(0xfde047, 0x27272a, 2.0);
      scene.add(hemiLight);

      const bayLight = new THREE.DirectionalLight(0xffedd5, 2.8);
      bayLight.position.set(15, 32, 15);
      bayLight.castShadow = true;
      bayLight.shadow.mapSize.width = 2048;
      bayLight.shadow.mapSize.height = 2048;
      scene.add(bayLight);

      // Industrial Concrete Floor with Forklift Tire Skid Marks Texture
      const whFloorGeo = new THREE.PlaneGeometry(74, 74);
      const whFloorMat = new THREE.MeshStandardMaterial({
        map: createWarehouseConcreteTexture(),
        roughness: 0.75,
        metalness: 0.15,
      });
      const whFloor = new THREE.Mesh(whFloorGeo, whFloorMat);
      whFloor.rotation.x = -Math.PI / 2;
      whFloor.receiveShadow = true;
      scene.add(whFloor);

      // Corrugated Metal Warehouse Enclosure Walls
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.35 });
      [-32, 32].forEach((zCoord) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(64, 12, 0.6), wallMat);
        wall.position.set(0, 6, zCoord);
        scene.add(wall);
      });
      [-32, 32].forEach((xCoord) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 12, 64), wallMat);
        wall.position.set(xCoord, 6, 0);
        scene.add(wall);
      });

      // Yellow & Black Diagonal Hazard Caution Striping along Forklift Transit Lanes
      const hazardMat = new THREE.MeshBasicMaterial({ map: createHazardStripeTexture() });

      // West & East Forklift Transit Lanes
      [-11, 11].forEach((laneX) => {
        const laneStripe = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 54), hazardMat);
        laneStripe.rotation.x = -Math.PI / 2;
        laneStripe.position.set(laneX, 0.022, 0);
        scene.add(laneStripe);
      });

      // Painted Pedestrian Zebra Crosswalks
      const zebraMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      for (let z = -6; z <= 6; z += 1.8) {
        const bar = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.8), zebraMat);
        bar.rotation.x = -Math.PI / 2;
        bar.position.set(0, 0.023, z);
        scene.add(bar);
      }

      // Massive Multi-Tier Pallet Storage Racks (4 Double-Aisle Heavy Duty Shelves)
      const rackBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.85, roughness: 0.25 });
      const beamOrangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.8, roughness: 0.3 });
      const palletWoodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });

      const rackPositions = [
        { x: -22, z: -15 },
        { x: -22, z: 15 },
        { x: 22, z: -15 },
        { x: 22, z: 15 },
      ];

      rackPositions.forEach((rp) => {
        const rack = new THREE.Group();
        rack.position.set(rp.x, 0, rp.z);

        // 4 Vertical Steel Uprights (10.5m high)
        for (let vx of [-2.2, 2.2]) {
          for (let vz of [-6.5, 6.5]) {
            const upright = new THREE.Mesh(new THREE.BoxGeometry(0.35, 10.5, 0.35), rackBlueMat);
            upright.position.set(vx, 5.25, vz);
            upright.castShadow = true;
            rack.add(upright);
          }
        }

        // 3 Shelf Levels with Safety Orange Load Beams & Pallets
        for (let lvl = 1; lvl <= 3; lvl++) {
          const beamZ1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 13.2), beamOrangeMat);
          beamZ1.position.set(-2.2, lvl * 3.2, 0);
          const beamZ2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 13.2), beamOrangeMat);
          beamZ2.position.set(2.2, lvl * 3.2, 0);

          const palletMesh = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.22, 13.0), palletWoodMat);
          palletMesh.position.set(0, lvl * 3.2 + 0.15, 0);
          rack.add(beamZ1, beamZ2, palletMesh);

          // Stored Barcoded Cargo Crates on each tier
          for (let bz = -4.5; bz <= 4.5; bz += 2.8) {
            const labelType = (lvl + Math.abs(bz)) % 3 === 0 ? 'FRAGILE' : ((lvl + Math.abs(bz)) % 2 === 0 ? 'CARGO' : 'PRIORITY');
            const sBox = new THREE.Mesh(
              new THREE.BoxGeometry(1.8, 1.6, 1.8),
              new THREE.MeshStandardMaterial({
                map: createCrateTexture(labelType),
                roughness: 0.75,
              })
            );
            sBox.position.set(0, lvl * 3.2 + 1.05, bz);
            sBox.castShadow = true;
            rack.add(sBox);
          }
        }

        // Yellow Steel Safety Bollards at rack ends
        [-7.5, 7.5].forEach((bz) => {
          const bollard = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 1.4, 16),
            new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.5 })
          );
          bollard.position.set(0, 0.7, bz);
          rack.add(bollard);
        });

        scene.add(rack);
      });

      // Movable High-Detail Interactive Cargo Wooden Crates on Floor
      const crateGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
      const cratePositions = [
        { x: -5, z: -5, label: 'FRAGILE' },
        { x: 5, z: -3, label: 'EXPRESS' },
        { x: -4, z: 7, label: 'PRIORITY' },
        { x: 4, z: 9, label: 'FRAGILE' },
        { x: 0, z: -12, label: 'CARGO' },
        { x: -6, z: 2, label: 'EXPRESS' },
      ];

      cratePositions.forEach((pos) => {
        const crate = new THREE.Mesh(
          crateGeo,
          new THREE.MeshStandardMaterial({
            map: createCrateTexture(pos.label),
            roughness: 0.8,
          })
        );
        crate.position.set(pos.x, 0.9, pos.z);
        crate.castShadow = true;
        scene.add(crate);
        crates.push(crate);
      });

      // Target Delivery Drop Zone (Glowing Green Holographic Bay with Vertical Beacon)
      const dropZoneGroup = new THREE.Group();
      dropZoneGroup.position.set(18, 0, 18);

      // Floor Holographic Pad
      const dropZoneGeo = new THREE.PlaneGeometry(8.5, 8.5);
      dropZoneGeo.rotateX(-Math.PI / 2);
      const dropZoneMat = new THREE.MeshBasicMaterial({
        color: 0x22c55e,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const dropZone = new THREE.Mesh(dropZoneGeo, dropZoneMat);
      dropZone.position.y = 0.035;

      // Glowing Green Border Rings
      const ring1 = new THREE.Mesh(
        new THREE.RingGeometry(3.6, 4.0, 32),
        new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide })
      );
      ring1.rotation.x = -Math.PI / 2;
      ring1.position.y = 0.038;

      // Vertical Glowing Light Pillar (Beacon)
      const beaconGeo = new THREE.CylinderGeometry(3.6, 3.6, 16, 24, 1, true);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: 0x22c55e,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = 8;

      // Point Light above Drop Zone
      const beaconLight = new THREE.PointLight(0x22c55e, 3.8, 25);
      beaconLight.position.set(0, 4, 0);

      dropZoneGroup.add(dropZone, ring1, beacon, beaconLight);
      scene.add(dropZoneGroup);

      // High-Bay Sodium Dome Lamps Hanging from Ceiling
      for (let lx of [-10, 10]) {
        for (let lz of [-15, 0, 15]) {
          const domeGroup = new THREE.Group();
          domeGroup.position.set(lx, 11, lz);

          // Bell reflector
          const bell = new THREE.Mesh(
            new THREE.ConeGeometry(0.85, 0.65, 16),
            new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 })
          );
          const bulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xfde047 })
          );
          bulb.position.y = -0.2;

          const sLight = new THREE.SpotLight(0xfde047, 2.4, 30, Math.PI / 3, 0.4);
          sLight.position.set(0, -0.2, 0);
          sLight.target.position.set(0, -11, 0);

          domeGroup.add(bell, bulb, sLight, sLight.target);
          scene.add(domeGroup);
        }
      }
    }

    // =========================================================================
    // 🏎️ 9 & 10-BOSQICH: SPEED RACING (Neo-Tokyo Kiber Magistrali & Nitro Boost)
    // =========================================================================
    else {
      scene.background = new THREE.Color(0x060913); // Midnight Neo-Tokyo cyber sky
      arenaBoundary = 38;

      // Atmospheric Cyberpunk Illumination (Cyan & Synthwave Purple)
      const hemiSpeed = new THREE.HemisphereLight(0x38bdf8, 0x2e1065, 2.2);
      scene.add(hemiSpeed);

      const cyanFlood = new THREE.PointLight(0x06b6d4, 4.8, 80);
      cyanFlood.position.set(-25, 22, -25);
      scene.add(cyanFlood);

      const magentaFlood = new THREE.PointLight(0xec4899, 4.5, 75);
      magentaFlood.position.set(25, 22, 25);
      scene.add(magentaFlood);

      const moonDir = new THREE.DirectionalLight(0xf43f5e, 2.5);
      moonDir.position.set(0, 35, -70);
      scene.add(moonDir);

      // Wet Midnight Asphalt Circuit Ground
      const trackGround = new THREE.Mesh(
        new THREE.PlaneGeometry(96, 96),
        new THREE.MeshStandardMaterial({
          map: createAsphaltTexture(),
          roughness: 0.35,
          metalness: 0.25,
        })
      );
      trackGround.rotation.x = -Math.PI / 2;
      trackGround.receiveShadow = true;
      scene.add(trackGround);

      // Glowing Dashed Yellow Centerline Markings
      const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      for (let z = -32; z <= 32; z += 4) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 2.2), yellowLineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(0, 0.025, z);
        scene.add(dash);

        const dashX = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.35), yellowLineMat);
        dashX.rotation.x = -Math.PI / 2;
        dashX.position.set(z, 0.025, 0);
        scene.add(dashX);
      }

      // Red & White 3D Rumble Kerbs (Kerblar) around circuit perimeter and corners
      const kerbMatR = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const kerbMatW = new THREE.MeshBasicMaterial({ color: 0xffffff });
      for (let k = -36; k <= 36; k += 2.5) {
        const mat = Math.abs(k) % 5 === 0 ? kerbMatR : kerbMatW;

        const kNorth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.9), mat);
        kNorth.position.set(k, 0.06, -37);
        scene.add(kNorth);

        const kSouth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.9), mat);
        kSouth.position.set(k, 0.06, 37);
        scene.add(kSouth);

        const kWest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 2.4), mat);
        kWest.position.set(-37, 0.06, k);
        scene.add(kWest);

        const kEast = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 2.4), mat);
        kEast.position.set(37, 0.06, k);
        scene.add(kEast);
      }

      // 6 Holographic Nitro Boost Pads (+18.5 m/s Overdrive Speed)
      const padGeo = new THREE.PlaneGeometry(4.2, 6.0);
      padGeo.rotateX(-Math.PI / 2);
      const padMat = new THREE.MeshBasicMaterial({
        map: createBoostPadTexture(),
        transparent: true,
        side: THREE.DoubleSide,
      });

      const padPositions = [
        { x: 0, z: 0 },
        { x: -16, z: -16 },
        { x: 16, z: -16 },
        { x: 16, z: 16 },
        { x: -16, z: 16 },
        { x: 0, z: -26 },
      ];

      padPositions.forEach((pos) => {
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(pos.x, 0.035, pos.z);
        scene.add(pad);
        boostPads.push(pad);

        // Neon side rails along boost pad
        const railMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
        const railL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 6.0), railMat);
        railL.position.set(pos.x - 2.2, 0.12, pos.z);
        const railR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 6.0), railMat);
        railR.position.set(pos.x + 2.2, 0.12, pos.z);
        scene.add(railL, railR);
      });

      // Holographic Speed Trap & Checkpoint Gantry Arch at (0, 16)
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, 16);

      const gantryMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
      const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

      const gPoleL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6.0, 0.6), gantryMat);
      gPoleL.position.set(-6, 3.0, 0);
      const gPoleR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6.0, 0.6), gantryMat);
      gPoleR.position.set(6, 3.0, 0);

      const gBeam = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.8, 0.8), gantryMat);
      gBeam.position.set(0, 6.0, 0);

      // Neon LED strip on beam
      const gStripe = new THREE.Mesh(new THREE.BoxGeometry(12.7, 0.15, 0.85), neonCyanMat);
      gStripe.position.set(0, 6.0, 0);

      // Speed Trap Readout Display
      const radarCanvas = document.createElement('canvas');
      radarCanvas.width = 384;
      radarCanvas.height = 80;
      const rCtx = radarCanvas.getContext('2d');
      if (rCtx) {
        rCtx.fillStyle = '#020617';
        rCtx.fillRect(0, 0, 384, 80);
        rCtx.strokeStyle = '#00f0ff';
        rCtx.lineWidth = 4;
        rCtx.strokeRect(4, 4, 376, 72);
        rCtx.fillStyle = '#00f0ff';
        rCtx.font = 'bold 28px monospace';
        rCtx.fillText('⚡ SPEED TRAP: 66.6 KM/H ⚡', 12, 50);
      }
      const radarPlate = new THREE.Mesh(
        new THREE.PlaneGeometry(5.2, 0.9),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(radarCanvas) })
      );
      radarPlate.position.set(0, 6.0, 0.45);

      gantryGroup.add(gPoleL, gPoleR, gBeam, gStripe, radarPlate);
      scene.add(gantryGroup);

      // Giant Synthwave Retro Blood Moon
      const moonMesh = new THREE.Mesh(
        new THREE.SphereGeometry(18, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xf43f5e })
      );
      moonMesh.position.set(0, 32, -95);
      scene.add(moonMesh);

      // 28 Futuristic Neon Skyscrapers on the Horizon
      const neonColors = [0x00f0ff, 0xec4899, 0xa855f7, 0x06b6d4];
      for (let i = 0; i < 28; i++) {
        const bHeight = 40 + Math.random() * 55;
        const bWidth = 8 + Math.random() * 9;
        const bAngle = (i / 28) * Math.PI * 2;
        const bDist = 68 + Math.random() * 18;

        const bGroup = new THREE.Group();
        bGroup.position.set(Math.cos(bAngle) * bDist, 0, Math.sin(bAngle) * bDist);

        const bMesh = new THREE.Mesh(
          new THREE.BoxGeometry(bWidth, bHeight, bWidth),
          new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.2 })
        );
        bMesh.position.y = bHeight / 2;
        bGroup.add(bMesh);

        // Neon Glow Crown on Rooftop
        const crownColor = neonColors[i % neonColors.length];
        const neonRoof = new THREE.Mesh(
          new THREE.BoxGeometry(bWidth + 0.3, 0.6, bWidth + 0.3),
          new THREE.MeshBasicMaterial({ color: crownColor })
        );
        neonRoof.position.y = bHeight;
        bGroup.add(neonRoof);

        scene.add(bGroup);
      }
    }

    // Outer Boundary Walls (Colliders)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
    const wallGeoX = new THREE.BoxGeometry(arenaBoundary * 2, 2.5, 1.2);
    const wallGeoZ = new THREE.BoxGeometry(1.2, 2.5, arenaBoundary * 2);

    const wallNorth = new THREE.Mesh(wallGeoX, wallMat);
    wallNorth.position.set(0, 1.25, -arenaBoundary);
    scene.add(wallNorth);

    const wallSouth = new THREE.Mesh(wallGeoX, wallMat);
    wallSouth.position.set(0, 1.25, arenaBoundary);
    scene.add(wallSouth);

    const wallWest = new THREE.Mesh(wallGeoZ, wallMat);
    wallWest.position.set(-arenaBoundary, 1.25, 0);
    scene.add(wallWest);

    const wallEast = new THREE.Mesh(wallGeoZ, wallMat);
    wallEast.position.set(arenaBoundary, 1.25, 0);
    scene.add(wallEast);

    // Collision Sparks
    const sparkCount = 30;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities: THREE.Vector3[] = [];
    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3] = 0;
      sparkPositions[i * 3 + 1] = -100;
      sparkPositions[i * 3 + 2] = 0;
      sparkVelocities.push(new THREE.Vector3());
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({ color: 0xf59e0b, size: 0.35, transparent: true, opacity: 0 });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparkPoints);

    // -------------------------------------------------------------------------
    // 🤖 PLAYER ROBOT (Correct Orientation Aligned with Forward Vector)
    // -------------------------------------------------------------------------
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);

    // Visual wrapper oriented correctly towards +Z forward movement
    const playerVisual = new THREE.Group();
    playerVisual.rotation.y = -Math.PI / 2;
    playerGroup.add(playerVisual);

    // Main Chassis: Vibrant Cobalt Blue
    const playerChassis = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.35, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.85, roughness: 0.25 })
    );
    playerChassis.position.y = 0.45;
    playerChassis.castShadow = true;
    playerVisual.add(playerChassis);

    // White Sports Racing Hood Cover
    const topPlate = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.06, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.4, roughness: 0.2 })
    );
    topPlate.position.set(0, 0.65, 0);
    playerVisual.add(topPlate);

    // Glowing Cyan Status LED Light Strip
    const playerStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.9),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
    );
    playerStripe.position.set(0.71, 0.45, 0);
    playerVisual.add(playerStripe);

    // Dual Front LED Headlights
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hl1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), hlMat);
    hl1.position.set(0.7, 0.45, 0.35);
    const hl2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), hlMat);
    hl2.position.set(0.7, 0.45, -0.35);
    playerVisual.add(hl1, hl2);

    // 4 Wheels
    const playerWheels: THREE.Mesh[] = [];
    const wheelPositions = [
      { x: 0.45, y: 0.3, z: 0.65 },
      { x: -0.45, y: 0.3, z: 0.65 },
      { x: 0.45, y: 0.3, z: -0.65 },
      { x: -0.45, y: 0.3, z: -0.65 },
    ];
    const pWheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 24);
    pWheelGeo.rotateX(Math.PI / 2);

    wheelPositions.forEach((pos) => {
      const w = new THREE.Mesh(
        pWheelGeo,
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 })
      );
      w.position.set(pos.x, pos.y, pos.z);
      w.castShadow = true;

      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.23, 16),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9 })
      );
      rim.rotation.x = Math.PI / 2;
      w.add(rim);

      playerVisual.add(w);
      playerWheels.push(w);
    });

    if (hasUltrasonic) {
      const uGroup = new THREE.Group();
      uGroup.position.set(0.72, 0.55, 0);
      const eyeGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 16);
      eyeGeo.rotateZ(Math.PI / 2);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });
      const e1 = new THREE.Mesh(eyeGeo, eyeMat);
      e1.position.set(0.06, 0.02, 0.16);
      const e2 = new THREE.Mesh(eyeGeo, eyeMat);
      e2.position.set(0.06, 0.02, -0.16);
      uGroup.add(e1, e2);
      playerVisual.add(uGroup);
    }

    if (hasLidar) {
      const lidarPuck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.18, 16),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.6 })
      );
      lidarPuck.position.set(-0.25, 0.75, 0);
      playerVisual.add(lidarPuck);
    }

    if (hasWedge) {
      const wedge = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.3, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 })
      );
      wedge.position.set(0.8, 0.32, 0);
      wedge.rotation.z = -Math.PI / 6;
      playerVisual.add(wedge);
    }

    // Floating "You" Marker (Sleek Transparent HUD Tag)
    const youTagCanvas = document.createElement('canvas');
    youTagCanvas.width = 128;
    youTagCanvas.height = 48;
    const ctx = youTagCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(2, 132, 199, 0.75)';
      ctx.beginPath();
      ctx.roundRect(8, 8, 112, 32, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YOU', 64, 30);
    }
    const youTexture = new THREE.CanvasTexture(youTagCanvas);
    const youSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: youTexture, transparent: true, opacity: 0.9 }));
    youSprite.position.set(0, 1.25, 0);
    youSprite.scale.set(1.0, 0.4, 1);
    playerGroup.add(youSprite);

    // -------------------------------------------------------------------------
    // 🤖 OPPONENT ROBOTS (ShadowX & Zephyr)
    // -------------------------------------------------------------------------
    const opponents: { group: THREE.Group; name: string; x: number; z: number }[] = [];
    const oppData = [
      {
        name: 'ShadowX',
        hullColor: 0x111827,
        accentColor: 0xef4444,
        startX: gameMode === 'sumo' ? 0 : (gameMode === 'football' ? 0 : (gameMode === 'line' ? -16 : (gameMode === 'warehouse' ? -11 : -4))),
        startZ: gameMode === 'sumo' ? -4 : (gameMode === 'football' ? -27 : (gameMode === 'line' ? -4 : (gameMode === 'warehouse' ? -10 : 10))),
      },
      {
        name: 'Zephyr',
        hullColor: 0x18181b,
        accentColor: 0xa855f7,
        startX: gameMode === 'sumo' ? 8 : (gameMode === 'football' ? -6 : (gameMode === 'line' ? -16 : (gameMode === 'warehouse' ? 11 : 4))),
        startZ: gameMode === 'sumo' ? -7 : (gameMode === 'football' ? -8 : (gameMode === 'line' ? 6 : (gameMode === 'warehouse' ? 10 : 8))),
      },
    ];

    oppData.forEach((opp) => {
      const oppGroup = new THREE.Group();
      oppGroup.position.set(opp.startX, 0, opp.startZ);

      // Visual wrapper oriented correctly towards +Z forward movement
      const oppVisual = new THREE.Group();
      oppVisual.rotation.y = -Math.PI / 2;
      oppGroup.add(oppVisual);

      // Heavy Aggressive Chassis
      const oppChassis = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.35, 1.1),
        new THREE.MeshStandardMaterial({ color: opp.hullColor, metalness: 0.92, roughness: 0.2 })
      );
      oppChassis.position.y = 0.45;
      oppChassis.castShadow = true;
      oppVisual.add(oppChassis);

      // Glowing Neon Armor Plate
      const oppArmor = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.08, 0.85),
        new THREE.MeshStandardMaterial({ color: opp.accentColor, metalness: 0.8, roughness: 0.3 })
      );
      oppArmor.position.set(0, 0.65, 0);
      oppVisual.add(oppArmor);

      // Front Ramming Wedge
      const oppRam = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.2, 1.05),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.95 })
      );
      oppRam.position.set(0.8, 0.28, 0);
      oppRam.rotation.z = -0.35;
      oppVisual.add(oppRam);

      // Glowing Laser Eyes
      const eyeGeo = new THREE.SphereGeometry(0.06, 12, 12);
      const eyeMat = new THREE.MeshBasicMaterial({ color: opp.accentColor });
      const e1 = new THREE.Mesh(eyeGeo, eyeMat);
      e1.position.set(0.71, 0.45, 0.3);
      const e2 = new THREE.Mesh(eyeGeo, eyeMat);
      e2.position.set(0.71, 0.45, -0.3);
      oppVisual.add(e1, e2);

      wheelPositions.forEach((pos) => {
        const w = new THREE.Mesh(
          pWheelGeo,
          new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.95 })
        );
        w.position.set(pos.x, pos.y, pos.z);
        oppVisual.add(w);
      });

      const tagCanvas = document.createElement('canvas');
      tagCanvas.width = 128;
      tagCanvas.height = 48;
      const tCtx = tagCanvas.getContext('2d');
      if (tCtx) {
        tCtx.fillStyle = 'rgba(239, 68, 68, 0.75)';
        tCtx.beginPath();
        tCtx.roundRect(8, 8, 112, 32, 8);
        tCtx.fill();
        tCtx.fillStyle = '#ffffff';
        tCtx.font = 'bold 15px sans-serif';
        tCtx.textAlign = 'center';
        tCtx.fillText(opp.name, 64, 30);
      }
      const tagTexture = new THREE.CanvasTexture(tagCanvas);
      const tagSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTexture, transparent: true, opacity: 0.9 }));
      tagSprite.position.set(0, 1.25, 0);
      tagSprite.scale.set(1.1, 0.45, 1);
      oppGroup.add(tagSprite);

      scene.add(oppGroup);
      opponents.push({ group: oppGroup, name: opp.name, x: opp.startX, z: opp.startZ });
    });

    // -------------------------------------------------------------------------
    // 🕹️ GAME PHYSICS & DRIVING LOOP
    // -------------------------------------------------------------------------
    let posX = gameMode === 'line' ? -16 : (gameMode === 'warehouse' ? -12 : 0);
    let posZ = gameMode === 'sumo' ? 4 : (gameMode === 'football' ? 12 : (gameMode === 'line' ? -12 : (gameMode === 'warehouse' ? -12 : (gameMode === 'racing' ? 16 : 0))));
    let angle = (gameMode === 'sumo' || gameMode === 'football' || gameMode === 'racing') ? Math.PI : 0;
    let velocity = 0;
    let hp = 85;
    let energy = 62;
    const maxSpeed = 7.5;
    const acceleration = 12.0;
    const friction = 6.0;
    const steerSpeed = 2.8;
    let prevRobotPos = { x: posX, z: posZ };

    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.code) keysRef.current[e.code.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      keysRef.current[e.key.toLowerCase()] = false;
      if (e.code) keysRef.current[e.code.toLowerCase()] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let lastCollisionTime = 0;
    const triggerCollision = (atX: number, atZ: number, impactDamage: number) => {
      const now = performance.now();
      if (now - lastCollisionTime < 400) return;
      lastCollisionTime = now;

      hp = Math.max(0, hp - impactDamage);
      onCollisionImpact(impactDamage, { x: atX, z: atZ });

      sparkMat.opacity = 1.0;
      const positions = sparkGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < sparkCount; i++) {
        positions[i * 3] = atX;
        positions[i * 3 + 1] = 0.4;
        positions[i * 3 + 2] = atZ;
        sparkVelocities[i].set(
          (Math.random() - 0.5) * 8,
          Math.random() * 6 + 2,
          (Math.random() - 0.5) * 8
        );
      }
      sparkGeo.attributes.position.needsUpdate = true;
    };

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const keys = keysRef.current;

      let isBoosting = keys[' '] || keys['space'] || false;
      let driveInput = 0;
      let steerInput = 0;

      if (!isAutonomous) {
        const forward = keys['w'] || keys['arrowup'] || keys['keyw'] || keys['ц'];
        const backward = keys['s'] || keys['arrowdown'] || keys['keys'] || keys['ы'];
        const left = keys['a'] || keys['arrowleft'] || keys['keya'] || keys['ф'];
        const right = keys['d'] || keys['arrowright'] || keys['keyd'] || keys['в'];

        if (forward) driveInput += 1;
        if (backward) driveInput -= 1;
        if (left) steerInput += 1;   // Chapga burilish (A / Strelka chap) -> musbat burchak = chap tomonga yuradi
        if (right) steerInput -= 1;  // O'ngga burilish (D / Strelka o'ng) -> manfiy burchak = o'ng tomonga yuradi

        // Agar foydalanuvchi faqat A yoki D ni bossa (W/S bosilmagan bo'lsa),
        // robot to'xtab qolmasdan chapga/o'ngga burilib oldinga yursin
        if (driveInput === 0 && (left || right)) {
          driveInput = 0.75;
        }
      } else if (gameMode === 'line' && lineTrackCurve) {
        driveInput = 1.0;
        const lapSpeed = 0.04;
        const u = ((clock.getElapsedTime() * lapSpeed) % 1.0 + 1.0) % 1.0;
        const pos = lineTrackCurve.getPointAt(u);
        const nextPos = lineTrackCurve.getPointAt((u + 0.01) % 1.0);

        const targetA = Math.atan2(nextPos.x - pos.x, nextPos.z - pos.z);
        let diff = targetA - angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        steerInput = Math.max(-1, Math.min(1, diff * 3));
      } else {
        driveInput = 1.0;
        const distFromCenter = Math.sqrt(posX * posX + posZ * posZ);
        if (distFromCenter > 15) {
          steerInput = 1.0;
        } else {
          steerInput = Math.sin(clock.getElapsedTime() * 0.8) * 0.5;
        }
      }

      // Racing Boost Pads & Nitro Overdrive
      if (gameMode === 'racing') {
        boostPads.forEach((pad) => {
          const dx = posX - pad.position.x;
          const dz = posZ - pad.position.z;
          if (Math.sqrt(dx * dx + dz * dz) < 2.5) {
            velocity = Math.min(18.5, velocity + 30 * delta);
            triggerCollision(posX, posZ, 0); // Visual cyan spark burst!
          }
        });
      }

      const currentMaxSpeed = isBoosting ? maxSpeed * 1.5 : maxSpeed;
      if (isBoosting && energy > 10) {
        energy = Math.max(0, energy - delta * 15);
      } else if (!isBoosting && energy < 100) {
        energy = Math.min(100, energy + delta * 6);
      }

      if (driveInput !== 0) {
        velocity += driveInput * acceleration * delta;
        velocity = Math.max(-currentMaxSpeed * 0.5, Math.min(currentMaxSpeed, velocity));
      } else {
        if (velocity > 0) {
          velocity = Math.max(0, velocity - friction * delta);
        } else if (velocity < 0) {
          velocity = Math.min(0, velocity + friction * delta);
        }
      }

      if (steerInput !== 0) {
        const dir = velocity < 0 ? -1 : 1;
        angle += steerInput * steerSpeed * delta * dir;
      }

      posX += Math.sin(angle) * velocity * delta;
      posZ += Math.cos(angle) * velocity * delta;

      // RoboSumo Pulsing Ring Warning & Ring Out Check
      if (gameMode === 'sumo') {
        const distFromTatami = Math.sqrt(posX * posX + posZ * posZ);

        if (sumoWarningRingMat) {
          if (distFromTatami > 10.2) {
            // Urgent edge warning: flash bright red rapidly
            sumoWarningRingMat.opacity = 0.5 + 0.5 * Math.sin(clock.getElapsedTime() * 16);
            (sumoWarningRingMat.color as THREE.Color).setHex(0xef4444);
          } else {
            // Calm ambient golden pulse
            sumoWarningRingMat.opacity = 0.3 + 0.15 * Math.sin(clock.getElapsedTime() * 4);
            (sumoWarningRingMat.color as THREE.Color).setHex(0xf59e0b);
          }
        }

        if (distFromTatami > 12.0) {
          onGameEvent({
            type: 'ringout',
            title: "RING OUT! DOIRADAN CHIQIB KETDINGIZ! 🥋",
            subtitle: "Raqib ustunlikka erishdi. Dohyo start chizig'iga qayting.",
            scoreAdd: -100,
          });
          posX = 0;
          posZ = 4.0;
          angle = Math.PI;
          velocity = 0;
        }
      }

      // Line Follower Lap Timing & Start Gantry Detection
      if (gameMode === 'line') {
        const dx = posX - (-16);
        const dz = posZ - (-14);
        if (Math.abs(dx) < 3.5 && Math.abs(dz) < 2.0) {
          const now = performance.now();
          if (now - lastLapCrossTime > 7500) {
            lastLapCrossTime = now;
            const lapTimeStr = clock.getElapsedTime().toFixed(1);
            onGameEvent({
              type: 'lap',
              title: `AYLANA ${currentLap} YAKUNLANDI! 🏁`,
              subtitle: `Aylana vaqti: ${lapTimeStr}s! Yangi rekord (+250 PTS)`,
              scoreAdd: 250,
            });
            currentLap++;
          }
        }
      }

      // Speed Racing Checkpoint Gantry Detection at (0, 16)
      if (gameMode === 'racing') {
        if (Math.abs(posX) < 5.0 && Math.abs(posZ - 16) < 2.4) {
          const now = performance.now();
          if (now - lastLapCrossTime > 8000) {
            lastLapCrossTime = now;
            const topSpeedKm = (Math.abs(velocity) * 3.6).toFixed(1);
            onGameEvent({
              type: 'lap',
              title: "TEZLIK REKORDI! 🏎️",
              subtitle: `Maksimal tezlik: ${topSpeedKm} km/soat! (+300 PTS)`,
              scoreAdd: 300,
            });
          }
        }
      }

      // Football Ball Physics, 3D Rolling, Collisions & Goals
      if (gameMode === 'football' && ballMesh) {
        const dx = posX - ballMesh.position.x;
        const dz = posZ - ballMesh.position.z;
        const distToBall = Math.sqrt(dx * dx + dz * dz);

        // Player Robot kicks ball
        if (distToBall < 1.7) {
          const hitMultiplier = isBoosting ? 2.4 : 1.3;
          const hitForce = Math.max(7.5, Math.abs(velocity) * 2.8) * hitMultiplier;

          const pushDirX = -Math.sin(angle);
          const pushDirZ = -Math.cos(angle);

          ballVelocity.x = pushDirX * hitForce;
          ballVelocity.z = pushDirZ * hitForce;
          if (isBoosting) {
            ballVelocity.y = 2.4; // Airborne rocket shot!
            triggerCollision((posX + ballMesh.position.x) / 2, (posZ + ballMesh.position.z) / 2, 0);
          }
        }

        // Apply velocity vectors
        ballMesh.position.x += ballVelocity.x * delta;
        ballMesh.position.z += ballVelocity.z * delta;
        ballMesh.position.y += ballVelocity.y * delta;

        // Gravity & Ground Bounce
        if (ballMesh.position.y > 0.85) {
          ballVelocity.y -= 9.8 * delta;
        } else {
          ballMesh.position.y = 0.85;
          if (Math.abs(ballVelocity.y) > 1.0) {
            ballVelocity.y = -ballVelocity.y * 0.45;
          } else {
            ballVelocity.y = 0;
          }
        }

        // 3D Realistic Rolling Rotation around perpendicular vector!
        const speed2D = Math.sqrt(ballVelocity.x * ballVelocity.x + ballVelocity.z * ballVelocity.z);
        if (speed2D > 0.05) {
          const rollAngle = (speed2D * delta) / 0.85;
          const rollAxis = new THREE.Vector3(-ballVelocity.z, 0, ballVelocity.x).normalize();
          ballMesh.rotateOnWorldAxis(rollAxis, rollAngle);
        }

        // Friction & Aerodynamic Drag
        ballVelocity.x *= 0.984;
        ballVelocity.z *= 0.984;

        // Side touchline rebounds
        if (Math.abs(ballMesh.position.x) > 22.0) {
          ballMesh.position.x = Math.sign(ballMesh.position.x) * 22.0;
          ballVelocity.x = -ballVelocity.x * 0.65;
        }

        // Goal Post Collisions (North: z = -30, South: z = 30, posts at x = ±5.0)
        [-30, 30].forEach((postZ) => {
          [-5.0, 5.0].forEach((postX) => {
            const pDx = ballMesh!.position.x - postX;
            const pDz = ballMesh!.position.z - postZ;
            const postDist = Math.sqrt(pDx * pDx + pDz * pDz);
            if (postDist < 1.0) {
              ballVelocity.x = (pDx / postDist) * Math.max(8, speed2D * 0.8);
              ballVelocity.z = (pDz / postDist) * Math.max(8, speed2D * 0.8);
              triggerCollision(postX, postZ, 0);
            }
          });
        });

        // North Goal Check (Player scores into opponent's goal!)
        if (ballMesh.position.z < -30.0 && Math.abs(ballMesh.position.x) < 4.8 && ballMesh.position.y < 3.6) {
          onGameEvent({
            type: 'goal',
            title: "GOOOOL! ⚽ REKORD ZARBA!",
            subtitle: "Siz raqib darvozasiga ajoyib to'p kiritdingiz! (+500 PTS)",
            scoreAdd: 500,
          });
          ballMesh.position.set(0, 0.85, 0);
          ballVelocity.set(0, 0, 0);
        }

        // South Goal Check (Opponent scores into player's goal)
        if (ballMesh.position.z > 30.0 && Math.abs(ballMesh.position.x) < 4.8 && ballMesh.position.y < 3.6) {
          onGameEvent({
            type: 'goal',
            title: "RAQIB GOL URDY! ⚽",
            subtitle: "O'z darvozamizdan to'p o'tkazib yubordik.",
            scoreAdd: 0,
          });
          ballMesh.position.set(0, 0.85, 0);
          ballVelocity.set(0, 0, 0);
        }

        // Behind goal lines out-of-bounds reset
        if (Math.abs(ballMesh.position.z) > 31.8 && Math.abs(ballMesh.position.x) >= 4.8) {
          ballMesh.position.set(0, 0.85, 0);
          ballVelocity.set(0, 0, 0);
        }
      }

      // Warehouse Crates Push Physics & Holographic Drop Zone Delivery
      if (gameMode === 'warehouse') {
        crates.forEach((crate) => {
          if (crate.position.y < -50) return;

          const dx = posX - crate.position.x;
          const dz = posZ - crate.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          // Pushing crate with realistic friction and resistance
          if (dist < 1.9) {
            const pushMultiplier = isBoosting ? 2.5 : 1.4;
            const force = Math.max(2.6, Math.abs(velocity) * 1.9) * pushMultiplier;
            crate.position.x -= (dx / dist) * force * delta;
            crate.position.z -= (dz / dist) * force * delta;

            // Resistance on robot
            velocity *= 0.88;
          }

          // Crate Delivery Detection into Holographic Drop Zone at (18, 18)
          const distToZone = Math.sqrt(
            Math.pow(crate.position.x - 18, 2) + Math.pow(crate.position.z - 18, 2)
          );
          if (distToZone < 3.8) {
            onGameEvent({
              type: 'crate',
              title: "YUK MUVAFFAQIYATLI YETKAZILDI! 📦",
              subtitle: "Ekspress logistika topshirig'i bajarildi! (+300 PTS)",
              scoreAdd: 300,
            });
            triggerCollision(18, 18, 0); // Visual particle burst!

            // Respawn crate at receiving dispatch area after delivery
            crate.position.set(-10 + (Math.random() - 0.5) * 8, 0.9, -10 + (Math.random() - 0.5) * 8);
          }
        });
      }

      // Boundary Collisions
      const safeBound = arenaBoundary - 1.5;
      if (Math.abs(posX) > safeBound) {
        posX = Math.sign(posX) * safeBound;
        if (Math.abs(velocity) > 2) triggerCollision(posX, posZ, 6);
        velocity = -velocity * 0.4;
      }
      if (Math.abs(posZ) > safeBound) {
        posZ = Math.sign(posZ) * safeBound;
        if (Math.abs(velocity) > 2) triggerCollision(posX, posZ, 6);
        velocity = -velocity * 0.4;
      }

      // 🛑 RIGID-BODY COLLISION RESOLUTION (Narsalar ichiga kirib ketishdan 100% qat'iy himoya)
      const robotR = 1.15; // To'liq korpus va g'ildiraklar xavfsizlik radiusi (mesh kesishishini butunlay yo'qotadi)

      // 1. Statik Silindrsimon / Ustun to'siqlar
      const staticPoles: { x: number; z: number; r: number }[] = [];

      if (gameMode === 'racing') {
        // Gantry start arkasi ustunlari (x: ±6, z: 16)
        staticPoles.push({ x: -6, z: 16, r: 0.9 }, { x: 6, z: 16, r: 0.9 });
      } else if (gameMode === 'line') {
        // Line Follower F1 Arkasi ustunlari va Sanoat robotlari
        staticPoles.push(
          { x: -19.5, z: -14, r: 0.8 },
          { x: -12.5, z: -14, r: 0.8 },
          { x: -24, z: 10, r: 1.8 },
          { x: 22, z: 10, r: 1.8 }
        );
      } else if (gameMode === 'football') {
        // Stadion darvoza ustunlari (x = ±5.0) va 4 ta baland projektor pilonlari
        staticPoles.push(
          { x: -5.0, z: -30, r: 0.6 },
          { x: 5.0, z: -30, r: 0.6 },
          { x: -5.0, z: 30, r: 0.6 },
          { x: 5.0, z: 30, r: 0.6 },
          { x: -28, z: -35, r: 2.2 },
          { x: 28, z: -35, r: 2.2 },
          { x: -28, z: 35, r: 2.2 },
          { x: 28, z: 35, r: 2.2 }
        );
      } else if (gameMode === 'sumo') {
        // Torii darvozalari ustunlari, Taiko barabanlari va Nobori bayroqlari
        staticPoles.push(
          { x: -4.5, z: -23.5, r: 1.1 },
          { x: 4.5, z: -23.5, r: 1.1 },
          { x: -4.5, z: 23.5, r: 1.1 },
          { x: 4.5, z: 23.5, r: 1.1 },
          { x: 0, z: -21, r: 2.0 },
          { x: 0, z: 21, r: 2.0 },
          { x: -16, z: -16, r: 0.8 },
          { x: 16, z: -16, r: 0.8 },
          { x: -16, z: 16, r: 0.8 },
          { x: 16, z: 16, r: 0.8 }
        );
      }

      staticPoles.forEach((pole) => {
        const dx = posX - pole.x;
        const dz = posZ - pole.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minDist = robotR + pole.r;
        if (dist < minDist) {
          // Robotni to'siq sirtidan darhol tashqariga surib chiqarish (penetrationni butunlay bartaraf etish)
          const pushX = dx / (dist || 0.001);
          const pushZ = dz / (dist || 0.001);
          posX = pole.x + pushX * minDist;
          posZ = pole.z + pushZ * minDist;
          velocity = -velocity * 0.4; // Qattiq jism elastik sakrashi
          triggerCollision(posX, posZ, 4);
        }
      });

      // 2. AABB Quti to'siqlar (Javonlar, stollar, serverlar, darvoza to'rlari)
      const aabbBoxes: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [];

      if (gameMode === 'warehouse') {
        // Omborxona 4 ta ulkan yuk javonlari (haqiqiy koordinatalari x: ±22, z: ±15)
        [-22, 22].forEach((rx) => {
          [-15, 15].forEach((rz) => {
            aabbBoxes.push({
              minX: rx - 2.5,
              maxX: rx + 2.5,
              minZ: rz - 7.9,
              maxZ: rz + 7.9,
            });
            staticPoles.push(
              { x: rx, z: rz - 7.5, r: 0.6 },
              { x: rx, z: rz + 7.5, r: 0.6 }
            );
          });
        });
      } else if (gameMode === 'line') {
        // Laboratoriya stollari va Server raklari
        aabbBoxes.push(
          { minX: -24, maxX: -16, minZ: -26.5, maxZ: -23.5 },
          { minX: -11, maxX: -3, minZ: -26.5, maxZ: -23.5 },
          { minX: 2, maxX: 10, minZ: -26.5, maxZ: -23.5 },
          { minX: 15, maxX: 23, minZ: -26.5, maxZ: -23.5 },
          { minX: 22.5, maxX: 25.5, minZ: -22, maxZ: -11 }
        );
      } else if (gameMode === 'football') {
        // Darvoza orqa to'rlari va konstruksiyasi
        aabbBoxes.push(
          { minX: -5.2, maxX: 5.2, minZ: -33.0, maxZ: -30.0 },
          { minX: -5.2, maxX: 5.2, minZ: 30.0, maxZ: 33.0 }
        );
      }

      aabbBoxes.forEach((box) => {
        const rMinX = box.minX - robotR;
        const rMaxX = box.maxX + robotR;
        const rMinZ = box.minZ - robotR;
        const rMaxZ = box.maxZ + robotR;

        if (posX > rMinX && posX < rMaxX && posZ > rMinZ && posZ < rMaxZ) {
          const dLeft = Math.abs(posX - rMinX);
          const dRight = Math.abs(rMaxX - posX);
          const dTop = Math.abs(posZ - rMinZ);
          const dBottom = Math.abs(rMaxZ - posZ);
          const minEdge = Math.min(dLeft, dRight, dTop, dBottom);

          if (minEdge === dLeft) posX = rMinX;
          else if (minEdge === dRight) posX = rMaxX;
          else if (minEdge === dTop) posZ = rMinZ;
          else posZ = rMaxZ;

          velocity = -velocity * 0.4;
          triggerCollision(posX, posZ, 4);
        }
      });

      // Opponents Collisions & Sumo AI Wrestling Logic
      opponents.forEach((opp, idx) => {
        if (gameMode === 'sumo' && opp.name === 'ShadowX') {
          // AI Sumo Wrestler (ShadowX): Faces player and actively charges
          const dx = posX - opp.x;
          const dz = posZ - opp.z;
          const distToPlayer = Math.sqrt(dx * dx + dz * dz);
          const oppDistFromCenter = Math.sqrt(opp.x * opp.x + opp.z * opp.z);

          const targetAngle = Math.atan2(dx, dz);
          opp.group.rotation.y = targetAngle;

          const chargeSpeed = 4.0;
          if (distToPlayer > 1.4) {
            opp.x += Math.sin(targetAngle) * chargeSpeed * delta;
            opp.z += Math.cos(targetAngle) * chargeSpeed * delta;
          }
          opp.group.position.set(opp.x, 0, opp.z);

          // Sumo Head-to-Head Grapple & Push Physics
          if (distToPlayer < 1.8) {
            const damage = Math.round(Math.abs(velocity) * 1.5) + 3;
            triggerCollision((posX + opp.x) / 2, (posZ + opp.z) / 2, damage);

            const pushFactor = isBoosting ? 2.4 : (velocity > 0 ? 1.5 : 0.8);
            const pushDirX = dx / distToPlayer;
            const pushDirZ = dz / distToPlayer;

            // Opponent pushed backwards
            opp.x -= pushDirX * pushFactor * 3.8 * delta;
            opp.z -= pushDirZ * pushFactor * 3.8 * delta;

            // Player pushed back slightly if not boosting
            posX += pushDirX * 1.6 * delta;
            posZ += pushDirZ * 1.6 * delta;
            velocity *= 0.65;
          }

          // Opponent pushed out of the 12m ring!
          if (oppDistFromCenter > 12.0) {
            onGameEvent({
              type: 'ringout',
              title: "YORIKIRI! G'ALABA! 🏆",
              subtitle: "Siz raqib ShadowX ni Dohyodan itarib chiqardingiz! (+300 PTS)",
              scoreAdd: 300,
            });
            opp.x = 0;
            opp.z = -4.0;
          }
        } else if (gameMode === 'sumo' && opp.name === 'Zephyr') {
          // Zephyr circles around the Dohyo edge as secondary spectator/challenger
          const time = clock.getElapsedTime();
          opp.x = Math.sin(time * 0.4) * 8;
          opp.z = -8 + Math.cos(time * 0.3) * 3;
          opp.group.position.set(opp.x, 0, opp.z);
          opp.group.rotation.y = time * 0.5;
        } else if (gameMode === 'football' && opp.name === 'ShadowX' && ballMesh) {
          // AI Goalkeeper (ShadowX): Defends North goal and tracks ball X
          const targetX = Math.max(-4.2, Math.min(4.2, ballMesh.position.x));
          opp.x += (targetX - opp.x) * 4.5 * delta;
          opp.z = -27.5;
          opp.group.position.set(opp.x, 0, opp.z);
          opp.group.rotation.y = 0; // Faces South downfield

          // Goalkeeper Save & Clearance Kick
          const bDx = ballMesh.position.x - opp.x;
          const bDz = ballMesh.position.z - opp.z;
          const distToBall = Math.sqrt(bDx * bDx + bDz * bDz);
          if (distToBall < 2.0) {
            ballVelocity.z = 18.0 + Math.random() * 4;
            ballVelocity.x = (Math.random() - 0.5) * 8;
            ballVelocity.y = 1.5;
            triggerCollision(opp.x, opp.z, 0);
          }
        } else if (gameMode === 'football' && opp.name === 'Zephyr' && ballMesh) {
          // AI Striker (Zephyr): Chases ball and attacks toward South goal
          const bDx = ballMesh.position.x - opp.x;
          const bDz = ballMesh.position.z - opp.z;
          const distToBall = Math.sqrt(bDx * bDx + bDz * bDz);
          const strikeAngle = Math.atan2(bDx, bDz);

          opp.group.rotation.y = strikeAngle;
          if (distToBall > 1.2) {
            opp.x += Math.sin(strikeAngle) * 4.2 * delta;
            opp.z += Math.cos(strikeAngle) * 4.2 * delta;
          }
          opp.group.position.set(opp.x, 0, opp.z);

          // Striker shoots toward South goal!
          if (distToBall < 1.7) {
            ballVelocity.z = 15.0;
            ballVelocity.x = (Math.random() - 0.5) * 6;
            triggerCollision(opp.x, opp.z, 0);
          }

          // Player vs Zephyr collision
          const pDx = posX - opp.x;
          const pDz = posZ - opp.z;
          if (Math.sqrt(pDx * pDx + pDz * pDz) < 1.8) {
            triggerCollision((posX + opp.x) / 2, (posZ + opp.z) / 2, 4);
            velocity = -velocity * 0.5;
          }
        } else if (gameMode === 'line' && lineTrackCurve) {
          // Autonomous Line Follower Racing AI along the vinyl track
          const lapSpeed = 0.035;
          const offset = opp.name === 'ShadowX' ? 0.08 : 0.24;
          const u = ((clock.getElapsedTime() * lapSpeed + offset) % 1.0 + 1.0) % 1.0;
          const pos = lineTrackCurve.getPointAt(u);
          const nextPos = lineTrackCurve.getPointAt((u + 0.01) % 1.0);

          opp.x = pos.x;
          opp.z = pos.z;
          opp.group.position.set(opp.x, 0, opp.z);
          opp.group.rotation.y = Math.atan2(nextPos.x - pos.x, nextPos.z - pos.z);

          // Player vs Opponent collision
          const pDx = posX - opp.x;
          const pDz = posZ - opp.z;
          if (Math.sqrt(pDx * pDx + pDz * pDz) < 1.8) {
            triggerCollision((posX + opp.x) / 2, (posZ + opp.z) / 2, 4);
            velocity = -velocity * 0.5;
          }
        } else if (gameMode === 'warehouse') {
          // Autonomous Guided Vehicles (AGVs) patrolling warehouse transit lanes
          const time = clock.getElapsedTime() * 0.4 + (opp.name === 'ShadowX' ? 0 : Math.PI);
          const laneX = opp.name === 'ShadowX' ? -11 : 11;
          const patrolZ = Math.sin(time) * 18;

          opp.x = laneX;
          opp.z = patrolZ;
          opp.group.position.set(opp.x, 0, opp.z);
          opp.group.rotation.y = Math.cos(time) > 0 ? 0 : Math.PI;

          // Player collision with AGV
          const pDx = posX - opp.x;
          const pDz = posZ - opp.z;
          if (Math.sqrt(pDx * pDx + pDz * pDz) < 1.8) {
            triggerCollision((posX + opp.x) / 2, (posZ + opp.z) / 2, 4);
            velocity = -velocity * 0.5;
          }
        } else if (gameMode === 'racing') {
          // Cyberpunk Street Racing Rivals cruising at high speed around circuit
          const time = clock.getElapsedTime() * 0.45 + (opp.name === 'ShadowX' ? 0 : Math.PI);
          const rX = Math.sin(time) * 22;
          const rZ = Math.cos(time * 0.8) * 22;

          const nextTime = time + 0.05;
          const nextX = Math.sin(nextTime) * 22;
          const nextZ = Math.cos(nextTime * 0.8) * 22;

          opp.x = rX;
          opp.z = rZ;
          opp.group.position.set(opp.x, 0, opp.z);
          opp.group.rotation.y = Math.atan2(nextX - rX, nextZ - rZ);

          // Player vs Rival racer collision
          const pDx = posX - opp.x;
          const pDz = posZ - opp.z;
          if (Math.sqrt(pDx * pDx + pDz * pDz) < 1.8) {
            triggerCollision((posX + opp.x) / 2, (posZ + opp.z) / 2, 5);
            velocity *= 0.7;
          }
        } else {
          // Standard roaming for other arenas
          const time = clock.getElapsedTime() + idx * 2.5;
          opp.x = (opp.name === 'ShadowX' ? -8 : 14) + Math.sin(time * 0.7) * 7;
          opp.z = (opp.name === 'ShadowX' ? -10 : -8) + Math.cos(time * 0.5) * 7;
          opp.group.position.set(opp.x, 0, opp.z);
          opp.group.rotation.y = time * 0.5;

          const dx = posX - opp.x;
          const dz = posZ - opp.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < 1.8) {
            const damage = Math.round(Math.abs(velocity) * 1.5) + 4;
            triggerCollision((posX + opp.x) / 2, (posZ + opp.z) / 2, damage);

            velocity = -velocity * 0.6;
            posX += (dx / dist) * 0.4;
            posZ += (dz / dist) * 0.4;
          }
        }
      });

      playerGroup.position.set(posX, 0, posZ);
      playerGroup.rotation.y = angle;

      playerWheels.forEach((w) => {
        w.rotation.z += velocity * delta * 5;
      });

      if (sparkMat.opacity > 0) {
        sparkMat.opacity = Math.max(0, sparkMat.opacity - delta * 2.5);
        const positions = sparkGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < sparkCount; i++) {
          positions[i * 3] += sparkVelocities[i].x * delta;
          positions[i * 3 + 1] += sparkVelocities[i].y * delta;
          positions[i * 3 + 2] += sparkVelocities[i].z * delta;
          sparkVelocities[i].y -= 9.8 * delta;
        }
        sparkGeo.attributes.position.needsUpdate = true;
      }

      // Camera Follow Modes & 360° Free Orbit (Blender/CAD LMB/MMB/RMB/Scroll)
      if (cameraMode === 'fpv') {
        controls.enabled = false;
        camera.position.set(posX + Math.sin(angle) * 0.7, 0.7, posZ + Math.cos(angle) * 0.7);
        camera.lookAt(posX + Math.sin(angle) * 8, 0.7, posZ + Math.cos(angle) * 8);
      } else if (cameraMode === 'top') {
        controls.enabled = false;
        camera.position.set(posX, 28, posZ + 0.1);
        camera.lookAt(posX, 0, posZ);
      } else {
        // Chase & 360° Free Orbit Mode (G'ildirak / Chap tugma bilan 360° erkin aylantirish)
        controls.enabled = true;
        const dX = posX - prevRobotPos.x;
        const dZ = posZ - prevRobotPos.z;
        prevRobotPos.x = posX;
        prevRobotPos.z = posZ;

        if (dX !== 0 || dZ !== 0) {
          camera.position.x += dX;
          camera.position.z += dZ;
          controls.target.x = posX;
          controls.target.y = 0.8;
          controls.target.z = posZ;
        }
        controls.update();
      }

      const displaySpeed = Number(Math.abs(velocity).toFixed(1));
      setPlayerPos({ x: posX, z: posZ, angle });
      onUpdateTelemetry({
        hp,
        speed: displaySpeed,
        energy: Math.round(energy),
        x: posX,
        z: posZ,
        angle,
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      const w = rect.width > 50 ? rect.width : (mountRef.current.clientWidth || window.innerWidth || 1000);
      const h = rect.height > 50 ? rect.height : (mountRef.current.clientHeight || 520);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [parts, isAutonomous, gameMode, cameraMode]);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full min-h-[350px] flex-1 overflow-hidden select-none cursor-grab active:cursor-grabbing"
    />
  );
};
