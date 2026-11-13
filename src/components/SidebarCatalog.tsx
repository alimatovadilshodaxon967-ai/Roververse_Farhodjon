import React from 'react';
import { 
  Layers, 
  Box, 
  Cpu, 
  Eye, 
  Battery, 
  Radio, 
  PlusCircle, 
  ShoppingCart,
  CheckCircle2,
  Sparkles,
  Camera,
  Shield,
  Disc
} from 'lucide-react';
import type { PartCategory, RobotPart } from '../types';

interface SidebarCatalogProps {
  selectedCategory: PartCategory;
  onSelectCategory: (cat: PartCategory) => void;
  parts: RobotPart[];
  onTogglePart: (partId: string) => void;
  cartCount: number;
}

export const SidebarCatalog: React.FC<SidebarCatalogProps> = ({
  selectedCategory,
  onSelectCategory,
  parts,
  onTogglePart,
  cartCount,
}) => {
  const categories: { id: PartCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Barcha qismlar', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'chassis', label: 'Chassis (Korpus)', icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'motors', label: 'Motorlar & G\'ildirak', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'sensors', label: 'Sensorlar', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'battery', label: 'Batareya', icon: <Battery className="w-3.5 h-3.5" /> },
    { id: 'electronics', label: 'Elektronika & MCU', icon: <Radio className="w-3.5 h-3.5" /> },
    { id: 'extra', label: "Qo'shimcha modullar", icon: <PlusCircle className="w-3.5 h-3.5" /> },
  ];

  const filteredParts = selectedCategory === 'all' 
    ? parts 
    : parts.filter(p => p.category === selectedCategory);

  return (
    <aside className="w-64 bg-[#0d121f] border-r border-[#1c2438] flex flex-col justify-between h-[calc(100vh-3.5rem)] select-none">
      {/* Top Header & Categories */}
      <div className="p-3.5 overflow-y-auto flex-1">
        {/* Title */}
        <div className="mb-4">
          <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
            <span>Robot Constructor</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          </h2>
          <p className="text-[11px] text-slate-400 font-normal mt-0.5">
            O'z robotingni yarat, sozla va kodla
          </p>
        </div>

        {/* 4-Bosqich: Categories Navigation */}
        <div className="space-y-1 mb-5">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/90 text-white font-semibold shadow-sm shadow-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-[#162035]'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {cat.icon}
                </span>
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* 5-Bosqich & 6-9 Bosqichlar: Qismlar Kartochkalari */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" />
              Katalog qismlari
            </span>
            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 font-mono">
              {filteredParts.length} qism
            </span>
          </div>

          <div className="space-y-2">
            {filteredParts.map((part) => {
              return (
                <div
                  key={part.id}
                  onClick={() => onTogglePart(part.id)}
                  className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center space-x-3 ${
                    part.enabled
                      ? 'bg-[#131d33] border-blue-500/50 shadow-md shadow-blue-500/10'
                      : 'bg-[#101726]/60 border-[#1c2740] hover:border-slate-600 hover:bg-[#141d30]'
                  }`}
                >
                  {/* Part Visual Preview Box */}
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center p-1.5 transition-colors shrink-0 ${
                    part.enabled 
                      ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400' 
                      : 'bg-[#172238] border border-[#233152] text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {part.iconType === 'motor' && (
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-[8px] font-bold">M</div>
                      </div>
                    )}
                    {part.iconType === 'ultrasonic' && (
                      <div className="flex space-x-0.5">
                        <div className="w-3.5 h-3.5 rounded-full border border-current bg-current/20"></div>
                        <div className="w-3.5 h-3.5 rounded-full border border-current bg-current/20"></div>
                      </div>
                    )}
                    {part.iconType === 'arduino' && (
                      <div className="w-6 h-5 rounded bg-blue-700/60 border border-blue-400/80 flex items-center justify-center text-[7px] font-mono font-bold text-white">
                        MCU
                      </div>
                    )}
                    {part.iconType === 'wheel' && (
                      <Disc className="w-5 h-5" />
                    )}
                    {part.iconType === 'chassis' && (
                      <Box className="w-5 h-5 text-indigo-400" />
                    )}
                    {part.iconType === 'battery' && (
                      <Battery className="w-5 h-5 text-emerald-400" />
                    )}
                    {part.iconType === 'lidar' && (
                      <div className="w-5 h-5 rounded-full border border-red-400 bg-red-500/20 flex items-center justify-center text-[8px] text-red-400 font-bold">
                        360°
                      </div>
                    )}
                    {part.iconType === 'camera' && (
                      <Camera className="w-5 h-5 text-cyan-400" />
                    )}
                    {part.iconType === 'driver' && (
                      <Cpu className="w-5 h-5 text-amber-400" />
                    )}
                    {part.iconType === 'wedge' && (
                      <Shield className="w-5 h-5 text-purple-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-white truncate">
                        {part.name}
                      </h4>
                      {part.enabled && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-1" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">
                        ⚙️ {part.countOrPower}
                      </span>
                      <span className="text-[10px] text-slate-500">•</span>
                      <span className="text-[10px] text-slate-400">
                        {part.weightKg} kg
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Savatcha (Inventory) Bar */}
      <div className="p-3 border-t border-[#1c2438] bg-[#0c101c]">
        <button className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-[#141e33] hover:bg-[#1a2744] text-blue-400 hover:text-blue-300 font-medium text-xs border border-blue-500/30 transition-all shadow-sm">
          <ShoppingCart className="w-4 h-4" />
          <span>Faol Qismlar ({cartCount})</span>
        </button>
      </div>
    </aside>
  );
};
