import React, { useState } from 'react';
import { 
  Home, 
  Wrench, 
  Globe, 
  Trophy, 
  Users, 
  Bell, 
  Bot,
  Plane,
  Volume2,
  VolumeX,
  Navigation
} from 'lucide-react';
import type { ActiveTab } from '../types';
import type { DroneViewMode } from '../types/drone';
import { soundEffects } from '../utils/audioEffects';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  platform: 'robot' | 'drone';
  droneSubMode: DroneViewMode;
  onSelectDroneSubMode: (mode: DroneViewMode) => void;
  onSwitchPlatform: (platform: 'robot' | 'drone') => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  onSelectTab,
  platform,
  droneSubMode,
  onSelectDroneSubMode,
  onSwitchPlatform
}) => {
  const [isMuted, setIsMuted] = useState(soundEffects.getIsMuted());

  const handleToggleSound = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
  };

  const handleNavClick = (tab: ActiveTab) => {
    soundEffects.playClickSound();
    onSelectTab(tab);
  };

  const isRobot = platform === 'robot';

  return (
    <header className="h-14 bg-[#0d121f] border-b border-[#1c2438] px-4 flex items-center justify-between select-none z-30 sticky top-0">
      {/* Left: Brand Logo (Robototexnika vs Dronlar) */}
      <div 
        className="flex items-center space-x-3 cursor-pointer" 
        onClick={() => {
          if (isRobot) handleNavClick('builder');
          else onSelectDroneSubMode('builder');
        }}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg border ${
          isRobot 
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30 border-blue-400/40' 
            : 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30 border-cyan-400/40'
        }`}>
          {isRobot ? (
            <Bot className="w-5 h-5 text-white" />
          ) : (
            <Plane className="w-5 h-5 text-white -rotate-45" />
          )}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center space-x-1">
            <span className="font-extrabold text-lg tracking-wider text-white">
              {isRobot ? 'Robo' : 'Drone'}
            </span>
            <span className={`font-extrabold text-lg tracking-wider ${isRobot ? 'text-blue-400' : 'text-cyan-400'}`}>
              Verse
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium tracking-tight -mt-1 font-mono">
            {isRobot ? 'Yer Usti Robototexnikasi' : 'Havo Dronlari & FPV'}
          </span>
        </div>
      </div>

      {/* Center: Context-Aware Navigation Tabs */}
      <nav className="flex items-center space-x-1 bg-[#131b2e]/90 p-1 rounded-xl border border-[#222e4c]">
        {/* Universal Home Button (Always available to return to Hub) */}
        <button
          onClick={() => handleNavClick('home')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
          title="Bosh sahifa (Platformalar tanlovi)"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>

        {isRobot ? (
          /* ======================================================== */
          /* 🤖 ROBOTOTEXNIKA MENYUSI (FAQAT ROBOTLARGA OID)         */
          /* ======================================================== */
          <>
            <button
              onClick={() => handleNavClick('builder')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'builder'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Robot Builder</span>
            </button>

            <button
              onClick={() => handleNavClick('world')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'world'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Robo World</span>
            </button>

            <button
              onClick={() => handleNavClick('competitions')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'competitions'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Turnirlar</span>
            </button>

            <button
              onClick={() => handleNavClick('friends')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'friends'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Do'stlar</span>
            </button>

            <div className="h-5 w-px bg-slate-700/60 mx-1" />

            <button
              onClick={() => onSwitchPlatform('drone')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/40 border border-cyan-500/30 transition-all cursor-pointer ml-1"
              title="Dronlar platformasiga o'tish"
            >
              <Plane className="w-3.5 h-3.5 -rotate-45" />
              <span>🛸 Dronlarga o'tish →</span>
            </button>
          </>
        ) : (
          /* ======================================================== */
          /* 🛸 DRONLAR MENYUSI (FAQAT DRONLARGA OID)                 */
          /* ======================================================== */
          <>
            <button
              onClick={() => {
                onSelectDroneSubMode('builder');
                handleNavClick('drone');
              }}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'drone' && droneSubMode === 'builder'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-cyan-300" />
              <span>Dron Builder</span>
            </button>

            <button
              onClick={() => {
                onSelectDroneSubMode('arena');
                handleNavClick('drone');
              }}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'drone' && droneSubMode === 'arena'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-300" />
              <span>Havo Arenasi</span>
            </button>

            <button
              onClick={() => alert("Dronlar FPV Poyga Ligasi: Navbatdagi havoda poyga turniri soat 20:00 da!")}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Dron Turnirlari</span>
            </button>

            <button
              onClick={() => alert("Dron Pilotlari: 14 ta pilot onlayn")}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pilotlar</span>
            </button>

            <div className="h-5 w-px bg-slate-700/60 mx-1" />

            <button
              onClick={() => onSwitchPlatform('robot')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-400 hover:text-blue-200 hover:bg-blue-950/40 border border-blue-500/30 transition-all cursor-pointer ml-1"
              title="Robototexnika platformasiga o'tish"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>🤖 Robotlarga o'tish →</span>
            </button>
          </>
        )}
      </nav>

      {/* Right: Audio Toggle, Notifications & Profile */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={handleToggleSound}
          className="p-2 rounded-lg bg-[#141d33] hover:bg-[#1c2847] text-slate-300 hover:text-white transition-colors border border-[#233154] cursor-pointer"
          title={isMuted ? 'Ovozni yoqish' : 'Ovozni o\'chirish'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        <button 
          onClick={() => alert(isRobot ? "Bildirishnomalar: RoboSumo turniri 18:00 da boshlanadi!" : "Bildirishnomalar: FPV Drone Racing Finali 20:00 da!")}
          className="relative p-2 rounded-lg bg-[#141d33] hover:bg-[#1c2847] text-slate-300 hover:text-white transition-colors border border-[#233154] cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-[#0d121f] ${isRobot ? 'bg-blue-500' : 'bg-cyan-400'}`}></span>
        </button>

        <div className="flex items-center space-x-2 pl-2 border-l border-[#222e4c]">
          <div className="relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 shadow-sm ${
              isRobot 
                ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 ring-blue-500/40' 
                : 'bg-gradient-to-tr from-emerald-500 to-cyan-600 ring-cyan-500/40'
            }`}>
              F
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0d121f]"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white leading-tight">Farhodjon</span>
            <div className="flex items-center">
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                isRobot 
                  ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' 
                  : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
              }`}>
                {isRobot ? 'Pro Robotik' : 'Pro Pilot'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
