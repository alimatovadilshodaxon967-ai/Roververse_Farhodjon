import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  Settings2, 
  Gauge, 
  Layers,
  X
} from 'lucide-react';
import type { RobotConfig, RobotPart } from '../types';
import { FullAnalysisModal } from './FullAnalysisModal';

interface RightPanelProps {
  robotConfig: RobotConfig;
  onUpdateRobotName: (name: string) => void;
  onUpdateRobotType: (type: string) => void;
  onApplyAiRecommendation: () => void;
  parts: RobotPart[];
  liveDistance: number;
  isSimulating: boolean;
  onClose?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  robotConfig,
  onUpdateRobotName,
  onUpdateRobotType,
  onApplyAiRecommendation,
  parts,
  liveDistance,
  isSimulating,
  onClose,
}) => {
  const [sensorsEnabled, setSensorsEnabled] = useState(true);
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  const [world, setWorld] = useState('Racing Arena');
  const [weather, setWeather] = useState('Kunduz');
  const [aiApplied, setAiApplied] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  // 13-Bosqich: Dinamik AI Heuristika Maslahatchisi
  const hasWedge = parts.find(p => p.id === 'sumo-wedge')?.enabled;
  const hasLidar = parts.find(p => p.id === 'lidar-scanner')?.enabled;
  const has3SBattery = parts.find(p => p.id === 'lipo-3s-battery')?.enabled;
  const hasUltrasonic = parts.find(p => p.id === 'ultrasonic')?.enabled;

  let aiSuggestionText = "Oldingi sinovlarga ko'ra, orqa g'ildiraklar uchun kuchliroq motor tavsiya etiladi.";
  let aiSuggestionBadge = "Tavsiya";

  if (robotConfig.type === 'SumoBot' && !hasWedge) {
    aiSuggestionText = "Sumo jangi uchun raqibni maydondan itarib chiqarishda 'Sumo Front Push Wedge' belkuragi juda zarur!";
    aiSuggestionBadge = "Muhim";
  } else if (!hasUltrasonic && !hasLidar) {
    aiSuggestionText = "Robotda to'siqlarni aniqlovchi datchik yo'q! Kamida bitta Ultrasonic yoki LiDAR o'rnating.";
    aiSuggestionBadge = "Ogohlantirish";
  } else if (hasLidar && !has3SBattery) {
    aiSuggestionText = "LiDAR va ko'p sensorlar ko'proq quvvat talab qiladi. 3S 11.1V batareyani ulashni tavsiya qilamiz.";
    aiSuggestionBadge = "Optimal";
  } else if (has3SBattery && robotConfig.metrics.speed >= 9.0) {
    aiSuggestionText = "Robot tezligi maksimal (9.6/10)! To'siqlar oldida avtonom tormozlanish kodini sozlang.";
    aiSuggestionBadge = "Tahlil";
  }

  const handleApplyAi = () => {
    setAiApplied(true);
    onApplyAiRecommendation();
    setTimeout(() => setAiApplied(false), 3000);
  };

  return (
    <>
      <aside className="w-80 bg-[#0d121f] border-l border-[#1c2438] flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto select-none p-3.5 space-y-3.5">
        {/* Yuqori sarlavha va Yopish tugmasi */}
        <div className="flex items-center justify-between pb-1 px-1">
          <span className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Robot Paneli</span>
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#141b2e] text-slate-400 hover:text-white hover:bg-rose-600/30 hover:text-rose-300 border border-[#22304f] transition-all cursor-pointer"
              title="Panelni yashirish"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 11-Bosqich: Robot Ma'lumotlari */}
        <div className="bg-[#12192b]/90 border border-[#1e2a47] rounded-2xl p-3.5 shadow-sm">
          <h3 className="text-xs font-bold text-white mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Robot ma'lumotlari</span>
            </span>
            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
              Profil
            </span>
          </h3>

          <div className="space-y-2 text-xs">
            {/* Robot Nomi */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Nomi:</span>
              <input
                type="text"
                value={robotConfig.name}
                onChange={(e) => onUpdateRobotName(e.target.value)}
                className="w-32 bg-[#18233c] text-white font-medium text-xs px-2 py-0.5 rounded border border-[#26375c] focus:outline-none focus:border-blue-500 text-right"
              />
            </div>

            {/* Robot Turi (Selector) */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Turi:</span>
              <select
                value={robotConfig.type}
                onChange={(e) => onUpdateRobotType(e.target.value)}
                className="bg-[#18233c] text-slate-200 font-semibold text-xs px-2 py-0.5 rounded border border-[#26375c] focus:outline-none focus:border-blue-500"
              >
                <option value="RoboRacer">🏎️ RoboRacer</option>
                <option value="SumoBot">🥋 SumoBot</option>
                <option value="LineFollower">〰️ LineFollower</option>
                <option value="Explorer">📡 Explorer</option>
                <option value="FootballBot">⚽ FootballBot</option>
              </select>
            </div>

            {/* Og'irlik */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Og'irlik:</span>
              <span className="text-slate-200 font-mono font-medium">
                {robotConfig.weight.toFixed(2)} kg
              </span>
            </div>

            {/* Gabarit O'lchamlari */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">O'lchamlar:</span>
              <span className="text-slate-200 font-mono text-[11px]">
                {robotConfig.dimensions.length} x {robotConfig.dimensions.width} x {robotConfig.dimensions.height} cm
              </span>
            </div>
          </div>
        </div>

        {/* 12-Bosqich: Ko'rsatkichlar (Stats) */}
        <div className="bg-[#12192b]/90 border border-[#1e2a47] rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span>Ko'rsatkichlar</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">10 Ballik</span>
          </div>

          <div className="space-y-2.5">
            {/* Tezlik */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Tezlik</span>
                <span className="text-blue-400 font-semibold font-mono">{robotConfig.metrics.speed}/10</span>
              </div>
              <div className="w-full bg-[#18233c] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(robotConfig.metrics.speed / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Barqarorlik */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Barqarorlik</span>
                <span className="text-cyan-400 font-semibold font-mono">{robotConfig.metrics.stability}/10</span>
              </div>
              <div className="w-full bg-[#18233c] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(robotConfig.metrics.stability / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Boshqaruv */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Boshqaruv</span>
                <span className="text-indigo-400 font-semibold font-mono">{robotConfig.metrics.handling}/10</span>
              </div>
              <div className="w-full bg-[#18233c] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(robotConfig.metrics.handling / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 12-Bosqich: To'liq tahlil tugmasi (Modal ochadi) */}
          <button
            onClick={() => setIsAnalysisModalOpen(true)}
            className="w-full mt-3 py-1.5 bg-[#17223b] hover:bg-[#1f2d4d] text-blue-400 hover:text-white rounded-lg text-xs font-semibold border border-[#23355c] transition-all cursor-pointer shadow-sm"
          >
            To'liq tahlil
          </button>
        </div>

        {/* 13-Bosqich: AI Tavsiya (Smart Assistant Moduli) */}
        <div className="bg-gradient-to-br from-[#121c33] to-[#162340] border border-blue-500/30 rounded-2xl p-3.5 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <h4 className="text-xs font-bold text-white">AI Tavsiya</h4>
            </div>
            <span className="text-[10px] text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded font-mono">
              {aiSuggestionBadge}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
            {aiSuggestionText}
          </p>

          <button
            onClick={handleApplyAi}
            className={`w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              aiApplied
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/30'
            }`}
          >
            {aiApplied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Qo'llandi!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Qo'llash</span>
              </>
            )}
          </button>
        </div>

        {/* Simulyatsiya sozlamalari */}
        <div className="bg-[#12192b]/90 border border-[#1e2a47] rounded-2xl p-3.5 shadow-sm space-y-2.5">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Simulyatsiya sozlamalari</span>
          </h4>

          {/* Toggles */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-300">Sensorlar</span>
            <button
              onClick={() => setSensorsEnabled(!sensorsEnabled)}
              className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                sensorsEnabled ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                  sensorsEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Fizika</span>
            <button
              onClick={() => setPhysicsEnabled(!physicsEnabled)}
              className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                physicsEnabled ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                  physicsEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Dropdowns */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">Real vaqt</span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              60 FPS
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Dunyo</span>
            <select
              value={world}
              onChange={(e) => setWorld(e.target.value)}
              className="bg-[#18233c] text-white text-[11px] px-2 py-1 rounded border border-[#26375c] focus:outline-none"
            >
              <option value="Racing Arena">Racing Arena</option>
              <option value="RoboSumo">RoboSumo Tatami</option>
              <option value="RoboFootball">RoboFootball</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Ob-havo</span>
            <select
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className="bg-[#18233c] text-white text-[11px] px-2 py-1 rounded border border-[#26375c] focus:outline-none"
            >
              <option value="Kunduz">Kunduz</option>
              <option value="Tun (Cyber)">Tun (Cyber)</option>
              <option value="Yomg'ir">Yomg'ir</option>
            </select>
          </div>
        </div>

        {/* 18-Bosqich: Test Natijalari & Jonli Telemetriya */}
        <div className="bg-[#12192b]/90 border border-[#1e2a47] rounded-2xl p-3.5 shadow-sm space-y-2">
          <h4 className="text-xs font-bold text-white flex items-center justify-between">
            <span>Test natijalari</span>
            <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
          </h4>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Masofa sensorlari:</span>
              <span className="text-emerald-400 font-mono font-medium flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${liveDistance < 20 ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                {hasUltrasonic ? `${(liveDistance / 10).toFixed(1)} m (${liveDistance} sm)` : '0.0 m (O\'chiq)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Motorlar holati:</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {isSimulating 
                  ? (liveDistance < 20 ? 'Aylanmoqda (L: 50%, R: -50%)' : 'Oldinga (100% PWM)')
                  : 'Kutish rejimida (0%)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Batareya quvvati:</span>
              <span className="text-emerald-400 font-mono font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {has3SBattery ? '98% (11.1V 3S)' : '78% (7.4V 2S)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Xatolar soni:</span>
              <span className="text-emerald-400 font-mono font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                0 ta (Kod to'g'ri)
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* 12-Bosqich: To'liq Tahlil Modali */}
      <FullAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        robotConfig={robotConfig}
      />
    </>
  );
};
