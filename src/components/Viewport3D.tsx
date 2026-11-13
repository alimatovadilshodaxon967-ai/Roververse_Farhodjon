import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { 
  Box, 
  RotateCcw, 
  Maximize2, 
  Save, 
  Plus, 
  Minus, 
  Focus, 
  CircuitBoard, 
  Play, 
  Square, 
  Crosshair, 
  FileDown, 
  Download, 
  Flag, 
  Shield, 
  Gauge,
  Code2,
  Expand,
  Shrink,
  PanelLeftClose,
  PanelLeftOpen,
  Gamepad2,
  Camera,
  Lightbulb,
  Layers
} from 'lucide-react';
import type { ViewMode, RobotPart } from '../types';
import { ElectronicsSchematic } from './ElectronicsSchematic';
import { physicsEngine } from '../utils/robotPhysics';
import type { PhysicsRobotState } from '../utils/robotPhysics';
import { runtimeEngine } from '../utils/robotRuntime';
import type { ExecutionLog, SupportedLanguage } from '../utils/robotRuntime';

export type ArenaType = 'obstacle' | 'line' | 'sumo';

interface Viewport3DProps {
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  parts: RobotPart[];
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onSave: () => void;
  onOpenExportImport: () => void;
  liveDistance: number;
  onUpdateLiveDistance: (dist: number) => void;
  pythonCode: string;
  language?: SupportedLanguage;
  onUpdateLogs?: (logs: ExecutionLog[]) => void;
  isCodeOpen?: boolean;
  onToggleCode?: () => void;
  is3DFullscreen?: boolean;
  onToggle3DFullscreen?: () => void;
  isLeftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  isRightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  viewMode,
  onSetViewMode,
  parts,
  isSimulating,
  onToggleSimulate,
  onSave,
  onOpenExportImport,
  liveDistance,
  onUpdateLiveDistance,
  pythonCode,
  language = 'python',
  onUpdateLogs,
  isCodeOpen = true,
  onToggleCode,
  is3DFullscreen = false,
  onToggle3DFullscreen,
  isLeftSidebarOpen = true,
  onToggleLeftSidebar,
  isRightSidebarOpen = true,
  onToggleRightSidebar,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const robotGroupRef = useRef<THREE.Group | null>(null);
  const wheelsRef = useRef<THREE.Mesh[]>([]);
  const lidarRef = useRef<THREE.Mesh | null>(null);
  const sensorBeamRef = useRef<THREE.Mesh | null>(null);
  const headlightsRef = useRef<THREE.SpotLight[]>([]);

