import { useState } from 'react';
import { Header } from './components/Header';
import { SidebarCatalog } from './components/SidebarCatalog';
import { Viewport3D } from './components/Viewport3D';
import { CodeEditorPanel } from './components/CodeEditorPanel';
import { RightPanel } from './components/RightPanel';
import { ExportImportModal } from './components/ExportImportModal';
import { RoboArenaView } from './components/arena/RoboArenaView';
import { DroneView } from './components/drone/DroneView';
import { PlatformsHubView } from './components/PlatformsHubView';
import type { DroneViewMode } from './types/drone';
import type { ActiveTab, ViewMode, PartCategory, RobotPart, RobotConfig } from './types';
import type { ExecutionLog, SupportedLanguage } from './utils/robotRuntime';

const INITIAL_PARTS: RobotPart[] = [
  // 6-Bosqich: Chassis (Korpus)
  {
    id: 'chassis-speed',
    name: 'RoboRacer Speed Chassis',
    category: 'chassis',
    countOrPower: 'Alloy 6061',
    iconType: 'chassis',
    weightKg: 0.45,
    description: 'Yengil va aerodinamik alyuminiy poyga korpusi.',
    enabled: true,
  },
  {
    id: 'chassis-armor',
    name: 'Titan Heavy Armor',
    category: 'chassis',
    countOrPower: 'Steel Armor',
    iconType: 'chassis',
    weightKg: 0.95,
    description: 'Qalin po\'lat himoya qoplamasi, to\'qnashuvlarga juda chidamli.',
    enabled: false,
  },

  // 7-Bosqich: Motorlar & G'ildiraklar
  {
    id: 'dc-motor',
    name: '12V DC High-Speed Motor',
    category: 'motors',
    countOrPower: 112,
    iconType: 'motor',
    weightKg: 0.15,
    description: 'Yuqori aylanish tezligiga ega 12V DC elektr motor.',
    enabled: true,
  },
  {
    id: 'track-wheel',
    name: 'Track Wheel (Gusenitsa)',
    category: 'motors',
    countOrPower: 15,
    iconType: 'wheel',
    weightKg: 0.22,
    description: 'Off-road va to\'siqlardan oshib o\'tuvchi kuchaytirilgan g\'ildirak.',
    enabled: true,
  },
  {
    id: 'servo-sg90',
    name: 'Micro Servo SG90',
    category: 'motors',
    countOrPower: '180° Turn',
    iconType: 'motor',
    weightKg: 0.03,
    description: 'Datchik yoki kamerani burish uchun mikromotor.',
    enabled: false,
  },

  // 8-Bosqich: Sensorlar & Datchiklar
  {
    id: 'ultrasonic',
    name: 'Ultrasonic HC-SR04',
    category: 'sensors',
    countOrPower: 8,
    iconType: 'ultrasonic',
    weightKg: 0.05,
    description: 'HC-SR04 ultratovushli masofa datchigi (2cm - 400cm).',
    enabled: true,
  },
  {
    id: 'lidar-scanner',
    name: 'Micro 360° LiDAR Scanner',
    category: 'sensors',
    countOrPower: '360° Scan',
    iconType: 'lidar',
    weightKg: 0.12,
    description: 'Lazerli xarita chizuvchi 360 darajali skaner datchigi.',
    enabled: false,
  },
  {
    id: 'fpv-camera',
    name: 'HD FPV Camera Module',
    category: 'sensors',
    countOrPower: '1080p 60fps',
    iconType: 'camera',
    weightKg: 0.06,
    description: 'Robot peshonasiga o\'rnatiladigan real-vaqt video kamerasi.',
    enabled: false,
  },

  // 9-Bosqich: Mikrokontroller & Quvvat
  {
    id: 'arduino-uno',
    name: 'Arduino Uno R3',
    category: 'electronics',
    countOrPower: 25,
    iconType: 'arduino',
    weightKg: 0.25,
    description: 'ATmega328P mikrokontrolleri, 14 raqamli va 6 analog pin.',
    enabled: true,
  },
  {
    id: 'driver-l298n',
    name: 'L298N Dual H-Bridge Driver',
    category: 'electronics',
    countOrPower: '2A Peak',
    iconType: 'driver',
    weightKg: 0.08,
    description: 'Ikkita DC motorni boshqaruvchi drayver moduli.',
    enabled: true,
  },
  {
    id: 'lipo-battery',
    name: 'Li-Po 7.4V (2S 2200mAh)',
    category: 'battery',
    countOrPower: '2200mAh',
    iconType: 'battery',
    weightKg: 0.18,
    voltage: '7.4V',
    description: '2S 2200mAh yuqori tok beruvchi qayta quvvatlanuvchi akkumulyator.',
    enabled: true,
  },
  {
    id: 'lipo-3s-battery',
    name: 'Li-Po 11.1V (3S 3300mAh)',
    category: 'battery',
    countOrPower: '3300mAh',
    iconType: 'battery',
    weightKg: 0.32,
    voltage: '11.1V',
    description: 'Maksimal tezlik va kuch beruvchi 3-bankali baquvvat akkumulyator.',
    enabled: false,
  },

  // Qo'shimcha Modullar
  {
    id: 'sumo-wedge',
    name: 'Sumo Front Push Wedge',
    category: 'extra',
    countOrPower: 'Heavy Wedge',
    iconType: 'wedge',
    weightKg: 0.35,
    description: 'Raqibni ostidan ko\'tarib itarib chiqarish uchun mustahkam belkurak.',
    enabled: false,
  },
];

