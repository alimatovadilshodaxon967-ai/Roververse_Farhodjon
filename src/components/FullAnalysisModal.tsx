import React from 'react';
import { 
  X, 
  Activity, 
  Battery, 
  Zap, 
  ShieldCheck, 
  Gauge, 
  Cpu
} from 'lucide-react';
import type { RobotConfig } from '../types';

interface FullAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  robotConfig: RobotConfig;
}

export const FullAnalysisModal: React.FC<FullAnalysisModalProps> = ({
  isOpen,
  onClose,
  robotConfig,
}) => {
  if (!isOpen) return null;

  const weight = robotConfig.weight;
  const powerW = Math.round(weight * 140 * (robotConfig.batteryVoltage / 7.4));
  const powerToWeight = Math.round(powerW / weight);
  const topSpeedKmh = (robotConfig.metrics.speed * 2.8).toFixed(1);
  const estRuntimeMin = Math.round((2200 / (powerW * 0.12)) * (robotConfig.batteryVoltage / 7.4) * 0.8);
  const cogHeightCm = (3.2 + (weight > 1.2 ? 0.8 : 0)).toFixed(1);
  const sensorLatencyMs = Math.max(5, Math.round(35 - robotConfig.metrics.handling * 2.5));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-xl bg-[#0f1728] border border-[#23355c] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="h-14 px-6 bg-[#131d33] border-b border-[#223154] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Robotning To'liq Muhandislik Tahlili</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {robotConfig.name} • {robotConfig.type} • Telemetriya & Hisoblar
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

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Top 3 Core Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#152038] border border-[#23355c] p-3 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400 mb-1">Tezlik Ko'rsatkichi</div>
              <div className="text-2xl font-black text-blue-400 font-mono">
                {robotConfig.metrics.speed}
                <span className="text-xs font-normal text-slate-500">/10</span>
              </div>
              <div className="text-[10px] text-emerald-400 mt-1">~{topSpeedKmh} km/soat</div>
            </div>

            <div className="bg-[#152038] border border-[#23355c] p-3 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400 mb-1">Barqarorlik</div>
              <div className="text-2xl font-black text-cyan-400 font-mono">
                {robotConfig.metrics.stability}
                <span className="text-xs font-normal text-slate-500">/10</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">COG: {cogHeightCm} sm</div>
            </div>

            <div className="bg-[#152038] border border-[#23355c] p-3 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400 mb-1">Boshqaruv & Reaksiya</div>
              <div className="text-2xl font-black text-indigo-400 font-mono">
                {robotConfig.metrics.handling}
                <span className="text-xs font-normal text-slate-500">/10</span>
              </div>
              <div className="text-[10px] text-blue-400 mt-1">{sensorLatencyMs} ms kechikish</div>
            </div>
          </div>

          {/* Technical Engineering Specifications */}
          <div className="bg-[#121a2d] border border-[#1e2a47] rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span>Dinamik va Fizik Ko'rsatkichlar</span>
            </h4>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Quvvat / Og'irlik:
                </span>
                <span className="text-white font-bold">{powerToWeight} W/kg</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  Akkumulyator muddati:
                </span>
                <span className="text-emerald-400 font-bold">~{estRuntimeMin} daqiqa</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Og'irlik Markazi (COG):
                </span>
                <span className="text-cyan-300 font-bold">{cogHeightCm} sm (Past)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  Maksimal Kuchlanish:
                </span>
                <span className="text-amber-300 font-bold">{robotConfig.batteryVoltage} V DC</span>
              </div>
            </div>
          </div>

          {/* Verdict Box */}
          <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-start space-x-3 text-xs">
            <span className="text-lg">💡</span>
            <div>
              <span className="font-bold text-blue-300 block mb-0.5">Muhandislik xulosasi:</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Ushbu konfiguratsiya ({robotConfig.type}) baland barqarorlik va yuqori boshqaruv aniqligiga ega. 
                {robotConfig.weight < 1.3 
                  ? " Og'irlik me'yorida, burilishlarda sirpanish xavfi past." 
                  : " Og'irlik ortgani sabab to'qnashuvlarda mustahkam, ammo tormozlanish masofasi biroz oshgan."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 px-6 bg-[#0c1220] border-t border-[#1c2740] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all"
          >
            Tushundim (Yopish)
          </button>
        </div>
      </div>
    </div>
  );
};
