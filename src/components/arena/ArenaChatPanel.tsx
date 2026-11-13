import React, { useState } from 'react';
import { 
  MessageSquare, 
  Users, 
  Trophy, 
  Send, 
  Sparkles,
  Smile
} from 'lucide-react';
import type { ChatMessage } from '../../types/arena';
import { soundEffects } from '../../utils/audioEffects';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm-1',
    sender: 'ShadowX',
    isSelf: false,
    text: 'Yaxshi harakat! 👍',
    time: '14:22',
  },
  {
    id: 'm-2',
    sender: 'Zephyr',
    isSelf: false,
    text: 'Sizning robot juda kuchli ekan!',
    time: '14:23',
  },
  {
    id: 'm-3',
    sender: 'You',
    isSelf: true,
    text: 'Rahmat! Endi strategiyani o\'zgartiraman.',
    time: '14:24',
  },
  {
    id: 'm-4',
    sender: 'Falcon',
    isSelf: false,
    text: 'Raqobat juda qiziqarli! 🔥',
    time: '14:26',
  },
  {
    id: 'm-5',
    sender: 'NightBot',
    isSelf: false,
    text: 'O\'yin 1 da yakunlandi. Natija: You - 1st 👑',
    time: '14:27',
    isSystem: true,
  },
];

const QUICK_EMOTES = [
  '👍 Zo\'r harakat!',
  '🔥 Turbo!',
  '⚠️ Ehtiyot bo\'l!',
  '👑 GG! (G\'alaba)',
];

export const ArenaChatPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'team' | 'ranks'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');

  const sendText = (text: string) => {
    soundEffects.playClickSound();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'You',
      isSelf: true,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);

    setTimeout(() => {
      const bots = ['ShadowX', 'Zephyr', 'RoboKing', 'Falcon'];
      const replies = [
        "Ajoyib taktika bo'ldi! 🔥",
        "Keyingi raundda yangi kod bilan chiqaman!",
        "Tezlikni oshirish kerak edi ⚡",
        "Maydon markazini himoya qiling!",
      ];
      const randomBot = bots[Math.floor(Math.random() * bots.length)];
      const randomText = replies[Math.floor(Math.random() * replies.length)];

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: randomBot,
          isSelf: false,
          text: randomText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1800);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendText(inputValue);
    setInputValue('');
  };

  return (
    <div className="flex-1 bg-[#0d1424] border-r border-[#1c2742] flex flex-col h-full overflow-hidden select-none">
      {/* Top Tabs */}
      <div className="h-10 px-4 bg-[#0a0f1c] border-b border-[#1c2742] flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'chat'
                ? 'border-blue-500 text-blue-400 bg-[#121b2f]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all border-b-2 cursor-pointer ${
              activeTab === 'team'
                ? 'border-blue-500 text-blue-400 bg-[#121b2f]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Jamoa</span>
          </button>

          <button
            onClick={() => setActiveTab('ranks')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all border-b-2 cursor-pointer ${
              activeTab === 'ranks'
                ? 'border-blue-500 text-blue-400 bg-[#121b2f]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Reyting</span>
          </button>
        </div>

        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          8 O'yinchi
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.isSystem
                ? 'bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl text-amber-300'
                : ''
            }`}
          >
            {!m.isSystem && (
              <div className="flex items-center space-x-2 mb-0.5">
                <span
                  className={`font-semibold text-[11px] ${
                    m.isSelf ? 'text-blue-400' : 'text-slate-300'
                  }`}
                >
                  {m.sender}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{m.time}</span>
              </div>
            )}
            <div
              className={`${
                m.isSystem
                  ? 'font-medium flex items-center gap-1 text-[11px]'
                  : m.isSelf
                  ? 'text-slate-100 bg-[#152038] p-2 rounded-xl border border-blue-500/30'
                  : 'text-slate-300 bg-[#101728] p-2 rounded-xl border border-slate-800'
              }`}
            >
              {m.isSystem && <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              <span>{m.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 36-Bosqich: Quick Tactical Emote Buttons */}
      <div className="px-3 py-1.5 bg-[#0a0f1c] border-t border-[#1c2742] flex items-center space-x-1.5 overflow-x-auto">
        <Smile className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
        {QUICK_EMOTES.map((emote, idx) => (
          <button
            key={idx}
            onClick={() => sendText(emote)}
            className="text-[10px] text-slate-300 bg-[#152038] hover:bg-[#1f2f52] px-2 py-0.5 rounded-lg border border-[#23355c] whitespace-nowrap transition-all cursor-pointer"
          >
            {emote}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={handleSendMessage}
        className="h-12 px-3 bg-[#0a0f1c] border-t border-[#1c2742] flex items-center space-x-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Xabar yozing..."
          className="flex-1 bg-[#131d33] text-white text-xs px-3 py-2 rounded-xl border border-[#223154] focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