const DEFAULT_PYTHON_CODE = `from robot import Robot
from sensors import DistanceSensor
from motors import Motor

robot = Robot()
sensor = DistanceSensor(port=0)
left_motor = Motor(port=1)
right_motor = Motor(port=2)

print("RoboRacer avtonom rejimi ishga tushdi!")

while True:
    distance = sensor.get_distance()
    if distance < 20:
        left_motor.set_speed(0.5)
        right_motor.set_speed(-0.5)
    else:
        left_motor.set_speed(1.0)
        right_motor.set_speed(1.0)`;

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [droneSubMode, setDroneSubMode] = useState<DroneViewMode>('builder');
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [selectedCategory, setSelectedCategory] = useState<PartCategory>('all');
  const [parts, setParts] = useState<RobotPart[]>(INITIAL_PARTS);
  const [isSimulating, setIsSimulating] = useState(false);
  const [pythonCode, setPythonCode] = useState(DEFAULT_PYTHON_CODE);
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [liveDistance, setLiveDistance] = useState<number>(24.5);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false); // Standart holatda yopiq (3D maydonga halaqit bermaydi)
  const [is3DFullscreen, setIs3DFullscreen] = useState(false);

  // 11-Bosqich: Robot parametrlari
  const [robotConfig, setRobotConfig] = useState<RobotConfig>({
    name: 'SpeedBot',
    type: 'RoboRacer',
    chassisModel: 'speed',
    wheelModel: 'track',
    mcuModel: 'arduino_uno',
    weight: 1.2,
    dimensions: {
      width: 18,
      length: 22,
      height: 12,
    },
    metrics: {
      speed: 8.5,
      stability: 7.8,
      handling: 9.2,
    },
    batteryVoltage: 7.4,
    batteryHealth: 100,
    equippedParts: INITIAL_PARTS.filter((p) => p.enabled).map((p) => p.id),
    pythonCode: DEFAULT_PYTHON_CODE,
  });

  // 12-Bosqich: Dinamik Ko'rsatkichlarni hisoblash funksiyasi
  const recalculateStats = (currentParts: RobotPart[], currentType: string) => {
    const totalWeight = currentParts
      .filter((p) => p.enabled)
      .reduce((sum, p) => sum + p.weightKg, 0.2);

    const hasMotor = currentParts.find((p) => p.id === 'dc-motor')?.enabled;
    const has3SBattery = currentParts.find((p) => p.id === 'lipo-3s-battery')?.enabled;
    const hasTracks = currentParts.find((p) => p.id === 'track-wheel')?.enabled;
    const hasArmor = currentParts.find((p) => p.id === 'chassis-armor')?.enabled;
    const hasLidar = currentParts.find((p) => p.id === 'lidar-scanner')?.enabled;
    const hasWedge = currentParts.find((p) => p.id === 'sumo-wedge')?.enabled;
    const hasCamera = currentParts.find((p) => p.id === 'fpv-camera')?.enabled;

    let speedScore = hasMotor
      ? Math.min(10, Math.max(2, Number((has3SBattery ? 9.8 : 10 - totalWeight * 1.35).toFixed(1))))
      : 1.0;

    let stabilityScore = Math.min(
      10,
      Number(((hasTracks ? 8.2 : 7.2) + (hasArmor ? 1.4 : 0) + (currentType === 'SumoBot' ? 0.8 : 0)).toFixed(1))
    );

    let handlingScore = Math.min(
      10,
      Number((8.5 + (hasLidar ? 0.9 : 0) + (hasCamera ? 0.3 : 0)).toFixed(1))
    );

    const dimensions = {
      length: 22 + (hasWedge ? 5 : 0),
      width: 18 + (hasTracks ? 3 : 0),
      height: 12 + (hasLidar ? 4 : 0) + (hasCamera ? 2 : 0),
    };

    setRobotConfig((prev) => ({
      ...prev,
      type: currentType,
      weight: Number(totalWeight.toFixed(2)),
      dimensions,
      batteryVoltage: has3SBattery ? 11.1 : 7.4,
      metrics: {
        speed: speedScore,
        stability: stabilityScore,
        handling: handlingScore,
      },
      equippedParts: currentParts.filter((p) => p.enabled).map((p) => p.id),
    }));
  };

  const handleTogglePart = (partId: string) => {
    setParts((prevParts) => {
      const updated = prevParts.map((p) =>
        p.id === partId ? { ...p, enabled: !p.enabled } : p
      );
      recalculateStats(updated, robotConfig.type);
      return updated;
    });
  };

  const handleUpdateRobotType = (type: string) => {
    recalculateStats(parts, type);
  };

  const handleApplyAiRecommendation = () => {
    setParts((prevParts) => {
      let updated = [...prevParts];

      if (robotConfig.type === 'SumoBot') {
        updated = updated.map((p) =>
          p.id === 'sumo-wedge' || p.id === 'chassis-armor' ? { ...p, enabled: true } : p
        );
      } else {
        updated = updated.map((p) =>
          p.id === 'lipo-3s-battery' || p.id === 'lidar-scanner' ? { ...p, enabled: true } : p
        );
      }

      recalculateStats(updated, robotConfig.type);
      return updated;
    });
  };

  const handleSave = () => {
    const configData = JSON.stringify({ ...robotConfig, pythonCode, parts }, null, 2);
    localStorage.setItem('roboverse_robot_config', configData);
    alert('✅ ' + robotConfig.name + ' (' + robotConfig.type + ') konfiguratsiyasi va Python kodi muvaffaqiyatli saqlandi!');
  };

  const handleRunCode = () => {
    setIsSimulating((prev) => !prev);
    if (!isSimulating) {
      setViewMode('3d');
    }
  };

  const handleImportConfig = (data: { robotConfig: RobotConfig; pythonCode: string; parts: RobotPart[] }) => {
    setRobotConfig(data.robotConfig);
    setPythonCode(data.pythonCode);
    setParts(data.parts);
    recalculateStats(data.parts, data.robotConfig.type);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Yuqori Header: Faqat platformalar ichida ko'rinadi (Builder, World, Drone). Asosiy Hub sahifasida tepada menyu ko'rinmaydi */}
      {['builder', 'world', 'drone'].includes(activeTab) && (
        <Header 
          activeTab={activeTab} 
          onSelectTab={setActiveTab}
          platform={activeTab === 'drone' ? 'drone' : 'robot'}
          droneSubMode={droneSubMode}
          onSelectDroneSubMode={(mode) => {
            setDroneSubMode(mode);
            setActiveTab('drone');
          }}
          onSwitchPlatform={(newPlatform) => {
            if (newPlatform === 'drone') {
              setActiveTab('drone');
            } else {
              setActiveTab('builder');
            }
          }}
        />
      )}

      {activeTab === 'builder' ? (
        /* 1-INTERFEYS: ROBOT CONSTRUCTOR (BUILDER) */
        <div className="flex-1 flex overflow-hidden relative">
          {/* Chap Panel: Qismlar Katalogi */}
          {!is3DFullscreen && isLeftSidebarOpen && (
            <SidebarCatalog
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              parts={parts}
              onTogglePart={handleTogglePart}
              cartCount={parts.filter((p) => p.enabled).length}
            />
          )}

          {/* Markaziy: 3D Sahna + Monaco Python Kod Muharriri */}
          <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
            <Viewport3D
              viewMode={viewMode}
              onSetViewMode={setViewMode}
              parts={parts}
              isSimulating={isSimulating}
              onToggleSimulate={() => setIsSimulating(!isSimulating)}
              onSave={handleSave}
              onOpenExportImport={() => setIsExportImportOpen(true)}
              liveDistance={liveDistance}
              onUpdateLiveDistance={setLiveDistance}
              pythonCode={pythonCode}
              language={language}
              onUpdateLogs={(newLogs) => setLogs((prev) => [...prev, ...newLogs].slice(-150))}
              isCodeOpen={isCodeOpen}
              onToggleCode={() => setIsCodeOpen((prev) => !prev)}
              is3DFullscreen={is3DFullscreen}
              onToggle3DFullscreen={() => setIs3DFullscreen((prev) => !prev)}
              isLeftSidebarOpen={isLeftSidebarOpen}
              onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
              isRightSidebarOpen={isRightSidebarOpen}
              onToggleRightSidebar={() => setIsRightSidebarOpen((prev) => !prev)}
            />

            {isCodeOpen && (
              <CodeEditorPanel
                code={pythonCode}
                onChangeCode={setPythonCode}
                onRunCode={handleRunCode}
                isSimulating={isSimulating}
                logs={logs}
                language={language}
                onChangeLanguage={setLanguage}
              />
            )}
          </div>

          {/* O'ng Panel: Robot Ma'lumotlari, Stats & Test Natijalari (Tugma bosilgandagina chiqadi) */}
          {!is3DFullscreen && isRightSidebarOpen && (
            <RightPanel
              robotConfig={robotConfig}
              onUpdateRobotName={(name) => setRobotConfig((prev) => ({ ...prev, name }))}
              onUpdateRobotType={handleUpdateRobotType}
              onApplyAiRecommendation={handleApplyAiRecommendation}
              parts={parts}
              liveDistance={liveDistance}
              isSimulating={isSimulating}
              onClose={() => setIsRightSidebarOpen(false)}
            />
          )}
        </div>
      ) : activeTab === 'world' ? (
        /* 2-INTERFEYS: VIRTUAL DUNYO (ROBOARENA) */
        <RoboArenaView
          parts={parts}
          robotName={robotConfig.name}
        />
      ) : activeTab === 'drone' ? (
        /* 3-INTERFEYS: DRONLAR PLATFORMASI (DRONEVERSE) */
        <DroneView 
          viewMode={droneSubMode}
          onSetViewMode={setDroneSubMode}
        />
      ) : (
        /* Home, Competitions, Friends: Ikkita Alohida Katta Kartochkali Hub */
        <PlatformsHubView 
          onSelectPlatform={(tab, subMode) => {
            if (subMode) setDroneSubMode(subMode);
            setActiveTab(tab);
          }} 
        />
      )}

      {/* 19-Bosqich: Robotni JSON Eksport va Import Qilish Modali */}
      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        robotConfig={robotConfig}
        pythonCode={pythonCode}
        parts={parts}
        onImportConfig={handleImportConfig}
      />
    </div>
  );
}

export default App;
