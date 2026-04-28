import { useEffect, useRef } from 'react';

const MAX_PARTICLES = 140;
const SPAWN_PER_MOVE = 3;

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
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let hasPointer = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (x, y, strength = 1) => {
      for (let i = 0; i < SPAWN_PER_MOVE; i += 1) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.12 + Math.random() * 0.45) * strength;
        particles.push({
          x: x + (Math.random() - 0.5) * 12,
          y: y + (Math.random() - 0.5) * 12,
          vx: Math.cos(angle) * speed * 0.6,
          vy: Math.sin(angle) * speed - (0.15 + Math.random() * 0.25),
          radius: 18 + Math.random() * 34,
          alpha: 0.14 + Math.random() * 0.1,
          life: 0,
          maxLife: 90 + Math.random() * 55,
        });
      }
    };

    const onPointerMove = (event) => {
      const dx = event.clientX - pointerX;
      const dy = event.clientY - pointerY;
      const dist = Math.hypot(dx, dy);
      pointerX = event.clientX;
      pointerY = event.clientY;
      hasPointer = true;
      spawn(pointerX, pointerY, Math.min(1.7, 0.8 + dist * 0.04));
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

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.992;
        p.vy *= 0.992;
        p.radius *= 1.004;
        const t = p.life / p.maxLife;
        const fade = 1 - t;

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        g.addColorStop(0, `rgba(20, 20, 20, ${p.alpha * fade})`);
        g.addColorStop(0.6, `rgba(45, 45, 45, ${p.alpha * 0.45 * fade})`);
        g.addColorStop(1, 'rgba(60, 60, 60, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (hasPointer && particles.length < 20) {
        spawn(pointerX, pointerY, 0.5);
      }

      rafId = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return <canvas className="smoke-trail-canvas" ref={canvasRef} aria-hidden="true" />;
}
