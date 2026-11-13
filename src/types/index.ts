export type ActiveTab = 'home' | 'builder' | 'world' | 'drone' | 'competitions' | 'friends';

export type ViewMode = '3d' | '2d' | 'simulation';

export type PartCategory = 
  | 'all'
  | 'chassis'
  | 'motors'
  | 'sensors'
  | 'battery'
  | 'electronics'
  | 'extra';

export interface RobotPart {
  id: string;
  name: string;
  category: PartCategory;
  countOrPower: string | number;
  iconType: 'motor' | 'ultrasonic' | 'arduino' | 'wheel' | 'battery' | 'chassis' | 'lidar' | 'camera' | 'driver' | 'wedge';
  weightKg: number;
  voltage?: string;
  price?: number;
  description: string;
  enabled: boolean;
  socketLocation?: 'chassis' | 'wheels' | 'front' | 'top_deck' | 'rear' | 'underneath';
}

export interface WireConnection {
  id: string;
  fromComponent: string;
  fromPin: string;
  toComponent: string;
  toPin: string;
  color: string;
  voltage?: string;
  status: 'connected' | 'warning' | 'short_circuit';
  label: string;
}

export interface SocketPoint {
  id: string;
  name: string;
  position: [number, number, number];
  acceptedTypes: string[];
  occupiedBy?: string;
}

export interface RobotConfig {
  name: string;
  type: string;
  chassisModel: 'speed' | 'tank' | 'heavy';
  wheelModel: 'racing' | 'track' | 'mecanum';
  mcuModel: 'arduino_uno' | 'esp32' | 'pico';
  weight: number;
  dimensions: {
    width: number;
    length: number;
    height: number;
  };
  metrics: {
    speed: number;        // out of 10
    stability: number;    // out of 10
    handling: number;     // out of 10
  };
  batteryVoltage: number;
  batteryHealth: number;
  equippedParts: string[];
  pythonCode: string;
}
