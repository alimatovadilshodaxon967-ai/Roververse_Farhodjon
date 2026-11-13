import React from 'react';
import { X, Shield, Cpu, Award } from 'lucide-react';
import type { ArenaPlayer } from '../../types/arena';

interface OpponentProfileModalProps {
  player: ArenaPlayer | null;
  onClose: () => void;
}

export const OpponentProfileModal: React.FC<OpponentProfileModalProps> = ({ player, onClose }) => {
  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-md bg-[#0f1728] border border-[#22355c] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="h-14 px-5 bg-[#131d33] border-b border-[#223154] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
              style={{ backgroundColor: player.color }}
            >
              {player.name[0]}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{player.name}</span>
                {player.rank === 1 && (
                  <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 rounded font-mono">
                    👑 1st MVP
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Server: Toshkent-Central • Ping: {player.ping} ms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs font-mono">
          {/* Match Score & Rank */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-[#141f36] border border-[#23355c] text-center">
              <div className="text-[11px] text-slate-400">Joriy Ochko</div>
              <div className="text-xl font-black text-blue-400 mt-0.5">{player.score} PTS</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#141f36] border border-[#23355c] text-center">
              <div className="text-[11px] text-slate-400">Arenadagi O'rni</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">#{player.rank} / 8</div>
            </div>
          </div>

          {/* Opponent Robot Specs */}
          <div className="p-3.5 rounded-2xl bg-[#11192c] border border-[#1d2c49] space-y-2">
            <div className="text-[11px] font-bold text-white flex items-center gap-1.5 pb-1.5 border-b border-slate-800">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Robot Arxitekturasi</span>
            </div>

            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Korpus:</span>
              <span className="text-white font-semibold">{player.name === 'ShadowX' ? 'Titan Heavy Armor' : 'Speed Racer Alloy'}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Motor:</span>
              <span className="text-amber-300 font-semibold">Dual DC 12V High-Torque</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Sensorlar:</span>
              <span className="text-cyan-300">HC-SR04 + 360° LiDAR</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Akkumulyator:</span>
              <span className="text-emerald-300">Li-Po 11.1V 3S</span>
            </div>
          </div>

          {/* Combat Stats */}
          <div className="p-3 rounded-2xl bg-[#131d33] border border-[#203052] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" /> Qolgan HP:
              </span>
              <span className="text-emerald-400 font-bold">{player.hp}%</span>
            </div>
            <div className="w-full bg-[#1b2742] h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${player.hp}%` }}></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 px-5 bg-[#0c1220] border-t border-[#1c2740] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-blue-400" />
            RoboVerse Matchmaking
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
