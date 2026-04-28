import { useEffect, useRef } from 'react';

const MAX_PARTICLES = 320;
const SPAWN_PER_MOVE = 6;

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

    const spawn = (x, y, strength = 1) => {
      for (let i = 0; i < SPAWN_PER_MOVE; i += 1) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.12 + Math.random() * 0.55) * strength;
        const baseRadius = 12 + Math.random() * 34;
        const spread = 12 + Math.random() * 16;
        const ttl = 140 + Math.random() * 120;
        particles.push({
          x: x + (Math.random() - 0.5) * spread,
          y: y + (Math.random() - 0.5) * spread,
          vx: Math.cos(angle) * speed * 0.48,
          vy: Math.sin(angle) * speed * 0.34 - (0.12 + Math.random() * 0.28),
          radius: baseRadius * (0.85 + Math.random() * 0.45),
          alpha: 0.06 + Math.random() * 0.11,
          spin: (Math.random() - 0.5) * 0.07,
          noiseSeed: Math.random() * 1000,
          growth: 1.006 + Math.random() * 0.0035,
          life: 0,
          maxLife: ttl,
        });
      }
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
      hasPointer = true;
      spawn(pointerX, pointerY, Math.min(2.8, 0.9 + dist * 0.06));
    };

    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life += 1;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const swirl = Math.sin((p.life + p.noiseSeed) * 0.035) * p.spin;
        const turbulenceX = Math.sin((p.life + p.noiseSeed) * 0.14) * 0.4;
        const turbulenceY = Math.cos((p.life + p.noiseSeed) * 0.11) * 0.28;
        p.x += p.vx + turbulenceX;
        p.y += p.vy + turbulenceY;
        p.vx = (p.vx + swirl) * 0.989;
        p.vy = (p.vy - 0.0026) * 0.99;
        p.radius *= p.growth;
        const t = p.life / p.maxLife;
        const fade = Math.max(0, 1 - t * 0.96);
        const density = Math.sin((1 - t) * Math.PI);
        const blurRadius = p.radius * (1.12 + density * 0.28);

        const darkLayer = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, blurRadius);
        darkLayer.addColorStop(0, `rgba(10, 10, 10, ${p.alpha * fade * 1.05})`);
        darkLayer.addColorStop(0.42, `rgba(34, 34, 34, ${p.alpha * fade * 0.8})`);
        darkLayer.addColorStop(1, 'rgba(70, 70, 70, 0)');
        ctx.fillStyle = darkLayer;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, blurRadius * 1.08, blurRadius * 0.86, swirl * 10, 0, Math.PI * 2);
        ctx.fill();

        const grayLayer = ctx.createRadialGradient(
          p.x + p.radius * 0.16,
          p.y - p.radius * 0.1,
          0,
          p.x,
          p.y,
          blurRadius * 1.3,
        );
        grayLayer.addColorStop(0, `rgba(88, 88, 88, ${p.alpha * fade * 0.33})`);
        grayLayer.addColorStop(0.7, `rgba(130, 130, 130, ${p.alpha * fade * 0.08})`);
        grayLayer.addColorStop(1, 'rgba(160, 160, 160, 0)');
        ctx.fillStyle = grayLayer;
        ctx.beginPath();
        ctx.arc(p.x, p.y, blurRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();

        const highlight = ctx.createRadialGradient(
          p.x - p.radius * 0.22,
          p.y - p.radius * 0.22,
          0,
          p.x,
          p.y,
          blurRadius * 0.88
        );
        highlight.addColorStop(0, `rgba(240, 240, 240, ${p.alpha * fade * 0.12})`);
        highlight.addColorStop(1, 'rgba(230, 230, 230, 0)');
        ctx.fillStyle = highlight;
        ctx.beginPath();
        ctx.arc(p.x - p.radius * 0.05, p.y - p.radius * 0.05, blurRadius * 0.84, 0, Math.PI * 2);
        ctx.fill();
      }

      if (hasPointer && particles.length < 68) {
        spawn(pointerX, pointerY, 0.5);
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
