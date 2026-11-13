export type DroneGameMode = 'racing' | 'city' | 'delivery' | 'targets' | 'canyon';

export type DroneViewMode = 'builder' | 'arena';

export type DronePartCategory = 
  | 'all'
  | 'frame'
  | 'motors'
  | 'propellers'
  | 'sensors'
  | 'battery'
  | 'fc'
  | 'extra';

export interface DronePart {
  id: string;
  name: string;
  category: DronePartCategory;
  specs: string;
  weightG: number;
  iconType: 'frame' | 'motor' | 'propeller' | 'camera' | 'battery' | 'fc' | 'gps' | 'lidar';
  description: string;
  enabled: boolean;
  price?: number;
}

export interface DroneConfig {
  name: string;
  type: 'racing' | 'cinematic' | 'delivery' | 'custom';
  frameModel: 'apex_5' | 'cinewhoop_3' | 'long_range_7';
  motorModel: '2306_2400kv' | '2207_1950kv' | '2807_1300kv';
  fcModel: 'speedybee_f7' | 'mamba_f405' | 'pixhawk_4';
  weight: number;
  dimensions: {
    width: number;
    length: number;
    height: number;
  };
  metrics: {
    speed: number;       // out of 10
    thrustToWeight: number; // e.g. 5.5:1
    flightTimeMin: number;  // minutes
    handling: number;    // out of 10
  };
  batteryVoltage: number;
  batteryHealth: number;
  equippedParts: string[];
  pythonCode: string;
}

export interface DroneTelemetry {
  altitude: number;      // Balandlik (metr)
  speed: number;         // Tezlik (km/s)
  verticalSpeed: number; // Ko'tarilish/tushish tezligi (m/s)
  pitch: number;         // Tangaj (gradus)
  roll: number;          // Kren (gradus)
  yaw: number;           // Kurs (gradus)
  battery: number;       // Batareya foizi (0-100%)
  rssi: number;          // Signal sifati (dBm / %)
  motorRpm: [number, number, number, number]; // 4 ta motor aylanishi
  score: number;
  gatesPassed: number;
}
