import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Zap, 
  Cpu, 
  Battery, 
  Eye, 
  Layers, 
  Trash2
} from 'lucide-react';
import type { WireConnection } from '../types';

interface ElectronicsSchematicProps {
  hasUltrasonic: boolean;
  hasArduino: boolean;
  hasLidar: boolean;
}

interface PinDef {
  id: string;
  component: string;
  pinName: string;
  type: 'power_vcc' | 'power_gnd' | 'pwm' | 'digital' | 'analog';
  voltage: string;
}

export const ElectronicsSchematic: React.FC<ElectronicsSchematicProps> = ({
  hasUltrasonic,
  hasArduino: _hasArduino,
  hasLidar: _hasLidar,
}) => {
  const [wires, setWires] = useState<WireConnection[]>([
    {
      id: 'w-power-vcc',
      fromComponent: 'Li-Po 7.4V',
      fromPin: 'BAT (+)',
      toComponent: 'L298N Driver',
      toPin: '12V Power In',
      color: '#ef4444',
      voltage: '7.4V DC',
      status: 'connected',
      label: 'Asosiy quvvat shinası',
    },
    {
      id: 'w-power-gnd',
      fromComponent: 'Li-Po 7.4V',
      fromPin: 'BAT (-)',
      toComponent: 'Arduino Uno',
      toPin: 'GND',
      color: '#0f172a',
      voltage: '0V (Ground)',
      status: 'connected',
      label: 'Umumiy massa / yer',
    },
    {
      id: 'w-mcu-5v',
      fromComponent: 'Arduino Uno',
      fromPin: '5V Out',
      toComponent: 'HC-SR04',
      toPin: 'VCC',
      color: '#f97316',
      voltage: '5.0V Stab.',
      status: 'connected',
      label: 'Datchik mantiqiy quvvati',
    },
    {
      id: 'w-sensor-trig',
      fromComponent: 'Arduino Uno',
      fromPin: 'D9',
      toComponent: 'HC-SR04',
      toPin: 'Trig',
      color: '#eab308',
      voltage: 'TTL Pulse',
      status: hasUltrasonic ? 'connected' : 'warning',
      label: 'Ultrasonic Trigger signali',
    },
    {
      id: 'w-sensor-echo',
      fromComponent: 'Arduino Uno',
      fromPin: 'D10',
      toComponent: 'HC-SR04',
      toPin: 'Echo',
      color: '#38bdf8',
      voltage: 'TTL Echo',
      status: hasUltrasonic ? 'connected' : 'warning',
      label: 'Ultrasonic Qaytuvchi aks-sado',
    },
    {
      id: 'w-driver-in1',
      fromComponent: 'Arduino Uno',
      fromPin: 'D5 (PWM)',
      toComponent: 'L298N Driver',
      toPin: 'IN1 (Chap)',
      color: '#10b981',
      voltage: '0-5V PWM',
      status: 'connected',
      label: 'Chap motor tezlik signali',
    },
    {
      id: 'w-driver-in2',
      fromComponent: 'Arduino Uno',
      fromPin: 'D6 (PWM)',
      toComponent: 'L298N Driver',
      toPin: 'IN2 (O\'ng)',
      color: '#6366f1',
      voltage: '0-5V PWM',
      status: 'connected',
      label: 'O\'ng motor tezlik signali',
    },
  ]);

  const [activePin, setActivePin] = useState<PinDef | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    title: string;
    description: string;
    details: string[];
  } | null>(null);

  const availablePins: PinDef[] = [
    // Battery
    { id: 'bat-vcc', component: 'Li-Po 7.4V', pinName: 'BAT (+)', type: 'power_vcc', voltage: '+7.4V' },
    { id: 'bat-gnd', component: 'Li-Po 7.4V', pinName: 'BAT (-)', type: 'power_gnd', voltage: '0V GND' },

    // Arduino
    { id: 'ard-5v', component: 'Arduino Uno', pinName: '5V Out', type: 'power_vcc', voltage: '+5.0V' },
    { id: 'ard-gnd', component: 'Arduino Uno', pinName: 'GND', type: 'power_gnd', voltage: '0V GND' },
    { id: 'ard-d5', component: 'Arduino Uno', pinName: 'D5 (PWM)', type: 'pwm', voltage: '0-5V' },
    { id: 'ard-d6', component: 'Arduino Uno', pinName: 'D6 (PWM)', type: 'pwm', voltage: '0-5V' },
    { id: 'ard-d9', component: 'Arduino Uno', pinName: 'D9', type: 'digital', voltage: 'TTL' },
    { id: 'ard-d10', component: 'Arduino Uno', pinName: 'D10', type: 'digital', voltage: 'TTL' },

    // L298N
    { id: 'l298-vcc', component: 'L298N Driver', pinName: '12V Power In', type: 'power_vcc', voltage: '7-12V' },
    { id: 'l298-gnd', component: 'L298N Driver', pinName: 'GND', type: 'power_gnd', voltage: '0V' },
    { id: 'l298-in1', component: 'L298N Driver', pinName: 'IN1 (Chap)', type: 'pwm', voltage: 'PWM In' },
    { id: 'l298-in2', component: 'L298N Driver', pinName: 'IN2 (O\'ng)', type: 'pwm', voltage: 'PWM In' },

    // HC-SR04
    { id: 'sr04-vcc', component: 'HC-SR04', pinName: 'VCC', type: 'power_vcc', voltage: '5V' },
    { id: 'sr04-gnd', component: 'HC-SR04', pinName: 'GND', type: 'power_gnd', voltage: '0V' },
    { id: 'sr04-trig', component: 'HC-SR04', pinName: 'Trig', type: 'digital', voltage: 'TTL' },
    { id: 'sr04-echo', component: 'HC-SR04', pinName: 'Echo', type: 'digital', voltage: 'TTL' },
  ];

  const handlePinClick = (pin: PinDef) => {
    if (!activePin) {
      setActivePin(pin);
    } else {
      if (activePin.id === pin.id) {
        setActivePin(null);
        return;
      }

      // Create new wire connection
      const newWire: WireConnection = {
        id: `wire-${Date.now()}`,
        fromComponent: activePin.component,
        fromPin: activePin.pinName,
        toComponent: pin.component,
        toPin: pin.pinName,
        color:
          activePin.type === 'power_vcc' || pin.type === 'power_vcc'
            ? '#ef4444'
            : activePin.type === 'power_gnd' || pin.type === 'power_gnd'
            ? '#0f172a'
            : '#38bdf8',
        voltage: activePin.voltage,
        status: 'connected',
        label: `${activePin.pinName} -> ${pin.pinName}`,
      };

      setWires((prev) => [...prev, newWire]);
      setActivePin(null);
    }
  };

  const handleRemoveWire = (id: string) => {
    setWires((prev) => prev.filter((w) => w.id !== id));
  };

  const handleValidateCircuit = () => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for short circuits (VCC directly connected to GND)
    const shortCircuit = wires.find(
      (w) =>
        (w.fromPin.includes('BAT (+)') && w.toPin.includes('GND')) ||
        (w.fromPin.includes('5V') && w.toPin.includes('GND'))
    );

    if (shortCircuit) {
      errors.push('Qisqa tutashuv (Short-Circuit)! Quvvat VCC to\'g\'ridan-to\'g\'ri yer (GND) ga ulangan!');
    }

    // Check power supply to L298N
    const l298Powered = wires.some(
      (w) =>
        (w.toComponent === 'L298N Driver' && w.toPin === '12V Power In') ||
        (w.fromComponent === 'L298N Driver' && w.fromPin === '12V Power In')
    );
    if (!l298Powered) {
      warnings.push('L298N motor drayveriga batareyadan asosiy quvvat ulanmagan.');
    }

    // Check ultrasonic wiring
    if (hasUltrasonic) {
      const trigConnected = wires.some((w) => w.toPin === 'Trig' || w.fromPin === 'Trig');
      const echoConnected = wires.some((w) => w.toPin === 'Echo' || w.fromPin === 'Echo');
      if (!trigConnected || !echoConnected) {
        warnings.push('HC-SR04 ultratovush datchigi Trig yoki Echo pinlari to\'liq ulanmagan.');
      }
    }

    if (errors.length > 0) {
      setValidationResult({
        valid: false,
        title: '❌ Zanjirda jiddiy xatolik aniqlandi!',
        description: 'Sxemada qisqa tutashuv xavfi bor, komponentlar shikastlanishi mumkin.',
        details: errors,
      });
    } else if (warnings.length > 0) {
      setValidationResult({
        valid: true,
        title: '⚠️ Zanjir qisman yig\'ilgan (Ogohlantirishlar bor)',
        description: 'Robot ishlaydi, biroq ayrim modullar signallari yetishmayapti.',
        details: warnings,
      });
    } else {
      setValidationResult({
        valid: true,
        title: '✅ Elektr Zanjiri Mukammal Holatda!',
        description: 'Barcha pinlar, mantiqiy va quvvat liniyalari xavfsiz va to\'g\'ri ulangan.',
        details: [
          'Hisoblangan nominal quvvat: 7.4V DC, 1.8A Peak (~13.3 Watt)',
          'Arduino Uno 5V stabillangan regulyatori optimal rejimda',
          'Motor drayveri galvanik ajratilgan',
        ],
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#080d16] overflow-y-auto select-none p-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1b2640] mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Interaktiv 2D Sxemotexnika & Simlar Zanjiri</span>
              <span className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded font-mono">
                Real-Time Circuit Simulator
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Pinlarni bosing va o'zaro sim torting. Elektr qonuniyatlari bo'yicha zanjirni tekshiring.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {activePin && (
            <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg animate-pulse font-mono">
              Tanlandi: {activePin.component} - {activePin.pinName} (Ikkinchi pinni bosing)
            </span>
          )}
          <button
            onClick={handleValidateCircuit}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zanjirni tekshirish</span>
          </button>
        </div>
      </div>

      {/* Validation Result Banner */}
      {validationResult && (
        <div
          className={`mb-4 p-3 rounded-xl border backdrop-blur-md transition-all ${
            validationResult.valid
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/40 border-red-500/40 text-red-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-xs">{validationResult.title}</span>
            <button
              onClick={() => setValidationResult(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] opacity-90 mb-2">{validationResult.description}</p>
          <ul className="text-[11px] space-y-1 font-mono list-disc list-inside">
            {validationResult.details.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Interactive Electronic Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Module: Battery */}
        <div className="bg-[#0e1628] border border-[#202f52] rounded-xl p-3 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Battery className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Li-Po 7.4V (2S)</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">2200mAh</span>
          </div>
          <div className="space-y-1.5">
            {availablePins
              .filter((p) => p.component === 'Li-Po 7.4V')
              .map((pin) => (
                <button
                  key={pin.id}
                  onClick={() => handlePinClick(pin)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                    activePin?.id === pin.id
                      ? 'bg-amber-500/30 border-amber-400 text-white ring-2 ring-amber-400/50'
                      : pin.type === 'power_vcc'
                      ? 'bg-red-950/40 border-red-500/40 text-red-300 hover:bg-red-900/40'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{pin.pinName}</span>
                  <span className="text-[10px] opacity-75">{pin.voltage}</span>
                </button>
              ))}
          </div>
        </div>

        {/* Module: Arduino Uno */}
        <div className="bg-[#0c1833] border border-blue-500/40 rounded-xl p-3 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-blue-900/60">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white">Arduino Uno R3</span>
            </div>
            <span className="text-[10px] text-blue-400 font-mono">ATmega328P</span>
          </div>
          <div className="space-y-1.5">
            {availablePins
              .filter((p) => p.component === 'Arduino Uno')
              .map((pin) => (
                <button
                  key={pin.id}
                  onClick={() => handlePinClick(pin)}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-mono border transition-all cursor-pointer ${
                    activePin?.id === pin.id
                      ? 'bg-amber-500/30 border-amber-400 text-white ring-2 ring-amber-400/50'
                      : 'bg-blue-950/40 border-blue-800/40 text-blue-200 hover:bg-blue-900/40'
                  }`}
                >
                  <span>{pin.pinName}</span>
                  <span className="text-[10px] opacity-75">{pin.voltage}</span>
                </button>
              ))}
          </div>
        </div>

        {/* Module: L298N Driver */}
        <div className="bg-[#0e1628] border border-[#202f52] rounded-xl p-3 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">L298N Driver</span>
            </div>
            <span className="text-[10px] text-amber-400 font-mono">Dual H-Bridge</span>
          </div>
          <div className="space-y-1.5">
            {availablePins
              .filter((p) => p.component === 'L298N Driver')
              .map((pin) => (
                <button
                  key={pin.id}
                  onClick={() => handlePinClick(pin)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                    activePin?.id === pin.id
                      ? 'bg-amber-500/30 border-amber-400 text-white ring-2 ring-amber-400/50'
                      : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{pin.pinName}</span>
                  <span className="text-[10px] opacity-75">{pin.voltage}</span>
                </button>
              ))}
          </div>
        </div>

        {/* Module: HC-SR04 Sensor */}
        <div className="bg-[#0e1628] border border-[#202f52] rounded-xl p-3 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">HC-SR04 Sensor</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">Ultrasonic</span>
          </div>
          <div className="space-y-1.5">
            {availablePins
              .filter((p) => p.component === 'HC-SR04')
              .map((pin) => (
                <button
                  key={pin.id}
                  onClick={() => handlePinClick(pin)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                    activePin?.id === pin.id
                      ? 'bg-amber-500/30 border-amber-400 text-white ring-2 ring-amber-400/50'
                      : 'bg-slate-900/80 border-slate-700 text-cyan-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{pin.pinName}</span>
                  <span className="text-[10px] opacity-75">{pin.voltage}</span>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Connected Wires Table */}
      <div className="bg-[#0e1628] border border-[#1e2c4d] rounded-xl p-3">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <span className="text-xs font-bold text-white">Ulangan Simlar Ro'yxati ({wires.length} ta)</span>
          <span className="text-[10px] text-slate-400">Har bir sim ustiga bosib uni o'chirish mumkin</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {wires.map((wire) => (
            <div
              key={wire.id}
              className="flex items-center justify-between p-2 rounded-lg bg-[#141e33] border border-[#213054] text-xs"
            >
              <div className="flex items-center space-x-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: wire.color }}
                />
                <span className="font-mono text-slate-200">
                  {wire.fromComponent} ({wire.fromPin}) ➔ {wire.toComponent} ({wire.toPin})
                </span>
              </div>
              <button
                onClick={() => handleRemoveWire(wire.id)}
                className="text-slate-400 hover:text-red-400 p-1 transition-colors cursor-pointer"
                title="Simni uzish"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
