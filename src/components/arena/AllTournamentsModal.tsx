import React, { useState } from 'react';
import { 
  X, 
  Trophy, 
  Award, 
  CheckCircle2, 
  Flame, 
  ShieldCheck, 
  Crown,
  KeyRound
} from 'lucide-react';

interface AllTournamentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AllTournamentsModal: React.FC<AllTournamentsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'bracket' | 'achievements' | 'rooms'>('bracket');
  const [roomCode, setRoomCode] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-2xl bg-[#0f1728] border border-[#23355c] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="h-14 px-6 bg-[#131d33] border-b border-[#223154] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Turnirlar Jadvali va Yutuqlar</h3>
              <p className="text-[11px] text-slate-400 font-mono">RoboVerse Chempionati 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 bg-[#0d1424] border-b border-[#1c2742]">
          <button
            onClick={() => setActiveTab('bracket')}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-semibold text-xs transition-all ${
              activeTab === 'bracket'
                ? 'border-blue-500 text-blue-400 bg-[#131d33] rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Turnir To'ri (Bracket)</span>
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-semibold text-xs transition-all ${
              activeTab === 'achievements'
                ? 'border-blue-500 text-blue-400 bg-[#131d33] rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Yutuqlar & Medallar (5)</span>
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-semibold text-xs transition-all ${
              activeTab === 'rooms'
                ? 'border-blue-500 text-blue-400 bg-[#131d33] rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Xususiy Xona (Private Room)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'bracket' ? (
            /* 37-Bosqich: Tournament Bracket */
            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-400" />
                  RoboSumo Pro Grand Finali
                </span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Mukofot: 5,000,000 UZS
                </span>
              </div>

              {/* Visual Matchups */}
              <div className="grid grid-cols-3 gap-3 text-center">
                {/* 1/4 Final */}
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">1/4 Final</div>
                  <div className="p-2 rounded-xl bg-[#121c33] border border-blue-500/30 text-left">
                    <div className="text-emerald-400 font-bold">✓ You (2 - 0)</div>
                    <div className="text-slate-500">✗ NightBot</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#121c33] border border-slate-800 text-left">
                    <div className="text-white font-semibold">✓ ShadowX (2 - 1)</div>
                    <div className="text-slate-500">✗ Falcon</div>
                  </div>
                </div>

                {/* Yarim Final */}
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Yarim Final</div>
                  <div className="p-2.5 rounded-xl bg-[#152342] border border-blue-500/40 text-left mt-4 shadow-md">
                    <div className="text-blue-300 font-bold">You (Farhodjon)</div>
                    <div className="text-slate-400 text-[10px] my-1 font-sans">VS (Bugun 19:30)</div>
                    <div className="text-red-400 font-bold">ShadowX</div>
                  </div>
                </div>

                {/* Grand Final */}
                <div className="space-y-2">
                  <div className="text-[10px] text-amber-400 uppercase font-bold flex items-center justify-center gap-1">
                    <Crown className="w-3.5 h-3.5" />
                    Grand Final
                  </div>
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-blue-500/10 border border-amber-500/40 text-center mt-3 shadow-lg">
                    <div className="text-amber-300 font-black text-sm">CHEMPIONLIK</div>
                    <div className="text-[10px] text-slate-400 mt-1">G'olib Oltin Kubok oladi</div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'achievements' ? (
            /* 39-Bosqich: Achievements & Medals */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#121c33] border border-emerald-500/40 flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
                  🏎️
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-1">
                    <span>Speed Demon</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Arenada 8.0 o/s dan yuqori tezlikka erishildi.</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#121c33] border border-emerald-500/40 flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
                  🥋
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-1">
                    <span>Sumo Master</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Raqibni dohyo doirasidan itarib chiqarildi.</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#121c33] border border-emerald-500/40 flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
                  ⚽
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-1">
                    <span>Top Scorer</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">RoboFootball musobaqasida darvozaga gol urildi.</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#121c33] border border-emerald-500/40 flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
                  💻
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-1">
                    <span>Python Engineer</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Robot avtonom Python kodi bilan harakatlandi.</div>
                </div>
              </div>
            </div>
          ) : (
            /* 37-Bosqich: Private Rooms */
            <div className="space-y-4 text-xs">
              <p className="text-slate-300">
                Do'stlaringiz bilan birga o'ynash uchun xususiy xona oching yoki xona kodini kiriting:
              </p>

              <div className="p-4 rounded-2xl bg-[#121b2f] border border-[#23355c] space-y-3">
                <div className="text-slate-300 font-semibold">Xona Kodingiz:</div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="#ROOM-7749"
                    className="flex-1 bg-[#0a0f1c] text-white font-mono px-3 py-2 rounded-xl border border-[#202f4e] focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (roomCode) {
                        alert(`🌐 "${roomCode}" xonasiga muvaffaqiyatli ulandingiz!`);
                        onClose();
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all cursor-pointer"
                  >
                    Xonaga Kirish
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#101728] border border-slate-800">
                <span className="text-slate-400">Yangi Xususiy Xona ochish:</span>
                <button
                  onClick={() => {
                    const newCode = `#ROOM-${Math.floor(1000 + Math.random() * 9000)}`;
                    setRoomCode(newCode);
                    alert(`✅ Yangi xona yaratildi: ${newCode}. Do'stlaringizga ushbu kodni ulashing!`);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all cursor-pointer"
                >
                  + Yangi Xona Yaratish
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 px-6 bg-[#0c1220] border-t border-[#1c2740] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Rasmiy RoboVerse Reytingi
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
