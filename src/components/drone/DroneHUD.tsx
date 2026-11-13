import React from 'react';
import { 
  Compass, 
  Gauge, 
  BatteryCharging, 
  Wifi, 
  Camera, 
  RotateCcw,
  Sparkles,
  Plane,
  Navigation,
  Trophy,
  Sliders
} from 'lucide-react';
import type { DroneGameMode, DroneTelemetry, DroneViewMode } from '../../types/drone';

interface DroneHUDProps {
  gameMode: DroneGameMode;
  onSelectGameMode: (mode: DroneGameMode) => void;
  telemetry: DroneTelemetry;
  cameraMode: 'chase' | 'fpv' | 'top';
  onCycleCamera: () => void;
  onResetDrone: () => void;
  viewMode: DroneViewMode;
  onSelectViewMode: (mode: DroneViewMode) => void;
}

export const DroneHUD: React.FC<DroneHUDProps> = ({
  gameMode,
  onSelectGameMode,
  telemetry,
  cameraMode,
  onCycleCamera,
  onResetDrone,
  viewMode,
  onSelectViewMode,
}) => {
  const arenaTabs: { id: DroneGameMode; label: string; icon: string }[] = [
    { id: 'racing', label: '⭕ FPV Poyga (Gates)', icon: '⭕' },
    { id: 'city', label: '🏙️ Kiber Shahar', icon: '🏙️' },
    { id: 'delivery', label: '📦 Yuk Yetkazish', icon: '📦' },
    { id: 'targets', label: '🎯 Havo Nishonlari', icon: '🎯' },
    { id: 'canyon', label: '⛰️ Kanyon Trassasi', icon: '⛰️' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20 select-none">
      {/* TOP BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        {/* Brand & Submode Switcher */}
        <div className="flex items-center space-x-2 bg-[#0d1424]/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-cyan-500/30 shadow-xl shadow-cyan-950/40">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Plane className="w-4 h-4 text-white -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-white tracking-wide">Drone</span>
              <span className="font-black text-sm text-cyan-400 tracking-wide">Verse</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">
                PRO 4S
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-mono -mt-0.5">3D Aerodinamik Havo Simulyatori</p>
          </div>

          <div className="h-6 w-px bg-slate-700/60 mx-1" />

          {/* Builder vs Arena toggle */}
          <div className="flex items-center bg-[#152038] p-0.5 rounded-xl border border-[#23355c]">
            <button
              onClick={() => onSelectViewMode('arena')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'arena'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Navigation className="w-3 h-3" />
              <span>Havo Arenasi</span>
            </button>
            <button
              onClick={() => onSelectViewMode('builder')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'builder'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Dron Sozlamalari</span>
            </button>
          </div>
        </div>

        {/* 5 Havo Arenalari Tabs */}
        {viewMode === 'arena' && (
          <div className="flex items-center space-x-1 bg-[#0d1424]/90 backdrop-blur-md p-1 rounded-2xl border border-[#202f4e] shadow-xl">
            {arenaTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSelectGameMode(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  gameMode === tab.id
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Right Status Badges */}
        <div className="flex items-center space-x-2 bg-[#0d1424]/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-[#202f4e] shadow-xl">
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
            <Wifi className="w-3.5 h-3.5" />
            <span>5.8GHz VTX ({telemetry.rssi}%)</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-[11px] text-amber-300 font-mono font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>Ball: {telemetry.score}</span>
          </div>
        </div>
      </div>

      {/* CENTER HUD: ARTIFICIAL HORIZON & FLIGHT CROSSHAIR (Only in Arena view) */}
      {viewMode === 'arena' && (
        <div className="self-center flex flex-col items-center justify-center my-auto pointer-events-none relative">
          {/* FPV Crosshair / Flight Reticle */}
          <div className="relative w-44 h-44 flex items-center justify-center opacity-85">
            {/* Center target circle */}
            <div className="w-4 h-4 rounded-full border-2 border-cyan-400/80 flex items-center justify-center">
              <div className="w-1 h-1 bg-cyan-300 rounded-full" />
            </div>

            {/* Pitch / Horizon ladder lines */}
            <div 
              className="absolute w-28 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent transition-transform duration-75"
              style={{
                transform: `rotate(${-telemetry.roll}deg) translateY(${Math.min(30, Math.max(-30, telemetry.pitch))}px)`
              }}
            >
              <div className="absolute -left-2 -top-1 w-2 h-2 border-l-2 border-b-2 border-cyan-400" />
              <div className="absolute -right-2 -top-1 w-2 h-2 border-r-2 border-b-2 border-cyan-400" />
            </div>

            {/* Wing indicator bars */}
            <div className="absolute left-1 w-7 h-0.5 bg-cyan-400/90" />
            <div className="absolute right-1 w-7 h-0.5 bg-cyan-400/90" />
            <div className="absolute top-1 w-0.5 h-3 bg-cyan-400/90" />
            <div className="absolute bottom-1 w-0.5 h-3 bg-cyan-400/90" />
          </div>

          {/* Current mission prompt */}
          <div className="mt-2 bg-[#091122]/80 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-500/40 text-[11px] font-mono text-cyan-300 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-amber-300" />
            {gameMode === 'racing' && <span>Neon Halqalar (Gates): {telemetry.gatesPassed} / 8 o'tildi</span>}
            {gameMode === 'city' && <span>Shahar osmonida erkin akrobatik FPV parvoz</span>}
            {gameMode === 'delivery' && <span>Maxsus qo'nish maydonchalariga yuk yetkazish</span>}
            {gameMode === 'targets' && <span>Havo nishonlari zonasiga yaqinlashing</span>}
            {gameMode === 'canyon' && <span>Kanyon daralari orqali tezkor uchish</span>}
          </div>
        </div>
      )}

      {/* BOTTOM CONTROLS & FLIGHT INSTRUMENT PANELS */}
      <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-3 pointer-events-auto">
        {/* Left Flight Metrics (Altimeter, Speed, VSI) */}
        {viewMode === 'arena' && (
          <div className="bg-[#0d1424]/90 backdrop-blur-md p-3 rounded-2xl border border-cyan-500/30 shadow-xl flex items-center gap-4 text-xs font-mono">
            {/* Altitude Barometer */}
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" /> Balandlik (ALT)
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-black text-cyan-300">{telemetry.altitude.toFixed(1)}</span>
                <span className="text-[10px] text-slate-400 font-bold">m</span>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-700/60" />

            {/* Airspeed */}
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Gauge className="w-3 h-3 text-blue-400" /> Tezlik (SPD)
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-black text-white">{telemetry.speed.toFixed(0)}</span>
                <span className="text-[10px] text-slate-400 font-bold">km/s</span>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-700/60" />

            {/* Battery 4S LiPo */}
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <BatteryCharging className="w-3 h-3 text-emerald-400" /> LiPo 4S
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-xl font-black ${telemetry.battery < 25 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  {telemetry.battery.toFixed(0)}%
                </span>
                <span className="text-[10px] text-slate-400 font-bold">14.8V</span>
              </div>
            </div>
          </div>
        )}

        {/* Center: Flight Keyboard Controls Hint */}
        <div className="bg-[#0d1424]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#202f4e] shadow-xl flex flex-wrap items-center gap-3 text-xs text-slate-300 font-sans">
          <div className="flex items-center space-x-1 font-mono font-bold text-white">
            <span className="bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-700/50">W</span>
            <span className="bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-700/50">A</span>
            <span className="bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-700/50">S</span>
            <span className="bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-700/50">D</span>
            <span className="text-[11px] font-normal text-slate-400 ml-1.5">Oldinga / Orqaga / Chap / O'ng</span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center space-x-1 font-mono font-bold">
            <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700">Space</span>
            <span className="text-[11px] text-amber-300 font-medium">Ko'tarilish (Yuqoriga)</span>
            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 ml-1">Shift</span>
            <span className="text-[11px] text-slate-400 font-medium">Pastlash</span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center space-x-1 font-mono font-bold">
            <span className="bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded border border-slate-700">Q</span>
            <span className="bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded border border-slate-700">E</span>
            <span className="text-[11px] text-slate-400 font-medium">Burilish (Yaw)</span>
          </div>

          <span className="text-slate-700">|</span>

          <button
            onClick={onCycleCamera}
            className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors cursor-pointer bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700"
            title="FPV va Orqa kamera ko'rinishini almashtirish"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold uppercase">{cameraMode} Kamera</span>
          </button>

          <button
            onClick={onResetDrone}
            className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 cursor-pointer"
            title="Dronni start nuqtasiga qaytarish"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>

        {/* Right Motor RPM Status */}
        {viewMode === 'arena' && (
          <div className="hidden xl:flex items-center space-x-2 bg-[#0d1424]/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-cyan-500/30 shadow-xl">
            {[0, 1, 2, 3].map((mIdx) => (
              <div key={mIdx} className="flex flex-col items-center">
                <span className="text-[9px] text-slate-400 font-mono">M{mIdx + 1}</span>
                <div className="w-2 bg-slate-800 h-8 rounded-full overflow-hidden flex flex-col justify-end mt-0.5 border border-slate-700">
                  <div 
                    className="w-full bg-cyan-400 rounded-full transition-all duration-75"
                    style={{ height: `${telemetry.motorRpm[mIdx]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
