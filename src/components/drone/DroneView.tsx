import React, { useState } from 'react';
import { DroneSidebarCatalog } from './DroneSidebarCatalog';
import { DroneViewport3D } from './DroneViewport3D';
import { DroneRightPanel } from './DroneRightPanel';
import { DroneArenaCanvas3D } from './DroneArenaCanvas3D';
import { DroneHUD } from './DroneHUD';
import { CodeEditorPanel } from '../CodeEditorPanel';
import type { ExecutionLog } from '../../utils/robotRuntime';
import type { 
  DroneGameMode, 
  DroneTelemetry, 
  DroneViewMode, 
  DronePart, 
  DronePartCategory,
  DroneConfig 
} from '../../types/drone';
import type { ViewMode } from '../../types';

const INITIAL_DRONE_PARTS: DronePart[] = [
  {
    id: 'frame-apex5',
    name: 'Apex 5" Carbon X-Frame',
    category: 'frame',
    specs: '3K Carbon Fiber (4mm)',
    weightG: 125,
    iconType: 'frame',
    description: 'Ultra chidamli va aerodinamik poyga korpusi.',
    enabled: true,
  },
  {
    id: 'frame-cinewhoop',
    name: 'CineWhoop 3" Ducted Frame',
    category: 'frame',
    specs: 'Ring Protector Frame',
    weightG: 95,
    iconType: 'frame',
    description: 'Xavfsiz parvoz va bino ichida uchish uchun halqali korpus.',
    enabled: false,
  },
  {
    id: 'motor-emax2400',
    name: '4x EMAX RS2306 2400KV Motors',
    category: 'motors',
    specs: '4S Brushless (4.2kg Thrust)',
    weightG: 136,
    iconType: 'motor',
    description: 'Yuqori aylanish tezligiga ega kuchli cho\'tkasiz motorlar.',
    enabled: true,
  },
  {
    id: 'motor-tmotor1950',
    name: '4x T-Motor F40 Pro 1950KV',
    category: 'motors',
    specs: '6S High-Torque Motor',
    weightG: 142,
    iconType: 'motor',
    description: '6S batareya uchun mo\'ljallangan yuqori momentli poyga motori.',
    enabled: false,
  },
  {
    id: 'prop-cyclone',
    name: 'Cyclone T5046C 3-Blade Props',
    category: 'propellers',
    specs: '5.0x4.6 Tri-Blade Polycarb',
    weightG: 22,
    iconType: 'propeller',
    description: 'Maksimal tortish va past shovqinli poyga parraklari.',
    enabled: true,
  },
  {
    id: 'prop-gemfan',
    name: 'Gemfan 51466 Hurricane Props',
    category: 'propellers',
    specs: 'Low-Drag Freestyle Blades',
    weightG: 19,
    iconType: 'propeller',
    description: 'Ajoyib burilish va manyovr uchun yengil parraklar.',
    enabled: false,
  },
  {
    id: 'cam-caddx',
    name: 'Caddx Ratel 2 Micro Starlight FPV',
    category: 'sensors',
    specs: '1200TVL 1.8mm 165° FOV',
    weightG: 12,
    iconType: 'camera',
    description: 'Kechasi va kunduzi tiniq ko\'rsatuvchi FPV videokamera moduli.',
    enabled: true,
  },
  {
    id: 'sensor-lidar',
    name: 'Micro LiDAR ToF Distance Sensor',
    category: 'sensors',
    specs: '0.05m - 12m Altitude Sensor',
    weightG: 8,
    iconType: 'lidar',
    description: 'Pastdan masofani va to\'siqlarni lazerli aniqlovchi datchik.',
    enabled: true,
  },
  {
    id: 'batt-tattu4s',
    name: 'Tattu R-Line 4S 1550mAh 130C LiPo',
    category: 'battery',
    specs: '14.8V 130C High Discharge',
    weightG: 185,
    iconType: 'battery',
    description: 'Ekstremal tezlanish uchun yuqori oqimli litiy-polimer batareya.',
    enabled: true,
  },
  {
    id: 'fc-speedybee',
    name: 'SpeedyBee F7 V3 Flight Controller',
    category: 'fc',
    specs: 'STM32F722 + BMI270 Gyro (8K/8K)',
    weightG: 18,
    iconType: 'fc',
    description: 'Yuqori aniqlikdagi giroskop va barometrli parvoz mikrokontrolleri.',
    enabled: true,
  },
  {
    id: 'esc-4in1',
    name: '4-in-1 50A BLHeli_32 ESC',
    category: 'fc',
    specs: 'DShot600 50A Burst 60A',
    weightG: 20,
    iconType: 'fc',
    description: '4 ta motorni sinxron boshqaruvchi quvvat drayveri.',
    enabled: true,
  },
  {
    id: 'extra-gps',
    name: 'Holybro Micro M10Q GPS & Compass',
    category: 'extra',
    specs: 'Multi-GNSS + QMC5883L',
    weightG: 14,
    iconType: 'gps',
    description: 'Avtonom parvoz va Return-to-Home (bazasiga qaytish) datchigi.',
    enabled: true,
  },
];

