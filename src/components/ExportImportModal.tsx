import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  FileJson, 
  CheckCircle2,
  FileCode
} from 'lucide-react';
import type { RobotConfig, RobotPart } from '../types';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  robotConfig: RobotConfig;
  pythonCode: string;
  parts: RobotPart[];
  onImportConfig: (data: { robotConfig: RobotConfig; pythonCode: string; parts: RobotPart[] }) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  robotConfig,
  pythonCode,
  parts,
  onImportConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const exportPayload = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    robot: {
      name: robotConfig.name,
      type: robotConfig.type,
      dimensions: robotConfig.dimensions,
      weight: robotConfig.weight,
      metrics: robotConfig.metrics,
      batteryVoltage: robotConfig.batteryVoltage,
    },
    parts: parts.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      enabled: p.enabled,
      weightKg: p.weightKg,
    })),
    pythonCode: pythonCode,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${robotConfig.name.toLowerCase().replace(/\s+/g, '_')}_config.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleApplyImport = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(importText);
      if (!parsed.robot || !parsed.parts || !parsed.pythonCode) {
        throw new Error("Noto'g'ri fayl formati! 'robot', 'parts' va 'pythonCode' mavjud bo'lishi shart.");
      }

      // Reconstruct
      const newRobotConfig: RobotConfig = {
        name: parsed.robot.name || 'ImportedBot',
        type: parsed.robot.type || 'RoboRacer',
        chassisModel: 'speed',
        wheelModel: 'track',
        mcuModel: 'arduino_uno',
        weight: parsed.robot.weight || 1.2,
        dimensions: parsed.robot.dimensions || { length: 22, width: 18, height: 12 },
        metrics: parsed.robot.metrics || { speed: 8.5, stability: 7.8, handling: 9.2 },
        batteryVoltage: parsed.robot.batteryVoltage || 7.4,
        batteryHealth: 100,
        equippedParts: parsed.parts.filter((p: any) => p.enabled).map((p: any) => p.id),
        pythonCode: parsed.pythonCode,
      };

      const newParts = parts.map((p) => {
        const matching = parsed.parts.find((item: any) => item.id === p.id);
        return matching ? { ...p, enabled: matching.enabled } : p;
      });

      onImportConfig({
        robotConfig: newRobotConfig,
        pythonCode: parsed.pythonCode,
        parts: newParts,
      });

      alert(`✅ "${newRobotConfig.name}" roboti muvaffaqiyatli import qilindi!`);
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'JSON kodni tahlil qilishda xatolik yuz berdi!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-2xl bg-[#0f1728] border border-[#23355c] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="h-14 px-6 bg-[#131d33] border-b border-[#223154] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Robotni Saqlash, Eksport va Import Qilish</h3>
              <p className="text-[11px] text-slate-400">Standart RoboVerse JSON Konfiguratsiya formati</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center px-6 pt-3 bg-[#0d1424] border-b border-[#1c2742]">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-semibold text-xs transition-all ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-400 bg-[#131d33] rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Eksport (Yuklab olish)</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-semibold text-xs transition-all ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-400 bg-[#131d33] rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import (Yuklash)</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">
                  {robotConfig.name} ({robotConfig.type}) ma'lumotlari JSON formatida:
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#162238] hover:bg-[#1e2e4c] text-slate-200 border border-[#23355c] text-xs transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Nusxalandi!' : 'Nusxa olish'}</span>
                  </button>

                  <button
                    onClick={handleDownloadFile}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Faylni yuklab olish (.json)</span>
                  </button>
                </div>
              </div>

              {/* JSON Code Box */}
              <div className="p-3 bg-[#0a0e17] rounded-2xl border border-slate-800 text-[11px] font-mono text-cyan-300 max-h-72 overflow-y-auto select-text">
                <pre>{jsonString}</pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Avval saqlangan robotning JSON matnini quyidagi maydonga joylang:
              </p>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='{"version": "1.0.0", "robot": { ... }, "parts": [ ... ], "pythonCode": "..."}'
                className="w-full h-56 bg-[#0a0e17] text-slate-200 font-mono text-xs p-3 rounded-2xl border border-[#23355c] focus:outline-none focus:border-blue-500 resize-none selection:bg-blue-600"
              />

              {importError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono">
                  ⚠️ {importError}
                </div>
              )}

              <button
                onClick={handleApplyImport}
                disabled={!importText.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Robotni Qayta Tiklash (Import)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 px-6 bg-[#0c1220] border-t border-[#1c2740] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            RoboVerse Protocol v1.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
