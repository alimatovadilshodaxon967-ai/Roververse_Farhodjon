/**
 * RoboVerse Robot Simulation Runtime Engine
 * Supports real Python-like execution and Arduino C++ syntax execution
 */

export interface ExecutionLog {
  timestamp: string;
  type: 'info' | 'output' | 'error' | 'success';
  message: string;
}

export interface RobotHardwareState {
  // Sensor inputs
  distance: number;               // sm (ultrasonic)
  lineOffsets: [number, number, number]; // [left, center, right] (0: white, 1: black)
  lidarRanges: number[];          // 16 points 360-deg distances
  batteryVoltage: number;         // V
  batteryPercent: number;         // 0-100%
  headingAngle: number;           // radians or degrees
  isColliding: boolean;

  // Actuator outputs
  leftMotorSpeed: number;         // -1.0 to 1.0
  rightMotorSpeed: number;        // -1.0 to 1.0
  servoAngle: number;             // 0 to 180 degrees
  isBoosting: boolean;
  ledColor?: string;

  // Execution meta
  logs: ExecutionLog[];
  errors: string[];
}

export type SupportedLanguage = 'python' | 'arduino';

export class RobotRuntimeEngine {
  private variables: Record<string, any> = {};
  private logs: ExecutionLog[] = [];
  private errors: string[] = [];
  private arduinoState = {
    pins: {} as Record<number, number>, // pin -> value (0-255)
    setupDone: false,
  };

  public reset() {
    this.variables = {};
    this.logs = [];
    this.errors = [];
    this.arduinoState = { pins: {}, setupDone: false };
  }

  private addLog(type: ExecutionLog['type'], message: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.push({ timestamp, type, message });
    if (this.logs.length > 100) this.logs.shift();
  }

  /**
   * Executes a single simulation step based on the provided code and sensor readings.
   */
  public executeStep(
    language: SupportedLanguage,
    code: string,
    hardware: {
      distance: number;
      lineOffsets: [number, number, number];
      lidarRanges: number[];
      batteryPercent: number;
    }
  ): {
    leftSpeed: number;
    rightSpeed: number;
    servoAngle: number;
    isBoost: boolean;
    logs: ExecutionLog[];
    errors: string[];
  } {
    this.logs = [];
    this.errors = [];

    let leftSpeed = 0;
    let rightSpeed = 0;
    let servoAngle = 90;
    let isBoost = false;

    if (language === 'arduino') {
      const res = this.executeArduinoCycle(code, hardware);
      leftSpeed = res.leftSpeed;
      rightSpeed = res.rightSpeed;
      servoAngle = res.servoAngle;
      isBoost = res.isBoost;
    } else {
      const res = this.executePythonCycle(code, hardware);
      leftSpeed = res.leftSpeed;
      rightSpeed = res.rightSpeed;
      servoAngle = res.servoAngle;
      isBoost = res.isBoost;
    }

    return {
      leftSpeed: Math.max(-1, Math.min(1, leftSpeed)),
      rightSpeed: Math.max(-1, Math.min(1, rightSpeed)),
      servoAngle,
      isBoost,
      logs: this.logs,
      errors: this.errors,
    };
  }

