import * as THREE from 'three';

/**
 * Procedural texture generator for hyper-realistic 3D arena surfaces.
 * Uses HTML5 Canvas without relying on external image asset downloads.
 */

// 1. Soccer Pitch Mowed Lawn Stripes Texture
export function createGrassPitchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Base grass
  ctx.fillStyle = '#166534';
  ctx.fillRect(0, 0, 1024, 1024);

  // Alternating lawn mower stripes (darker vs lighter emerald green)
  const stripeWidth = 64;
  for (let x = 0; x < 1024; x += stripeWidth * 2) {
    ctx.fillStyle = '#15803d'; // Lighter green cut
    ctx.fillRect(x, 0, stripeWidth, 1024);
  }

  // Subtle grass blade noise speckles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 0; i < 3000; i++) {
    const rx = Math.random() * 1024;
    const ry = Math.random() * 1024;
    ctx.fillRect(rx, ry, 2, 2);
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
  for (let i = 0; i < 3000; i++) {
    const rx = Math.random() * 1024;
    const ry = Math.random() * 1024;
    ctx.fillRect(rx, ry, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

// 2. Soccer Ball Classic Hexagon / Pentagon Pattern Texture
export function createSoccerBallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // White base
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 256);

  // Black patches (pentagons/hexagons)
  ctx.fillStyle = '#0f172a';
  const centers = [
    { x: 80, y: 64 },
    { x: 200, y: 192 },
    { x: 320, y: 64 },
    { x: 440, y: 192 },
    { x: 140, y: 64 },
    { x: 260, y: 192 },
    { x: 380, y: 64 },
  ];

  centers.forEach((c) => {
    ctx.beginPath();
    const sides = 5;
    const r = 26;
    for (let i = 0; i < sides; i++) {
      const a = (i * 2 * Math.PI) / sides;
      const px = c.x + Math.cos(a) * r;
      const py = c.y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  });

  // Seam lines
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

// 3. LED Stadium Advertising Perimeter Hoardings Texture
export function createLedBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Dark background
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, 1024, 128);

  // Glowing borders
  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(0, 0, 1024, 6);
  ctx.fillRect(0, 122, 1024, 6);

  // Text
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 36px monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡ ROBOVERSE LEAGUE 2026   •   AI WORLD CUP   •   AUTONOMOUS ROBOTS TASHKENT ⚡', 20, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 4. Parquet / Tatami Dojo Wooden Floor Texture
export function createDojoWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Warm golden Japanese cedar parquet floor
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, 512, 512);

  // Alternating wood planks
  const plankH = 40;
  for (let y = 0; y < 512; y += plankH) {
    ctx.fillStyle = (y / plankH) % 2 === 0 ? '#92400e' : '#a16207';
    ctx.fillRect(0, y, 512, plankH);

    // Plank seam
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    // Wood grain detail lines
    ctx.strokeStyle = 'rgba(254, 215, 170, 0.15)';
    ctx.lineWidth = 1.5;
    for (let g = 1; g < 4; g++) {
      ctx.beginPath();
      ctx.moveTo(0, y + g * 10);
      ctx.bezierCurveTo(140, y + g * 10 + 4, 360, y + g * 10 - 3, 512, y + g * 10);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  return texture;
}

// 5. Cleanroom Epoxy Lab Tile Grid Floor Texture
export function createCleanroomFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Ultra clean light slate grey
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 512, 512);

  // Anti-static tile seams
  const tileSize = 64;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;

  for (let x = 0; x <= 512; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

// 6. Industrial Concrete Warehouse Floor with Hazard Stripes Texture
export function createWarehouseConcreteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Industrial Grey Concrete
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(0, 0, 512, 512);

  // Noise specks
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let i = 0; i < 4000; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 2000; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
  }

  // Forklift tire skid marks
  ctx.strokeStyle = 'rgba(24, 24, 27, 0.4)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(100, 50);
  ctx.quadraticCurveTo(250, 180, 420, 220);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(120, 70);
  ctx.quadraticCurveTo(270, 200, 440, 240);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// 7. Wooden Crate with Stencil Label Texture
export function createCrateTexture(label: string = 'FRAGILE'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Wood pine base
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, 256, 256);

  // Wood planks
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 4;
  for (let y = 0; y < 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  // Stencil Label
  ctx.fillStyle = '#1c1917';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, 128, 120);

  // Barcode
  ctx.fillStyle = '#1c1917';
  for (let b = 50; b < 200; b += 8) {
    const w = (b % 3 === 0) ? 5 : 2;
    ctx.fillRect(b, 150, w, 30);
  }

  return new THREE.CanvasTexture(canvas);
}

