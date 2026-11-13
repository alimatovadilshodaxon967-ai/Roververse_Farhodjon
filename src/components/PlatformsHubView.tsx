import React, { useState } from 'react';
import { 
  Wrench, 
  Trophy, 
  ArrowRight,
  Plane
} from 'lucide-react';
import type { ActiveTab } from '../types';

interface PlatformsHubViewProps {
  onSelectPlatform: (tab: ActiveTab, subMode?: 'builder' | 'arena') => void;
}

export const PlatformsHubView: React.FC<PlatformsHubViewProps> = ({
  onSelectPlatform,
}) => {
  const [activeSide, setActiveSide] = useState<'robot' | 'drone' | null>(null);

  return (
    <div className="relative w-full h-screen min-h-[640px] overflow-hidden flex flex-col md:flex-row select-none bg-[#03060d]">
      
      {/* ================= CENTER NEON DIVIDER LINE ================= */}
      <div 
        className={`absolute top-0 bottom-0 z-20 hidden md:block pointer-events-none transition-all duration-700 ease-out ${
          activeSide === 'robot' 
            ? 'left-[56%]' 
            : activeSide === 'drone' 
            ? 'left-[44%]' 
            : 'left-1/2'
        }`}
      >
        <div className="w-[2px] h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(6,182,212,0.9)] opacity-80" />
      </div>

      {/* ================= LEFT PORTAL: ROBOTOTEXNIKA ================= */}
      <div 
        onMouseEnter={() => setActiveSide('robot')}
        onMouseLeave={() => setActiveSide(null)}
        className={`group relative h-1/2 md:h-full transition-all duration-700 ease-out overflow-hidden flex flex-col justify-end ${
          activeSide === 'robot' 
            ? 'md:w-[56%]' 
            : activeSide === 'drone' 
            ? 'md:w-[44%]' 
            : 'md:w-1/2'
        }`}
      >
        {/* Fullscreen Epic Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/robot_banner.jpg" 
            alt="RoboVerse - Robototexnika" 
            className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-1000 ease-out"
          />
          {/* Cinematic Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#02050e] via-[#02050e]/70 md:via-[#02050e]/40 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/50" />
          {/* Active side ambient electric glow */}
          <div className={`absolute inset-0 bg-blue-600/15 mix-blend-screen transition-opacity duration-700 pointer-events-none ${activeSide === 'robot' ? 'opacity-100' : 'opacity-0'}`} />
        </div>

        {/* Bottom Content Area */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-16 max-w-3xl">
          <div className="inline-flex items-center gap-2.5 text-blue-400 text-xs sm:text-sm font-mono font-black tracking-widest uppercase mb-3">
            <span>01. YER USTI JANGOVAR ROBOTLARI</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-wide leading-tight drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
            Robototexnika Platformasi
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-100/90 leading-relaxed font-sans mt-3.5 mb-7 drop-shadow-md">
            3D Konstruktorda o'z jangovar va avtonom robotingizni yig'ing, datchiklar, motorlar va Python kodini sozlang hamda 5 ta xalqaro maydonda (Sumo, Futbol, Poyga, Ombor, Chiziq) g'alaba qozoning.
          </p>

          {/* 2 HIGH-VOLTAGE FUTURISTIC BUTTONS (EXTRA LARGE) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            
            {/* Button 1: Robot Konstruktori */}
            <button
              onClick={() => onSelectPlatform('builder')}
              className="group/btn relative overflow-hidden py-4.5 sm:py-5 px-5 sm:px-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white shadow-[0_12px_40px_rgba(37,99,235,0.6)] hover:shadow-[0_16px_55px_rgba(59,130,246,0.9)] border-t border-blue-300/70 border-b border-blue-900/80 border-x border-blue-500/50 flex items-center justify-between transition-all duration-300 cursor-pointer transform hover:-translate-y-1.5 active:translate-y-0"
            >
              {/* Top Laser Bevel */}
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />
              {/* Internal Sheen on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/15 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none duration-300" />
              
              <div className="flex items-center gap-4 z-10">
                <div className="w-12 h-12 rounded-2xl bg-black/35 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner group-hover/btn:scale-110 group-hover/btn:bg-white group-hover/btn:text-blue-600 transition-all duration-300 flex-shrink-0">
                  <Wrench className="w-6 h-6 group-hover/btn:rotate-12 transition-transform duration-300" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-base sm:text-lg font-black tracking-wide text-white drop-shadow-sm leading-tight">
                    Robot Konstruktori
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-blue-200 tracking-tight mt-0.5">
                    3D Yig'ish & Dasturlash
                  </span>
                </div>
              </div>

              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white z-10 group-hover/btn:translate-x-1.5 group-hover/btn:bg-white group-hover/btn:text-blue-600 transition-all duration-300 shadow-sm flex-shrink-0">
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>

            {/* Button 2: Robo Arenalar */}
            <button
              onClick={() => onSelectPlatform('world')}
              className="group/btn relative overflow-hidden py-4.5 sm:py-5 px-5 sm:px-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-[0_12px_40px_rgba(16,185,129,0.6)] hover:shadow-[0_16px_55px_rgba(16,185,129,0.9)] border-t border-emerald-300/70 border-b border-emerald-900/80 border-x border-emerald-500/50 flex items-center justify-between transition-all duration-300 cursor-pointer transform hover:-translate-y-1.5 active:translate-y-0"
            >
              {/* Top Laser Bevel */}
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />
              {/* Internal Sheen on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/15 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none duration-300" />

              <div className="flex items-center gap-4 z-10">
                <div className="w-12 h-12 rounded-2xl bg-black/35 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner group-hover/btn:scale-110 group-hover/btn:bg-white group-hover/btn:text-emerald-700 transition-all duration-300 flex-shrink-0">
                  <Trophy className="w-6 h-6 group-hover/btn:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-base sm:text-lg font-black tracking-wide text-white drop-shadow-sm leading-tight">
                    Robo Arenalar
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-emerald-200 tracking-tight mt-0.5">
                    5 Ta Jang Maydoni
                  </span>
                </div>
              </div>

              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white z-10 group-hover/btn:translate-x-1.5 group-hover/btn:bg-white group-hover/btn:text-emerald-700 transition-all duration-300 shadow-sm flex-shrink-0">
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ================= RIGHT PORTAL: DRONLAR ================= */}
      <div 
        onMouseEnter={() => setActiveSide('drone')}
        onMouseLeave={() => setActiveSide(null)}
        className={`group relative h-1/2 md:h-full transition-all duration-700 ease-out overflow-hidden flex flex-col justify-end ${
          activeSide === 'drone' 
            ? 'md:w-[56%]' 
            : activeSide === 'robot' 
            ? 'md:w-[44%]' 
            : 'md:w-1/2'
        }`}
      >
        {/* Fullscreen Epic Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/drone_banner.jpg" 
            alt="DroneVerse - FPV Dronlar" 
            className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-1000 ease-out"
          />
          {/* Cinematic Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020712] via-[#020712]/70 md:via-[#020712]/40 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-transparent to-black/50" />
          {/* Active side ambient cyan glow */}
          <div className={`absolute inset-0 bg-cyan-500/15 mix-blend-screen transition-opacity duration-700 pointer-events-none ${activeSide === 'drone' ? 'opacity-100' : 'opacity-0'}`} />
        </div>

        {/* Bottom Content Area */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-16 max-w-3xl">
          <div className="inline-flex items-center gap-2.5 text-cyan-400 text-xs sm:text-sm font-mono font-black tracking-widest uppercase mb-3">
            <span>02. HAVO AVIATSIYASI & TEZYURAR FPV</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-wide leading-tight drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
            Dronlar (DroneVerse) Platformasi
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-100/90 leading-relaxed font-sans mt-3.5 mb-7 drop-shadow-md">
            Tezyurar FPV poyga dronlarini loyihalashtiring, motor, propellor va F7 kontrollerlarini sozlang hamda 5 ta 3D havo maydonida (Neon Halqalar, Kiber Shahar, Yuk Tashish, Havo Nishonlari, Kanyon) parvoz qiling.
          </p>

          {/* 2 HIGH-VOLTAGE FUTURISTIC BUTTONS (EXTRA LARGE) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            
            {/* Button 1: Dron Konstruktori */}
            <button
              onClick={() => onSelectPlatform('drone', 'builder')}
              className="group/btn relative overflow-hidden py-4.5 sm:py-5 px-5 sm:px-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-400 hover:to-sky-500 text-white shadow-[0_12px_40px_rgba(6,182,212,0.6)] hover:shadow-[0_16px_55px_rgba(6,182,212,0.9)] border-t border-cyan-200/80 border-b border-cyan-950/80 border-x border-cyan-400/50 flex items-center justify-between transition-all duration-300 cursor-pointer transform hover:-translate-y-1.5 active:translate-y-0"
            >
              {/* Top Laser Bevel */}
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />
              {/* Internal Sheen on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/15 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none duration-300" />

              <div className="flex items-center gap-4 z-10">
                <div className="w-12 h-12 rounded-2xl bg-black/35 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner group-hover/btn:scale-110 group-hover/btn:bg-white group-hover/btn:text-cyan-700 transition-all duration-300 flex-shrink-0">
                  <Wrench className="w-6 h-6 group-hover/btn:rotate-12 transition-transform duration-300" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-base sm:text-lg font-black tracking-wide text-white drop-shadow-sm leading-tight">
                    Dron Konstruktori
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-cyan-100 tracking-tight mt-0.5">
                    FPV & Aerodinamika
                  </span>
                </div>
              </div>

              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white z-10 group-hover/btn:translate-x-1.5 group-hover/btn:bg-white group-hover/btn:text-cyan-700 transition-all duration-300 shadow-sm flex-shrink-0">
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>

            {/* Button 2: Havo Arenalari */}
            <button
              onClick={() => onSelectPlatform('drone', 'arena')}
              className="group/btn relative overflow-hidden py-4.5 sm:py-5 px-5 sm:px-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-[0_12px_40px_rgba(147,51,234,0.6)] hover:shadow-[0_16px_55px_rgba(147,51,234,0.9)] border-t border-purple-300/80 border-b border-purple-950/80 border-x border-purple-400/50 flex items-center justify-between transition-all duration-300 cursor-pointer transform hover:-translate-y-1.5 active:translate-y-0"
            >
              {/* Top Laser Bevel */}
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />
              {/* Internal Sheen on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/15 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none duration-300" />

              <div className="flex items-center gap-4 z-10">
                <div className="w-12 h-12 rounded-2xl bg-black/35 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner group-hover/btn:scale-110 group-hover/btn:bg-white group-hover/btn:text-purple-700 transition-all duration-300 flex-shrink-0">
                  <Plane className="w-6 h-6 -rotate-45 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform duration-300" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-base sm:text-lg font-black tracking-wide text-white drop-shadow-sm leading-tight">
                    Havo Arenalari
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-purple-200 tracking-tight mt-0.5">
                    5 Ta Parvoz Maydoni
                  </span>
                </div>
              </div>

              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white z-10 group-hover/btn:translate-x-1.5 group-hover/btn:bg-white group-hover/btn:text-purple-700 transition-all duration-300 shadow-sm flex-shrink-0">
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
