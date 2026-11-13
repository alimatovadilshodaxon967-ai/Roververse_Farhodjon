import React from 'react';
import { 
  Layers, 
  Box, 
  Cpu, 
  Eye, 
  Battery, 
  PlusCircle, 
  ShoppingCart, 
  CheckCircle2, 
  Sparkles, 
  Plane, 
  Zap 
} from 'lucide-react';
import type { DronePartCategory, DronePart } from '../../types/drone';

interface DroneSidebarCatalogProps {
  selectedCategory: DronePartCategory;
  onSelectCategory: (cat: DronePartCategory) => void;
  parts: DronePart[];
  onTogglePart: (partId: string) => void;
  cartCount: number;
}

export const DroneSidebarCatalog: React.FC<DroneSidebarCatalogProps> = ({
  selectedCategory,
  onSelectCategory,
  parts,
  onTogglePart,
  cartCount,
}) => {
  const categories: { id: DronePartCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Barcha qismlar', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'frame', label: 'Ramka (Korpus)', icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'motors', label: 'Motorlar', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'propellers', label: 'Parraklar', icon: <Plane className="w-3.5 h-3.5" /> },
    { id: 'sensors', label: 'Sensorlar & Kamera', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'battery', label: 'Batareya', icon: <Battery className="w-3.5 h-3.5" /> },
    { id: 'fc', label: 'Elektronika & FC', icon: <Cpu className="w-3.5 h-3.5" /> },
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
            <span>Drone Constructor</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          </h2>
          <p className="text-[11px] text-slate-400 font-normal mt-0.5">
            O'z droningni yarat, sozla va uchir
          </p>
        </div>

        {/* Categories Navigation */}
        <div className="space-y-1 mb-5">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c2e]'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Catalog Items Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1c2438]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Katalog Qismlari
          </span>
          <span className="text-[10px] bg-cyan-950/80 text-cyan-300 font-mono font-bold px-1.5 py-0.5 rounded border border-cyan-800/40">
            {filteredParts.length} qism
          </span>
        </div>

        {/* Parts Cards List */}
        <div className="space-y-2">
          {filteredParts.map((part) => (
            <div
              key={part.id}
              onClick={() => onTogglePart(part.id)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                part.enabled
                  ? 'bg-gradient-to-r from-[#122240] to-[#0c1628] border-cyan-500/60 shadow-md shadow-cyan-950/50'
                  : 'bg-[#101726]/60 border-[#1a233a] hover:border-slate-700 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      part.enabled
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {part.category === 'frame' && <Box className="w-3.5 h-3.5" />}
                    {part.category === 'motors' && <Zap className="w-3.5 h-3.5" />}
                    {part.category === 'propellers' && <Plane className="w-3.5 h-3.5" />}
                    {part.category === 'fc' && <Cpu className="w-3.5 h-3.5" />}
                    {part.category === 'battery' && <Battery className="w-3.5 h-3.5" />}
                    {part.category === 'sensors' && <Eye className="w-3.5 h-3.5" />}
                    {part.category === 'extra' && <PlusCircle className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white leading-tight">
                      {part.name}
                    </h4>
                    <span className="text-[10px] text-cyan-400 font-mono font-medium block mt-0.5">
                      {part.specs} • {part.weightG}g
                    </span>
                  </div>
                </div>

                {/* Checkbox state */}
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors mt-0.5 ${
                    part.enabled
                      ? 'bg-cyan-600 border-cyan-400 text-white'
                      : 'border-slate-700 bg-slate-800/80'
                  }`}
                >
                  {part.enabled && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Cart / Active Count Summary */}
      <div className="p-3 border-t border-[#1c2438] bg-[#090d17]">
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#122344] to-[#0d1628] rounded-xl border border-cyan-500/40 shadow-inner">
          <div className="flex items-center space-x-2 text-cyan-400">
            <ShoppingCart className="w-4 h-4" />
            <span className="text-xs font-bold text-white">Faol Qismlar</span>
          </div>
          <span className="text-xs font-mono font-black text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800/50">
            {cartCount}
          </span>
        </div>
      </div>
    </aside>
  );
};
