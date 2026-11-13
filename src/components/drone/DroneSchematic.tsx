import React, { useState } from 'react';
import { 
  Zap, 
  Cpu, 
  Battery, 
  Camera, 
  Radio, 
  Layers, 
  Trash2,
  Plane
} from 'lucide-react';
import type { WireConnection } from '../../types';

interface DroneSchematicProps {
  hasCamera?: boolean;
  hasGps?: boolean;
}

export const DroneSchematic: React.FC<DroneSchematicProps> = () => {
  const [selectedWire, setSelectedWire] = useState<string | null>(null);
  const [isTestPowerOn, setIsTestPowerOn] = useState<boolean>(true);

  const initialWires: WireConnection[] = [
    {
      id: 'w-lipo-esc',
      fromComponent: '4S LiPo 14.8V',
      fromPin: 'XT60 (+)',
      toComponent: '4-in-1 50A ESC',
      toPin: 'BAT (+)',
      color: '#ef4444',
      voltage: '14.8V DC',
      status: 'connected',
      label: '14.8V Asosiy Quvvat Liniyasi',
    },
    {
      id: 'w-lipo-gnd',
      fromComponent: '4S LiPo 14.8V',
      fromPin: 'XT60 (-)',
      toComponent: '4-in-1 50A ESC',
      toPin: 'GND',
      color: '#0f172a',
      voltage: '0V (GND)',
      status: 'connected',
      label: 'Umumiy Yer (Ground)',
    },
    {
      id: 'w-esc-fc-bec',
      fromComponent: '4-in-1 50A ESC',
      fromPin: '5V BEC Out',
      toComponent: 'SpeedyBee F7 FC',
      toPin: '5V In',
      color: '#f59e0b',
      voltage: '5.0V Regulated',
      status: 'connected',
      label: 'FC 5V Regulyator Quvvati',
    },
    {
      id: 'w-esc-fc-pwm',
      fromComponent: 'SpeedyBee F7 FC',
      fromPin: 'Motor Signals (M1-M4)',
      toComponent: '4-in-1 50A ESC',
      toPin: 'DShot600 In',
      color: '#06b6d4',
      voltage: 'Digital PWM',
      status: 'connected',
      label: 'DShot600 Yuqori Tezlikli Signal',
    },
    {
      id: 'w-fc-m1',
      fromComponent: '4-in-1 50A ESC',
      fromPin: 'M1 Out (A, B, C)',
      toComponent: 'Motor 1 (2400KV)',
      toPin: 'Phase Wires',
      color: '#3b82f6',
      voltage: '3-Phase AC',
      status: 'connected',
      label: 'Motor 1 3-Fazali Quvvat',
    },
    {
      id: 'w-fc-m2',
      fromComponent: '4-in-1 50A ESC',
      fromPin: 'M2 Out (A, B, C)',
      toComponent: 'Motor 2 (2400KV)',
      toPin: 'Phase Wires',
      color: '#3b82f6',
      voltage: '3-Phase AC',
      status: 'connected',
      label: 'Motor 2 3-Fazali Quvvat',
    },
    {
      id: 'w-cam-vtx',
      fromComponent: 'Caddx FPV Camera',
      fromPin: 'Video Signal Out',
      toComponent: 'SpeedyBee F7 FC',
      toPin: 'CAM (OSD In)',
      color: '#eab308',
      voltage: '1Vp-p NTSC',
      status: 'connected',
      label: 'Analog Video + Betaflight OSD',
    },
  ];

  const [wires, setWires] = useState<WireConnection[]>(initialWires);

  const handleDeleteWire = (id: string) => {
    setWires(prev => prev.filter(w => w.id !== id));
    if (selectedWire === id) setSelectedWire(null);
  };

  return (
    <div className="w-full h-full bg-[#080d19] flex flex-col p-4 select-none overflow-y-auto">
      {/* Top Banner & Schematic Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-[#0f172a]/90 backdrop-blur-md p-3.5 rounded-2xl border border-cyan-500/30">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-600/30">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Quadcopter Parvoz Kontrolleri & ESC 2D Sxemasi</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">
                Betaflight 4.5 Standard
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Elektron plata simlari, DShot600 protokoli va kuchlanish zanjirlari
            </p>
          </div>
        </div>

        {/* Live Power Simulation Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsTestPowerOn(!isTestPowerOn)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
              isTestPowerOn
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isTestPowerOn ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>{isTestPowerOn ? '14.8V Quvvat Yoqilgan (Live)' : 'Quvvat O\'chirilgan'}</span>
          </button>
        </div>
      </div>

      {/* Schematic Canvas Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
        {/* Left Column: Power & ESC */}
        <div className="space-y-4">
          {/* LiPo Battery Block */}
          <div className="bg-[#0f182c] border border-amber-500/40 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Battery className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white">4S LiPo Akkumulyator</h4>
              </div>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                14.8V 130C
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded-lg border border-red-500/30">
                <span className="text-red-400 font-bold">XT60 (+) Red</span>
                <span className="text-white">+14.8V VCC</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded-lg border border-slate-700">
                <span className="text-slate-400 font-bold">XT60 (-) Black</span>
                <span className="text-slate-400">0V GND</span>
              </div>
            </div>
          </div>

          {/* 4-in-1 ESC Board */}
          <div className="bg-[#0f182c] border border-cyan-500/40 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">4-in-1 50A ESC Platasidir</h4>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                BLHeli_32
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded-lg">
                <span className="text-cyan-400">DShot600 Input</span>
                <span className="text-slate-300">FC Signal</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded-lg">
                <span className="text-amber-400">5V / 2A BEC Out</span>
                <span className="text-slate-300">FC Power</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                <div className="p-1.5 bg-blue-950/40 border border-blue-500/30 rounded text-center text-blue-300">
                  M1 Front-Right
                </div>
                <div className="p-1.5 bg-blue-950/40 border border-blue-500/30 rounded text-center text-blue-300">
                  M2 Front-Left
                </div>
                <div className="p-1.5 bg-blue-950/40 border border-blue-500/30 rounded text-center text-blue-300">
                  M3 Rear-Left
                </div>
                <div className="p-1.5 bg-blue-950/40 border border-blue-500/30 rounded text-center text-blue-300">
                  M4 Rear-Right
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Central Flight Controller (FC) */}
        <div className="space-y-4">
          <div className="bg-[#0f1c36] border-2 border-cyan-500 rounded-3xl p-5 shadow-2xl shadow-cyan-950/60 relative">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-500/30">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-black text-white">SpeedyBee F7 V3 FC</h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                MCU: STM32F722
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-2 bg-slate-900/80 rounded-xl border border-cyan-500/30 flex justify-between">
                <span className="text-slate-400 font-bold">Giro / Akselerometr:</span>
                <span className="text-cyan-300">BMI270 (8KHz Sync)</span>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-xl border border-cyan-500/30 flex justify-between">
                <span className="text-slate-400 font-bold">Barometr (Balandlik):</span>
                <span className="text-cyan-300">BMP280 (±10cm)</span>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-xl border border-cyan-500/30 flex justify-between">
                <span className="text-slate-400 font-bold">OSD Chip:</span>
                <span className="text-cyan-300">AT7456E HD OSD</span>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-xl border border-cyan-500/30 flex justify-between">
                <span className="text-slate-400 font-bold">Qora Quti (Blackbox):</span>
                <span className="text-cyan-300">512MB Flash</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              Dronning miyasi: parvoz barqarorligi, PID hisob-kitoblari va barcha sensorlar markazi.
            </div>
          </div>

          {/* Active Wires List */}
          <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-4">
            <h5 className="text-xs font-bold text-white mb-2 flex items-center justify-between">
              <span>Ulanish Liniyalari ({wires.length})</span>
              <span className="text-[10px] text-cyan-400 font-mono">100% Sinxron</span>
            </h5>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {wires.map((wire) => (
                <div
                  key={wire.id}
                  onClick={() => setSelectedWire(wire.id)}
                  className={`p-2 rounded-xl border text-[11px] flex items-center justify-between transition-all cursor-pointer ${
                    selectedWire === wire.id
                      ? 'bg-cyan-950/60 border-cyan-400 text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: wire.color }}
                    />
                    <span className="font-semibold">{wire.label}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteWire(wire.id); }}
                    className="p-1 hover:text-red-400 text-slate-500"
                    title="Ulanishni uzish"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Peripherals (FPV, Receiver, GPS, Motors) */}
        <div className="space-y-4">
          {/* FPV Video Module */}
          <div className="bg-[#0f182c] border border-rose-500/40 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold text-white">FPV Kamera & 5.8G VTX</h4>
              </div>
              <span className="text-[10px] font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 font-bold">
                800mW Video
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded-lg">
                <span className="text-rose-400">Kamera Rezolyutsiya:</span>
                <span className="text-white">1200TVL 165°</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded-lg">
                <span className="text-cyan-400">VTX Chastota:</span>
                <span className="text-white">5.8GHz 48CH</span>
              </div>
            </div>
          </div>

          {/* Receiver / Radio */}
          <div className="bg-[#0f182c] border border-blue-500/40 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold text-white">ELRS 2.4GHz Qabul Qiluvchi</h4>
              </div>
              <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30 font-bold">
                1000Hz Paket
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded-lg">
                <span className="text-slate-400">Protokol:</span>
                <span className="text-white">CRSF Serial UART</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded-lg">
                <span className="text-emerald-400">Kechikish (Latency):</span>
                <span className="text-emerald-300 font-bold">1.2ms Ultra-Past</span>
              </div>
            </div>
          </div>

          {/* 4 Motors Summary */}
          <div className="bg-[#0f182c] border border-cyan-500/40 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-cyan-400 -rotate-45" />
                <h4 className="text-xs font-bold text-white">4x EMAX RS2306 Motorlar</h4>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                2400KV
              </span>
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed font-mono">
              Har bir motor 1050g gacha tortish kuchi beradi (Jami: 4.2 kg tortish kuchi).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
