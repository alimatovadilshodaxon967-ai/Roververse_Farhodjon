import React, { useState, useEffect } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  Trophy
} from 'lucide-react';
import { ArenaCanvas3D } from './ArenaCanvas3D';
import { ArenaHUD } from './ArenaHUD';
import { ArenaChatPanel } from './ArenaChatPanel';
import { ArenaCompetitionsPanel } from './ArenaCompetitionsPanel';
import type { RobotPart } from '../../types';
import type { ArenaGameMode, ArenaPlayer } from '../../types/arena';
import { soundEffects } from '../../utils/audioEffects';

interface RoboArenaViewProps {
  parts: RobotPart[];
  robotName: string;
}

const INITIAL_PLAYERS: ArenaPlayer[] = [
  { id: 'p-1', name: 'You', isSelf: true, score: 2450, rank: 1, ping: 14, color: '#2563eb', x: 0, z: 0, rotationY: 0, hp: 85, speed: 4.2, energy: 62 },
  { id: 'p-2', name: 'ShadowX', isSelf: false, score: 2180, rank: 2, ping: 24, color: '#ef4444', x: -6, z: -8, rotationY: 0.5, hp: 70, speed: 3.8, energy: 50 },
  { id: 'p-3', name: 'Zephyr', isSelf: false, score: 1940, rank: 3, ping: 32, color: '#06b6d4', x: 12, z: -6, rotationY: 1.2, hp: 90, speed: 5.1, energy: 80 },
  { id: 'p-4', name: 'NightBot', isSelf: false, score: 1720, rank: 4, ping: 45, color: '#a855f7', x: -14, z: 10, rotationY: 2.1, hp: 60, speed: 3.2, energy: 40 },
  { id: 'p-5', name: 'Falcon', isSelf: false, score: 1510, rank: 5, ping: 52, color: '#f59e0b', x: 18, z: 12, rotationY: 0.8, hp: 80, speed: 4.0, energy: 65 },
  { id: 'p-6', name: 'RoboKing', isSelf: false, score: 1390, rank: 6, ping: 68, color: '#10b981', x: -20, z: -16, rotationY: 3.1, hp: 55, speed: 2.9, energy: 30 },
];

