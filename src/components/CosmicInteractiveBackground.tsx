import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Palette, Eye, EyeOff } from 'lucide-react';

export type BackgroundTheme = 'cosmic-nebula' | 'aurora-emerald' | 'cyber-sapphire' | 'light-crystal';

interface CosmicBackgroundProps {
  currentTheme?: BackgroundTheme;
  onThemeChange?: (theme: BackgroundTheme) => void;
}

interface Star {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  depth: number; // 0.2 to 1.0
  isCrossFlare: boolean;
  color: string;
}

interface ConstellationDot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

type FloatingItemType = 
  | 'coin'
  | 'diamond'
  | 'box'
  | 'tag'
  | 'bag'
  | 'rocket'
  | 'chart'
  | 'cash'
  | 'star'
  | 'planet'
  | 'shield';

interface FloatingObject {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  depth: number;
  alpha: number;
  type: FloatingItemType;
  wobblePhase: number;
  wobbleSpeed: number;
}

const THEME_CONFIGS: Record<BackgroundTheme, {
  name: string;
  gradientBg: string;
  canvasBg: string;
  ambientGlow1: string;
  ambientGlow2: string;
  dotColor: string;
  lineColor: string;
  isDark: boolean;
}> = {
  'cosmic-nebula': {
    name: 'Cosmic Nebula',
    gradientBg: 'from-[#070b14] via-[#0b1329] to-[#05111a]',
    canvasBg: '#080d1a',
    ambientGlow1: 'rgba(16, 185, 129, 0.12)', // emerald glow
    ambientGlow2: 'rgba(99, 102, 241, 0.14)', // indigo nebula
    dotColor: 'rgba(147, 197, 253, 0.6)',
    lineColor: 'rgba(96, 165, 250, 0.12)',
    isDark: true,
  },
  'aurora-emerald': {
    name: 'Aurora Emerald',
    gradientBg: 'from-[#04130e] via-[#06241a] to-[#03151b]',
    canvasBg: '#051b14',
    ambientGlow1: 'rgba(16, 185, 129, 0.2)', // rich emerald
    ambientGlow2: 'rgba(20, 184, 166, 0.16)', // teal aurora
    dotColor: 'rgba(110, 231, 183, 0.65)',
    lineColor: 'rgba(52, 211, 153, 0.14)',
    isDark: true,
  },
  'cyber-sapphire': {
    name: 'Cyber Sapphire',
    gradientBg: 'from-[#030d1e] via-[#091b36] to-[#040f24]',
    canvasBg: '#061327',
    ambientGlow1: 'rgba(56, 189, 248, 0.18)', // cyan
    ambientGlow2: 'rgba(129, 140, 248, 0.15)', // violet
    dotColor: 'rgba(186, 230, 253, 0.7)',
    lineColor: 'rgba(56, 189, 248, 0.15)',
    isDark: true,
  },
  'light-crystal': {
    name: 'Light Crystal',
    gradientBg: 'from-[#f1f5f9] via-[#e2e8f0] to-[#f8fafc]',
    canvasBg: '#f8fafc',
    ambientGlow1: 'rgba(16, 185, 129, 0.08)',
    ambientGlow2: 'rgba(59, 130, 246, 0.08)',
    dotColor: 'rgba(71, 85, 105, 0.35)',
    lineColor: 'rgba(148, 163, 184, 0.2)',
    isDark: false,
  },
};

