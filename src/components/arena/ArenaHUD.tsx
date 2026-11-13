import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Camera, 
  Radio, 
  Crown, 
  Zap, 
  Gauge, 
  ShieldAlert, 
  Compass, 
  Globe,
  Trophy,
  Sparkles
} from 'lucide-react';
import type { ArenaGameMode, ArenaPlayer } from '../../types/arena';
import { OpponentProfileModal } from './OpponentProfileModal';
import { ArenaSelectorModal } from './ArenaSelectorModal';

interface ArenaHUDProps {
  telemetry: {
    hp: number;
    speed: number;
    energy: number;
    x: number;
    z: number;
    angle: number;
  };
  players: ArenaPlayer[];
  cameraMode: 'chase' | 'top' | 'fpv';
  onCycleCamera: () => void;
  isAutonomous: boolean;
  onToggleAutonomous: () => void;
  isImpactShaking: boolean;
  gameMode: ArenaGameMode;
  onSelectGameMode: (mode: ArenaGameMode) => void;
  bannerEvent: { title: string; subtitle: string } | null;
  footballScore: { player: number; opponent: number };
}

export const ArenaHUD: React.FC<ArenaHUDProps> = ({
  telemetry,
  players,
  cameraMode,
  onCycleCamera,
  isAutonomous,
  onToggleAutonomous,
  isImpactShaking,
  gameMode,
  onSelectGameMode,
  bannerEvent,
  footballScore,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<ArenaPlayer | null>(null);
  const [isArenaModalOpen, setIsArenaModalOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(156);
  const [serverRegion, setServerRegion] = useState<'UZ-Central' | 'EU-Central'>('UZ-Central');
  const [livePing, setLivePing] = useState(14);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 180));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const pTimer = setInterval(() => {
      const base = serverRegion === 'UZ-Central' ? 14 : 48;
      setLivePing(base + Math.floor(Math.random() * 5));
    }, 2000);
    return () => clearInterval(pTimer);
  }, [serverRegion]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const degrees = Math.round(((telemetry.angle * 180) / Math.PI) % 360);
  const normalizedDegrees = degrees < 0 ? degrees + 360 : degrees;
  let cardinal = 'N';
  if (normalizedDegrees >= 315 || normalizedDegrees < 45) cardinal = 'N';
  else if (normalizedDegrees >= 45 && normalizedDegrees < 135) cardinal = 'E';
  else if (normalizedDegrees >= 135 && normalizedDegrees < 225) cardinal = 'S';
  else cardinal = 'W';

  const radarRadius = 45;
  const arenaBound = 35;

  return (
    <>
      {/* Impact Screen Flash */}
      {isImpactShaking && (
        <div className="absolute inset-0 bg-red-600/20 pointer-events-none z-30 animate-pulse border-4 border-red-500/50"></div>
      )}

      {/* In-Game Announcement Banner (31-35 bosqichlar) */}
      {bannerEvent && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-blue-900/90 via-indigo-900/95 to-blue-900/90 border border-cyan-400/60 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-center animate-in zoom-in-95 duration-200">
          <div className="text-sm font-black text-white tracking-wider flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{bannerEvent.title}</span>
          </div>
          <p className="text-[11px] text-cyan-200 font-medium mt-0.5">{bannerEvent.subtitle}</p>
        </div>
      )}

      <div className={`absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 z-20 ${isImpactShaking ? 'translate-x-1 translate-y-1' : ''}`}>
        {/* TOP BAR OVERLAY */}
        <div className="flex items-start justify-between w-full">
          {/* Top Left: RoboArena Match Status & 5 GAME MODES SELECTOR */}
          <div className="flex items-center space-x-2 pointer-events-auto">
            <div className="flex items-center space-x-3 bg-[#0d1424]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#202f4e] shadow-xl">
              <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
                <Box className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white tracking-wide">RoboArena</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded border border-slate-700">
                    3/8
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Live Match</span>
                </div>
              </div>
            </div>

            {/* 31-35 Bosqichlar: O'yin Rejimini Tanlash Dropdown & Quick Tabs */}
            <div className="bg-[#0d1424]/90 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-[#202f4e] flex items-center space-x-1.5 shadow-lg">
              <span className="text-[10px] text-slate-400 font-mono">Rejim:</span>
              <select
                value={gameMode}
                onChange={(e) => onSelectGameMode(e.target.value as ArenaGameMode)}
                className="bg-[#152038] text-white font-bold text-xs px-2 py-1 rounded-xl border border-[#23355c] focus:outline-none cursor-pointer"
              >
                <option value="sumo">🥋 RoboSumo (Yapon Dojo)</option>
                <option value="football">⚽ RoboFootball (Stadion)</option>
                <option value="line">〰️ Line Follower (R&D Lab)</option>
                <option value="warehouse">📦 Warehouse (Smart Ombor)</option>
                <option value="racing">🏎️ Speed Racing (Kiber Trassa)</option>
              </select>
            </div>

            {/* 5 Alohida Maydonlar Tezkor Switcher (Pill Tabs) */}
            <div className="hidden xl:flex items-center space-x-1 bg-[#0d1424]/90 backdrop-blur-md p-1 rounded-2xl border border-[#202f4e] shadow-lg">
              {[
                { id: 'sumo', label: '🥋 Sumo' },
                { id: 'football', label: '⚽ Futbol' },
                { id: 'line', label: '〰️ Chiziq' },
                { id: 'warehouse', label: '📦 Ombor' },
                { id: 'racing', label: '🏎️ Poyga' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onSelectGameMode(tab.id as ArenaGameMode)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    gameMode === tab.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <button
                onClick={() => setIsArenaModalOpen(true)}
                className="ml-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer shadow-md transition-all border border-blue-400/40"
                title="Barcha 5 ta maydon tavsifi va parametrlarini ko'rish"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Maydonlar Hub</span>
              </button>
            </div>

            {/* Server Region */}
            <button
              onClick={() => setServerRegion(prev => prev === 'UZ-Central' ? 'EU-Central' : 'UZ-Central')}
              className="bg-[#0d1424]/90 backdrop-blur-md px-2.5 py-2 rounded-2xl border border-[#202f4e] text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
              title="Server hududini almashtirish"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>{serverRegion}</span>
              <span className="text-[10px] text-emerald-400 font-bold">({livePing}ms)</span>
            </button>
          </div>

          {/* Top Center: Football Scoreboard if in football mode */}
          {gameMode === 'football' && (
            <div className="pointer-events-auto bg-[#0d1424]/95 backdrop-blur-md border border-[#202f4e] px-5 py-2 rounded-2xl shadow-2xl flex items-center space-x-4">
              <div className="text-center">
                <div className="text-[10px] text-blue-400 font-bold uppercase">YOU</div>
                <div className="text-xl font-black text-white font-mono">{footballScore.player}</div>
              </div>
              <div className="text-sm font-bold text-slate-500 font-mono">:</div>
              <div className="text-center">
                <div className="text-[10px] text-red-400 font-bold uppercase">BOTS</div>
                <div className="text-xl font-black text-white font-mono">{footballScore.opponent}</div>
              </div>
            </div>
          )}

          {/* Top Right: Time, Round and Leaderboard */}
          <div className="flex items-start space-x-2 pointer-events-auto">
            <div className="bg-[#0d1424]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#202f4e] text-center shadow-lg">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Time</div>
              <div className="text-sm font-bold font-mono text-white tracking-wider">{timeFormatted}</div>
            </div>

            <div className="bg-[#0d1424]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#202f4e] text-center shadow-lg">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Round</div>
              <div className="text-sm font-bold font-mono text-blue-400">1/3</div>
            </div>

            <div className="bg-[#0d1424]/90 backdrop-blur-md rounded-2xl border border-[#202f4e] p-2.5 shadow-xl w-48">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1 flex items-center justify-between">
                <span>Ishtirokchilar</span>
                <span className="text-emerald-400 font-mono text-[9px]">Jonli ball</span>
              </div>

              <div className="space-y-1">
                {players.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlayer(p)}
                    className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      p.isSelf
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                    title="Robot profilini ko'rish uchun bosing"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      {p.rank === 1 ? (
                        <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                      ) : (
                        <span className="w-2.5 text-center text-[10px] text-slate-500 font-mono">
                          {p.rank}
                        </span>
                      )}
                      <span className="truncate text-[11px]">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-blue-400 font-bold">
                      {p.score} pt
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM OVERLAY: RADAR + CONTROLS + TELEMETRY */}
        <div className="flex items-end justify-between w-full">
          {/* 360° Circular Radar / Minimap */}
          <div className="bg-[#0d1424]/90 backdrop-blur-md p-2.5 rounded-2xl border border-[#202f4e] shadow-2xl pointer-events-auto flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full border border-blue-500/40 bg-[#090e18]/90 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full animate-spin [animation-duration:3s]"></div>

              <span className="absolute top-1 text-[9px] font-bold text-cyan-400">N</span>
              <span className="absolute bottom-1 text-[9px] font-bold text-slate-500">S</span>
              <span className="absolute left-1.5 text-[9px] font-bold text-slate-500">W</span>
              <span className="absolute right-1.5 text-[9px] font-bold text-slate-500">E</span>

              <div className="absolute w-20 h-20 rounded-full border border-blue-500/20"></div>
              <div className="absolute w-10 h-10 rounded-full border border-blue-500/20"></div>

              <div className="relative w-3 h-3 rounded-full bg-blue-500 shadow-md shadow-blue-500 z-10 flex items-center justify-center">
                <div
                  className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[7px] border-b-cyan-300"
                  style={{ transform: `rotate(${-telemetry.angle}rad)` }}
                ></div>
              </div>

              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500 transition-all duration-200"
                style={{
                  left: `${50 + ((-6 - telemetry.x) / arenaBound) * radarRadius}%`,
                  top: `${50 + ((-8 - telemetry.z) / arenaBound) * radarRadius}%`,
                }}
                title="ShadowX"
              ></div>

              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 transition-all duration-200"
                style={{
                  left: `${50 + ((12 - telemetry.x) / arenaBound) * radarRadius}%`,
                  top: `${50 + ((-6 - telemetry.z) / arenaBound) * radarRadius}%`,
                }}
                title="Zephyr"
              ></div>
            </div>

            <div className="flex items-center space-x-1 text-[10px] text-slate-300 font-mono mt-1.5">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>{String(normalizedDegrees).padStart(3, '0')}° {cardinal}</span>
            </div>
          </div>

          {/* Bottom Center: Keyboard Controls Hint */}
          <div className="bg-[#0d1424]/85 backdrop-blur-md px-4 py-2 rounded-xl border border-[#202f4e] shadow-xl pointer-events-auto flex items-center space-x-3 text-xs text-slate-300">
            <div className="flex items-center space-x-1 font-mono font-bold text-white">
              <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">W</span>
              <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">A</span>
              <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">S</span>
              <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">D</span>
              <span className="text-[11px] font-normal text-slate-400 ml-1">Harakat</span>
            </div>

            <span className="text-slate-600">|</span>

            <div className="flex items-center space-x-1">
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono font-bold text-white">
                Space
              </span>
              <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-0.5">
                <Zap className="w-3 h-3" /> Boost
              </span>
            </div>

            <span className="text-slate-600">|</span>

            <button
              onClick={onCycleCamera}
              className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Kamera burchagini almashtirish"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px]">Kamera ({cameraMode})</span>
            </button>

            <span className="text-slate-600">|</span>

            <button
              onClick={onToggleAutonomous}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                isAutonomous 
                  ? 'bg-emerald-600/40 text-emerald-300 border border-emerald-500/50' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAutonomous ? 'Avtonom (Python)' : 'Qo\'lda (Manual)'}</span>
            </button>
          </div>

          {/* Bottom Right: Status Bars (HP, Speed, Energy) */}
          <div className="bg-[#0d1424]/90 backdrop-blur-md p-3.5 rounded-2xl border border-[#202f4e] shadow-2xl pointer-events-auto w-64 space-y-2.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-emerald-400" />
                  HP
                </span>
                <span className={`font-mono font-bold ${telemetry.hp < 40 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  {telemetry.hp}%
                </span>
              </div>
              <div className="w-full bg-[#172238] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    telemetry.hp < 40
                      ? 'bg-gradient-to-r from-red-600 to-rose-400'
                      : 'bg-gradient-to-r from-emerald-500 to-green-400'
                  }`}
                  style={{ width: `${telemetry.hp}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-blue-400" />
                  Speed
                </span>
                <span className="text-blue-400 font-mono font-bold">{telemetry.speed} o/s</span>
              </div>
              <div className="w-full bg-[#172238] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (telemetry.speed / 10) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  Energy
                </span>
                <span className="text-cyan-400 font-mono font-bold">{telemetry.energy}%</span>
              </div>
              <div className="w-full bg-[#172238] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${telemetry.energy}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <OpponentProfileModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />

      <ArenaSelectorModal
        isOpen={isArenaModalOpen}
        onClose={() => setIsArenaModalOpen(false)}
        currentMode={gameMode}
        onSelectMode={onSelectGameMode}
      />
    </>
  );
};
