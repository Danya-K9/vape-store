import { useEffect, useRef } from 'react';

const MAX_PARTICLES = 220;
const SPAWN_PER_MOVE = 4;

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
    let pointerX = 0;
    let pointerY = 0;
    let hasPointer = false;
    let activeArea = null;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const updateArea = () => {
      activeArea = canvas.getBoundingClientRect();
    };

    const spawn = (x, y, strength = 1) => {
      for (let i = 0; i < SPAWN_PER_MOVE; i += 1) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.08 + Math.random() * 0.38) * strength;
        const baseRadius = 14 + Math.random() * 32;
        particles.push({
          x: x + (Math.random() - 0.5) * 16,
          y: y + (Math.random() - 0.5) * 16,
          vx: Math.cos(angle) * speed * 0.65,
          vy: Math.sin(angle) * speed - (0.1 + Math.random() * 0.24),
          radius: baseRadius,
          radiusX: baseRadius * (1.05 + Math.random() * 0.25),
          radiusY: baseRadius * (0.75 + Math.random() * 0.22),
          alpha: 0.095 + Math.random() * 0.1,
          swirl: (Math.random() - 0.5) * 0.035,
          jitter: 0.25 + Math.random() * 0.45,
          hueShift: Math.random() * 10,
          life: 0,
          maxLife: 110 + Math.random() * 90,
        });
      }
    };

    const onPointerMove = (event) => {
      if (!activeArea) updateArea();
      if (!activeArea) return;
      const inArea = event.clientX >= activeArea.left
        && event.clientX <= activeArea.right
        && event.clientY >= activeArea.top
        && event.clientY <= activeArea.bottom;
      if (!inArea) {
        hasPointer = false;
        return;
      }
      const localX = event.clientX - activeArea.left;
      const localY = event.clientY - activeArea.top;
      const dx = localX - pointerX;
      const dy = localY - pointerY;
      const dist = Math.hypot(dx, dy);
      pointerX = localX;
      pointerY = localY;
      hasPointer = true;
      spawn(pointerX, pointerY, Math.min(2.1, 0.85 + dist * 0.05));
    };

    const render = () => {
      if (!activeArea) updateArea();
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width <= 0 || height <= 0) {
        rafId = window.requestAnimationFrame(render);
        return;
      }
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life += 1;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const swirlForce = p.swirl * Math.sin(p.life * 0.08 + p.hueShift);
        const jitterX = Math.sin((p.life + p.hueShift) * 0.22) * p.jitter;
        const jitterY = Math.cos((p.life + p.hueShift) * 0.18) * p.jitter;
        p.x += p.vx + jitterX * 0.08;
        p.y += p.vy + jitterY * 0.08;
        p.vx = (p.vx + swirlForce) * 0.992;
        p.vy = (p.vy - 0.003) * 0.992;
        p.radius *= 1.0035;
        p.radiusX *= 1.004;
        p.radiusY *= 1.003;
        const t = p.life / p.maxLife;
        const fade = Math.max(0, 1 - t);
        const dense = Math.sin((1 - t) * Math.PI);

        const core = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        core.addColorStop(0, `rgba(18, 18, 18, ${p.alpha * fade * 0.9})`);
        core.addColorStop(0.4, `rgba(35, 35, 35, ${p.alpha * dense * 0.55})`);
        core.addColorStop(1, 'rgba(70, 70, 70, 0)');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radiusX, p.radiusY, p.swirl * 12, 0, Math.PI * 2);
        ctx.fill();

        const soft = ctx.createRadialGradient(
          p.x + p.radius * 0.1,
          p.y - p.radius * 0.05,
          0,
          p.x,
          p.y,
          p.radius * 1.28,
        );
        soft.addColorStop(0, `rgba(52, 52, 52, ${p.alpha * fade * 0.22})`);
        soft.addColorStop(1, 'rgba(80, 80, 80, 0)');
        ctx.fillStyle = soft;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 1.25, 0, Math.PI * 2);
        ctx.fill();
      }

      if (hasPointer && particles.length < 34) {
        spawn(pointerX, pointerY, 0.38);
      }

      rafId = window.requestAnimationFrame(render);
    };

    const onResize = () => {
      updateArea();
      resize();
    };

    updateArea();
    resize();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', updateArea, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', updateArea);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return <canvas className="smoke-trail-canvas" ref={canvasRef} aria-hidden="true" />;
}