export const CosmicInteractiveBackground: React.FC<CosmicBackgroundProps> = ({
  currentTheme = 'cosmic-nebula',
  onThemeChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTheme, setActiveTheme] = useState<BackgroundTheme>(currentTheme);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [motionActive, setMotionActive] = useState<boolean>(true);

  // Sync external theme changes
  useEffect(() => {
    setActiveTheme(currentTheme);
  }, [currentTheme]);

  const handleSelectTheme = (theme: BackgroundTheme) => {
    setActiveTheme(theme);
    if (onThemeChange) {
      onThemeChange(theme);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking with inertia
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 220,
      active: false,
      lastMoveTime: Date.now(),
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
      mouse.lastMoveTime = Date.now();
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initElements();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Arrays of elements
    let stars: Star[] = [];
    let dots: ConstellationDot[] = [];
    let floatingObjects: FloatingObject[] = [];

    // Initialize stars, dots, and floating commerce/celestial objects
    const initElements = () => {
      stars = [];
      dots = [];
      floatingObjects = [];

      // 1. Stars (soft, elegant starry sky)
      const starCount = Math.min(85, Math.floor((width * height) / 14000));
      for (let i = 0; i < starCount; i++) {
        const depth = 0.2 + Math.random() * 0.8;
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          baseX: Math.random() * width,
          baseY: Math.random() * height,
          size: Math.random() < 0.12 ? 2.0 + Math.random() * 1.5 : 0.8 + Math.random() * 1.2,
          alpha: 0.2 + Math.random() * 0.5,
          twinkleSpeed: 0.01 + Math.random() * 0.02,
          twinklePhase: Math.random() * Math.PI * 2,
          depth,
          isCrossFlare: Math.random() < 0.08,
          color: Math.random() < 0.35 ? '#6ee7b7' : Math.random() < 0.7 ? '#93c5fd' : '#fef08a',
        });
      }

      // 2. Constellation Dots (subtle, quiet network)
      const dotCount = Math.min(26, Math.floor((width * height) / 38000));
      for (let i = 0; i < dotCount; i++) {
        dots.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          size: 1.5 + Math.random() * 1.5,
          alpha: 0.2 + Math.random() * 0.35,
        });
      }

      // 3. Floating Graphic Items (Delicate, dreamy commerce & celestial icons)
      const objectTypes: FloatingItemType[] = [
        'coin', 'diamond', 'box', 'tag', 'bag', 'rocket', 'chart', 'cash', 'star', 'planet', 'shield'
      ];

      const objectCount = Math.min(18, Math.floor((width * height) / 50000) + 8);
      for (let i = 0; i < objectCount; i++) {
        const type = objectTypes[i % objectTypes.length];
        floatingObjects.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.006,
          scale: 0.65 + Math.random() * 0.45,
          depth: 0.3 + Math.random() * 0.7,
          alpha: 0.28 + Math.random() * 0.22,
          type,
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.015 + Math.random() * 0.02,
        });
      }
    };

    initElements();

    // High performance rendering helpers for custom vector items
    const drawCoin = (ctx: CanvasRenderingContext2D, size: number) => {
      // Golden outer rim
      const grad = ctx.createRadialGradient(-size * 0.2, -size * 0.2, size * 0.1, 0, 0, size);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#f59e0b');
      grad.addColorStop(1, '#b45309');

      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Inner embossed coin circle
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.76, 0, Math.PI * 2);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Coin currency symbol "Rp"
      ctx.fillStyle = '#78350f';
      ctx.font = `bold ${Math.round(size * 0.85)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Rp', 0, 1);
    };

    const drawDiamond = (ctx: CanvasRenderingContext2D, size: number) => {
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.9, -size * 0.25);
      ctx.lineTo(0, size * 1.1);
      ctx.lineTo(-size * 0.9, -size * 0.25);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, -size, 0, size);
      grad.addColorStop(0, '#a7f3d0');
      grad.addColorStop(0.5, '#06b6d4');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Facet highlights
      ctx.beginPath();
      ctx.moveTo(-size * 0.9, -size * 0.25);
      ctx.lineTo(size * 0.9, -size * 0.25);
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size * 1.1);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.stroke();
    };

    const drawBox = (ctx: CanvasRenderingContext2D, size: number) => {
      // Kraft delivery package with tape
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-size, -size * 0.8, size * 2, size * 1.6);

      // Box lid line
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-size, -size * 0.8, size * 2, size * 0.4);

      // Cross tape
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(-size * 0.25, -size * 0.8, size * 0.5, size * 1.6);
      ctx.fillRect(-size, -size * 0.1, size * 2, size * 0.35);

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-size, -size * 0.8, size * 2, size * 1.6);
    };

    const drawRocket = (ctx: CanvasRenderingContext2D, size: number) => {
      // Rocket fuselage
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.3);
      ctx.quadraticCurveTo(size * 0.6, -size * 0.2, size * 0.5, size * 0.8);
      ctx.lineTo(-size * 0.5, size * 0.8);
      ctx.quadraticCurveTo(-size * 0.6, -size * 0.2, 0, -size * 1.3);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cockpit porthole
      ctx.beginPath();
      ctx.arc(0, -size * 0.2, size * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Red nose cone
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.3);
      ctx.quadraticCurveTo(size * 0.35, -size * 0.8, size * 0.4, -size * 0.6);
      ctx.lineTo(-size * 0.4, -size * 0.6);
      ctx.quadraticCurveTo(-size * 0.35, -size * 0.8, 0, -size * 1.3);
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      // Jet flame exhaust
      ctx.beginPath();
      ctx.moveTo(-size * 0.3, size * 0.8);
      ctx.lineTo(0, size * 1.5);
      ctx.lineTo(size * 0.3, size * 0.8);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
    };

    const drawShoppingBag = (ctx: CanvasRenderingContext2D, size: number) => {
      // Bag body
      ctx.beginPath();
      ctx.rect(-size * 0.8, -size * 0.4, size * 1.6, size * 1.5);
      const grad = ctx.createLinearGradient(0, -size * 0.4, 0, size * 1.1);
      grad.addColorStop(0, '#10b981');
      grad.addColorStop(1, '#047857');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#064e3b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Handles
      ctx.beginPath();
      ctx.arc(0, -size * 0.4, size * 0.45, Math.PI, 0, false);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Star or symbol on bag
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, size * 0.3, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawPriceTag = (ctx: CanvasRenderingContext2D, size: number) => {
      ctx.beginPath();
      ctx.moveTo(-size * 0.7, -size * 0.6);
      ctx.lineTo(size * 0.2, -size * 0.6);
      ctx.lineTo(size * 0.8, 0);
      ctx.lineTo(size * 0.2, size * 0.6);
      ctx.lineTo(-size * 0.7, size * 0.6);
      ctx.closePath();

      ctx.fillStyle = '#f97316';
      ctx.fill();
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Hole
      ctx.beginPath();
      ctx.arc(-size * 0.35, 0, size * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    };

    const drawChart = (ctx: CanvasRenderingContext2D, size: number) => {
      // 3 ascending bars
      ctx.fillStyle = '#34d399';
      ctx.fillRect(-size * 0.8, size * 0.1, size * 0.4, size * 0.7);
      ctx.fillRect(-size * 0.2, -size * 0.3, size * 0.4, size * 1.1);
      ctx.fillRect(size * 0.4, -size * 0.7, size * 0.4, size * 1.5);

      // Upward trend arrow
      ctx.beginPath();
      ctx.moveTo(-size * 0.8, size * 0.3);
      ctx.lineTo(-size * 0.1, -size * 0.2);
      ctx.lineTo(size * 0.6, -size * 0.8);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    };

    const drawCash = (ctx: CanvasRenderingContext2D, size: number) => {
      // Banknote
      ctx.fillStyle = '#059669';
      ctx.fillRect(-size * 1.1, -size * 0.6, size * 2.2, size * 1.2);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-size * 1.1, -size * 0.6, size * 2.2, size * 1.2);

      // Central oval seal
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.6, size * 0.35, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const drawSparkleStar = (ctx: CanvasRenderingContext2D, size: number) => {
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.4);
      ctx.quadraticCurveTo(0, 0, size * 1.4, 0);
      ctx.quadraticCurveTo(0, 0, 0, size * 1.4);
      ctx.quadraticCurveTo(0, 0, -size * 1.4, 0);
      ctx.quadraticCurveTo(0, 0, 0, -size * 1.4);
      ctx.closePath();

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.4);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#fef08a');
      grad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = grad;
      ctx.fill();
    };

    const drawPlanet = (ctx: CanvasRenderingContext2D, size: number) => {
      // Planet Sphere
      const grad = ctx.createRadialGradient(-size * 0.3, -size * 0.3, size * 0.1, 0, 0, size);
      grad.addColorStop(0, '#818cf8');
      grad.addColorStop(0.7, '#4f46e5');
      grad.addColorStop(1, '#312e81');

      ctx.beginPath();
      ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Cosmic Ring
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 1.5, size * 0.4, Math.PI / 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    };

    const drawShield = (ctx: CanvasRenderingContext2D, size: number) => {
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.9, -size * 0.6);
      ctx.lineTo(size * 0.9, size * 0.2);
      ctx.quadraticCurveTo(0, size * 1.2, 0, size * 1.2);
      ctx.quadraticCurveTo(0, size * 1.2, -size * 0.9, size * 0.2);
      ctx.lineTo(-size * 0.9, -size * 0.6);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, -size, 0, size);
      grad.addColorStop(0, '#10b981');
      grad.addColorStop(1, '#065f46');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Checkmark in shield
      ctx.beginPath();
      ctx.moveTo(-size * 0.4, size * 0.1);
      ctx.lineTo(-size * 0.1, size * 0.4);
      ctx.lineTo(size * 0.4, -size * 0.3);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    // Render loop
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const themeCfg = THEME_CONFIGS[activeTheme];

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Parallax center offset (-1 to 1)
      const mouseNormX = (mouse.x / width - 0.5) * 2;
      const mouseNormY = (mouse.y / height - 0.5) * 2;

      // Clear canvas with base background
      ctx.clearRect(0, 0, width, height);

      // Ambient radial gradients (Nebula / Aurora clouds)
      const ambient1X = width * 0.25 + mouseNormX * -40;
      const ambient1Y = height * 0.2 + mouseNormY * -40;
      const rad1 = ctx.createRadialGradient(ambient1X, ambient1Y, 50, ambient1X, ambient1Y, width * 0.55);
      rad1.addColorStop(0, themeCfg.ambientGlow1);
      rad1.addColorStop(1, 'transparent');
      ctx.fillStyle = rad1;
      ctx.fillRect(0, 0, width, height);

      const ambient2X = width * 0.75 + mouseNormX * -60;
      const ambient2Y = height * 0.7 + mouseNormY * -60;
      const rad2 = ctx.createRadialGradient(ambient2X, ambient2Y, 60, ambient2X, ambient2Y, width * 0.6);
      rad2.addColorStop(0, themeCfg.ambientGlow2);
      rad2.addColorStop(1, 'transparent');
      ctx.fillStyle = rad2;
      ctx.fillRect(0, 0, width, height);

      // Cursor Ambient Spotlight (Halo around user cursor)
      if (mouse.active) {
        const cursorGlow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius * 1.2
        );
        cursorGlow.addColorStop(0, themeCfg.isDark ? 'rgba(52, 211, 153, 0.16)' : 'rgba(16, 185, 129, 0.08)');
        cursorGlow.addColorStop(0.5, themeCfg.isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(59, 130, 246, 0.05)');
        cursorGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = cursorGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // 1. Draw Constellation Network (Dots + Connecting Filaments)
      // Update dot positions
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        if (motionActive) {
          d.x += d.vx;
          d.y += d.vy;

          if (d.x < 0) d.x = width;
          if (d.x > width) d.x = 0;
          if (d.y < 0) d.y = height;
          if (d.y > height) d.y = 0;
        }

        // Distance from cursor
        const dx = mouse.x - d.x;
        const dy = mouse.y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && mouse.active) {
          // Repel gently
          const force = (1 - dist / mouse.radius) * 1.5;
          d.x -= (dx / dist) * force;
          d.y -= (dy / dist) * force;
        }
      }

      // Connecting lines between nearby dots
      ctx.lineWidth = 0.8;
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const d1 = dots[i];
          const d2 = dots[j];
          const dist = Math.hypot(d1.x - d2.x, d1.y - d2.y);
          if (dist < 100) {
            const lineAlpha = (1 - dist / 100) * 0.22;
            ctx.strokeStyle = themeCfg.lineColor.replace(/[\d\.]+\)$/, `${lineAlpha})`);
            ctx.beginPath();
            ctx.moveTo(d1.x, d1.y);
            ctx.lineTo(d2.x, d2.y);
            ctx.stroke();
          }
        }
      }

      // Render dots
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = themeCfg.dotColor;
        ctx.fill();
      }

      // 2. Draw Stars (Twinkling + Parallax)
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.twinklePhase += s.twinkleSpeed;
        const twinkle = 0.5 + Math.sin(s.twinklePhase) * 0.5;
        const currentAlpha = Math.max(0.15, s.alpha * twinkle);

        // Parallax offset relative to mouse
        const parallaxX = s.baseX + mouseNormX * -35 * s.depth;
        const parallaxY = s.baseY + mouseNormY * -35 * s.depth;

        // Wrap around boundaries
        let rx = (parallaxX % width + width) % width;
        let ry = (parallaxY % height + height) % height;

        // Repel from cursor if near
        const dx = mouse.x - rx;
        const dy = mouse.y - ry;
        const dist = Math.hypot(dx, dy);
        if (dist < mouse.radius * 0.7 && mouse.active) {
          const push = (1 - dist / (mouse.radius * 0.7)) * 12;
          rx -= (dx / dist) * push;
          ry -= (dy / dist) * push;
        }

        ctx.save();
        ctx.fillStyle = s.color;
        ctx.globalAlpha = currentAlpha;

        if (s.isCrossFlare) {
          // 4-point star flare
          const r = s.size * 2.2;
          ctx.beginPath();
          ctx.moveTo(rx, ry - r);
          ctx.lineTo(rx, ry + r);
          ctx.moveTo(rx - r, ry);
          ctx.lineTo(rx + r, ry);
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(rx, ry, s.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(rx, ry, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. Draw Floating Objects (Coins, Diamonds, Boxes, Bags, Rockets, etc.)
      for (let i = 0; i < floatingObjects.length; i++) {
        const obj = floatingObjects[i];

        if (motionActive) {
          obj.x += obj.vx;
          obj.y += obj.vy;
          obj.rotation += obj.rotationSpeed;
          obj.wobblePhase += obj.wobbleSpeed;

          // Screen bounds wrap
          if (obj.x < -40) obj.x = width + 40;
          if (obj.x > width + 40) obj.x = -40;
          if (obj.y < -40) obj.y = height + 40;
          if (obj.y > height + 40) obj.y = -40;
        }

        // Parallax + Cursor Interaction
        const parallaxX = obj.x + mouseNormX * -50 * obj.depth;
        const parallaxY = obj.y + mouseNormY * -50 * obj.depth + Math.sin(obj.wobblePhase) * 6;

        let drawX = (parallaxX % (width + 80) + (width + 80)) % (width + 80) - 40;
        let drawY = (parallaxY % (height + 80) + (height + 80)) % (height + 80) - 40;

        // Cursor Repulsion or Attraction effect
        const dx = mouse.x - drawX;
        const dy = mouse.y - drawY;
        const dist = Math.hypot(dx, dy);

        if (dist < mouse.radius && mouse.active) {
          // Smooth repulsion with slight swirling torque
          const force = (1 - dist / mouse.radius) * 25;
          drawX -= (dx / dist) * force;
          drawY -= (dy / dist) * force;
          obj.rotation += 0.02 * (1 - dist / mouse.radius);
        }

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(obj.rotation);
        ctx.globalAlpha = Math.min(0.55, obj.alpha * (themeCfg.isDark ? 0.75 : 0.5));

        // Subtle soft shadow behind floating graphics
        ctx.shadowColor = themeCfg.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;

        const baseSize = 14;

        switch (obj.type) {
          case 'coin':
            drawCoin(ctx, baseSize * 1.1);
            break;
          case 'diamond':
            drawDiamond(ctx, baseSize);
            break;
          case 'box':
            drawBox(ctx, baseSize);
            break;
          case 'rocket':
            drawRocket(ctx, baseSize);
            break;
          case 'bag':
            drawShoppingBag(ctx, baseSize);
            break;
          case 'tag':
            drawPriceTag(ctx, baseSize);
            break;
          case 'chart':
            drawChart(ctx, baseSize);
            break;
          case 'cash':
            drawCash(ctx, baseSize * 1.1);
            break;
          case 'star':
            drawSparkleStar(ctx, baseSize * 1.2);
            break;
          case 'planet':
            drawPlanet(ctx, baseSize);
            break;
          case 'shield':
            drawShield(ctx, baseSize);
            break;
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTheme, motionActive]);

  const currentConfig = THEME_CONFIGS[activeTheme];

  return (
    <>
      {/* Dynamic Background Wrapper with Tailwind Gradient */}
      <div 
        className={`fixed inset-0 pointer-events-none z-0 transition-colors duration-700 bg-gradient-to-br ${currentConfig.gradientBg}`}
        aria-hidden="true"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>

      {/* Floating Theme & Background Control Pill (Bottom Right) */}
      <div className="no-print fixed bottom-4 right-4 z-50 flex items-center gap-2">
        {showControls && (
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 text-xs">
            <span className="px-2 text-[11px] font-semibold text-slate-400">
              Tema Latar:
            </span>
            {(Object.keys(THEME_CONFIGS) as BackgroundTheme[]).map((t) => (
              <button
                key={t}
                onClick={() => handleSelectTheme(t)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
                  activeTheme === t
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {THEME_CONFIGS[t].name}
              </button>
            ))}
            <div className="h-4 w-px bg-slate-700 mx-0.5" />
            <button
              onClick={() => setMotionActive(!motionActive)}
              title={motionActive ? 'Jeda animasi partikel' : 'Lanjutkan animasi partikel'}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              {motionActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          </div>
        )}

        <button
          onClick={() => setShowControls(!showControls)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl shadow-lg backdrop-blur-md text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 group"
          title="Atur Efek Latar Interaktif & Warna"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Efek Kosmik & Kursor</span>
          <Palette className="w-3 h-3 text-slate-400" />
        </button>
      </div>
    </>
  );
};