const INITIAL_DRONE_CONFIG: DroneConfig = {
  name: 'DroneVerse Phantom X',
  type: 'racing',
  frameModel: 'apex_5',
  motorModel: '2306_2400kv',
  fcModel: 'speedybee_f7',
  weight: 520,
  dimensions: {
    width: 21,
    length: 21,
    height: 7,
  },
  metrics: {
    speed: 9.4,
    thrustToWeight: 8.1,
    flightTimeMin: 8.5,
    handling: 9.6,
  },
  batteryVoltage: 14.8,
  batteryHealth: 98,
  equippedParts: INITIAL_DRONE_PARTS.filter(p => p.enabled).map(p => p.id),
  pythonCode: `# 🛸 DRONEVERSE AUTONOMOUS FLIGHT SCRIPT
import time
from drone_core import FC, Sensors, Motors

def autonomous_mission():
    print("Pre-flight self test initiated...")
    Sensors.calibrate()
    
    # Takeoff to 2.5 meters
    Motors.arm()
    FC.set_target_altitude(2.5)
    time.sleep(1.5)
    
    # Forward gate tracking
    while Sensors.get_battery() > 14.2:
        dist = Sensors.get_front_distance()
        if dist < 1.0:
            FC.evade_obstacle()
        else:
            FC.cruise_forward(speed=45)
            
    print("Mission complete. Landing safely...")
    FC.land()

autonomous_mission()
`,
};

interface DroneViewProps {
  viewMode?: DroneViewMode;
  onSetViewMode?: (mode: DroneViewMode) => void;
  initialViewMode?: DroneViewMode;
}

