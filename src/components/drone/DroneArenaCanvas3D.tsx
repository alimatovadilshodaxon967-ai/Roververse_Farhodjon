import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { DroneGameMode, DroneTelemetry } from '../../types/drone';

interface DroneArenaCanvas3DProps {
  gameMode: DroneGameMode;
  cameraMode: 'chase' | 'fpv' | 'top';
  onUpdateTelemetry: (telemetry: DroneTelemetry) => void;
  resetTrigger: number;
}

export const DroneArenaCanvas3D: React.FC<DroneArenaCanvas3DProps> = ({
  gameMode,
  cameraMode,
  onUpdateTelemetry,
  resetTrigger,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const rect = container.getBoundingClientRect();
    const width = rect.width > 50 ? rect.width : (container.clientWidth || window.innerWidth || 1200);
    const height = rect.height > 50 ? rect.height : (container.clientHeight || window.innerHeight || 700);

    // ==========================================
    // 1. SCENE, CAMERA, RENDERER
    // ==========================================
    const scene = new THREE.Scene();

    // Distinct Sky & Fog Per Arena
    let skyColor = 0x091426;
    let groundColor = 0x0c192e;
    let fogDensity = 0.003;

    if (gameMode === 'racing') {
      skyColor = 0x070c1a;
      groundColor = 0x0a1224;
      fogDensity = 0.0025;
    } else if (gameMode === 'city') {
      skyColor = 0x050914;
      groundColor = 0x081020;
      fogDensity = 0.003;
    } else if (gameMode === 'delivery') {
      skyColor = 0x0c182c;
      groundColor = 0x182438;
      fogDensity = 0.002;
    } else if (gameMode === 'targets') {
      skyColor = 0x081224;
      groundColor = 0x0a1932;
      fogDensity = 0.002;
    } else if (gameMode === 'canyon') {
      skyColor = 0x241208; // Sunset Amber
      groundColor = 0x3d1d0e;
      fogDensity = 0.0028;
    }

    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, fogDensity);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.2, 800);
    camera.position.set(0, 4.0, 7.0);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      powerPreference: 'high-performance',
      alpha: false 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 1.0;
    controls.maxDistance = 120.0;

    // EXACT user requested mouse mapping:
    // - O'rta tugma (g'ildirak bosish): Modelni barcha burchaklardan 360° erkin aylantirish (Blender/CAD)
    // - Chap tugma (LMB): Standart erkin aylantirish
    // - G'ildirak aylantirish (Scroll): Yaqinlashtirish / Uzoqlashtirish (Zoom In / Out)
    // - O'ng tugma (RMB): Kamerani tekis siljitish (Pan)
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.ROTATE,
      RIGHT: THREE.MOUSE.PAN,
    };

    // ==========================================
    // 2. LIGHTING & ENVIRONMENT
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(
      gameMode === 'canyon' ? 0xffa050 : 0x7dd3fc, 
      2.0
    );
    sunLight.position.set(60, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 280;
    const shadowD = 80;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    scene.add(sunLight);

    // Hemispherical Sky Fill Light
    const hemiLight = new THREE.HemisphereLight(
      gameMode === 'canyon' ? 0xffbe76 : 0x38bdf8, 
      0x0f172a, 
      0.7
    );
    scene.add(hemiLight);

    // ==========================================
    // 3. GROUND & ARENA STRUCTURES
    // ==========================================
    const groundGeo = new THREE.PlaneGeometry(500, 500, 80, 80);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: groundColor,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);

    // Glowing Holographic Grid Floor
    const gridHelper = new THREE.GridHelper(
      500, 
      100, 
      gameMode === 'canyon' ? 0xf59e0b : 0x06b6d4, 
      gameMode === 'canyon' ? 0x78350f : 0x1e293b
    );
    gridHelper.position.y = 0.05;
    scene.add(gridHelper);

    // Interactive Gates / Target Rings / Waypoints
    const interactiveGates: { mesh: THREE.Mesh; passed: boolean; scoreVal: number }[] = [];
    let totalScore = 0;
    let gatesPassedCount = 0;

    // --- ARENA 1: FPV POYGA (GATES) ---
    if (gameMode === 'racing') {
      // Launch Helipad Pad at Start (0, 0, 0)
      const startPad = new THREE.Mesh(
        new THREE.CylinderGeometry(5, 5, 0.4, 32),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 })
      );
      startPad.position.set(0, 0.2, 0);
      startPad.receiveShadow = true;
      scene.add(startPad);

      const startRing = new THREE.Mesh(
        new THREE.RingGeometry(4.2, 4.8, 32),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
      );
      startRing.rotation.x = -Math.PI / 2;
      startRing.position.set(0, 0.42, 0);
      scene.add(startRing);

      // Race Track Perimeter Stadium Floodlight Towers
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI * 2) / 8;
        const rad = 75;
        const tower = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 1.2, 28, 8),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
        );
        tower.position.set(Math.cos(ang) * rad, 14, Math.sin(ang) * rad);
        scene.add(tower);

        const spot = new THREE.Mesh(
          new THREE.BoxGeometry(4, 2, 2),
          new THREE.MeshBasicMaterial({ color: 0x67e8f9 })
        );
        spot.position.set(tower.position.x, 28, tower.position.z);
        scene.add(spot);
      }

      // 8 Neon Race Gates with Pillars & Animated Glow
      const waypoints = [
        { x: 0, y: 5.5, z: -18, rotY: 0, col: 0x22c55e },
        { x: -16, y: 8.0, z: -42, rotY: Math.PI / 6, col: 0x06b6d4 },
        { x: -36, y: 11.0, z: -68, rotY: Math.PI / 3, col: 0x3b82f6 },
        { x: -28, y: 7.5, z: -105, rotY: Math.PI / 2, col: 0xa855f7 },
        { x: 8, y: 12.0, z: -110, rotY: (2 * Math.PI) / 3, col: 0xec4899 },
        { x: 38, y: 9.0, z: -75, rotY: Math.PI, col: 0xf59e0b },
        { x: 30, y: 6.5, z: -35, rotY: -Math.PI / 3, col: 0x06b6d4 },
        { x: 0, y: 5.0, z: -6, rotY: 0, col: 0x22c55e }, // Finish Gate
      ];

      waypoints.forEach((wp) => {
        // Torus Neon Ring
        const ringGeo = new THREE.TorusGeometry(4.2, 0.35, 16, 32);
        const ringMat = new THREE.MeshStandardMaterial({
          color: wp.col,
          emissive: wp.col,
          emissiveIntensity: 0.9,
          roughness: 0.2,
        });
        const gate = new THREE.Mesh(ringGeo, ringMat);
        gate.position.set(wp.x, wp.y, wp.z);
        gate.rotation.y = wp.rotY;
        scene.add(gate);

        interactiveGates.push({ mesh: gate, passed: false, scoreVal: 200 });

        // Left & Right Support Carbon Pillars
        const pillGeo = new THREE.CylinderGeometry(0.2, 0.35, wp.y, 8);
        const pillMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
        const leftPill = new THREE.Mesh(pillGeo, pillMat);
        leftPill.position.set(wp.x - Math.cos(wp.rotY) * 4.2, wp.y / 2, wp.z - Math.sin(wp.rotY) * 4.2);
        const rightPill = new THREE.Mesh(pillGeo, pillMat);
        rightPill.position.set(wp.x + Math.cos(wp.rotY) * 4.2, wp.y / 2, wp.z + Math.sin(wp.rotY) * 4.2);
        scene.add(leftPill, rightPill);
      });
    }

    // --- ARENA 2: KIBER SHAHAR (CYBER METROPOLIS) ---
    else if (gameMode === 'city') {
      // 40 Cyberpunk Skyscrapers with lit windows and rooftop landing pads
      for (let i = 0; i < 40; i++) {
        const h = 25 + Math.random() * 65;
        const w = 12 + Math.random() * 14;
        const d = 12 + Math.random() * 14;
        const bldGeo = new THREE.BoxGeometry(w, h, d);
        const bldMat = new THREE.MeshStandardMaterial({
          color: 0x091428,
          roughness: 0.3,
          metalness: 0.85,
        });
        const bld = new THREE.Mesh(bldGeo, bldMat);
        const ang = Math.random() * Math.PI * 2;
        const dist = 32 + Math.random() * 95;
        bld.position.set(Math.cos(ang) * dist, h / 2, Math.sin(ang) * dist);
        bld.castShadow = true;
        bld.receiveShadow = true;
        scene.add(bld);

        // Rooftop Beacon & Helipad
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(1.2, 12, 12),
          new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0x06b6d4 : 0xec4899 })
        );
        beacon.position.set(bld.position.x, h + 1.2, bld.position.z);
        scene.add(beacon);

        // Holographic Neon Billboards on sides
        if (i % 3 === 0) {
          const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 5),
            new THREE.MeshBasicMaterial({ 
              color: i % 2 === 0 ? 0x00f0ff : 0xff0055, 
              side: THREE.DoubleSide 
            })
          );
          sign.position.set(bld.position.x, h * 0.7, bld.position.z + d / 2 + 0.1);
          scene.add(sign);
        }
      }

      // Skybridge between towers
      const bridge = new THREE.Mesh(
        new THREE.BoxGeometry(50, 2.5, 5),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
      );
      bridge.position.set(0, 32, -45);
      scene.add(bridge);
    }

    // --- ARENA 3: YUK YETKAZISH (LOGISTICS & CARGO HUB) ---
    else if (gameMode === 'delivery') {
      // 3 Elevated Landing Helipads (Zone A, B, C)
      const pads = [
        { x: -22, y: 6, z: -30, name: 'ZONE A', col: 0x10b981 },
        { x: 26, y: 11, z: -55, name: 'ZONE B', col: 0x06b6d4 },
        { x: 0, y: 16, z: -90, name: 'ZONE C', col: 0xf59e0b },
      ];

      pads.forEach((p) => {
        // Tower Shaft
        const shaft = new THREE.Mesh(
          new THREE.CylinderGeometry(5.5, 7.0, p.y, 16),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.4 })
        );
        shaft.position.set(p.x, p.y / 2, p.z);
        shaft.castShadow = true;
        shaft.receiveShadow = true;
        scene.add(shaft);

        // Helipad Surface
        const padDisc = new THREE.Mesh(
          new THREE.CylinderGeometry(5.2, 5.2, 0.3, 24),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
        );
        padDisc.position.set(p.x, p.y + 0.15, p.z);
        scene.add(padDisc);

        // Glowing Target Circle
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(3.5, 4.2, 24),
          new THREE.MeshBasicMaterial({ color: p.col, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(p.x, p.y + 0.32, p.z);
        scene.add(ring);

        // Delivery Cargo Crate on Helipad
        const crate = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 1.6, 1.6),
          new THREE.MeshStandardMaterial({ color: p.col, roughness: 0.3, metalness: 0.7 })
        );
        crate.position.set(p.x, p.y + 1.1, p.z);
        scene.add(crate);

        interactiveGates.push({ mesh: padDisc, passed: false, scoreVal: 350 });
      });

      // Cargo Shipping Containers in Stacks
      const containerColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b];
      for (let c = 0; c < 24; c++) {
        const cMesh = new THREE.Mesh(
          new THREE.BoxGeometry(6, 3, 12),
          new THREE.MeshStandardMaterial({
            color: containerColors[c % containerColors.length],
            roughness: 0.5,
            metalness: 0.5,
          })
        );
        const col = c % 4;
        const row = Math.floor(c / 4) % 3;
        const stack = Math.floor(c / 12);
        cMesh.position.set(-35 + col * 8, 1.5 + stack * 3.1, -15 - row * 15);
        cMesh.castShadow = true;
        cMesh.receiveShadow = true;
        scene.add(cMesh);
      }
    }

    // --- ARENA 4: HAVO NISHONLARI (AERIAL TARGET RINGS) ---
    else if (gameMode === 'targets') {
      // Center Launch Platform
      const launchPlatform = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 6, 0.5, 32),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 })
      );
      launchPlatform.position.set(0, 0.25, 0);
      scene.add(launchPlatform);

      // 10 Floating Target Concentric Rings at Varying Elevations & Angles
      const targetLocations = [
        { x: 0, y: 5.5, z: -16, radius: 4.0, col: 0x10b981, pts: 100 },
        { x: -14, y: 9.0, z: -32, radius: 3.5, col: 0x06b6d4, pts: 200 },
        { x: 16, y: 12.0, z: -45, radius: 3.5, col: 0x3b82f6, pts: 200 },
        { x: -22, y: 15.0, z: -65, radius: 3.0, col: 0xa855f7, pts: 300 },
        { x: 0, y: 18.0, z: -85, radius: 3.0, col: 0xf59e0b, pts: 400 },
        { x: 25, y: 14.0, z: -105, radius: 2.8, col: 0xec4899, pts: 400 },
        { x: -18, y: 10.0, z: -125, radius: 3.2, col: 0x06b6d4, pts: 300 },
        { x: 12, y: 8.0, z: -145, radius: 3.5, col: 0x10b981, pts: 200 },
        { x: 0, y: 22.0, z: -165, radius: 2.5, col: 0xff0055, pts: 500 }, // Bullseye Ring
      ];

      targetLocations.forEach((tl) => {
        // Outer Glow Ring
        const ringGeo = new THREE.TorusGeometry(tl.radius, 0.35, 16, 32);
        const ringMat = new THREE.MeshStandardMaterial({
          color: tl.col,
          emissive: tl.col,
          emissiveIntensity: 0.95,
          roughness: 0.2,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(tl.x, tl.y, tl.z);
        scene.add(ring);

        // Center Bullseye Target Marker
        const centerMarker = new THREE.Mesh(
          new THREE.SphereGeometry(0.45, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        centerMarker.position.set(tl.x, tl.y, tl.z);
        scene.add(centerMarker);

        interactiveGates.push({ mesh: ring, passed: false, scoreVal: tl.pts });
      });

      // Ambient Laser Boundary Radar Beacons
      for (let b = 0; b < 6; b++) {
        const beacon = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4, 0.8, 30, 8),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
        );
        beacon.position.set((b % 2 === 0 ? -1 : 1) * 45, 15, -b * 35);
        scene.add(beacon);

        const lightDome = new THREE.Mesh(
          new THREE.SphereGeometry(1.0, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
        );
        lightDome.position.set(beacon.position.x, 30.5, beacon.position.z);
        scene.add(lightDome);
      }
    }

    // --- ARENA 5: KANYON TRASSASI (DESERT MOUNTAIN CANYON) ---
    else if (gameMode === 'canyon') {
      // 32 Majestic Red-Rock Canyon Cliffs & Pillars
      for (let i = 0; i < 32; i++) {
        const ph = 35 + Math.random() * 55;
        const pr = 6 + Math.random() * 9;
        const pillarGeo = new THREE.ConeGeometry(pr, ph, 8);
        const pillarMat = new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0x853b16 : 0xa04e22,
          roughness: 0.9,
          metalness: 0.1,
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        const side = i % 2 === 0 ? -1 : 1;
        const px = side * (18 + Math.random() * 32);
        const pz = -i * 8;
        pillar.position.set(px, ph / 2, pz);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        scene.add(pillar);
      }

      // Natural Stone Archway to fly through
      const archTop = new THREE.Mesh(
        new THREE.TorusGeometry(12, 2.5, 12, 24, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x6e2f10, roughness: 0.9 })
      );
      archTop.position.set(0, 14, -60);
      archTop.rotation.y = Math.PI / 2;
      scene.add(archTop);

      interactiveGates.push({ mesh: archTop, passed: false, scoreVal: 300 });
    }

    // ==========================================
    // 4. DETAILED 3D FPV QUADCOPTER DRONE MODEL
    // ==========================================
    const droneGroup = new THREE.Group();
    scene.add(droneGroup);

    // Carbon Fiber X-Arms Frame (Scale: ~1.2m across for clear visibility)
    const armMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.25, metalness: 0.9 });
    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 16), armMat);
    arm1.rotation.z = Math.PI / 2;
    arm1.rotation.y = Math.PI / 4;
    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 16), armMat);
    arm2.rotation.z = Math.PI / 2;
    arm2.rotation.y = -Math.PI / 4;
    droneGroup.add(arm1, arm2);

    // Central Carbon Electronics Pod
    const podGeo = new THREE.BoxGeometry(0.5, 0.22, 0.7);
    const podMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.15 });
    const pod = new THREE.Mesh(podGeo, podMat);
    pod.position.y = 0.08;
    pod.castShadow = true;
    droneGroup.add(pod);

    // 4S LiPo Battery
    const batt = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.16, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })
    );
    batt.position.set(0, 0.25, -0.04);
    droneGroup.add(batt);

    // FPV Camera with lens
    const camBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.18, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
    );
    camBody.rotation.x = Math.PI / 2 + 0.35;
    camBody.position.set(0, 0.12, 0.38);
    droneGroup.add(camBody);

    const camLens = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    camLens.position.set(0, 0.16, 0.46);
    droneGroup.add(camLens);

    // 5.8GHz VTX Antenna
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.03, 0.45, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    antenna.position.set(0, 0.35, -0.35);
    antenna.rotation.x = -0.35;
    droneGroup.add(antenna);

    // 4 Brushless Motors & 4 High-Speed Spinning Propellers
    const motorCoords = [
      { x: 0.64, z: 0.64 },
      { x: -0.64, z: 0.64 },
      { x: 0.64, z: -0.64 },
      { x: -0.64, z: -0.64 },
    ];
    const propellers: THREE.Group[] = [];

    motorCoords.forEach((pos, idx) => {
      // Motor Bell
      const motor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.16, 16),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.95, roughness: 0.1 })
      );
      motor.position.set(pos.x, 0.08, pos.z);
      droneGroup.add(motor);

      // Propeller Hub & 3 Aero Blades
      const propGroup = new THREE.Group();
      propGroup.position.set(pos.x, 0.18, pos.z);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.06, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      propGroup.add(hub);

      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.015, 0.55),
          new THREE.MeshStandardMaterial({
            color: idx < 2 ? 0x06b6d4 : 0x3b82f6,
            transparent: true,
            opacity: 0.85,
            roughness: 0.1,
          })
        );
        blade.position.z = 0.28;
        blade.rotation.x = 0.2;
        const bladeArm = new THREE.Group();
        bladeArm.rotation.y = (b * (Math.PI * 2)) / 3;
        bladeArm.add(blade);
        propGroup.add(bladeArm);
      }

      droneGroup.add(propGroup);
      propellers.push(propGroup);
    });

    // High-Intensity Navigation LEDs (Front Cyan, Rear Orange)
    const ledF1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
    ledF1.position.set(0.64, 0.02, 0.64);
    const ledF2 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
    ledF2.position.set(-0.64, 0.02, 0.64);
    const ledR1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
    ledR1.position.set(0.64, 0.02, -0.64);
    const ledR2 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
    ledR2.position.set(-0.64, 0.02, -0.64);
    droneGroup.add(ledF1, ledF2, ledR1, ledR2);

    // ==========================================
    // 5. 3D FLIGHT PHYSICS STATE
    // ==========================================
    let posX = 0;
    let posY = 3.0; // Spawns cleanly in the air
    let posZ = 0;

    let velX = 0;
    let velY = 0;
    let velZ = 0;

    let pitch = 0;      // Tilt forward/backward
    let roll = 0;       // Tilt left/right
    let yaw = Math.PI;  // Heading facing -Z (forward into arena)

    let battery = 96;
    const clock = new THREE.Clock();

    // ==========================================
    // 6. KEYBOARD LISTENERS
    // ==========================================
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

    let animationFrameId: number;

    // ==========================================
    // 7. AERODYNAMIC SIMULATION LOOP
    // ==========================================
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(0.05, clock.getDelta());
      const keys = keysRef.current;

      // Inputs
      const forwardInput = (keys['w'] || keys['keyw'] || keys['arrowup'] || keys['ц'] ? 1 : 0) -
                           (keys['s'] || keys['keys'] || keys['arrowdown'] || keys['ы'] ? 1 : 0);

      // A is Left, D is Right
      const rightInput = (keys['d'] || keys['keyd'] || keys['arrowright'] || keys['в'] ? 1 : 0) -
                         (keys['a'] || keys['keya'] || keys['arrowleft'] || keys['ф'] ? 1 : 0);

      const upInput = (keys[' '] || keys['space'] ? 1 : 0) -
                      (keys['shift'] || keys['shiftleft'] || keys['shiftright'] ? 1 : 0);

      const yawInput = (keys['e'] || keys['keye'] ? 1 : 0) -
                       (keys['q'] || keys['keyq'] ? 1 : 0);

      // Smooth Angular Attitude
      const targetPitch = forwardInput * 0.45;
      const targetRoll = -rightInput * 0.55;
      const targetYawSpeed = -yawInput * 2.5;

      pitch += (targetPitch - pitch) * Math.min(1, delta * 8);
      roll += (targetRoll - roll) * Math.min(1, delta * 8);
      yaw += targetYawSpeed * delta;

      // Vertical Lift vs Gravity
      const hoverThrust = 9.8;
      const verticalThrust = hoverThrust + upInput * 18.0;

      // Horizontal Propulsion
      const forwardAccel = forwardInput * 32.0;
      const rightAccel = rightInput * 26.0;

      const fX = Math.sin(yaw) * forwardAccel + Math.cos(yaw) * rightAccel;
      const fZ = Math.cos(yaw) * forwardAccel - Math.sin(yaw) * rightAccel;

      velX += fX * delta;
      velZ += fZ * delta;
      velY += (verticalThrust - 9.8) * delta;

      // Drag Air Resistance
      const drag = 3.0;
      velX -= velX * drag * delta;
      velZ -= velZ * drag * delta;
      velY -= velY * 2.2 * delta;

      // Position update
      posX += velX * delta;
      posY += velY * delta;
      posZ += velZ * delta;

      // Floor safety barrier
      if (posY < 0.45) {
        posY = 0.45;
        velY = 0;
        pitch *= 0.8;
        roll *= 0.8;
      }

      // Propeller spin
      const rpmSpeed = 55 + Math.abs(upInput) * 45;
      propellers.forEach((p, idx) => {
        const dir = idx % 2 === 0 ? 1 : -1;
        p.rotation.y += rpmSpeed * delta * dir;
      });

      // Update 3D Drone Transform
      droneGroup.position.set(posX, posY, posZ);
      droneGroup.rotation.set(0, 0, 0);
      droneGroup.rotation.y = yaw;
      droneGroup.rotateX(pitch);
      droneGroup.rotateZ(roll);

      // Gate Passing & Target Hits Check
      interactiveGates.forEach((gateObj) => {
        if (!gateObj.passed) {
          const dx = posX - gateObj.mesh.position.x;
          const dy = posY - gateObj.mesh.position.y;
          const dz = posZ - gateObj.mesh.position.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 4.5) {
            gateObj.passed = true;
            totalScore += gateObj.scoreVal;
            gatesPassedCount++;

            // Visual reward: Flash gate green
            const mat = gateObj.mesh.material as THREE.MeshStandardMaterial;
            if (mat && mat.color) {
              mat.color.setHex(0x22c55e);
              mat.emissive.setHex(0x22c55e);
              mat.emissiveIntensity = 2.0;
            }
          }
        }
      });

      // Camera Position & Tracking
      if (cameraMode === 'fpv') {
        controls.enabled = false;
        camera.position.set(
          posX + Math.sin(yaw) * 0.45,
          posY + 0.16,
          posZ + Math.cos(yaw) * 0.45
        );
        camera.lookAt(
          posX + Math.sin(yaw) * 20,
          posY + 0.16 - Math.sin(pitch) * 10,
          posZ + Math.cos(yaw) * 20
        );
      } else if (cameraMode === 'top') {
        controls.enabled = false;
        camera.position.set(posX, posY + 28, posZ + 0.2);
        camera.lookAt(posX, posY, posZ);
      } else {
        // Chase Cam (Default: Third Person smoothly trailing behind)
        controls.enabled = true;
        const camDistance = 4.8;
        const camHeight = 2.0;
        const targetCamX = posX - Math.sin(yaw) * camDistance;
        const targetCamY = posY + camHeight;
        const targetCamZ = posZ - Math.cos(yaw) * camDistance;

        camera.position.x += (targetCamX - camera.position.x) * Math.min(1, delta * 8);
        camera.position.y += (targetCamY - camera.position.y) * Math.min(1, delta * 8);
        camera.position.z += (targetCamZ - camera.position.z) * Math.min(1, delta * 8);

        controls.target.set(posX, posY + 0.3, posZ);
        controls.update();
      }

      // Battery depletion
      if (battery > 1) {
        battery -= delta * 0.035;
      }

      // Live Telemetry to HUD
      const horizontalKmh = Math.sqrt(velX * velX + velZ * velZ) * 3.6;
      onUpdateTelemetry({
        altitude: Math.max(0, posY),
        speed: horizontalKmh,
        verticalSpeed: velY,
        pitch: (pitch * 180) / Math.PI,
        roll: (roll * 180) / Math.PI,
        yaw: ((yaw * 180) / Math.PI) % 360,
        battery,
        rssi: 98,
        motorRpm: [
          Math.min(100, Math.round(50 + forwardInput * 25 + upInput * 25)),
          Math.min(100, Math.round(50 - forwardInput * 25 + upInput * 25)),
          Math.min(100, Math.round(50 + rightInput * 25 + upInput * 25)),
          Math.min(100, Math.round(50 - rightInput * 25 + upInput * 25)),
        ],
        score: totalScore,
        gatesPassed: gatesPassedCount,
      });

      renderer.render(scene, camera);
    };

    animate();

    // Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const r = container.getBoundingClientRect();
      const w = r.width > 50 ? r.width : (container.clientWidth || window.innerWidth);
      const h = r.height > 50 ? r.height : (container.clientHeight || window.innerHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [gameMode, cameraMode, resetTrigger]);

  return <div ref={mountRef} className="w-full h-full relative" />;
};
