import { useEffect, useRef } from 'react';

const MAX_PARTICLES = 180;
const BASE_EMIT_PER_FRAME = 1;
const POINTER_EMIT_BURST = 3;
const FRAME_INTERVAL_MS = 1000 / 45;

export default function SmokeTrailCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (window.innerWidth < 900) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    let rafId = 0;
    let lastFrameTs = 0;
    const particles = [];
    let pointerX = window.innerWidth * 0.5;
    let pointerY = window.innerHeight * 0.4;
    let hasPointer = false;
    let pointerSpeed = 0;
    let prevPointerX = pointerX;
    let prevPointerY = pointerY;
    let mainArea = null;
    let footerArea = null;
    let darkTexture = null;
    let lightTexture = null;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const updateZones = () => {
      const mainContent = document.querySelector('.main-content');
      const footer = document.querySelector('.footer-dark');
      mainArea = mainContent ? mainContent.getBoundingClientRect() : null;
      footerArea = footer ? footer.getBoundingClientRect() : null;
    };

    const isAllowedPoint = (clientX, clientY) => {
      const inMain = !mainArea
        || (clientX >= mainArea.left
          && clientX <= mainArea.right
          && clientY >= mainArea.top
          && clientY <= mainArea.bottom);
      const inFooter = footerArea
        && clientX >= footerArea.left
        && clientX <= footerArea.right
        && clientY >= footerArea.top
        && clientY <= footerArea.bottom;
      return inMain && !inFooter;
    };

    const createSmokeTexture = (kind = 'dark') => {
      const t = document.createElement('canvas');
      t.width = 160;
      t.height = 160;
      const tctx = t.getContext('2d');
      if (!tctx) return null;
      tctx.clearRect(0, 0, t.width, t.height);

      const blobs = kind === 'dark' ? 8 : 6;
      for (let i = 0; i < blobs; i += 1) {
        const x = 46 + Math.random() * 68;
        const y = 42 + Math.random() * 76;
        const r = 22 + Math.random() * 34;
        const g = tctx.createRadialGradient(x, y, 0, x, y, r);
        if (kind === 'dark') {
          g.addColorStop(0, `rgba(${10 + Math.random() * 20}, ${10 + Math.random() * 20}, ${10 + Math.random() * 20}, ${0.35 + Math.random() * 0.25})`);
          g.addColorStop(0.65, `rgba(${45 + Math.random() * 25}, ${45 + Math.random() * 25}, ${45 + Math.random() * 25}, ${0.16 + Math.random() * 0.12})`);
        } else {
          g.addColorStop(0, `rgba(${180 + Math.random() * 60}, ${180 + Math.random() * 60}, ${180 + Math.random() * 60}, ${0.22 + Math.random() * 0.18})`);
          g.addColorStop(0.65, `rgba(${150 + Math.random() * 40}, ${150 + Math.random() * 40}, ${150 + Math.random() * 40}, ${0.08 + Math.random() * 0.09})`);
        }
        g.addColorStop(1, 'rgba(200, 200, 200, 0)');
        tctx.fillStyle = g;
        tctx.beginPath();
        tctx.arc(x, y, r, 0, Math.PI * 2);
        tctx.fill();
      }
      return t;
    };

    const emitParticle = (x, y, strength = 1, type = 'core') => {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      const angle = Math.random() * Math.PI * 2;
      const baseSpeed = (0.08 + Math.random() * 0.42) * strength;
      const spread = type === 'core' ? (8 + Math.random() * 14) : (16 + Math.random() * 20);
      const ttl = type === 'core' ? (130 + Math.random() * 110) : (95 + Math.random() * 90);
      const baseRadius = type === 'core' ? (14 + Math.random() * 26) : (8 + Math.random() * 16);
      const stretch = 0.75 + Math.random() * 0.55;
      particles.push({
        x: x + (Math.random() - 0.5) * spread,
        y: y + (Math.random() - 0.5) * spread,
        vx: Math.cos(angle) * baseSpeed * (type === 'core' ? 0.42 : 0.62),
        vy: Math.sin(angle) * baseSpeed * (type === 'core' ? 0.32 : 0.5) - (0.1 + Math.random() * 0.35),
        radius: baseRadius * (0.82 + Math.random() * 0.45),
        alpha: (type === 'core' ? 0.08 : 0.055) + Math.random() * 0.12,
        spin: (Math.random() - 0.5) * (type === 'core' ? 0.08 : 0.12),
        noiseSeed: Math.random() * 2000,
        growth: type === 'core' ? (1.006 + Math.random() * 0.004) : (1.004 + Math.random() * 0.003),
        lift: 0.002 + Math.random() * 0.004,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        stretch,
        life: 0,
        maxLife: ttl,
        type,
      });
    };

    const spawnCluster = (x, y, strength = 1) => {
      const coreCount = 2 + Math.round(strength * 2);
      const wispsCount = 3 + Math.round(strength * 3);
      for (let i = 0; i < coreCount; i += 1) emitParticle(x, y, strength, 'core');
      for (let i = 0; i < wispsCount; i += 1) emitParticle(x, y, strength * (0.8 + Math.random() * 0.4), 'wisp');
    };

    const spawn = (x, y, strength = 1, amount = POINTER_EMIT_BURST) => {
      for (let i = 0; i < amount; i += 1) spawnCluster(x, y, strength * (0.85 + Math.random() * 0.35));
    };

    const onPointerMove = (event) => {
      if (!mainArea) updateZones();
      if (!isAllowedPoint(event.clientX, event.clientY)) {
        hasPointer = false;
        return;
      }
      const dx = event.clientX - pointerX;
      const dy = event.clientY - pointerY;
      const dist = Math.hypot(dx, dy);
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerSpeed = Math.min(36, dist);
      hasPointer = true;
      spawn(pointerX, pointerY, Math.min(2.4, 0.9 + dist * 0.05), POINTER_EMIT_BURST);
    };

    const render = (ts = 0) => {
      if (ts - lastFrameTs < FRAME_INTERVAL_MS) {
        rafId = window.requestAnimationFrame(render);
        return;
      }
      lastFrameTs = ts;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = 'source-over';

      if (hasPointer && isAllowedPoint(pointerX, pointerY)) {
        const driftX = pointerX - prevPointerX;
        const driftY = pointerY - prevPointerY;
        prevPointerX += driftX * 0.24;
        prevPointerY += driftY * 0.24;
        const trailingStrength = Math.min(1.8, 0.7 + pointerSpeed * 0.03);
        spawn(prevPointerX, prevPointerY, trailingStrength, BASE_EMIT_PER_FRAME);
      }

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life += 1;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const swirl = Math.sin((p.life + p.noiseSeed) * 0.035) * p.spin;
        const turbulenceX = Math.sin((p.life + p.noiseSeed) * (p.type === 'core' ? 0.11 : 0.19)) * (p.type === 'core' ? 0.35 : 0.62);
        const turbulenceY = Math.cos((p.life + p.noiseSeed) * (p.type === 'core' ? 0.09 : 0.16)) * (p.type === 'core' ? 0.25 : 0.44);
        p.x += p.vx + turbulenceX;
        p.y += p.vy + turbulenceY;
        p.vx = (p.vx + swirl) * (p.type === 'core' ? 0.988 : 0.982);
        p.vy = (p.vy - p.lift) * (p.type === 'core' ? 0.991 : 0.986);
        p.radius *= p.growth;
        const t = p.life / p.maxLife;
        const fade = Math.max(0, 1 - t * 0.95);
        const density = Math.sin((1 - t) * Math.PI);
        const drawSize = p.radius * (1.28 + density * 0.3);
        p.rotation += p.rotationSpeed + swirl * 0.03;
        if (darkTexture) {
          ctx.save();
          ctx.globalAlpha = p.alpha * fade * (p.type === 'core' ? 1.05 : 0.85);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.scale(1 + p.stretch * 0.35, 0.85 + p.stretch * 0.2);
          ctx.drawImage(darkTexture, -drawSize, -drawSize, drawSize * 2, drawSize * 2);
          ctx.restore();
        }
        if (lightTexture) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = p.alpha * fade * 0.42;
          ctx.translate(p.x - p.radius * 0.12, p.y - p.radius * 0.08);
          ctx.rotate(-p.rotation * 0.75);
          ctx.scale(0.9 + p.stretch * 0.2, 0.85 + p.stretch * 0.1);
          ctx.drawImage(lightTexture, -drawSize * 0.82, -drawSize * 0.82, drawSize * 1.64, drawSize * 1.64);
          ctx.restore();
          ctx.globalCompositeOperation = 'source-over';
        }
      }

      if (hasPointer && particles.length < 110) {
        spawn(pointerX, pointerY, Math.min(1.25, 0.55 + pointerSpeed * 0.02), 1);
      }

      rafId = window.requestAnimationFrame(render);
    };

    const onResize = () => {
      updateZones();
      resize();
    };

    updateZones();
    resize();
    darkTexture = createSmokeTexture('dark');
    lightTexture = createSmokeTexture('light');
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', updateZones, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', updateZones);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return <canvas className="smoke-trail-canvas" ref={canvasRef} aria-hidden="true" />;
}