// 8. Cyberpunk Speed Racing Wet Asphalt Texture
export function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Midnight asphalt
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 512, 512);

  // Grain
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 3000; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
  }

  // Wet puddle gloss patch
  const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 160);
  grad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
  grad.addColorStop(1, 'rgba(9, 13, 22, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

// 9. Holographic Nitro Boost Pad Animated Texture
export function createBoostPadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Dark cyan backing
  ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
  ctx.fillRect(0, 0, 256, 512);

  // Glowing Chevrons pointing forward
  ctx.fillStyle = '#00f0ff';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 18;

  for (let y = 90; y <= 420; y += 100) {
    ctx.beginPath();
    ctx.moveTo(128, y - 50);
    ctx.lineTo(215, y + 20);
    ctx.lineTo(175, y + 20);
    ctx.lineTo(128, y - 15);
    ctx.lineTo(81, y + 20);
    ctx.lineTo(41, y + 20);
    ctx.closePath();
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

// 10. Traditional Shoji Screen Paper Lattice Wall Texture
export function createShojiWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Warm translucent rice paper background
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle paper fibers
  ctx.fillStyle = 'rgba(217, 119, 6, 0.05)';
  for (let i = 0; i < 2000; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 1);
  }

  // Kumiko Wooden Lattice Grid
  ctx.strokeStyle = '#451a03'; // Dark lacquered wood
  ctx.lineWidth = 6;
  const step = 64;

  for (let x = 0; x <= 512; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  return texture;
}

// 11. Ceremonial Japanese Nobori Banner Texture
export function createNoboriBannerTexture(kanji: string = '勝', subtitle: string = 'VICTORY'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Deep indigo/crimson banner base
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(0, 0, 256, 768);

  // Golden borders
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, 232, 744);

  // Central Gold Sun Emblem
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(128, 140, 50, 0, Math.PI * 2);
  ctx.fill();

  // Bold Japanese Kanji character
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 120px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(kanji, 128, 380);

  // English/Romaji subtitle
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(subtitle, 128, 540);
  ctx.fillText('ROBOSUMO', 128, 580);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 12. Traditional Rice-Straw Sumo Bale (Tawara - 俵) Texture
export function createStrawBaleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Golden yellow-brown dried straw base
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(0, 0, 256, 128);

  // Alternating straw weave strands
  for (let y = 0; y < 128; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? '#a16207' : '#eab308';
    ctx.fillRect(0, y, 256, 4);
  }

  // Woven straw texture noise
  ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
  for (let i = 0; i < 800; i++) {
    ctx.fillRect(Math.random() * 256, Math.random() * 128, 3, 1);
  }

  // Black rice-straw binding ropes (nawa) around the bale
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(40, 0, 10, 128);
  ctx.fillRect(123, 0, 10, 128);
  ctx.fillRect(206, 0, 10, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 13. Soccer Pitch Corner Flag Red/Yellow Checkered Texture
export function createCornerFlagTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Red and Yellow Checkered Quarters
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillRect(64, 64, 64, 64);

  ctx.fillStyle = '#facc15';
  ctx.fillRect(64, 0, 64, 64);
  ctx.fillRect(0, 64, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 14. Oscilloscope Digital Waveform Screen Texture
export function createOscilloscopeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Dark Phosphor Screen Base
  ctx.fillStyle = '#022c22';
  ctx.fillRect(0, 0, 256, 160);

  // Phosphor Grid Reticle
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 160);
    ctx.stroke();
  }
  for (let y = 0; y <= 160; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  // Glowing Green Signal Sine Wave
  ctx.strokeStyle = '#34d399';
  ctx.shadowColor = '#10b981';
  ctx.shadowBlur = 8;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x < 256; x++) {
    const y = 80 + Math.sin(x * 0.08) * 45 + Math.sin(x * 0.16) * 12;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Frequency readout
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#6ee7b7';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('CH1: 2.45 GHz   50mV/div', 12, 22);

  return new THREE.CanvasTexture(canvas);
}

// 15. Server Rack Telemetry Front Panel Texture
export function createServerRackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Black Rack Unit
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 512);

  // Rack Server Units (1U, 2U slots)
  for (let y = 8; y < 500; y += 40) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8, y, 240, 34);

    // Vent louvres
    ctx.fillStyle = '#090d16';
    for (let vx = 20; vx < 160; vx += 8) {
      ctx.fillRect(vx, y + 10, 4, 14);
    }

    // Status LEDs (Green, Cyan, Amber)
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(180, y + 14, 6, 6);
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(195, y + 14, 6, 6);
    ctx.fillStyle = (y % 80 === 0) ? '#eab308' : '#22c55e';
    ctx.fillRect(210, y + 14, 6, 6);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 16. F1 Start / Finish Checkered Line Texture
export function createCheckeredLineTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const tileSize = 16;
  for (let x = 0; x < 256; x += tileSize) {
    for (let y = 0; y < 64; y += tileSize) {
      const isBlack = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
      ctx.fillStyle = isBlack ? '#000000' : '#ffffff';
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 17. Industrial Yellow & Black Diagonal Hazard Caution Stripe Texture
export function createHazardStripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Yellow base
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 0, 128, 128);

  // Diagonal black caution stripes
  ctx.fillStyle = '#18181b';
  const stripeW = 24;
  for (let i = -128; i < 256; i += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + stripeW, 0);
    ctx.lineTo(i + stripeW + 128, 128);
    ctx.lineTo(i + 128, 128);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 1);
  return texture;
}
