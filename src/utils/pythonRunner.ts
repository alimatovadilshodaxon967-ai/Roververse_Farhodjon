export interface ExecutionLog {
  timestamp: string;
  type: 'info' | 'output' | 'error' | 'success';
  message: string;
}

export interface SimulationState {
  distance: number;
  leftMotorSpeed: number;
  rightMotorSpeed: number;
  isBoosting: boolean;
  batteryPercent: number;
  robotX: number;
  robotZ: number;
  robotAngle: number;
  logs: ExecutionLog[];
  hasError: boolean;
  errorMessage?: string;
}

export class PythonVirtualSandbox {
  public validateSyntax(code: string): { isValid: boolean; error?: string } {
    // Quick syntax checks for Python keywords and structures
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('if ') || trimmed.startsWith('elif ') || trimmed.startsWith('while ') || trimmed.startsWith('for ') || trimmed.startsWith('else:')) {
        if (!trimmed.endsWith(':')) {
          return {
            isValid: false,
            error: `Sintaktik xatolik (Qator ${i + 1}): ':' belgisi qolib ketgan -> "${trimmed}"`,
          };
        }
      }
    }
    return { isValid: true };
  }

  public executeCycle(code: string, currentDistance: number, _battery: number): {
    leftSpeed: number;
    rightSpeed: number;
    isBoost: boolean;
    logs: ExecutionLog[];
    hasError: boolean;
    errorMessage?: string;
  } {
    const syntax = this.validateSyntax(code);
    if (!syntax.isValid) {
      return {
        leftSpeed: 0,
        rightSpeed: 0,
        isBoost: false,
        logs: [
          {
            timestamp: new Date().toLocaleTimeString(),
            type: 'error',
            message: syntax.error || 'Noma\'lum sintaksis xatoligi',
          },
        ],
        hasError: true,
        errorMessage: syntax.error,
      };
    }

    let leftSpeed = 1.0;
    let rightSpeed = 1.0;
    let isBoost = false;

    // Simulate behavior matching code
    if (code.includes('sensor.get_distance()') || code.includes('distance_sensor.get_distance()')) {
      if (currentDistance < 20) {
        // Obstacle near
        if (code.includes('sumo') || code.includes('Full Turbo')) {
          leftSpeed = 1.0;
          rightSpeed = 1.0;
          isBoost = true;
        } else {
          // Avoid obstacle: turn
          leftSpeed = 0.5;
          rightSpeed = -0.5;
        }
      } else {
        // Path clear
        leftSpeed = 1.0;
        rightSpeed = 1.0;
      }
    }

    const now = new Date().toLocaleTimeString();
    const cycleLogs: ExecutionLog[] = [
      {
        timestamp: now,
        type: 'info',
        message: `Datchik o'qildi: ${currentDistance.toFixed(1)} sm | Motorlar: [L: ${(leftSpeed * 100).toFixed(0)}%, R: ${(rightSpeed * 100).toFixed(0)}%]`,
      },
    ];

    return {
      leftSpeed,
      rightSpeed,
      isBoost,
      logs: cycleLogs,
      hasError: false,
    };
  }
}
