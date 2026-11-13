import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { 
  Rotate3d, 
  Play, 
  Square, 
  Download, 
  Save, 
  Code, 
  FileCode, 
  Gamepad2, 
  Terminal, 
  Lightbulb,
  Camera,
  Info
} from 'lucide-react';
import { DroneSchematic } from './DroneSchematic';
import type { ViewMode } from '../../types';
import type { DronePart } from '../../types/drone';

interface DroneViewport3DProps {
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  parts: DronePart[];
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onSave: () => void;
  onOpenExportImport: () => void;
  liveAltitude: number;
  onUpdateLiveAltitude: (alt: number) => void;
  pythonCode: string;
  isCodeOpen: boolean;
  onToggleCode: () => void;
  is3DFullscreen: boolean;
  onToggle3DFullscreen: () => void;
  isLeftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  isRightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
}

export const DroneViewport3D: React.FC<DroneViewport3DProps> = ({
  viewMode,
  onSetViewMode,
  parts: _parts,
  isSimulating,
  onToggleSimulate,
  onSave,
  onOpenExportImport,
  liveAltitude,
  onUpdateLiveAltitude,
  pythonCode: _pythonCode,
  isCodeOpen,
  onToggleCode,
  is3DFullscreen: _is3DFullscreen,
  onToggle3DFullscreen: _onToggle3DFullscreen,
  isLeftSidebarOpen: _isLeftSidebarOpen,
  onToggleLeftSidebar: _onToggleLeftSidebar,
  isRightSidebarOpen,
  onToggleRightSidebar,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const droneGroupRef = useRef<THREE.Group | null>(null);
  const propellersRef = useRef<THREE.Group[]>([]);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  const [controlMode, setControlMode] = useState<'manual' | 'auto'>('manual');
  const [environmentType, setEnvironmentType] = useState<'obstacles' | 'gates' | 'helipad'>('obstacles');
  const [headlightsOn, setHeadlightsOn] = useState<boolean>(true);
  const [isFpvCamera, setIsFpvCamera] = useState<boolean>(false);
  const [speedDisplay, setSpeedDisplay] = useState<number>(0);

  // Keyboard Event Listeners for Manual Flight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      keysPressedRef.current[e.code] = true;
      keysPressedRef.current[e.key.toLowerCase()] = true;
      if (e.code === 'KeyH') setHeadlightsOn(prev => !prev);
      if (e.code === 'KeyC') setIsFpvCamera(prev => !prev);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      keysPressedRef.current[e.code] = false;
      keysPressedRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Export 3D STL file for 3D Printing the Drone Frame
  const handleExportSTL = () => {
    if (!droneGroupRef.current) return;
    const exporter = new STLExporter();
    const result = exporter.parse(droneGroupRef.current, { binary: true });
    const blob = new Blob([result], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DroneVerse_Apex_Frame.stl`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  useEffect(() => {
    if (!mountRef.current || (viewMode !== '3d' && viewMode !== 'simulation')) return;
    const container = mountRef.current;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060a14);
    scene.fog = new THREE.FogExp2(0x060a14, 0.008);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3.2, 5.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.02;
    controls.minDistance = 0.8;
    controls.maxDistance = 45.0;
    controls.target.set(0, 1.2, 0);

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

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x7dd3fc, 2.0);
    mainLight.position.set(18, 30, 18);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0005;
    scene.add(mainLight);

    // Subtle Fill Light from opposite side
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-15, 12, -15);
    scene.add(fillLight);

    // 3. Grid & Ground (High-Tech Cleanroom Floor)
    const grid = new THREE.GridHelper(80, 40, 0x0ea5e9, 0x1e293b);
    grid.position.y = 0.015;
    scene.add(grid);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ 
        color: 0x060c18, 
        roughness: 0.75,
        metalness: 0.25 
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 4. Test Obstacles / Environment Objects (Upgraded High-Tech Crates)
    const boxPositions = [
      { x: -3.0, y: 1.0, z: -2.0, w: 1.4, h: 2.0, d: 1.4 },
      { x: 3.0, y: 1.0, z: -2.0, w: 1.4, h: 2.0, d: 1.4 },
      { x: 0.0, y: 0.9, z: -4.0, w: 1.4, h: 1.8, d: 1.4 },
      { x: 2.6, y: 0.8, z: 2.0, w: 1.4, h: 1.6, d: 1.4 },
      { x: -2.6, y: 0.8, z: 2.0, w: 1.4, h: 1.6, d: 1.4 },
    ];

    if (environmentType === 'obstacles') {
      const crateMat = new THREE.MeshStandardMaterial({
        color: 0xe07a10, // Rich Industrial Amber
        roughness: 0.35,
        metalness: 0.3,
      });

      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.2,
        metalness: 0.85,
      });

      boxPositions.forEach((bp) => {
        // Main Crate Body
        const crateGroup = new THREE.Group();
        crateGroup.position.set(bp.x, bp.y, bp.z);

        const box = new THREE.Mesh(new THREE.BoxGeometry(bp.w, bp.h, bp.d), crateMat);
        box.castShadow = true;
        box.receiveShadow = true;
        crateGroup.add(box);

        // Tech Edge Corner Frames
        const edgeWire = new THREE.BoxHelper(box, 0xfbbf24);
        crateGroup.add(edgeWire);

        // Top Status Beacon
        const beacon = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        beacon.position.set(0, bp.h / 2 + 0.04, 0);
        crateGroup.add(beacon);

        // Side Industrial Reinforcement Bevels
        const band1 = new THREE.Mesh(new THREE.BoxGeometry(bp.w + 0.04, 0.15, bp.d + 0.04), frameMat);
        band1.position.y = bp.h * 0.25;
        const band2 = new THREE.Mesh(new THREE.BoxGeometry(bp.w + 0.04, 0.15, bp.d + 0.04), frameMat);
        band2.position.y = -bp.h * 0.25;
        crateGroup.add(band1, band2);

        scene.add(crateGroup);
      });
    } else if (environmentType === 'gates') {
      // Neon Air Gates
      for (let i = 0; i < 3; i++) {
        const gate = new THREE.Mesh(
          new THREE.TorusGeometry(2.4, 0.18, 16, 32),
          new THREE.MeshStandardMaterial({ 
            color: 0x06b6d4, 
            emissive: 0x06b6d4, 
            emissiveIntensity: 0.8 
          })
        );
        gate.position.set(0, 2.2, -4 * (i + 1));
        scene.add(gate);
      }
    } else if (environmentType === 'helipad') {
      // Glowing Helipad Landing Target
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(2.8, 2.8, 0.12, 32),
        new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 })
      );
      pad.position.set(0, 0.06, -3.5);
      scene.add(pad);
    }

    // 5. 3D Quadcopter Drone Model
    const drone = new THREE.Group();
    scene.add(drone);
    droneGroupRef.current = drone;

    // Carbon X-Arms
    const armMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.8 });
    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 12), armMat);
    arm1.rotation.z = Math.PI / 2;
    arm1.rotation.y = Math.PI / 4;
    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 12), armMat);
    arm2.rotation.z = Math.PI / 2;
    arm2.rotation.y = -Math.PI / 4;
    drone.add(arm1, arm2);

    // Main Body Fuselage (Cobalt Blue with metallic sheen)
    const pod = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.18, 0.52),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.85, roughness: 0.2 })
    );
    pod.position.y = 0.06;
    pod.castShadow = true;
    drone.add(pod);

    // Top Battery Pack
    const batt = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.12, 0.38),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 })
    );
    batt.position.set(0, 0.2, -0.02);
    drone.add(batt);

    // Front FPV Camera with LED
    const camNose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
    );
    camNose.rotation.x = Math.PI / 2 + 0.3;
    camNose.position.set(0, 0.08, 0.28);
    drone.add(camNose);

    // Ultrasonic / LiDAR Forward Distance Rays Cone (huddi rasmdagidek moviy nurlar konusi!)
    const rayConeMat = new THREE.MeshBasicMaterial({ 
      color: 0x38bdf8, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.45 
    });
    const rayCone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.5, 16, 4, true), rayConeMat);
    rayCone.rotation.x = -Math.PI / 2;
    rayCone.position.set(0, 0.08, 1.55);
    drone.add(rayCone);

    // 4 Motors and 4 Spinning Propellers
    const mOffsets = [
      { x: 0.5, z: 0.5 },
      { x: -0.5, z: 0.5 },
      { x: 0.5, z: -0.5 },
      { x: -0.5, z: -0.5 },
    ];
    const props: THREE.Group[] = [];

    mOffsets.forEach((pos) => {
      // Motor Bell
      const motorBell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.12, 16),
        new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.1 })
      );
      motorBell.position.set(pos.x, 0.06, pos.z);
      drone.add(motorBell);

      // Propeller Group
      const pGroup = new THREE.Group();
      pGroup.position.set(pos.x, 0.14, pos.z);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12),
        new THREE.MeshBasicMaterial({ color: 0x0284c7 })
      );
      pGroup.add(hub);

      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.01, 0.4),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
        );
        blade.position.z = 0.2;
        blade.rotation.x = 0.15;
        const bMount = new THREE.Group();
        bMount.rotation.y = (b * Math.PI * 2) / 3;
        bMount.add(blade);
        pGroup.add(bMount);
      }

      drone.add(pGroup);
      props.push(pGroup);
    });
    propellersRef.current = props;

    // Flight Physics State inside Constructor Viewport
    let dX = 0;
    let dY = 0.25; // on ground initially
    let dZ = 0;
    let vX = 0;
    let vY = 0;
    let vZ = 0;
    let pitch = 0;
    let roll = 0;
    let yaw = Math.PI;

    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(0.05, clock.getDelta());
      const keys = keysPressedRef.current;

      let forward = 0;
      let right = 0;
      let up = 0;
      let yawIn = 0;

      if (controlMode === 'manual') {
        if (keys['KeyW'] || keys['ArrowUp'] || keys['w']) forward += 1;
        if (keys['KeyS'] || keys['ArrowDown'] || keys['s']) forward -= 1;
        if (keys['KeyD'] || keys['ArrowRight'] || keys['d']) right += 1;
        if (keys['KeyA'] || keys['ArrowLeft'] || keys['a']) right -= 1;
        if (keys['Space'] || keys[' ']) up += 1;
        if (keys['ShiftLeft'] || keys['ShiftRight'] || keys['shift']) up -= 1;
        if (keys['KeyE'] || keys['e']) yawIn += 1;
        if (keys['KeyQ'] || keys['q']) yawIn -= 1;
      } else if (isSimulating) {
        // Autonomous Code Simulation (Gentle figure-8 hover test)
        up = Math.sin(clock.getElapsedTime() * 1.5) * 0.4 + 0.3;
        forward = 0.6;
        yawIn = Math.sin(clock.getElapsedTime() * 0.8) * 0.6;
      }

      // If simulating or manual flight input, calculate flight physics
      const isFlying = isSimulating || up > 0 || Math.abs(forward) > 0 || Math.abs(right) > 0 || dY > 0.35;

      if (isFlying) {
        // Auto-hover when in air
        const hoverThrust = 9.8;
        const totalUpThrust = hoverThrust + up * 14.0;
        vY += (totalUpThrust - 9.8) * delta;

        const forwardAccel = forward * 24.0;
        const rightAccel = right * 20.0;

        vX += (Math.sin(yaw) * forwardAccel + Math.cos(yaw) * rightAccel) * delta;
        vZ += (Math.cos(yaw) * forwardAccel - Math.sin(yaw) * rightAccel) * delta;

        // Air Drag
        vX -= vX * 3.5 * delta;
        vZ -= vZ * 3.5 * delta;
        vY -= vY * 2.5 * delta;

        dX += vX * delta;
        dY += vY * delta;
        dZ += vZ * delta;

        // Pitch & Roll Dynamics
        pitch += (forward * 0.45 - pitch) * Math.min(1, delta * 8);
        roll += (-right * 0.5 - roll) * Math.min(1, delta * 8);
        yaw -= yawIn * 2.5 * delta;

        // Floor Boundary
        if (dY < 0.25) {
          dY = 0.25;
          vY = 0;
          pitch *= 0.5;
          roll *= 0.5;
        }

        // Obstacle Collisions - True Solid Non-Clipping Physics
        // Dron hech qachon qutilar yoki obyektlar ichiga kirib ketmaydi!
        const droneRadius = 0.65;
        boxPositions.forEach((bp) => {
          const halfW = bp.w / 2 + droneRadius;
          const halfD = bp.d / 2 + droneRadius;
          const obsTop = bp.y + bp.h / 2 + 0.1;

          const dx = dX - bp.x;
          const dz = dZ - bp.z;

          if (Math.abs(dx) < halfW && Math.abs(dz) < halfD && dY < obsTop) {
            const penX = halfW - Math.abs(dx);
            const penZ = halfD - Math.abs(dz);

            if (penX < penZ) {
              dX = bp.x + (dx >= 0 ? 1 : -1) * halfW;
              vX = -vX * 0.25;
            } else {
              dZ = bp.z + (dz >= 0 ? 1 : -1) * halfD;
              vZ = -vZ * 0.25;
            }
          }
        });

        // Fast propeller spinning
        const rpm = 50 + Math.abs(up) * 40;
        props.forEach((p, idx) => {
          p.rotation.y += rpm * delta * (idx % 2 === 0 ? 1 : -1);
        });
      } else {
        // Idle on ground
        dY = 0.25;
        vX = 0;
        vY = 0;
        vZ = 0;
        pitch = 0;
        roll = 0;
      }

      // Update Drone Mesh
      drone.position.set(dX, dY, dZ);
      drone.rotation.set(0, 0, 0);
      drone.rotation.y = yaw;
      drone.rotateX(pitch);
      drone.rotateZ(roll);

      // Ray cone pulse
      rayConeMat.opacity = 0.35 + 0.15 * Math.sin(clock.getElapsedTime() * 8);

      // Camera Follow
      if (isFpvCamera) {
        controls.enabled = false;
        camera.position.set(dX + Math.sin(yaw) * 0.4, dY + 0.15, dZ + Math.cos(yaw) * 0.4);
        camera.lookAt(dX + Math.sin(yaw) * 12, dY + 0.15 - Math.sin(pitch) * 6, dZ + Math.cos(yaw) * 12);
      } else {
        controls.enabled = true;
        controls.target.set(dX, dY + 0.2, dZ);
        controls.update();
      }

      // Live Telemetry updates
      const curSpeed = Math.sqrt(vX * vX + vZ * vZ) * 3.6;
      setSpeedDisplay(Math.round(curSpeed));
      onUpdateLiveAltitude(Number(dY.toFixed(1)));

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [viewMode, environmentType, isSimulating, controlMode, isFpvCamera]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#070b14] relative overflow-hidden select-none">
      {/* TOP TOOLBAR (Exactly matching the user's screenshot layout!) */}
      <div className="h-12 bg-[#0d1424] border-b border-[#1c2438] px-3 flex items-center justify-between text-xs z-20 overflow-x-auto scrollbar-none">
        {/* Left Toolbar Items: Views, Sim, Control Mode, Environments */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* View Mode Toggle: 3D vs 2D Sxema */}
          <div className="flex items-center bg-[#152038] p-0.5 rounded-xl border border-[#23355c]">
            <button
              onClick={() => onSetViewMode('3d')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === '3d'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Rotate3d className="w-3.5 h-3.5 text-cyan-300" />
              <span>3D ko'rinish</span>
            </button>
            <button
              onClick={() => onSetViewMode('2d')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === '2d'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-amber-300" />
              <span>2D sxema</span>
            </button>
          </div>

          {/* Simulyatsiya Tugmasi */}
          <button
            onClick={onToggleSimulate}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-md ${
              isSimulating
                ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/40 ring-1 ring-red-400 animate-pulse'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/40 ring-1 ring-emerald-400/50'
            }`}
          >
            {isSimulating ? <Square className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>{isSimulating ? 'To\'xtatish' : 'Simulyatsiya'}</span>
          </button>

          {/* Boshqaruv: Pult (WASD) vs Avtonom Kod */}
          <div className="flex items-center bg-[#152038] p-0.5 rounded-xl border border-[#23355c]">
            <button
              onClick={() => setControlMode('manual')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                controlMode === 'manual'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Pult (WASD)</span>
            </button>
            <button
              onClick={() => setControlMode('auto')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                controlMode === 'auto'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Avtonom Kod</span>
            </button>
          </div>

          {/* Muhit Tanlash: To'siqlar / Havo Trassa / Qo'nish Halqasi */}
          <div className="hidden xl:flex items-center bg-[#152038] p-0.5 rounded-xl border border-[#23355c]">
            <button
              onClick={() => setEnvironmentType('obstacles')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                environmentType === 'obstacles'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              To'siqlar
            </button>
            <button
              onClick={() => setEnvironmentType('gates')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                environmentType === 'gates'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Havo Darvozalari
            </button>
            <button
              onClick={() => setEnvironmentType('helipad')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                environmentType === 'helipad'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Qo'nish Halqasi
            </button>
          </div>
        </div>

        {/* Right Toolbar Items: FPV, Fara, Snap, STL, JSON, Kod, Stats, Saqlash */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsFpvCamera(!isFpvCamera)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
              isFpvCamera
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                : 'bg-[#152038] text-slate-300 border-[#23355c] hover:text-white'
            }`}
            title="FPV Kamera Rejimi"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-[11px] font-bold hidden sm:inline">FPV</span>
          </button>

          <button
            onClick={() => setHeadlightsOn(!headlightsOn)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
              headlightsOn
                ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                : 'bg-[#152038] text-slate-300 border-[#23355c] hover:text-white'
            }`}
            title="Navigatsiya Fara / LED"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[11px] font-bold hidden sm:inline">Fara</span>
          </button>

          <button
            onClick={handleExportSTL}
            className="p-1.5 rounded-xl bg-[#152038] text-slate-300 border border-[#23355c] hover:text-white transition-all cursor-pointer flex items-center gap-1"
            title="3D Printer uchun STL fayl eksport qilish"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-bold hidden sm:inline">STL</span>
          </button>

          <button
            onClick={onOpenExportImport}
            className="p-1.5 rounded-xl bg-[#152038] text-slate-300 border border-[#23355c] hover:text-white transition-all cursor-pointer flex items-center gap-1"
            title="Dron konfiguratsiyasini JSON eksport/import qilish"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold hidden sm:inline">JSON</span>
          </button>

          <button
            onClick={onToggleCode}
            className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isCodeOpen
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30'
                : 'bg-[#152038] text-slate-300 border-[#23355c] hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden md:inline">Kodni ochish</span>
          </button>

          <button
            onClick={onToggleRightSidebar}
            className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isRightSidebarOpen
                ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                : 'bg-[#152038] text-slate-300 border-[#23355c] hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-blue-300" />
            <span className="hidden md:inline">Dron ma'lumotlari</span>
          </button>

          <button
            onClick={onSave}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/40"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Saqlash</span>
          </button>
        </div>
      </div>

      {/* CENTER VIEWPORT OR 2D SCHEMATIC */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        {viewMode === '2d' ? (
          <DroneSchematic hasCamera={true} hasGps={true} />
        ) : (
          <div ref={mountRef} className="w-full h-full relative" />
        )}

        {/* Live Flight Telemetry Overlay Badge (Top Left - Exactly like the screenshot!) */}
        {viewMode === '3d' && (
          <div className="absolute top-4 left-4 z-10 bg-[#0d1424]/90 backdrop-blur-md p-3 rounded-2xl border border-cyan-500/40 shadow-xl flex items-center space-x-4 pointer-events-none font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tezlik</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-black text-white">{speedDisplay}</span>
                <span className="text-[10px] text-slate-400 font-bold">km/s</span>
              </div>
            </div>
            <div className="h-7 w-px bg-slate-700/60" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Balandlik / Masofa</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-black text-cyan-300">{liveAltitude.toFixed(1)}</span>
                <span className="text-[10px] text-slate-400 font-bold">m</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Banner: Flight Controls Instructions (Matching the screenshot!) */}
        {viewMode === '3d' && (
          <div className="absolute bottom-4 left-4 z-10 bg-[#0d1424]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#202f4e] shadow-xl pointer-events-none flex items-center space-x-2 text-xs text-slate-300 font-mono">
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <Gamepad2 className="w-3.5 h-3.5" /> Jonli Uchirish:
            </span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-bold border border-slate-700">W, A, S, D</span>
            <span className="text-slate-400 text-[11px]">yoki Strelkalar</span>
            <span className="text-slate-600">|</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold border border-slate-700">space</span>
            <span className="text-amber-300 text-[11px]">(Yuqoriga)</span>
            <span className="text-slate-600">|</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-bold border border-slate-700">shift</span>
            <span className="text-slate-400 text-[11px]">(Pastga)</span>
            <span className="text-slate-600">|</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 font-bold border border-slate-700">C</span>
            <span className="text-cyan-300 text-[11px]">(FPV)</span>
          </div>
        )}
      </div>
    </div>
  );
};
