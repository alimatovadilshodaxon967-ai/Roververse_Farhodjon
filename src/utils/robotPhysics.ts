/**
 * RoboVerse Physical Simulation Engine
 * Handles Differential Drive Kinematics, Mass/Inertia, Collision, and Sensor Raycasting
 */

export interface Vector2D {
  x: number;
  z: number;
}

export interface ObstacleBox {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
}

export interface PhysicsRobotState {
  x: number;
  z: number;
  rotation: number;          // Yaw angle in radians (0 is forward along +X)
  linearVelocity: number;    // m/s
  angularVelocity: number;   // rad/s
  leftWheelRot: number;      // Wheel animation rotation radians
  rightWheelRot: number;
  isCollided: boolean;
}

export class RobotPhysicsEngine {
  // Physical parameters
  public wheelBase: number = 0.32;       // Distance between wheels in meters
  public wheelRadius: number = 0.045;    // Wheel radius in meters
  public maxSpeed: number = 1.8;         // Maximum speed in m/s
  public mass: number = 1.2;             // Robot mass in kg
  public frictionCoeff: number = 0.85;   // Grip friction
  public activeArena: 'obstacle' | 'line' | 'sumo' = 'obstacle';

  // Arena Boundaries & Obstacles
  public arenaSize: number = 10;         // 10x10 meters
  public obstacles: ObstacleBox[] = [
    { id: 'cube-1', x: 2.2, z: 0.0, width: 0.6, depth: 0.8 },
    { id: 'cube-2', x: -1.8, z: 2.2, width: 0.8, depth: 0.8 },
    { id: 'cube-3', x: 0.5, z: -2.5, width: 0.5, depth: 1.2 },
    { id: 'pillar-center', x: -2.0, z: -1.5, width: 0.7, depth: 0.7 },
  ];