export const RoboArenaView: React.FC<RoboArenaViewProps> = ({ parts }) => {
  const [telemetry, setTelemetry] = useState({
    hp: 85,
    speed: 4.2,
    energy: 62,
    x: 0,
    z: 0,
    angle: 0,
  });

  const [players, setPlayers] = useState<ArenaPlayer[]>(INITIAL_PLAYERS);
  const [cameraMode, setCameraMode] = useState<'chase' | 'top' | 'fpv'>('chase');
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [isImpactShaking, setIsImpactShaking] = useState(false);
  const [gameMode, setGameMode] = useState<ArenaGameMode>('sumo');
  const [bannerEvent, setBannerEvent] = useState<{ title: string; subtitle: string } | null>(null);
  const [footballScore, setFootballScore] = useState({ player: 1, opponent: 0 });

  // ⛶ To'liq Ekran (100% Fullscreen) & Pastki Panellarni Ko'rsatish
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBottomPanels, setShowBottomPanels] = useState(true);

  // Esc bosilganda to'liq ekrandan chiqish
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        soundEffects.playClickSound();
      }
      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFullscreen(prev => !prev);
        soundEffects.playClickSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleCycleCamera = () => {
    setCameraMode((prev) => (prev === 'chase' ? 'top' : prev === 'top' ? 'fpv' : 'chase'));
  };

  const handleCollisionImpact = (damage: number) => {
    soundEffects.playCollisionSound();
    setIsImpactShaking(true);
    setTimeout(() => setIsImpactShaking(false), 250);

    setPlayers((prev) => {
      const updated = prev.map((p) => {
        if (p.isSelf) {
          return { ...p, score: p.score + 50, hp: Math.max(0, p.hp - damage) };
        }
        return p;
      });
      return updated.sort((a, b) => b.score - a.score).map((p, idx) => ({ ...p, rank: idx + 1 }));
    });
  };

  const handleGameEvent = (event: { type: 'goal' | 'ringout' | 'crate' | 'lap'; title: string; subtitle: string; scoreAdd: number }) => {
    soundEffects.playGoalSound();
    setBannerEvent({ title: event.title, subtitle: event.subtitle });
    setTimeout(() => setBannerEvent(null), 3500);

    if (event.type === 'goal') {
      if (event.scoreAdd > 0) {
        setFootballScore((prev) => ({ ...prev, player: prev.player + 1 }));
      } else {
        setFootballScore((prev) => ({ ...prev, opponent: prev.opponent + 1 }));
      }
    }

    if (event.scoreAdd !== 0) {
      setPlayers((prev) => {
        const updated = prev.map((p) => {
          if (p.isSelf) {
            return { ...p, score: Math.max(0, p.score + event.scoreAdd) };
          }
          return p;
        });
        return updated.sort((a, b) => b.score - a.score).map((p, idx) => ({ ...p, rank: idx + 1 }));
      });
    }
  };

  const handleSelectGameMode = (mode: ArenaGameMode) => {
    setGameMode(mode);
    soundEffects.playBoostSound();
    const arenaTitles: Record<ArenaGameMode, { title: string; subtitle: string }> = {
      sumo: {
        title: "🥋 ROBOSUMO (YAPON CYBER DOYO)",
        subtitle: "Dohyo tatami doirasidan chiqib ketmang! Raqibni surib chiqaring."
      },
      football: {
        title: "⚽ ROBOFOOTBALL STADIONI",
        subtitle: "Zumrad maysa va darvozalar. To'pni raqib to'riga uring!"
      },
      line: {
        title: "〰️ LINE FOLLOWER R&D CLEANROOM",
        subtitle: "Yuqori texnologiyali laboratoriya. Qora vinil trassada poyga aylanasini yakunlang."
      },
      warehouse: {
        title: "📦 WAREHOUSE FULFILLMENT CENTER",
        subtitle: "Amazon uslubidagi logistika ombori. Qutilarni yashil zonaga yetkazing."
      },
      racing: {
        title: "🏎️ SPEED RACING (NEO-TOKYO KIBER MAGISTRALI)",
        subtitle: "Nam asfalt va nitro boost maydonchalari. Maksimal tezlikka erishing!"
      },
    };
    setBannerEvent(arenaTitles[mode]);
    setTimeout(() => setBannerEvent(null), 3200);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#0b0f19] select-none overflow-y-auto">
      {/* ============================================================== */}
      {/* 3D ARENA VIEWPORT CONTAINER                                    */}
      {/* ============================================================== */}
      <div 
        className={
          isFullscreen
            ? 'fixed inset-0 z-50 w-screen h-screen bg-[#070b14] overflow-hidden'
            : showBottomPanels
              ? 'relative w-full h-[540px] min-h-[460px] shrink-0 border-b border-[#1c2742] overflow-hidden'
              : 'relative w-full flex-1 min-h-[calc(100vh-6.5rem)] overflow-hidden'
        }
      >
        <ArenaCanvas3D
          key={gameMode}
          parts={parts}
          isAutonomous={isAutonomous}
          gameMode={gameMode}
          onUpdateTelemetry={setTelemetry}
          onCollisionImpact={handleCollisionImpact}
          onGameEvent={handleGameEvent}
          cameraMode={cameraMode}
        />

        {/* In-Game HUD: 360° Radar, Game Mode Switcher, Scoreboard, Banner */}
        <ArenaHUD
          telemetry={telemetry}
          players={players}
          cameraMode={cameraMode}
          onCycleCamera={handleCycleCamera}
          isAutonomous={isAutonomous}
          onToggleAutonomous={() => setIsAutonomous(!isAutonomous)}
          isImpactShaking={isImpactShaking}
          gameMode={gameMode}
          onSelectGameMode={handleSelectGameMode}
          bannerEvent={bannerEvent}
          footballScore={footballScore}
        />

        {/* To'liq Ekran rejimida bo'lganda chiqish tugmasi */}
        {isFullscreen && (
          <button
            onClick={() => {
              setIsFullscreen(false);
              soundEffects.playClickSound();
            }}
            className="absolute top-4 right-4 z-40 bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs px-3.5 py-2 rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-md border border-red-400/50 cursor-pointer transition-all"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Kichraytirish (Esc)</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* PANEL TOGGLE & FULLSCREEN CONTROL BAR STRIP                    */}
      {/* ============================================================== */}
      {!isFullscreen && (
        <div className="w-full bg-[#0d1424] border-b border-[#1b263e] px-4 py-2 flex items-center justify-between shrink-0 shadow-md">
          {/* Chap tomon: Panellar ko'rinishi va status */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setShowBottomPanels(!showBottomPanels);
                soundEffects.playClickSound();
              }}
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 hover:text-white bg-[#152038] hover:bg-[#1e2d4d] px-3 py-1.5 rounded-xl border border-[#23355c] transition-all cursor-pointer shadow"
            >
              {showBottomPanels ? (
                <>
                  <ChevronDown className="w-4 h-4 text-amber-400" />
                  <span>Panellarni Yashirish (O'yinni Kengaytirish)</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4 text-emerald-400" />
                  <span>Chat va Musobaqalarni Ochish</span>
                </>
              )}
            </button>

            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                Chat
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Musobaqalar (4)
              </span>
            </div>
          </div>

          {/* O'ng tomon: Haqiqiy 100% To'liq Ekran Tugmasi */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsFullscreen(true);
                soundEffects.playBoostSound();
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-blue-400/40 cursor-pointer transition-all hover:scale-105 active:scale-95"
              title="3D Maydonni butun ekranga ochish (Alt+F)"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-200" />
              <span>To'liq Ekranda O'ynash</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PASTKI PANELLAR: CHAT & REYTING + MUSOBAQALAR & DO'STLAR       */}
      {/* ============================================================== */}
      {!isFullscreen && showBottomPanels && (
        <div className="w-full min-h-[300px] flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-[#1c2742] bg-[#080d1a] overflow-hidden">
          {/* Chap: Chat, Jamoa, Reyting */}
          <div className="flex-1 w-full lg:w-1/2 min-h-[280px] overflow-hidden">
            <ArenaChatPanel />
          </div>

          {/* O'ng: Musobaqalar va Do'stlar */}
          <div className="flex-1 w-full lg:w-1/2 min-h-[280px] overflow-hidden">
            <ArenaCompetitionsPanel />
          </div>
        </div>
      )}
    </div>
  );
};
