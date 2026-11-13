import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Code2, 
  BookOpen, 
  Copy, 
  Sparkles, 
  FileCode2,
  Terminal,
  Blocks
} from 'lucide-react';
import type { ExecutionLog } from '../utils/robotRuntime';

interface CodeEditorPanelProps {
  code: string;
  onChangeCode: (code: string) => void;
  onRunCode: () => void;
  isSimulating: boolean;
  logs?: ExecutionLog[];
  language?: 'python' | 'arduino';
  onChangeLanguage?: (lang: 'python' | 'arduino') => void;
}

const TEMPLATES: { [key: string]: { title: string; lang: 'python' | 'arduino'; code: string } } = {
  roboracer: {
    title: '🏎️ Python: RoboRacer (To\'siqlarni aylanib o\'tish)',
    lang: 'python',
    code: `from robot import Robot
from sensors import DistanceSensor
from motors import Motor

robot = Robot()
sensor = DistanceSensor(port=0)
left_motor = Motor(port=1)
right_motor = Motor(port=2)

print("🏎️ RoboRacer avtonom rejimi ishga tushdi!")

while True:
    distance = sensor.get_distance()
    
    # Agar 20 sm dan yaqin to'siq bo'lsa, chapga buril
    if distance < 20:
        print("⚠️ To'siq aniqlandi! Masofa:", distance, "sm")
        left_motor.set_speed(0.4)
        right_motor.set_speed(-0.6)
    else:
        # Yo'l ochiq - maksimal tezlik
        left_motor.set_speed(1.0)
        right_motor.set_speed(1.0)`,
  },
  sumo: {
    title: '🥋 Python: RoboSumo (Raqibni surib chiqarish)',
    lang: 'python',
    code: `from robot import Robot
from sensors import DistanceSensor, FloorSensor
from motors import Motor

robot = Robot()
distance_sensor = DistanceSensor(port=0)
floor_sensor = FloorSensor(port=1)
left_motor = Motor(port=1)
right_motor = Motor(port=2)

print("🥋 RoboSumo jangga tayyor!")

while True:
    # Tatami oq chizig'idan qochish
    if floor_sensor.detects_white_line():
        print("⚠️ Chegara! Orqaga qaytish")
        left_motor.set_speed(-0.8)
        right_motor.set_speed(-0.8)
        continue

    enemy_dist = distance_sensor.get_distance()
    if enemy_dist < 40:
        print("🔥 Raqib topildi! Turbo hujum!")
        robot.boost(duration_sec=0.5)
        left_motor.set_speed(1.0)
        right_motor.set_speed(1.0)
    else:
        # Raqibni qidirib 360 daraja aylanish
        left_motor.set_speed(0.5)
        right_motor.set_speed(-0.5)`,
  },
  linefollower: {
    title: '〰️ Python: Line Follower (Trassa poygasi)',
    lang: 'python',
    code: `from robot import Robot
from sensors import LineSensorArray
from motors import Motor

robot = Robot()
line_sensors = LineSensorArray() # [chap, o'rta, o'ng]
left_motor = Motor(port=1)
right_motor = Motor(port=2)

base_speed = 0.8
kp = 0.5 # Proporsional koeffitsiyent

while True:
    offset = line_sensors.get_line_offset() # -1.0 dan +1.0 gacha
    
    left_motor.set_speed(base_speed + offset * kp)
    right_motor.set_speed(base_speed - offset * kp)`,
  },
  arduino_avoid: {
    title: '⚡ Arduino C++: To\'siqlarni aylanib o\'tish',
    lang: 'arduino',
    code: `// Arduino Uno R3 Robot Boshqaruvi
#define TRIG_PIN 9
#define ECHO_PIN 10
#define MOTOR_LEFT_PWM 5
#define MOTOR_RIGHT_PWM 6

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(MOTOR_LEFT_PWM, OUTPUT);
  pinMode(MOTOR_RIGHT_PWM, OUTPUT);
  Serial.println("Arduino Robot tayyor!");
}

void loop() {
  // Ultratovush impulsini jo'natish
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = duration * 0.034 / 2;

  if (distance < 20.0) {
    Serial.println("To'siq! Chapga burilish");
    analogWrite(MOTOR_LEFT_PWM, 50);
    analogWrite(MOTOR_RIGHT_PWM, 220);
  } else {
    // To'g'riga harakat
    analogWrite(MOTOR_LEFT_PWM, 255);
    analogWrite(MOTOR_RIGHT_PWM, 255);
  }
}`,
  },
};

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  code,
  onChangeCode,
  logs = [],
  language = 'python',
  onChangeLanguage,
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'terminal' | 'api' | 'blocks'>('code');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectTemplate = (templateKey: string) => {
    if (TEMPLATES[templateKey]) {
      const t = TEMPLATES[templateKey];
      if (onChangeLanguage) {
        onChangeLanguage(t.lang);
      }
      onChangeCode(t.code);
    }
  };

  return (
    <div className="flex-1 bg-[#0b0f19] flex flex-col border-t border-[#1c2438] select-none min-h-[280px]">
      {/* Top Tabs */}
      <div className="h-10 px-4 bg-[#0e1424] border-b border-[#1c2740] flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'code'
                ? 'border-blue-500 text-blue-400 bg-[#141d33]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Kod Muharriri</span>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'terminal'
                ? 'border-emerald-500 text-emerald-400 bg-[#141d33]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Konsol (Terminal)</span>
            {logs.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('blocks')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'blocks'
                ? 'border-purple-500 text-purple-400 bg-[#141d33]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Blocks className="w-3.5 h-3.5" />
            <span>Vizual Bloklar</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'api'
                ? 'border-blue-500 text-blue-400 bg-[#141d33]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Robot API</span>
          </button>
        </div>

        {/* Right Options */}
        <div className="flex items-center space-x-2">
          {/* Templates Selector */}
          <div className="flex items-center space-x-1">
            <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
            <select
              onChange={(e) => handleSelectTemplate(e.target.value)}
              defaultValue="roboracer"
              className="bg-[#152038] text-slate-200 text-[11px] px-2 py-0.5 rounded border border-[#23355c] focus:outline-none cursor-pointer"
            >
              <option value="roboracer">🏎️ Python: RoboRacer</option>
              <option value="sumo">🥋 Python: RoboSumo</option>
              <option value="linefollower">〰️ Python: LineFollower</option>
              <option value="arduino_avoid">⚡ Arduino C++: To'siqlar</option>
            </select>
          </div>

          {/* Language Switcher */}
          {onChangeLanguage && (
            <div className="flex items-center space-x-1 bg-[#152038] p-0.5 rounded border border-[#23355c]">
              <button
                onClick={() => onChangeLanguage('python')}
                className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${
                  language === 'python' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Python
              </button>
              <button
                onClick={() => onChangeLanguage('arduino')}
                className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${
                  language === 'arduino' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Arduino C++
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-[#151f36] px-2 py-0.5 rounded border border-[#223154] cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            <span>{copied ? 'Nusxalandi' : 'Nusxa'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'code' ? (
          <div className="w-full h-full">
            <Editor
              height="100%"
              language={language === 'arduino' ? 'cpp' : 'python'}
              theme="vs-dark"
              value={code}
              onChange={(value) => onChangeCode(value || '')}
              options={{
                fontSize: 12,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 4,
                lineNumbersMinChars: 3,
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                padding: { top: 8, bottom: 8 },
              }}
            />
          </div>
        ) : activeTab === 'terminal' ? (
          /* Live Terminal / Serial Monitor */
          <div className="w-full h-full p-3 bg-[#070b12] text-xs font-mono overflow-y-auto space-y-1 text-slate-300">
            <div className="pb-2 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>📡 Robot Serial / Print Konsoli ({logs.length} ta yozuv)</span>
              <span className="text-emerald-400 font-mono">Baudrate: 9600</span>
            </div>
            {logs.length === 0 ? (
              <div className="text-slate-500 py-6 text-center italic">
                Hozircha xabarlar yo'q. Simulyatsiyani ishga tushirsangiz robot chiqargan ma'lumotlar shu yerda ko'rinadi.
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-start space-x-2 leading-relaxed">
                  <span className="text-slate-500 text-[10px] shrink-0">[{log.timestamp}]</span>
                  <span
                    className={
                      log.type === 'error'
                        ? 'text-red-400 font-bold'
                        : log.type === 'output'
                        ? 'text-cyan-300'
                        : 'text-slate-300'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'blocks' ? (
          /* Visual Blocks (Scratch-like) */
          <div className="w-full h-full p-4 overflow-y-auto bg-[#090e1a] text-xs space-y-3">
            <div className="flex items-center space-x-2 text-white pb-2 border-b border-slate-800">
              <Blocks className="w-4 h-4 text-purple-400" />
              <span className="font-bold">Vizual Blokli Dasturlash (Scratch / Blockly Rejimi)</span>
            </div>
            <p className="text-slate-400 text-xs">
              Yangi boshlovchilar bloklarni qo'shib o'z dasturini tuza oladilar:
            </p>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-200 flex items-center justify-between">
                <span>[Agar Masofa &lt; 20 sm] ➔ [Chapga 90° buril]</span>
                <button
                  onClick={() => handleSelectTemplate('roboracer')}
                  className="px-2 py-1 rounded bg-blue-600 text-white text-[11px] font-semibold cursor-pointer"
                >
                  Kodga joylash
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-center justify-between">
                <span>[Har doim] ➔ [Oq/Qora chiziqni kuzatish (Line Follower)]</span>
                <button
                  onClick={() => handleSelectTemplate('linefollower')}
                  className="px-2 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold cursor-pointer"
                >
                  Kodga joylash
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 flex items-center justify-between">
                <span>[Agar Raqib Ko'rinsa] ➔ [Turbo Quvvatni Yoq va Hujum Qil]</span>
                <button
                  onClick={() => handleSelectTemplate('sumo')}
                  className="px-2 py-1 rounded bg-amber-600 text-white text-[11px] font-semibold cursor-pointer"
                >
                  Kodga joylash
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* API Documentation */
          <div className="w-full h-full p-4 overflow-y-auto bg-[#0a0e18] text-xs font-mono space-y-3">
            <div className="flex items-center space-x-2 text-white pb-2 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="font-bold">RoboVerse Python & Arduino API</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#121b2f] border border-[#213254] space-y-1">
                <div className="text-blue-400 font-bold">sensor.get_distance()</div>
                <div className="text-slate-300 text-[11px]">
                  Oldindagi to'siqqacha bo'lgan masofani sm da qaytaradi.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#121b2f] border border-[#213254] space-y-1">
                <div className="text-blue-400 font-bold">left_motor.set_speed(val)</div>
                <div className="text-slate-300 text-[11px]">
                  Motor tezligini belgilaydi (-1.0 dan +1.0 gacha).
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#121b2f] border border-[#213254] space-y-1">
                <div className="text-emerald-400 font-bold">line_sensors.get_line_offset()</div>
                <div className="text-slate-300 text-[11px]">
                  Chiziqdan og'ish burchagi (-1.0 chap, 0 o'rta, +1.0 o'ng).
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#121b2f] border border-[#213254] space-y-1">
                <div className="text-purple-400 font-bold">robot.boost(duration_sec)</div>
                <div className="text-slate-300 text-[11px]">
                  Turbo tezlanishni faollashtiradi.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