  /**
   * Updates robot kinematics and positions for a time delta (dt)
   */
  public updateStep(
    state: PhysicsRobotState,
    targetLeftSpeed: number,   // -1.0 to 1.0
    targetRightSpeed: number,  // -1.0 to 1.0
    dt: number,
    isBoosting: boolean = false
  ): PhysicsRobotState {
    const boostMultiplier = isBoosting ? 1.6 : 1.0;
    const targetVL = targetLeftSpeed * this.maxSpeed * boostMultiplier;
    const targetVR = targetRightSpeed * this.maxSpeed * boostMultiplier;

    // Mass inertia: acceleration rate inversely proportional to mass
    const accelRate = (6.0 / Math.max(0.4, this.mass)) * dt;
    const targetLinearVel = (targetVL + targetVR) / 2;
    const targetAngularVel = (targetVR - targetVL) / this.wheelBase;

    // Smooth approach to target velocities (inertia)
    const newLinearVel = state.linearVelocity + (targetLinearVel - state.linearVelocity) * Math.min(1, accelRate);
    const newAngularVel = state.angularVelocity + (targetAngularVel - state.angularVelocity) * Math.min(1, accelRate * 1.5);

    // Update orientation
    let newRotation = state.rotation + newAngularVel * dt;

    // Forward displacement along current heading (X = forward cos, Z = forward sin)
    const forwardX = Math.cos(newRotation);
    const forwardZ = Math.sin(newRotation);

    let nextX = state.x + forwardX * newLinearVel * dt;
    let nextZ = state.z + forwardZ * newLinearVel * dt;
    let resolvedLinearVel = newLinearVel;

    // 🛑 RIGID-BODY COLLISION RESOLUTION (Robot shakllar ichiga kirib ketishdan 100% qat'iy himoya)
    // 3D fizik o'lchamlardan kelib chiqadigan aniq yo'naltirilgan xavfsizlik yarim-o'qlari (1.4m x 1.0m korpus + g'ildiraklar + datchiklar)
    const halfLen = 0.76;  // Burun uchidan markazgacha masofa
    const halfWidth = 0.65; // Markazdan g'ildirak tashqi qirrasigacha masofa
    const extX = halfLen * Math.abs(Math.cos(newRotation)) + halfWidth * Math.abs(Math.sin(newRotation));
    const extZ = halfLen * Math.abs(Math.sin(newRotation)) + halfWidth * Math.abs(Math.cos(newRotation));

    let collided = false;

    // Maydon devorlari bilan to'qnashuv
    const halfBoundX = this.arenaSize / 2 - extX;
    const halfBoundZ = this.arenaSize / 2 - extZ;
    if (Math.abs(nextX) > halfBoundX) {
      nextX = Math.sign(nextX) * halfBoundX;
      collided = true;
      resolvedLinearVel = -resolvedLinearVel * 0.35;
    }
    if (Math.abs(nextZ) > halfBoundZ) {
      nextZ = Math.sign(nextZ) * halfBoundZ;
      collided = true;
      resolvedLinearVel = -resolvedLinearVel * 0.35;
    }

    // To'siqlar (Kublar / Ustunlar) bilan to'qnashuvni aniq AABB qirralari bo'yicha orqaga itarish
    if (this.activeArena === 'obstacle') {
      for (const obs of this.obstacles) {
        const minX = obs.x - obs.width / 2 - extX;
        const maxX = obs.x + obs.width / 2 + extX;
        const minZ = obs.z - obs.depth / 2 - extZ;
        const maxZ = obs.z + obs.depth / 2 + extZ;

        if (nextX >= minX && nextX <= maxX && nextZ >= minZ && nextZ <= maxZ) {
          collided = true;
          // Eng yaqin chiqish yuzasini aniqlash va robotni sirt ustiga qat'iy chiqarib qo'yish
          const dLeft = Math.abs(nextX - minX);
          const dRight = Math.abs(maxX - nextX);
          const dTop = Math.abs(nextZ - minZ);
          const dBottom = Math.abs(maxZ - nextZ);
          const minEdge = Math.min(dLeft, dRight, dTop, dBottom);

          if (minEdge === dLeft) nextX = minX;
          else if (minEdge === dRight) nextX = maxX;
          else if (minEdge === dTop) nextZ = minZ;
          else nextZ = maxZ;

          // Qattiq jism elastik orqaga sakrashi
          resolvedLinearVel = -resolvedLinearVel * 0.4;
          break;
        }
      }
    }

    // Update wheel animations
    const wheelRotDeltaL = (targetVL / this.wheelRadius) * dt;
    const wheelRotDeltaR = (targetVR / this.wheelRadius) * dt;

    return {
      x: nextX,
      z: nextZ,
      rotation: newRotation,
      linearVelocity: resolvedLinearVel,
      angularVelocity: collided ? 0 : newAngularVel,
      leftWheelRot: state.leftWheelRot + wheelRotDeltaL,
      rightWheelRot: state.rightWheelRot + wheelRotDeltaR,
      isCollided: collided,
    };
  }

  /**
   * Raycasts ultrasonic distance sensor from robot's nose forward
   * Returns distance in centimeters (2.0 to 400.0 cm)
   */
  public getRaycastDistance(robotX: number, robotZ: number, robotAngle: number): number {
    const maxRange = 4.0; // 4 meters
    const noseOffset = 0.74; // Burun uchidagi HC-SR04 datchigi o'rnatilgan haqiqiy nuqta (0.72 + ko'zlar)
    const startX = robotX + Math.cos(robotAngle) * noseOffset;
    const startZ = robotZ + Math.sin(robotAngle) * noseOffset;

    let closestDist = maxRange;

    // Cast 5 rays in a 15-degree cone to simulate ultrasonic beam width
    const coneAngles = [-0.12, -0.06, 0, 0.06, 0.12];

    for (const angleOffset of coneAngles) {
      const rayAngle = robotAngle + angleOffset;
      const dirX = Math.cos(rayAngle);
      const dirZ = Math.sin(rayAngle);

      // Check against arena walls
      const halfBound = this.arenaSize / 2;
      const tEast = dirX > 0 ? (halfBound - startX) / dirX : 999;
      const tWest = dirX < 0 ? (-halfBound - startX) / dirX : 999;
      const tSouth = dirZ > 0 ? (halfBound - startZ) / dirZ : 999;
      const tNorth = dirZ < 0 ? (-halfBound - startZ) / dirZ : 999;

      const wallDist = Math.min(tEast, tWest, tSouth, tNorth);
      if (wallDist > 0 && wallDist < closestDist) {
        closestDist = wallDist;
      }

      // Check against obstacles (Ray vs AABB test)
      for (const obs of this.obstacles) {
        const minX = obs.x - obs.width / 2;
        const maxX = obs.x + obs.width / 2;
        const minZ = obs.z - obs.depth / 2;
        const maxZ = obs.z + obs.depth / 2;

        const t = this.rayIntersectAABB(startX, startZ, dirX, dirZ, minX, maxX, minZ, maxZ);
        if (t > 0 && t < closestDist) {
          closestDist = t;
        }
      }
    }

    // Add 1.5% realistic sensor noise
    const noise = (Math.random() - 0.5) * 0.03 * closestDist;
    const finalDistMeters = Math.max(0.02, Math.min(4.0, closestDist + noise));

    return Number((finalDistMeters * 100).toFixed(1)); // Return in cm
  }

