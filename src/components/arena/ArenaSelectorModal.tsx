import React from 'react';
import { X, Check, Trophy, Shield, Zap, Sparkles, Navigation } from 'lucide-react';
import type { ArenaGameMode } from '../../types/arena';

interface ArenaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: ArenaGameMode;
  onSelectMode: (mode: ArenaGameMode) => void;
}

interface ArenaConfig {
  id: ArenaGameMode;
  name: string;
  badge: string;
  theme: string;
  description: string;
  color: string;
  accentBorder: string;
  features: string[];
  rules: string;
  dimensions: string;
  lighting: string;
}

const ARENAS: ArenaConfig[] = [
  {
    id: 'sumo',
    name: 'RoboSumo',
    badge: '🥋 Yapon Dohyo Ringi',
    theme: 'Tokyo Cyber Dojo',
    description: "An'anaviy yapon Dohyo tatami maydoni. Tsuriyane ibodatxona tomi, 4 rangli muqaddas Fusa bog'ichlari, Torii darvozalari, qizil fonarlar va gil dohyo platformasi.",
    color: 'from-amber-950/60 to-red-950/50',
    accentBorder: 'border-amber-500/50 hover:border-amber-400',
    features: [
      '12.5 metrli baland gil Dohyo ringi',
      "Rice-straw bale (Tawara) chegara belgilari",
      'Markaziy qizil Shikiri-sen start chiziqlari',
      '4 ta ulkan laklangan ustun va Torii darvozalari',
      'Ring-Out chegara nazorati tizimi'
    ],
    rules: "Raqibni Dohyo doirasidan itarib chiqarish. O'zingiz doiradan chiqib ketsangiz, -100 ball jarima!",
    dimensions: '60m x 60m (Dohyo r = 12.5m)',
    lighting: 'Iliq dojo spotlari va qizil neon fonarlar'
  },
  {
    id: 'football',
    name: 'RoboFootball',
    badge: '⚽ Jahon Chempionati',
    theme: 'World Cup Grand Arena',
    description: "Haqiqiy maysa qoplamali (lawn stripes) robot futbol arenasi. 3D to'rli darvozalar, burchak bayroqchalari, dinamik LED reklama tablolari, 4 ta baland projektor minorasi va real to'p fizikasi.",
    color: 'from-emerald-950/60 to-teal-950/50',
    accentBorder: 'border-emerald-500/50 hover:border-emerald-400',
    features: [
      'Chiziqli zumrad maysa (lawn mower stripes)',
      "3D to'rli darvoza karkaslari va ustunlar",
      'Haqiqiy aylanish va urilish fizikasiga ega to\'p',
      'LED reklama perimetri (RoboVerse 2026)',
      'Jonli hisob tablosi (YOU vs BOTS)'
    ],
    rules: "To'pni raqib darvozasiga aniq kiritish. Har bir gol uchun +500 ball hisoblanadi!",
    dimensions: '74m x 74m (Darvozalar: 12m x 4.2m)',
    lighting: 'Kunduzgi quyosh nurlari va 4 ta stadion projektorlari'
  },
  {
    id: 'line',
    name: 'Line Follower',
    badge: '〰️ R&D Laboratoriya',
    theme: 'High-Tech Cleanroom Lab',
    description: "Kremniy vodiysi darajasidagi toza xona robototexnika laboratoriyasi. Qora vinil poyga trassasi, keskin burilishlar, Start/Finish gantri arkasi, osiloskoplar, robot qo'llar va server shkaflari.",
    color: 'from-sky-950/60 to-blue-950/50',
    accentBorder: 'border-sky-500/50 hover:border-sky-400',
    features: [
      'Epoksi yaltiroq pol va toza xona koshinlari',
      'Murakkab S-burilishli qora vinil trassa',
      'Start/Finish LED gantri arkasi',
      'Osiloskoplar, KUKA robot qo\'llar, serverlar',
      'Chiziq sensorlari uchun yuqori kontrast'
    ],
    rules: "Robot qora chiziqdan chetga chiqmasdan butun aylanani eng qisqa vaqtda bosib o'tishi shart.",
    dimensions: '64m x 64m (Trassa uzunligi: ~180m)',
    lighting: 'Sovuq oq lyuminestsent toza xona yorug\'ligi'
  },
  {
    id: 'warehouse',
    name: 'Warehouse Challenge',
    badge: '📦 Smart Logistika',
    theme: 'Amazon Fulfillment Center',
    description: "Zamonaviy aqlli logistika ombori. Baland metall stellajlar, to'la pallet qutilari, xavfsizlik zonalari, ogohlantirish chiziqlari va itariladigan yog'och yuk qutilari.",
    color: 'from-amber-950/60 to-yellow-950/50',
    accentBorder: 'border-yellow-500/50 hover:border-yellow-400',
    features: [
      'Sanoat betoni pol va sariq xavfsizlik yo\'laklari',
      '3 qavatli baland po\'lat yuk stellajlari',
      'Haqiqiy itariladigan yog\'och yuk qutilari',
      'Yashil golografik qabul qilish maydonchasi (Drop Zone)',
      'Sariq himoya to\'siqlari va xavf belgilari'
    ],
    rules: "Maydondagi yuk qutilarini topib, ularni yashil 'Drop Zone' qabul zonasiga yetkazing (+300 ball).",
    dimensions: '68m x 68m (3 qavatli 10m stellajlar)',
    lighting: 'Sanoat natriy yuqori quvvatli ship lampalari'
  },
  {
    id: 'racing',
    name: 'Speed Racing',
    badge: '🏎️ Kiberpank Trassa',
    theme: 'Neo-Tokyo Midnight Circuit',
    description: "Tungi kiberpank magistrali. Nam qora asfalt, qizil-oq poyga kerblari, golografik nitro tezlatkichlar (+15 m/s boost), neon osmono'par binolar va ulkan kiber oy.",
    color: 'from-purple-950/60 to-cyan-950/50',
    accentBorder: 'border-cyan-500/50 hover:border-cyan-400',
    features: [
      'Nam qora asfalt va yo\'l belgilari',
      'Qizil va oq tebranish kerblari (Rumble strips)',
      'Golografik ko\'k nitro boost maydonchalari',
      'Atrofda neon osmono\'par binolar va bannerlar',
      'Yuqori tezlikda boshqaruv va manyovrlar'
    ],
    rules: "Nitro maydonchalar ustidan o'tib maksimal tezlik oling va to'siqlarga urilmasdan aylaning!",
    dimensions: '84m x 84m (Trassa kengligi: 14m)',
    lighting: 'Binafsha va firuza neon projektorlar, kiber osmon'
  }
];