  /**
   * Python-like Interpreter Sandbox
   */
  private executePythonCycle(
    code: string,
    hw: {
      distance: number;
      lineOffsets: [number, number, number];
      lidarRanges: number[];
      batteryPercent: number;
    }
  ) {
    let leftSpeed = 0;
    let rightSpeed = 0;
    let servoAngle = 90;
    let isBoost = false;

    // Define virtual environment API accessible to user's Python code
    const virtualEnv = {
      // Robot API
      robot: {
        set_motors: (l: number, r: number) => {
          leftSpeed = Number(l);
          rightSpeed = Number(r);
        },
        boost: (duration_sec = 0.5) => {
          isBoost = true;
          this.addLog('info', `🚀 Full Turbo Boost faollashdi! (${duration_sec}s)`);
        },
        get_battery: () => hw.batteryPercent,
      },
      // Left / Right Motor abstractions
      left_motor: {
        set_speed: (spd: number) => { leftSpeed = Number(spd); },
        stop: () => { leftSpeed = 0; },
      },
      right_motor: {
        set_speed: (spd: number) => { rightSpeed = Number(spd); },
        stop: () => { rightSpeed = 0; },
      },
      // Servo motor
      servo: {
        set_angle: (angle: number) => { servoAngle = Number(angle); },
      },
      // Sensors
      sensor: {
        get_distance: () => hw.distance,
      },
      distance_sensor: {
        get_distance: () => hw.distance,
      },
      line_sensors: {
        get_line_offset: () => {
          // returns offset -1 (far left) to +1 (far right)
          const [l, c, r] = hw.lineOffsets;
          if (c > 0.5) return 0;
          if (l > 0.5) return -0.8;
          if (r > 0.5) return 0.8;
          return 0;
        },
        read_all: () => hw.lineOffsets,
      },
      floor_sensor: {
        detects_white_line: () => hw.lineOffsets[0] > 0.8 || hw.lineOffsets[2] > 0.8,
      },
      lidar: {
        get_min_distance: () => Math.min(...hw.lidarRanges),
        get_ranges: () => hw.lidarRanges,
      },
      // Math & Builtins
      math: Math,
      print: (...args: any[]) => {
        const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        this.addLog('output', text);
      },
      // Classes for instantiation if user does `Motor(1)` etc
      Robot: function () { return virtualEnv.robot; },
      DistanceSensor: function () { return virtualEnv.sensor; },
      Motor: function (port: any) {
        if (port === 1 || port === 'left') return virtualEnv.left_motor;
        return virtualEnv.right_motor;
      },
      LineSensorArray: function () { return virtualEnv.line_sensors; },
      FloorSensor: function () { return virtualEnv.floor_sensor; },
      LidarScanner: function () { return virtualEnv.lidar; },
    };

    try {
      // Transpile simple python code lines into JS safe statements
      const sanitizedJs = this.transpilePythonToJs(code);
      const runner = new Function('env', 'vars', `
        with(env) {
          with(vars) {
            ${sanitizedJs}
          }
        }
      `);

      runner(virtualEnv, this.variables);
    } catch (err: any) {
      this.errors.push(`Python xatoligi: ${err.message}`);
      this.addLog('error', `Qatorda xatolik yuz berdi: ${err.message}`);
    }

    return { leftSpeed, rightSpeed, servoAngle, isBoost };
  }

  /**
   * Transpiles Python control flow (while True, if/elif, True/False, not, and, or)
   * into a single-iteration execution block suitable for simulation cycles.
   */
  private transpilePythonToJs(pythonCode: string): string {
    const lines = pythonCode.split('\n');
    const transformed: string[] = [];

    for (let rawLine of lines) {
      let line = rawLine;

      // Skip imports
      if (line.trim().startsWith('from ') || line.trim().startsWith('import ')) {
        continue;
      }

      // Convert while True: -> if (true) { to avoid blocking infinite loop in simulation frame
      if (line.trim().startsWith('while True:') || line.trim().startsWith('while 1:')) {
        line = line.replace(/while\s+(True|1)\s*:/, 'if (true) {');
        transformed.push(line);
        continue;
      }

      // elif -> else if
      line = line.replace(/\belif\b/g, 'else if');

      // Python booleans and logical operators
      line = line.replace(/\bTrue\b/g, 'true');
      line = line.replace(/\bFalse\b/g, 'false');
      line = line.replace(/\band\b/g, '&&');
      line = line.replace(/\bor\b/g, '||');
      line = line.replace(/\bnot\s+/g, '!');

      // if condition: -> if (condition) {
      const ifMatch = line.match(/^(\s*)(if|else if)\s+(.+):$/);
      if (ifMatch) {
        line = `${ifMatch[1]}${ifMatch[2]} (${ifMatch[3]}) {`;
        transformed.push(line);
        continue;
      }

      // else: -> else {
      const elseMatch = line.match(/^(\s*)else\s*:$/);
      if (elseMatch) {
        line = `${elseMatch[1]}else {`;
        transformed.push(line);
        continue;
      }

      // For normal lines, keep them
      transformed.push(line);
    }

    // Auto-balance curly braces based on python indentation
    return this.autoBracePython(transformed);
  }