  /**
   * Raycasts 360-degree LiDAR scanner
   * Returns array of 16 distance points around the robot (in meters)
   */
  public getLidarScan(robotX: number, robotZ: number, robotAngle: number): number[] {
    const numRays = 16;
    const scan: number[] = [];
    const maxRange = 6.0;

    for (let i = 0; i < numRays; i++) {
      const angle = robotAngle + (i * 2 * Math.PI) / numRays;
      const dirX = Math.cos(angle);
      const dirZ = Math.sin(angle);

      let closest = maxRange;

      // Arena walls
      const halfBound = this.arenaSize / 2;
      const tEast = dirX > 0 ? (halfBound - robotX) / dirX : 999;
      const tWest = dirX < 0 ? (-halfBound - robotX) / dirX : 999;
      const tSouth = dirZ > 0 ? (halfBound - robotZ) / dirZ : 999;
      const tNorth = dirZ < 0 ? (-halfBound - robotZ) / dirZ : 999;
      closest = Math.min(closest, Math.max(0.1, Math.min(tEast, tWest, tSouth, tNorth)));

      // Obstacles
      for (const obs of this.obstacles) {
        const t = this.rayIntersectAABB(
          robotX,
          robotZ,
          dirX,
          dirZ,
          obs.x - obs.width / 2,
          obs.x + obs.width / 2,
          obs.z - obs.depth / 2,
          obs.z + obs.depth / 2
        );
        if (t > 0 && t < closest) closest = t;
      }

      scan.push(Number(closest.toFixed(2)));
    }

    return scan;
  }

  /**
   * Line sensor array reader (Left, Center, Right)
   * Simulated racetrack track: oval with black ribbon of width 0.15m
   */
  public getLineSensors(robotX: number, robotZ: number, robotAngle: number): [number, number, number] {
    // Check 3 points at the front bumper of robot: Left (-0.08m), Center (0m), Right (+0.08m)
    const sensorDistForward = 0.72;
    const checkPoint = (sideOffset: number) => {
      const px = robotX + Math.cos(robotAngle) * sensorDistForward - Math.sin(robotAngle) * sideOffset;
      const pz = robotZ + Math.sin(robotAngle) * sensorDistForward + Math.cos(robotAngle) * sideOffset;

      // Oval line track equation: (x / 3)^2 + (z / 2)^2 approx 1.0
      const norm = Math.pow(px / 3.2, 2) + Math.pow(pz / 2.2, 2);
      const onLine = Math.abs(norm - 1.0) < 0.12;
      return onLine ? 1.0 : 0.0;
    };

    return [checkPoint(-0.09), checkPoint(0.0), checkPoint(0.09)];
  }

  private rayIntersectAABB(
    ox: number,
    oz: number,
    dx: number,
    dz: number,
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number
  ): number {
    const invDx = 1.0 / (Math.abs(dx) < 1e-6 ? 1e-6 : dx);
    const invDz = 1.0 / (Math.abs(dz) < 1e-6 ? 1e-6 : dz);

    let t1 = (minX - ox) * invDx;
    let t2 = (maxX - ox) * invDx;
    let t3 = (minZ - oz) * invDz;
    let t4 = (maxZ - oz) * invDz;

    const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
    const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

    if (tmax < 0 || tmin > tmax) return -1;
    return tmin > 0 ? tmin : tmax;
  }
}

export const physicsEngine = new RobotPhysicsEngine();
