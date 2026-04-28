import { useEffect, useRef } from 'react';

const MAX_PARTICLES = 520;
const BASE_EMIT_PER_FRAME = 2;
const POINTER_EMIT_BURST = 7;

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
    const particles = [];
    let pointerX = window.innerWidth * 0.5;
    let pointerY = window.innerHeight * 0.4;
    let hasPointer = false;
    let pointerSpeed = 0;
    let prevPointerX = pointerX;
    let prevPointerY = pointerY;
    let mainArea = null;
    let footerArea = null;

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

    const emitParticle = (x, y, strength = 1, type = 'core') => {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      const angle = Math.random() * Math.PI * 2;
      const baseSpeed = (0.08 + Math.random() * 0.55) * strength;
      const spread = type === 'core' ? (8 + Math.random() * 14) : (16 + Math.random() * 20);
      const ttl = type === 'core' ? (160 + Math.random() * 140) : (120 + Math.random() * 110);
      const baseRadius = type === 'core' ? (12 + Math.random() * 30) : (8 + Math.random() * 18);
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
      spawn(pointerX, pointerY, Math.min(3.4, 1.1 + dist * 0.08), POINTER_EMIT_BURST);
    };

    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = 'source-over';

      if (hasPointer && isAllowedPoint(pointerX, pointerY)) {
        const driftX = pointerX - prevPointerX;
        const driftY = pointerY - prevPointerY;
        prevPointerX += driftX * 0.24;
        prevPointerY += driftY * 0.24;
        const trailingStrength = Math.min(2.6, 0.8 + pointerSpeed * 0.05);
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
        const blurRadius = p.radius * (1.1 + density * 0.34);

        const darkLayer = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, blurRadius);
        darkLayer.addColorStop(0, `rgba(8, 8, 8, ${p.alpha * fade * (p.type === 'core' ? 1.35 : 0.95)})`);
        darkLayer.addColorStop(0.42, `rgba(26, 26, 26, ${p.alpha * fade * 0.92})`);
        darkLayer.addColorStop(0.75, `rgba(48, 48, 48, ${p.alpha * fade * 0.42})`);
        darkLayer.addColorStop(1, 'rgba(88, 88, 88, 0)');
        ctx.fillStyle = darkLayer;
        ctx.beginPath();
        ctx.ellipse(
          p.x,
          p.y,
          blurRadius * (p.type === 'core' ? 1.12 : 0.95),
          blurRadius * (p.type === 'core' ? 0.82 : 0.92),
          swirl * (p.type === 'core' ? 8 : 14),
          0,
          Math.PI * 2
        );
        ctx.fill();

        const grayLayer = ctx.createRadialGradient(
          p.x + p.radius * 0.16,
          p.y - p.radius * 0.1,
          0,
          p.x,
          p.y,
          blurRadius * 1.3,
        );
        grayLayer.addColorStop(0, `rgba(92, 92, 92, ${p.alpha * fade * 0.42})`);
        grayLayer.addColorStop(0.7, `rgba(152, 152, 152, ${p.alpha * fade * 0.16})`);
        grayLayer.addColorStop(1, 'rgba(182, 182, 182, 0)');
        ctx.fillStyle = grayLayer;
        ctx.beginPath();
        ctx.arc(p.x, p.y, blurRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'lighter';
        const highlight = ctx.createRadialGradient(
          p.x - p.radius * 0.22,
          p.y - p.radius * 0.22,
          0,
          p.x,
          p.y,
          blurRadius * 0.88
        );
        highlight.addColorStop(0, `rgba(248, 248, 248, ${p.alpha * fade * 0.22})`);
        highlight.addColorStop(0.45, `rgba(215, 215, 215, ${p.alpha * fade * 0.1})`);
        highlight.addColorStop(1, 'rgba(230, 230, 230, 0)');
        ctx.fillStyle = highlight;
        ctx.beginPath();
        ctx.arc(p.x - p.radius * 0.05, p.y - p.radius * 0.05, blurRadius * 0.84, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }

      if (hasPointer && particles.length < 130) {
        spawn(pointerX, pointerY, Math.min(1.8, 0.7 + pointerSpeed * 0.03), 1);
      }

      rafId = window.requestAnimationFrame(render);
    };

    const onResize = () => {
      updateZones();
      resize();
    };

    updateZones();
    resize();
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