  private autoBracePython(lines: string[]): string {
    const output: string[] = [];
    const indentStack: number[] = [0];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim() || line.trim().startsWith('#')) {
        continue;
      }

      const indent = line.search(/\S/);

      while (indentStack.length > 1 && indent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        output.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
      }

      output.push(line);

      if (line.trim().endsWith('{')) {
        indentStack.push(indent + 2);
      }
    }

    while (indentStack.length > 1) {
      indentStack.pop();
      output.push('}');
    }

    return output.join('\n');
  }

  /**
   * Arduino C++ Interpreter Sandbox
   */
  private executeArduinoCycle(
    code: string,
    hw: {
      distance: number;
      lineOffsets: [number, number, number];
      lidarRanges: number[];
      batteryPercent: number;
    }
  ) {
    let leftSpeed = 0;
    let rightSpeed = 0;
    let servoAngle = 90;
    let isBoost = false;

    // Emulate PWM pins (D5: Left Motor PWM, D6: Right Motor PWM, D9: Trig, D10: Echo)
    const pins = this.arduinoState.pins;

    const arduinoEnv = {
      HIGH: 1,
      LOW: 0,
      OUTPUT: 'OUTPUT',
      INPUT: 'INPUT',
      pinMode: (_pin: number, _mode: string) => {
        // config pin
      },
      digitalWrite: (pin: number, val: number) => {
        pins[pin] = val ? 255 : 0;
      },
      analogWrite: (pin: number, val: number) => {
        pins[pin] = Math.max(0, Math.min(255, val));
      },
      digitalRead: (pin: number) => {
        if (pin === 2) return hw.lineOffsets[0] > 0.5 ? 1 : 0; // Left IR
        if (pin === 3) return hw.lineOffsets[2] > 0.5 ? 1 : 0; // Right IR
        return pins[pin] ? 1 : 0;
      },
      analogRead: (pin: number) => {
        if (pin === 0) return Math.round((hw.distance / 400) * 1023);
        return 0;
      },
      pulseIn: (_echoPin: number, _val: number) => {
        // HC-SR04 pulse duration in microseconds (distance * 58)
        return Math.round(hw.distance * 58);
      },
      delay: (_ms: number) => {
        // simulated tick
      },
      delayMicroseconds: (_us: number) => {},
      millis: () => Date.now(),
      Serial: {
        begin: (_baud: number) => {},
        println: (...args: any[]) => {
          this.addLog('output', `[Serial] ` + args.join(' '));
        },
        print: (...args: any[]) => {
          this.addLog('output', `[Serial] ` + args.join(' '));
        },
      },
    };

    try {
      // Extract setup and loop function bodies
      const loopMatch = code.match(/void\s+loop\s*\(\s*\)\s*\{([\s\S]*)\}/);
      const loopBody = loopMatch ? loopMatch[1] : code;

      // Clean C++ types: int, float, double, bool, long
      const cleanedBody = loopBody
        .replace(/\b(int|float|double|long|unsigned|bool|char)\s+/g, 'let ')
        .replace(/\bconst\s+let\b/g, 'const');

      const runner = new Function('arduino', 'vars', `
        with(arduino) {
          with(vars) {
            ${cleanedBody}
          }
        }
      `);

      runner(arduinoEnv, this.variables);

      // Map Arduino PWM Pins (5 and 6) to Left / Right motor speeds (-1.0 to 1.0)
      if (pins[5] !== undefined) {
        leftSpeed = (pins[5] / 255) * 2 - 1; // 0..255 -> -1..1
      }
      if (pins[6] !== undefined) {
        rightSpeed = (pins[6] / 255) * 2 - 1;
      }
    } catch (err: any) {
      this.errors.push(`Arduino C++ xatoligi: ${err.message}`);
      this.addLog('error', `Arduino kodi xatosi: ${err.message}`);
    }

    return { leftSpeed, rightSpeed, servoAngle, isBoost };
  }
}

export const runtimeEngine = new RobotRuntimeEngine();