export const DroneView: React.FC<DroneViewProps> = ({ 
  viewMode: controlledViewMode,
  onSetViewMode,
  initialViewMode = 'builder' 
}) => {
  const [internalViewMode, setInternalViewMode] = useState<DroneViewMode>(initialViewMode);
  const viewMode = controlledViewMode ?? internalViewMode;
  const setViewMode = onSetViewMode ?? setInternalViewMode;
  const [viewportViewMode, setViewportViewMode] = useState<ViewMode>('3d');
  const [gameMode, setGameMode] = useState<DroneGameMode>('racing');
  const [cameraMode, setCameraMode] = useState<'chase' | 'fpv' | 'top'>('chase');
  const [parts, setParts] = useState<DronePart[]>(INITIAL_DRONE_PARTS);
  const [selectedCategory, setSelectedCategory] = useState<DronePartCategory>('all');
  const [droneConfig, setDroneConfig] = useState<DroneConfig>(INITIAL_DRONE_CONFIG);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [liveAltitude, setLiveAltitude] = useState<number>(0.3);
  const [isCodeOpen, setIsCodeOpen] = useState<boolean>(false);
  const [is3DFullscreen, setIs3DFullscreen] = useState<boolean>(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<ExecutionLog[]>([
    { timestamp: '00:00:01', type: 'info', message: '[INIT] Drone FC Firmware: Betaflight 4.5.1 Online' },
    { timestamp: '00:00:02', type: 'success', message: '[OK] Gyroscope BMI270 8KHz Calibrated successfully' },
    { timestamp: '00:00:02', type: 'success', message: '[OK] 4x ESC BLHeli_32 DShot600 Protocol Ready' },
    { timestamp: '00:00:03', type: 'info', message: '[RADIO] ELRS 2.4GHz Link Established - RSSI 98%' },
  ]);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  const [telemetry, setTelemetry] = useState<DroneTelemetry>({
    altitude: 2.5,
    speed: 0,
    verticalSpeed: 0,
    pitch: 0,
    roll: 0,
    yaw: 180,
    battery: 98,
    rssi: 98,
    motorRpm: [50, 50, 50, 50],
    score: 0,
    gatesPassed: 0,
  });

  const handleTogglePart = (partId: string) => {
    setParts(prev => prev.map(p => p.id === partId ? { ...p, enabled: !p.enabled } : p));
  };

  const handleCycleCamera = () => {
    setCameraMode(prev => {
      if (prev === 'chase') return 'fpv';
      if (prev === 'fpv') return 'top';
      return 'chase';
    });
  };

  const handleSave = () => {
    alert("Dron konfiguratsiyasi va sozlamalari muvaffaqiyatli saqlandi! 🛸");
  };

  const handleApplyAiRecommendation = () => {
    alert("AI aerodinamik tavsiyalari qo'llanildi: Motor & Propeller nisbati maksimal tezlikka moslashtirildi!");
  };

  return (
    <div className="flex-1 w-full h-[calc(100vh-3.5rem)] relative overflow-hidden bg-[#070b14] flex flex-col">
      {viewMode === 'arena' ? (
        /* DRONE WORLD / ARENAS (Neon Gates, Cyber City, Delivery, Canyon, Targets) */
        <div className="flex-1 w-full h-full relative">
          <DroneArenaCanvas3D
            gameMode={gameMode}
            cameraMode={cameraMode}
            onUpdateTelemetry={setTelemetry}
            resetTrigger={resetTrigger}
          />

          <DroneHUD
            gameMode={gameMode}
            onSelectGameMode={setGameMode}
            telemetry={telemetry}
            cameraMode={cameraMode}
            onCycleCamera={handleCycleCamera}
            onResetDrone={() => setResetTrigger(prev => prev + 1)}
            viewMode={viewMode}
            onSelectViewMode={setViewMode}
          />
        </div>
      ) : (
        /* DRONE CONSTRUCTOR WORKSPACE (Exact replica of Robot Constructor from user's screenshot!) */
        <div className="flex-1 flex overflow-hidden relative">
          {/* Chap Panel: Dron Qismlari Katalogi */}
          {!is3DFullscreen && isLeftSidebarOpen && (
            <DroneSidebarCatalog
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              parts={parts}
              onTogglePart={handleTogglePart}
              cartCount={parts.filter(p => p.enabled).length}
            />
          )}

          {/* Markaziy: 3D Viewport va Kod Muharriri */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            <DroneViewport3D
              viewMode={viewportViewMode}
              onSetViewMode={setViewportViewMode}
              parts={parts}
              isSimulating={isSimulating}
              onToggleSimulate={() => setIsSimulating(!isSimulating)}
              onSave={handleSave}
              onOpenExportImport={() => alert("JSON Eksport / Import tayyor")}
              liveAltitude={liveAltitude}
              onUpdateLiveAltitude={setLiveAltitude}
              pythonCode={droneConfig.pythonCode}
              isCodeOpen={isCodeOpen}
              onToggleCode={() => setIsCodeOpen(!isCodeOpen)}
              is3DFullscreen={is3DFullscreen}
              onToggle3DFullscreen={() => setIs3DFullscreen(!is3DFullscreen)}
              isLeftSidebarOpen={isLeftSidebarOpen}
              onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              isRightSidebarOpen={isRightSidebarOpen}
              onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            />

            {/* Pastki / Yon Kod Muharriri (Tugma bosilganda chiqadi) */}
            {isCodeOpen && (
              <CodeEditorPanel
                code={droneConfig.pythonCode}
                onChangeCode={(c) => setDroneConfig(prev => ({ ...prev, pythonCode: c }))}
                onRunCode={() => {
                  setIsSimulating(true);
                  setLogs(prev => [
                    ...prev, 
                    { timestamp: new Date().toLocaleTimeString(), type: 'info', message: '[RUN] Dron parvoz kodi bajarilmoqda...' }
                  ]);
                }}
                isSimulating={isSimulating}
                logs={logs}
                language={'python'}
                onChangeLanguage={() => {}}
              />
            )}
          </div>

          {/* O'ng Panel: Dron Ma'lumotlari & AI Tavsiyalar (Tugma bosilganda chiqadi) */}
          {!is3DFullscreen && isRightSidebarOpen && (
            <DroneRightPanel
              droneConfig={droneConfig}
              onUpdateDroneName={(name) => setDroneConfig(prev => ({ ...prev, name }))}
              onUpdateDroneType={(type) => setDroneConfig(prev => ({ ...prev, type }))}
              onApplyAiRecommendation={handleApplyAiRecommendation}
              parts={parts}
              liveAltitude={liveAltitude}
              isSimulating={isSimulating}
              onClose={() => setIsRightSidebarOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};
