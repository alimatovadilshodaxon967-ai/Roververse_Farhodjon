import React, { useState } from 'react';
import { 
  Trophy, 
  Users, 
  Check, 
  Clock, 
  Flame, 
  Activity, 
  Box, 
  ChevronRight
} from 'lucide-react';
import type { Competition } from '../../types/arena';
import { AllTournamentsModal } from './AllTournamentsModal';
import { soundEffects } from '../../utils/audioEffects';

const COMPETITIONS: Competition[] = [
  {
    id: 'sumo',
    name: 'RoboSumo',
    startTime: 'Boshlanish vaqti: 18:00',
    participants: '4/16',
    icon: 'sumo',
    mode: 'sumo',
  },
  {
    id: 'football',
    name: 'RoboFootball',
    startTime: 'Boshlanish vaqti: 19:00',
    participants: '8/16',
    icon: 'football',
    mode: 'football',
  },
  {
    id: 'line',
    name: 'Line Follower',
    startTime: 'Boshlanish vaqti: 20:00',
    participants: '12/32',
    icon: 'line',
    mode: 'line',
  },
  {
    id: 'warehouse',
    name: 'Warehouse Challenge',
    startTime: 'Boshlanish vaqti: 21:00',
    participants: '6/16',
    icon: 'warehouse',
    mode: 'warehouse',
  },
];

export const ArenaCompetitionsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tournaments' | 'friends'>('tournaments');
  const [joinedMatches, setJoinedMatches] = useState<{ [key: string]: boolean }>({ sumo: true });
  const [isAllTournamentsOpen, setIsAllTournamentsOpen] = useState(false);

  const handleToggleJoin = (id: string, name: string) => {
    soundEffects.playClickSound();
    setJoinedMatches((prev) => {
      const isCurrentlyJoined = prev[id];
      const updated = { ...prev, [id]: !isCurrentlyJoined };
      if (!isCurrentlyJoined) {
        soundEffects.playGoalSound();
        alert(`🏆 "${name}" turniriga muvaffaqiyatli ro'yxatdan o'tdingiz! Boshlanish vaqtida avtomatik arenaga chaqirilasiz.`);
      }
      return updated;
    });
  };

  return (
    <>
      <div className="flex-1 bg-[#0d1424] flex flex-col h-full overflow-hidden select-none">
        {/* Top Tabs */}
        <div className="h-10 px-4 bg-[#0a0f1c] border-b border-[#1c2742] flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('tournaments')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-all border-b-2 cursor-pointer ${
                activeTab === 'tournaments'
                  ? 'border-blue-500 text-blue-400 bg-[#121b2f]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Musobaqalar</span>
            </button>

            <button
              onClick={() => setActiveTab('friends')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all border-b-2 cursor-pointer ${
                activeTab === 'friends'
                  ? 'border-blue-500 text-blue-400 bg-[#121b2f]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Do'stlar</span>
            </button>
          </div>

          <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            Arena v2.4
          </span>
        </div>

        {/* Competitions Cards List */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-2">
          {activeTab === 'tournaments' ? (
            COMPETITIONS.map((c) => {
              const isJoined = joinedMatches[c.id];

              return (
                <div
                  key={c.id}
                  className="p-2.5 rounded-2xl bg-[#101729] border border-[#1e2b47] hover:border-blue-500/40 transition-all flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#152038] border border-[#223357] flex items-center justify-center text-lg">
                      {c.icon === 'sumo' && <Flame className="w-5 h-5 text-red-400" />}
                      {c.icon === 'football' && '⚽'}
                      {c.icon === 'line' && <Activity className="w-5 h-5 text-cyan-400" />}
                      {c.icon === 'warehouse' && <Box className="w-5 h-5 text-amber-400" />}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white tracking-wide">
                        {c.name}
                      </h4>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {c.startTime}
                        </span>
                        <span>•</span>
                        <span className="text-blue-400 font-semibold">{c.participants}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleJoin(c.id, c.name)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer shadow-md ${
                      isJoined
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Qo'shildingiz</span>
                      </>
                    ) : (
                      <span>Qo'shilish</span>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            /* Friends Tab */
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#101729] border border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                  <div>
                    <span className="font-semibold text-white block">ShadowX</span>
                    <span className="text-[10px] text-slate-400">RoboSumo Arenada jang qilmoqda</span>
                  </div>
                </div>
                <button
                  onClick={() => alert("ShadowX o'yinchisiga do'stlik taklifi yuborildi!")}
                  className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[11px] hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                >
                  Kuzatish
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#101729] border border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  <div>
                    <span className="font-semibold text-white block">Zephyr</span>
                    <span className="text-[10px] text-slate-400">Speed Racing mashg'ulotida</span>
                  </div>
                </div>
                <button
                  onClick={() => alert("Zephyr o'yinchisiga xonaga chaqiruv jo'natildi!")}
                  className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[11px] hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                >
                  Xonaga taklif
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 37-Bosqich: Barcha musobaqalar jadvali modal ochish tugmasi */}
        <div className="p-2.5 bg-[#0a0f1c] border-t border-[#1c2742]">
          <button
            onClick={() => {
              soundEffects.playClickSound();
              setIsAllTournamentsOpen(true);
            }}
            className="w-full py-2 rounded-xl bg-[#141e33] hover:bg-[#1b2845] text-slate-300 hover:text-white text-xs font-semibold border border-[#223154] flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm"
          >
            <span>Barcha musobaqalarni ko'rish</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      <AllTournamentsModal
        isOpen={isAllTournamentsOpen}
        onClose={() => setIsAllTournamentsOpen(false)}
      />
    </>
  );
};
