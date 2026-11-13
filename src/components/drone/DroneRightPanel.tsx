import React from 'react';
import { 
  X, 
  Sparkles, 
  Zap, 
  Gauge, 
  Battery, 
  Check, 
  Plane,
  Radio
} from 'lucide-react';
import type { DroneConfig, DronePart } from '../../types/drone';

interface DroneRightPanelProps {
  droneConfig: DroneConfig;
  onUpdateDroneName: (name: string) => void;
  onUpdateDroneType: (type: DroneConfig['type']) => void;
  onApplyAiRecommendation: () => void;
  parts: DronePart[];
  liveAltitude: number;
  isSimulating: boolean;
  onClose: () => void;
}

export const DroneRightPanel: React.FC<DroneRightPanelProps> = ({
  droneConfig,
  onUpdateDroneName,
  onUpdateDroneType,
  onApplyAiRecommendation,
  parts,
  liveAltitude,
  isSimulating,
  onClose,
}) => {
  const activeParts = parts.filter(p => p.enabled);
  const totalWeightG = activeParts.reduce((sum, p) => sum + p.weightG, 0);
  const thrustKg = 4.2;
  const thrustToWeight = ((thrustKg * 1000) / Math.max(100, totalWeightG)).toFixed(1);
  const estimatedFlightTime = (12.5 - (totalWeightG / 100)).toFixed(1);
  const topSpeedKm = Math.round(140 - (totalWeightG * 0.08));

  return (
    <aside className="w-80 bg-[#0d121f] border-l border-[#1c2438] flex flex-col justify-between h-[calc(100vh-3.5rem)] select-none z-20">
      {/* Top Header */}
      <div className="p-4 border-b border-[#1c2438] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Plane className="w-4 h-4 -rotate-45" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide">Dron Ma'lumotlari</h3>
            <span className="text-[10px] text-slate-400 font-mono">Aerodinamika & Telemetriya</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Yopish"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Body */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        {/* Drone Name Input */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block mb-1">
            Dron Nomi
          </label>
          <input
            type="text"
            value={droneConfig.name}
            onChange={(e) => onUpdateDroneName(e.target.value)}
            className="w-full bg-[#131b2e] border border-[#233354] rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Drone Class Selection */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block mb-1">
            Dron Sinfi & Modifikatsiyasi
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'racing', label: 'FPV Racing' },
              { id: 'cinematic', label: 'CineWhoop' },
              { id: 'delivery', label: 'Smart Delivery' },
              { id: 'custom', label: 'Eksperimental' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => onUpdateDroneType(type.id as DroneConfig['type'])}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  droneConfig.type === type.id
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30'
                    : 'bg-[#131b2e] text-slate-400 border-[#233354] hover:text-white'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Flight Telemetry Status */}
        <div className="bg-[#121c32] p-3 rounded-2xl border border-cyan-500/30 space-y-2 font-mono">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400" /> Parvoz Holati:
            </span>
            <span className={`font-bold ${isSimulating ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`}>
              {isSimulating ? 'Havoda (Flying)' : 'Qo\'ngan (Landed)'}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Jonli Balandlik:</span>
            <span className="text-cyan-300 font-bold">{liveAltitude.toFixed(1)} metr</span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Umumiy Vazn (AUW):</span>
            <span className="text-white font-bold">{totalWeightG} gramm</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="space-y-3">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
            Hisoblangan Parametrlar
          </span>

          {/* Thrust to weight */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Tortish/Vazn (T/W)
              </span>
              <span className="text-amber-300 font-bold">{thrustToWeight} : 1</span>
            </div>
            <div className="w-full bg-[#172238] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (Number(thrustToWeight) / 10) * 100)}%` }}
              />
            </div>
          </div>

          {/* Speed */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-blue-400" /> Maksimal Tezlik
              </span>
              <span className="text-blue-300 font-bold">{topSpeedKm} km/s</span>
            </div>
            <div className="w-full bg-[#172238] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (topSpeedKm / 160) * 100)}%` }}
              />
            </div>
          </div>

          {/* Flight Time */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300 flex items-center gap-1">
                <Battery className="w-3 h-3 text-emerald-400" /> Parvoz Davomiyligi
              </span>
              <span className="text-emerald-400 font-bold">{estimatedFlightTime} min</span>
            </div>
            <div className="w-full bg-[#172238] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (Number(estimatedFlightTime) / 20) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-gradient-to-br from-[#111f3d] to-[#0c1628] p-3.5 rounded-2xl border border-cyan-500/40 shadow-lg">
          <div className="flex items-center space-x-2 text-cyan-300 mb-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold">AI Aerodinamika Maslahati</h4>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans mb-3">
            {totalWeightG < 450 
              ? "Vazn va motor quvvati ajoyib muvozanatda. 2400KV motorlar poyga uchun maksimal tezlikni ta'minlaydi." 
              : "Vazn biroz yuqori. Akkumulyatorni 6S ga almashtirish yoki yengilroq parraklardan foydalanish tavsiya etiladi."}
          </p>
          <button
            onClick={onApplyAiRecommendation}
            className="w-full py-1.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>AI Sozlamalarini Qo'llash</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
