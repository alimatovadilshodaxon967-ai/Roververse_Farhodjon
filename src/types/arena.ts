export type ArenaGameMode = 'sumo' | 'football' | 'line' | 'warehouse' | 'racing';

export interface ArenaPlayer {
  id: string;
  name: string;
  isSelf: boolean;
  score: number;
  rank: number;
  ping: number;
  color: string;
  x: number;
  z: number;
  rotationY: number;
  hp: number;
  speed: number;
  energy: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  isSelf: boolean;
  text: string;
  time: string;
  isSystem?: boolean;
}

export interface Competition {
  id: string;
  name: string;
  startTime: string;
  participants: string;
  icon: string;
  mode: ArenaGameMode;
}

export interface GameModeState {
  currentMode: ArenaGameMode;
  footballScore: { player: number; opponent: number };
  lapTime: number;
  bestLapTime: number;
  cargoDelivered: number;
  sumoWins: number;
}