export const ArenaSelectorModal: React.FC<ArenaSelectorModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1120] border border-[#202f4e] w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1b2742] bg-[#0d1527]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                <span>Haqiqiy 3D Maydonlar Arenasi</span>
                <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                  5 Xil Alohida Muhit
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Har bir rejim o'zining alohida arxitekturasi, yoritilishi, to'siqlari va qoidalariga ega.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: 5 Arenas Grid */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ARENAS.map((arena) => {
              const isSelected = currentMode === arena.id;
              return (
                <div
                  key={arena.id}
                  onClick={() => {
                    onSelectMode(arena.id);
                    onClose();
                  }}
                  className={`group relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer flex flex-col justify-between bg-gradient-to-br ${arena.color} ${
                    isSelected
                      ? 'border-blue-400 ring-2 ring-blue-500/50 shadow-xl shadow-blue-900/30'
                      : arena.accentBorder
                  }`}
                >
                  {/* Top row */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black tracking-wider uppercase bg-black/40 px-2.5 py-1 rounded-lg border border-white/10 text-slate-200">
                        {arena.badge}
                      </span>
                      {isSelected ? (
                        <div className="flex items-center space-x-1 text-xs font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                          <Check className="w-3.5 h-3.5" />
                          <span>Hozir faol</span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 group-hover:text-blue-300 flex items-center gap-1">
                          Tanlash <Navigation className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-white group-hover:text-blue-200 transition-colors">
                      {arena.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-400 mb-3">{arena.theme}</p>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                      {arena.description}
                    </p>

                    {/* Features list */}
                    <div className="space-y-1.5 mb-4">
                      {arena.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-[11px] text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Stats */}
                  <div className="pt-3 border-t border-white/10 mt-auto">
                    <div className="text-[10px] text-slate-400 flex items-center justify-between mb-1">
                      <span>Maydon: <strong className="text-slate-200">{arena.dimensions}</strong></span>
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-[10px] text-amber-300/90 font-medium flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{arena.rules}</span>
                    </div>

                    <button
                      className={`w-full mt-3 py-2 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-2 transition-all shadow-md ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-white group-hover:bg-blue-600'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{isSelected ? "Maydonda turibsiz" : "Maydonga Kirish"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-[#1b2742] bg-[#0a0f1d] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Real vaqt 3D Three.js GPU renderlash dvigateli faol</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            60 FPS • PCF Soft Shadows • ACES Filmic Tone
          </div>
        </div>
      </div>
    </div>
  );
};