  // Interactive controls & mode states
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showSnapSockets, setShowSnapSockets] = useState<boolean>(true);
  const [selectedArena, setSelectedArena] = useState<ArenaType>('obstacle');
  const [controlMode, setControlMode] = useState<'code' | 'manual'>('manual');
  const [isFpvCamera, setIsFpvCamera] = useState<boolean>(false);
  const [headlightsOn, setHeadlightsOn] = useState<boolean>(true);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [isNitro, setIsNitro] = useState<boolean>(false);

  // Active keyboard keys state
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  // Equipped modules
  const hasArduino = parts.find(p => p.iconType === 'arduino')?.enabled ?? true;
  const hasUltrasonic = parts.find(p => p.iconType === 'ultrasonic')?.enabled ?? true;
  const hasLidar = parts.find(p => p.iconType === 'lidar')?.enabled ?? false;
  const hasCamera = parts.find(p => p.iconType === 'camera')?.enabled ?? false;
  const hasWedge = parts.find(p => p.iconType === 'wedge')?.enabled ?? false;
  const hasTrackWheel = parts.find(p => p.id === 'track-wheel')?.enabled ?? true;

  // Real-time physics state
  const robotPhysicsRef = useRef<PhysicsRobotState>({
    x: 0,
    z: 0,
    rotation: 0,
    linearVelocity: 0,
    angularVelocity: 0,
    leftWheelRot: 0,
    rightWheelRot: 0,
    isCollided: false,
  });

  // Keyboard Event Listeners for Manual Driving (WASD & Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys if typing inside code editor or input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      keysPressedRef.current[e.code] = true;
      if (e.code === 'KeyH') {
        setHeadlightsOn(prev => !prev);
      }
      if (e.code === 'KeyC') {
        setIsFpvCamera(prev => !prev);
      }
      if (e.code === 'Space') {
        setIsNitro(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
      if (e.code === 'Space') {
        setIsNitro(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Export 3D STL file for 3D Printing
  const handleExportSTL = () => {
    if (!robotGroupRef.current) return;
    const exporter = new STLExporter();
    const result = exporter.parse(robotGroupRef.current, { binary: true });
    const blob = new Blob([result], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `RoboVerse_Robot_3DPrint.stl`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  useEffect(() => {
    if (!mountRef.current || (viewMode !== '3d' && viewMode !== 'simulation')) return;

    const container = mountRef.current;
    let width = container.clientWidth || 800;
    let height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.025);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.2, 2.6, 3.8);
    cameraRef.current = camera;

    // 3. Renderer with PBR tone mapping & soft shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls (Blender & CAD Standard Control Mapping)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.02;
    controls.minDistance = 0.8;
    controls.maxDistance = 15.0;
    controls.target.set(0, 0.4, 0);

    // Sichqoncha g'ildiragini bosib aylantirish (Middle Click Orbit)
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.ROTATE, // G'ildirak bosilganda ham erkin aylantirish
      RIGHT: THREE.MOUSE.PAN,      // O'ng tugma kamerani surish (Pan)
    };

    controlsRef.current = controls;

    // 5. Lighting: Studio Key Light + Blue Fill Light
    const ambientLight = new THREE.AmbientLight(0xd4e4ff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(7, 10, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const rimLight = new THREE.PointLight(0x38bdf8, 3.0, 12);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    // 6. Arena & Floor Builder
    const arenaGroup = new THREE.Group();
    scene.add(arenaGroup);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(20, 40, 0x2563eb, 0x141f38);
    arenaGroup.add(gridHelper);

    // Metallic High-Gloss Ground Plane
    const groundGeo = new THREE.PlaneGeometry(24, 24);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x060911,
      roughness: 0.6,
      metalness: 0.4,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    arenaGroup.add(ground);

    // Arena specific elements
    if (selectedArena === 'obstacle') {
      physicsEngine.obstacles.forEach((obs) => {
        const obsGeo = new THREE.BoxGeometry(obs.width, 0.75, obs.depth);
        const obsMat = new THREE.MeshStandardMaterial({
          color: 0xd97706,
          metalness: 0.5,
          roughness: 0.3,
        });
        const mesh = new THREE.Mesh(obsGeo, obsMat);
        mesh.position.set(obs.x, 0.375, obs.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        arenaGroup.add(mesh);
      });
    } else if (selectedArena === 'line') {
      const lineCurve = new THREE.EllipseCurve(0, 0, 3.4, 2.3, 0, 2 * Math.PI, false, 0);
      const points = lineCurve.getPoints(80);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, 0.015, p.y)));
      const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 5 });
      const lineMesh = new THREE.LineLoop(lineGeo, lineMat);
      arenaGroup.add(lineMesh);
    } else if (selectedArena === 'sumo') {
      const dohyoGeo = new THREE.CylinderGeometry(2.6, 2.6, 0.06, 64);
      const dohyoMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
      const dohyo = new THREE.Mesh(dohyoGeo, dohyoMat);
      dohyo.position.y = 0.03;
      dohyo.receiveShadow = true;
      arenaGroup.add(dohyo);

      const ringGeo = new THREE.RingGeometry(2.42, 2.6, 64);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.062;
      arenaGroup.add(ring);
    }

    // 7. ROBOT 3D MODEL GROUP
    const robotGroup = new THREE.Group();
    robotGroupRef.current = robotGroup;
    scene.add(robotGroup);

    // Chassis (High-Gloss Carbon Body)
    const chassisGeo = new THREE.BoxGeometry(1.4, 0.25, 1.0);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.85,
      roughness: 0.2,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.35;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    robotGroup.add(chassis);

    // Top Metallic Deck
    const deckGeo = new THREE.BoxGeometry(1.2, 0.05, 0.85);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      metalness: 0.9,
      roughness: 0.15,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.5;
    deck.castShadow = true;
    robotGroup.add(deck);

    // LED Headlights (Real SpotLights!)
    const spotLeft = new THREE.SpotLight(0x60a5fa, 4.0, 10, Math.PI / 4, 0.4);
    spotLeft.position.set(0.72, 0.38, 0.35);
    spotLeft.target.position.set(3.0, 0.1, 0.35);
    spotLeft.castShadow = true;
    robotGroup.add(spotLeft);
    robotGroup.add(spotLeft.target);

    const spotRight = new THREE.SpotLight(0x60a5fa, 4.0, 10, Math.PI / 4, 0.4);
    spotRight.position.set(0.72, 0.38, -0.35);
    spotRight.target.position.set(3.0, 0.1, -0.35);
    spotRight.castShadow = true;
    robotGroup.add(spotRight);
    robotGroup.add(spotRight.target);

    headlightsRef.current = [spotLeft, spotRight];

    // Neon Headlamp bulbs
    const bulbGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const bulbLeft = new THREE.Mesh(bulbGeo, bulbMat);
    bulbLeft.position.set(0.71, 0.38, 0.35);
    robotGroup.add(bulbLeft);
    const bulbRight = new THREE.Mesh(bulbGeo, bulbMat);
    bulbRight.position.set(0.71, 0.38, -0.35);
    robotGroup.add(bulbRight);

    // Snap Sockets
    if (showSnapSockets) {
      const socketPositions = [
        [0.72, 0.45, 0],
        [-0.15, 0.54, 0],
        [0.25, 0.54, 0],
        [0, 0.3, 0.52],
        [0, 0.3, -0.52],
      ];
      socketPositions.forEach((pos) => {
        const sockRingGeo = new THREE.RingGeometry(0.04, 0.07, 16);
        sockRingGeo.rotateX(-Math.PI / 2);
        const sockRingMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const sockMesh = new THREE.Mesh(sockRingGeo, sockRingMat);
        sockMesh.position.set(pos[0], pos[1], pos[2]);
        robotGroup.add(sockMesh);
      });
    }

    // Wheels
    const wheelMeshes: THREE.Mesh[] = [];
    const wheelPositions = [
      { x: 0.45, y: 0.3, z: 0.6 },
      { x: -0.45, y: 0.3, z: 0.6 },
      { x: 0.45, y: 0.3, z: -0.6 },
      { x: -0.45, y: 0.3, z: -0.6 },
    ];
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.18, 24);
    wheelGeo.rotateX(Math.PI / 2);

    wheelPositions.forEach((pos) => {
      const tyreMat = new THREE.MeshStandardMaterial({
        color: hasTrackWheel ? 0x090d16 : 0x1e293b,
        roughness: 0.9,
      });
      const wheel = new THREE.Mesh(wheelGeo, tyreMat);
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.castShadow = true;

      const rimGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.19, 16);
      rimGeo.rotateX(Math.PI / 2);
      const rimMat = new THREE.MeshStandardMaterial({
        color: hasTrackWheel ? 0x1d4ed8 : 0x06b6d4,
        metalness: 0.85,
        roughness: 0.25,
      });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheel.add(rim);

      robotGroup.add(wheel);
      wheelMeshes.push(wheel);
    });
    wheelsRef.current = wheelMeshes;

    // Ultrasonic Sensor HC-SR04
    if (hasUltrasonic) {
      const ultraGroup = new THREE.Group();
      ultraGroup.position.set(0.72, 0.45, 0);

      const pcbGeo = new THREE.BoxGeometry(0.04, 0.15, 0.32);
      const pcbMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.7 });
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      ultraGroup.add(pcb);

      const eyeGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.08, 16);
      eyeGeo.rotateZ(Math.PI / 2);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9 });

      const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
      eye1.position.set(0.04, 0, 0.09);
      ultraGroup.add(eye1);

      const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
      eye2.position.set(0.04, 0, -0.09);
      ultraGroup.add(eye2);

      // Sensor Beam Cone
      const beamGeo = new THREE.ConeGeometry(0.35, 1.2, 16, 1, true);
      beamGeo.rotateZ(-Math.PI / 2);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.4,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0.68, 0, 0);
      ultraGroup.add(beam);
      sensorBeamRef.current = beam;

      robotGroup.add(ultraGroup);
    }

    // Arduino Uno
    if (hasArduino) {
      const ardGroup = new THREE.Group();
      ardGroup.position.set(-0.15, 0.54, 0);

      const pcbGeo = new THREE.BoxGeometry(0.48, 0.03, 0.36);
      const pcbMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6 });
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      ardGroup.add(pcb);

      const mcuGeo = new THREE.BoxGeometry(0.24, 0.02, 0.08);
      const mcuMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
      const mcu = new THREE.Mesh(mcuGeo, mcuMat);
      mcu.position.y = 0.025;
      ardGroup.add(mcu);

      robotGroup.add(ardGroup);
    }

    // LiDAR Scanner
    if (hasLidar) {
      const lidGroup = new THREE.Group();
      lidGroup.position.set(0.25, 0.6, 0);

      const baseGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.1, 24);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      lidGroup.add(base);

      const headGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 24);
      const headMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.08;
      lidGroup.add(head);

      lidarRef.current = head;
      robotGroup.add(lidGroup);
    }

    // Front Wedge
    if (hasWedge) {
      const wedgeGeo = new THREE.BoxGeometry(0.3, 0.15, 0.95);
      const wedgeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 });
      const wedge = new THREE.Mesh(wedgeGeo, wedgeMat);
      wedge.position.set(0.85, 0.25, 0);
      wedge.rotation.z = -0.4;
      robotGroup.add(wedge);
    }

    // FPV Camera
    if (hasCamera) {
      const camGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      const camMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const cam = new THREE.Mesh(camGeo, camMat);
      cam.position.set(0.68, 0.62, 0);
      robotGroup.add(cam);
    }

    // 8. ANIMATION & REAL-TIME PHYSICS LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let batteryState = 100;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(0.05, clock.getDelta());

      // Update Headlights intensity based on state
      headlightsRef.current.forEach(light => {
        light.intensity = headlightsOn ? 4.0 : 0.0;
      });

      if (lidarRef.current) {
        lidarRef.current.rotation.y += delta * 6;
      }

      const pState = robotPhysicsRef.current;
      physicsEngine.activeArena = selectedArena;

      // Real-time Sensor Calculations
      const currentDistance = physicsEngine.getRaycastDistance(pState.x, pState.z, pState.rotation);
      const lineOffsets = physicsEngine.getLineSensors(pState.x, pState.z, pState.rotation);
      const lidarRanges = physicsEngine.getLidarScan(pState.x, pState.z, pState.rotation);
      onUpdateLiveDistance(currentDistance);

      let targetLeft = 0;
      let targetRight = 0;
      let boostActive = false;

      // Determine control input (Manual Keyboard vs Autonomous Code)
      if (controlMode === 'manual') {
        const keys = keysPressedRef.current;
        const forward = keys['KeyW'] || keys['ArrowUp'];
        const backward = keys['KeyS'] || keys['ArrowDown'];
        const left = keys['KeyA'] || keys['ArrowLeft'];
        const right = keys['KeyD'] || keys['ArrowRight'];
        boostActive = keys['Space'] || false;

        if (forward) {
          targetLeft += 1.0;
          targetRight += 1.0;
        }
        if (backward) {
          targetLeft -= 0.8;
          targetRight -= 0.8;
        }
        if (left) {
          targetLeft += 0.7;
          targetRight -= 0.7;
        }
        if (right) {
          targetLeft -= 0.7;
          targetRight += 0.7;
        }
      } else if (isSimulating) {
        // Autonomous Code execution
        const stepResult = runtimeEngine.executeStep(language, pythonCode, {
          distance: currentDistance,
          lineOffsets,
          lidarRanges,
          batteryPercent: batteryState,
        });

        if (onUpdateLogs && stepResult.logs.length > 0) {
          onUpdateLogs(stepResult.logs);
        }
        targetLeft = stepResult.leftSpeed;
        targetRight = stepResult.rightSpeed;
        boostActive = stepResult.isBoost;
      }

      // Physics Kinematics Update
      const nextPhys = physicsEngine.updateStep(
        pState,
        targetLeft,
        targetRight,
        delta,
        boostActive
      );
      robotPhysicsRef.current = nextPhys;
      setCurrentSpeed(Number(Math.abs(nextPhys.linearVelocity).toFixed(2)));

      // Update 3D Transforms
      if (robotGroupRef.current) {
        robotGroupRef.current.position.x = nextPhys.x;
        robotGroupRef.current.position.z = nextPhys.z;
        robotGroupRef.current.rotation.y = -nextPhys.rotation;

        // Wheel rotations
        wheelMeshes.forEach((w, idx) => {
          w.rotation.z = (idx % 2 === 0 ? nextPhys.leftWheelRot : nextPhys.rightWheelRot);
        });

        // Ultrasonic Beam color feedback
        if (sensorBeamRef.current) {
          const isNear = currentDistance < 20;
          (sensorBeamRef.current.material as THREE.MeshBasicMaterial).color.set(
            isNear ? 0xef4444 : 0x38bdf8
          );
        }
      }

      // FPV Camera Follow vs OrbitControls
      if (isFpvCamera && cameraRef.current && robotGroupRef.current) {
        controls.enabled = false;
        const noseX = nextPhys.x + Math.cos(nextPhys.rotation) * 0.7;
        const noseZ = nextPhys.z + Math.sin(nextPhys.rotation) * 0.7;
        cameraRef.current.position.set(noseX, 0.65, noseZ);

        const lookTargetX = noseX + Math.cos(nextPhys.rotation) * 5.0;
        const lookTargetZ = noseZ + Math.sin(nextPhys.rotation) * 5.0;
        cameraRef.current.lookAt(lookTargetX, 0.45, lookTargetZ);
      } else {
        controls.enabled = true;
        controls.update();
      }

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth || 800;
      const h = mountRef.current.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [viewMode, parts, showSnapSockets, selectedArena, isSimulating, controlMode, isFpvCamera, headlightsOn]);

  const handleZoom = (delta: number) => {
    if (!controlsRef.current) return;
    const camera = controlsRef.current.object as THREE.PerspectiveCamera;
    camera.position.multiplyScalar(delta);
    controlsRef.current.update();
    setZoomLevel((prev) => Math.round(prev * (1 / delta)));
  };

  const handleResetCamera = () => {
    setIsFpvCamera(false);
    if (!controlsRef.current) return;
    const camera = controlsRef.current.object as THREE.PerspectiveCamera;
    camera.position.set(3.2, 2.6, 3.8);
    controlsRef.current.target.set(0, 0.4, 0);
    controlsRef.current.update();
    setZoomLevel(100);
  };

  const handleResetRobotPos = () => {
    robotPhysicsRef.current = {
      x: 0,
      z: 0,
      rotation: 0,
      linearVelocity: 0,
      angularVelocity: 0,
      leftWheelRot: 0,
      rightWheelRot: 0,
      isCollided: false,
    };
    if (robotGroupRef.current) {
      robotGroupRef.current.position.set(0, 0, 0);
      robotGroupRef.current.rotation.set(0, 0, 0);
    }
  };

  return (
    <div className="relative flex-1 h-full min-h-[420px] bg-[#0c121e] border-b border-[#1c2438] flex flex-col overflow-hidden select-none">
      {/* 🚀 Top Bar Viewport Controls - Professional Unified Studio Toolbar */}
      <div className="h-12 px-3 bg-[#0a0f1d]/95 border-b border-[#1a253c] flex items-center justify-between z-10 backdrop-blur-md gap-2 overflow-x-auto select-none">
        {/* 1-GURUH: Asosiy Ko'rinish (3D / 2D) & Simulyatsiya */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {onToggleLeftSidebar && (
            <button
              onClick={onToggleLeftSidebar}
              className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
                isLeftSidebarOpen
                  ? 'bg-[#101828] text-slate-400 hover:text-white border-[#1f2d47]'
                  : 'bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-sm shadow-blue-500/20'
              }`}
              title={isLeftSidebarOpen ? 'Katalog panelini yashirish' : 'Katalog panelini ochish'}
            >
              {isLeftSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          )}

          {/* Segmented View Switcher (3D vs 2D) */}
          <div className="flex items-center bg-[#101828] p-0.5 rounded-lg border border-[#1f2d47]">
            <button
              onClick={() => onSetViewMode('3d')}
              className={`flex items-center space-x-1.5 h-7 px-3 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                viewMode === '3d'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D ko'rinish</span>
            </button>

            <button
              onClick={() => onSetViewMode('2d')}
              className={`flex items-center space-x-1.5 h-7 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                viewMode === '2d'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <CircuitBoard className="w-3.5 h-3.5" />
              <span>2D sxema</span>
            </button>
          </div>

          {/* Simulyatsiya Start / Stop tugmasi */}
          <button
            onClick={() => {
              onSetViewMode('3d');
              onToggleSimulate();
            }}
            className={`flex items-center space-x-1.5 h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shadow-sm ${
              isSimulating
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
            }`}
          >
            {isSimulating ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>To'xtatish</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulyatsiya</span>
              </>
            )}
          </button>
        </div>

        {/* 2-GURUH: Boshqaruv Rejimi (Pult vs Avtonom Kod) & Maydon Tanlash */}
        {viewMode === '3d' && (
          <div className="flex items-center space-x-2 shrink-0">
            <div className="h-5 w-px bg-slate-800/80 mx-0.5 hidden sm:block" />

            {/* Boshqaruv: Pult (WASD) vs Avtonom Kod */}
            <div className="flex items-center bg-[#101828] p-0.5 rounded-lg border border-[#1f2d47]">
              <button
                onClick={() => setControlMode('manual')}
                className={`flex items-center space-x-1.5 h-7 px-2.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  controlMode === 'manual'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
                title="Klaviaturada (WASD / Strelkalar) robotni qo'lda haydash"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-300" />
                <span>Pult (WASD)</span>
              </button>
              <button
                onClick={() => setControlMode('code')}
                className={`flex items-center space-x-1.5 h-7 px-2.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  controlMode === 'code'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
                title="Python/Arduino kodi orqali avtonom harakat"
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Avtonom Kod</span>
              </button>
            </div>

            <div className="h-5 w-px bg-slate-800/80 mx-0.5 hidden md:block" />

            {/* Maydon Tanlash: To'siqlar / Line Trassa / Sumo Ring */}
            <div className="flex items-center bg-[#101828] p-0.5 rounded-lg border border-[#1f2d47]">
              <button
                onClick={() => setSelectedArena('obstacle')}
                className={`flex items-center space-x-1.5 h-7 px-2.5 rounded-md text-xs whitespace-nowrap transition-all cursor-pointer ${
                  selectedArena === 'obstacle'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
                title="To'siqlardan qochish sinov maydoni"
              >
                <Shield className="w-3 h-3 text-amber-400" />
                <span>To'siqlar</span>
              </button>
              <button
                onClick={() => setSelectedArena('line')}
                className={`flex items-center space-x-1.5 h-7 px-2.5 rounded-md text-xs whitespace-nowrap transition-all cursor-pointer ${
                  selectedArena === 'line'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
                title="Chiziq bo'ylab harakatlanish trassasi"
              >
                <Flag className="w-3 h-3 text-cyan-400" />
                <span>Line Trassa</span>
              </button>
              <button
                onClick={() => setSelectedArena('sumo')}
                className={`flex items-center space-x-1.5 h-7 px-2.5 rounded-md text-xs whitespace-nowrap transition-all cursor-pointer ${
                  selectedArena === 'sumo'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
                title="Robo-Sumo kurash doirasi"
              >
                <Gauge className="w-3 h-3 text-rose-400" />
                <span>Sumo Ring</span>
              </button>
            </div>
          </div>
        )}

        {/* 3-GURUH: Asboblar (FPV, Faralar, Snap, STL, JSON, Qayta o'rnatish) & Kod / Saqlash */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {viewMode === '3d' && (
            <>
              {/* Tezkor uskunalar bloki */}
              <div className="flex items-center bg-[#101828] p-0.5 rounded-lg border border-[#1f2d47]">
                {/* FPV Kamera */}
                <button
                  onClick={() => setIsFpvCamera(!isFpvCamera)}
                  className={`h-7 px-2 flex items-center space-x-1 rounded-md text-xs transition-all cursor-pointer whitespace-nowrap ${
                    isFpvCamera
                      ? 'bg-rose-600 text-white font-semibold shadow-sm shadow-rose-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                  title="Robot Ko'zi (FPV Birinchi Shaxs Kamerasi)"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">FPV</span>
                </button>

                {/* Faralar */}
                <button
                  onClick={() => setHeadlightsOn(!headlightsOn)}
                  className={`h-7 px-2 flex items-center space-x-1 rounded-md text-xs transition-all cursor-pointer whitespace-nowrap ${
                    headlightsOn
                      ? 'bg-amber-600 text-white font-semibold shadow-sm shadow-amber-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                  title="LED Faralar (Chiroqlar On/Off - 'H' tugmasi)"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Fara</span>
                </button>

                {/* Snap nuqtalari */}
                <button
                  onClick={() => setShowSnapSockets(!showSnapSockets)}
                  className={`h-7 px-2 flex items-center space-x-1 rounded-md text-xs transition-all cursor-pointer whitespace-nowrap ${
                    showSnapSockets
                      ? 'bg-cyan-600 text-white font-semibold shadow-sm shadow-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                  title="Snap-to-Socket ulanish nuqtalarini ko'rsatish"
                >
                  <Crosshair className="w-3 h-3 text-cyan-300" />
                  <span>Snap</span>
                </button>
              </div>

              {/* Eksport Bloki (STL + JSON) */}
              <div className="flex items-center bg-[#101828] p-0.5 rounded-lg border border-[#1f2d47]">
                <button
                  onClick={handleExportSTL}
                  className="h-7 px-2.5 flex items-center space-x-1 rounded-md text-xs font-semibold text-emerald-300 hover:text-white hover:bg-emerald-600/30 transition-all cursor-pointer whitespace-nowrap"
                  title="Robot 3D modelini STL formatida yuklab olish (3D Printer uchun)"
                >
                  <Download className="w-3 h-3" />
                  <span>STL</span>
                </button>
                <button
                  onClick={onOpenExportImport}
                  className="h-7 px-2.5 flex items-center space-x-1 rounded-md text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/40 transition-all cursor-pointer whitespace-nowrap"
                  title="Robot parametrlarini JSON eksport / import qilish"
                >
                  <FileDown className="w-3 h-3 text-blue-400" />
                  <span>JSON</span>
                </button>
              </div>

              {/* Kamera & Pozitsiyani Qaytarish */}
              <div className="flex items-center bg-[#101828] p-0.5 rounded-lg border border-[#1f2d47]">
                <button
                  onClick={handleResetRobotPos}
                  title="Robotni start nuqtasiga qaytarish"
                  className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetCamera}
                  title="Kamerani markazlash"
                  className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

          <div className="h-5 w-px bg-slate-800/80 mx-0.5 hidden sm:block" />

          {/* Kod Muharririni Ochish / Yopish */}
          {onToggleCode && (
            <button
              onClick={onToggleCode}
              className={`h-8 px-3 flex items-center space-x-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                isCodeOpen
                  ? 'bg-[#152038] text-slate-300 hover:text-white border-[#24355c]'
                  : 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20 hover:bg-emerald-600/40'
              }`}
              title={isCodeOpen ? "Kodni yashirish (3D oynani kattalashtirish)" : "Kod muharririni ochish"}
            >
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{isCodeOpen ? 'Kodni yopish' : 'Kodni ochish'}</span>
            </button>
          )}

          {/* 3D To'liq Ekran */}
          {onToggle3DFullscreen && (
            <button
              onClick={onToggle3DFullscreen}
              className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
                is3DFullscreen
                  ? 'bg-amber-600/40 text-amber-300 border-amber-500/60 shadow-sm shadow-amber-500/20'
                  : 'bg-[#101828] text-slate-400 hover:text-white border-[#1f2d47]'
              }`}
              title={is3DFullscreen ? "Oddiy ekranga qaytish" : "To'liq 3D Ekran"}
            >
              {is3DFullscreen ? <Shrink className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
            </button>
          )}

          {/* O'ng Sidebar Toggle - Qulay ko'rinuvchi Tugma */}
          {onToggleRightSidebar && (
            <button
              onClick={onToggleRightSidebar}
              className={`h-8 px-2.5 flex items-center space-x-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                isRightSidebarOpen
                  ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/25'
                  : 'bg-[#101828] text-slate-300 hover:text-white hover:bg-slate-800/60 border-[#1f2d47]'
              }`}
              title={isRightSidebarOpen ? "Ma'lumotlar panelini yashirish" : "Robot ma'lumotlari va sozlamalarini ochish"}
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Ma'lumotlar</span>
            </button>
          )}

          {/* Asosiy Saqlash Tugmasi */}
          <button
            onClick={onSave}
            className="h-8 px-3.5 flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Saqlash</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Area */}
      {viewMode === '3d' || viewMode === 'simulation' ? (
        <div className="relative flex-1 w-full h-full min-h-[380px]">
          <div ref={mountRef} className="w-full h-full min-h-[380px] cursor-grab active:cursor-grabbing" />

          {/* O'ng panel yopiq bo'lsa, o'ng yuqori burchakda qulay ochish tugmasi */}
          {!isRightSidebarOpen && onToggleRightSidebar && (
            <button
              onClick={onToggleRightSidebar}
              className="absolute top-3 right-3 bg-[#0a0f1d]/85 hover:bg-[#131d33] text-slate-300 hover:text-white backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#1e2d4d] hover:border-blue-500/50 shadow-lg flex items-center space-x-2 text-xs font-semibold transition-all cursor-pointer group z-10"
              title="Robot ma'lumotlari, ko'rsatkichlar va test natijalarini ko'rish"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>Robot ma'lumotlari</span>
            </button>
          )}

          {/* Live Telemetry HUD (Spidometr, Masofa, Nitro) */}
          <div className="absolute top-3 left-3 bg-[#0a0f1d]/85 backdrop-blur-md p-2.5 rounded-2xl border border-[#1e2d4d] shadow-2xl pointer-events-none flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Tezlik</span>
              <span className="text-base font-extrabold text-white font-mono flex items-baseline">
                {currentSpeed} <span className="text-[10px] text-slate-400 ml-1 font-normal">m/s</span>
              </span>
            </div>
            <div className="h-7 w-[1px] bg-slate-700/60" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Masofa</span>
              <span className="text-sm font-bold text-cyan-300 font-mono">
                {liveDistance} <span className="text-[10px] text-slate-400">sm</span>
              </span>
            </div>
            {isNitro && (
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded animate-pulse">
                NITRO
              </span>
            )}
          </div>

          {/* Manual Control Instructions Banner */}
          {controlMode === 'manual' && (
            <div className="absolute bottom-4 left-3 bg-[#0b1222]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-indigo-500/40 shadow-xl flex items-center space-x-2 text-xs text-slate-200">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
              <span className="font-semibold text-indigo-300">🎮 Jonli Haydash:</span>
              <span className="font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded text-white font-bold">W, A, S, D</span>
              <span className="text-slate-400">yoki Strelkalar</span>
              <span className="font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-bold ml-1">Space</span>
              <span className="text-slate-400">(Nitro)</span>
              <span className="font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 font-bold ml-1">C</span>
              <span className="text-slate-400">(FPV)</span>
            </div>
          )}

          {/* FPV Mode Badge */}
          {isFpvCamera && (
            <div className="absolute top-3 right-3 bg-rose-950/85 backdrop-blur-md border border-rose-500/60 px-3 py-1.5 rounded-xl shadow-lg flex items-center space-x-2 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-xs font-bold text-rose-200 font-mono">
                FPV ROBOT KAMERASI REJIMI
              </span>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="absolute bottom-3 right-3 flex items-center space-x-1.5 bg-[#0e1424]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#202c49] shadow-lg">
            <span className="text-[10px] text-slate-400 font-mono px-1">
              {zoomLevel}%
            </span>
            <button
              onClick={() => handleZoom(0.85)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-[#1a2744] rounded-lg transition-colors cursor-pointer"
              title="Yaqinlashtirish (+)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(1.15)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-[#1a2744] rounded-lg transition-colors cursor-pointer"
              title="Uzoqlashtirish (-)"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetCamera}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-[#1a2744] rounded-lg transition-colors cursor-pointer"
              title="Markazlashtirish"
            >
              <Focus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full h-full overflow-hidden">
          <ElectronicsSchematic
            hasArduino={hasArduino}
            hasUltrasonic={hasUltrasonic}
            hasLidar={hasLidar}
          />
        </div>
      )}
    </div>
  );
};
