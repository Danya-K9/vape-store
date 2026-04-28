import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import './HeroCarousel.css';

const CONSTELLATION_POINTS = [
  [0.16, 0.55], [0.24, 0.42], [0.34, 0.37], [0.48, 0.33], [0.62, 0.36], [0.74, 0.45], [0.8, 0.56],
  [0.7, 0.64], [0.56, 0.69], [0.42, 0.71], [0.28, 0.67], [0.18, 0.61], [0.29, 0.51], [0.42, 0.47],
  [0.56, 0.49], [0.68, 0.55], [0.56, 0.58], [0.44, 0.59], [0.34, 0.57],
];

const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 0],
  [1, 12], [12, 13], [13, 14], [14, 15], [15, 7], [12, 18], [18, 17], [17, 16], [16, 15], [13, 17],
];

const hash = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

const smoothstep = (t) => t * t * (3 - 2 * t);

const valueNoise = (x, y) => {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const xf = x - x0;
  const yf = y - y0;
  const n00 = hash(x0, y0);
  const n10 = hash(x0 + 1, y0);
  const n01 = hash(x0, y0 + 1);
  const n11 = hash(x0 + 1, y0 + 1);
  const u = smoothstep(xf);
  const v = smoothstep(yf);
  const nx0 = n00 + (n10 - n00) * u;
  const nx1 = n01 + (n11 - n01) * u;
  return nx0 + (nx1 - nx0) * v;
};

const fractalNoise = (x, y, t) => {
  let amp = 0.55;
  let freq = 0.0055;
  let sum = 0;
  for (let i = 0; i < 4; i += 1) {
    sum += valueNoise(x * freq + t * 0.00014, y * freq - t * 0.00011) * amp;
    amp *= 0.52;
    freq *= 1.95;
  }
  return sum;
};

export default function HeroCarousel() {
  const canvasRef = useRef(null);
  const constellation = useMemo(() => ({ points: CONSTELLATION_POINTS, edges: EDGES }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let rafId = 0;
    let time = 0;
    let lastTs = 0;
    let stars = [];
    let vapor = [];
    let edgesPx = [];
    const MAX_VAPOR = window.innerWidth < 900 ? 90 : 160;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const pointsPx = constellation.points.map(([x, y]) => ({
        x: x * rect.width,
        y: y * rect.height,
      }));
      edgesPx = constellation.edges.map(([a, b]) => ({
        a: pointsPx[a],
        b: pointsPx[b],
      }));

      stars = pointsPx.map((point, idx) => ({
        ...point,
        r: 1.2 + ((idx * 7) % 10) * 0.12,
        twinkleSeed: idx * 0.8 + 0.5,
      }));
      vapor = [];
    };

    const spawnVapor = (count = 3) => {
      for (let i = 0; i < count; i += 1) {
        if (vapor.length >= MAX_VAPOR) vapor.shift();
        const e = edgesPx[(Math.random() * edgesPx.length) | 0];
        if (!e) return;
        const t = Math.random();
        const x = e.a.x + (e.b.x - e.a.x) * t;
        const y = e.a.y + (e.b.y - e.a.y) * t;
        const tx = e.b.x - e.a.x;
        const ty = e.b.y - e.a.y;
        const len = Math.hypot(tx, ty) || 1;
        vapor.push({
          x,
          y,
          vx: (tx / len) * (0.18 + Math.random() * 0.25),
          vy: (ty / len) * (0.18 + Math.random() * 0.25),
          life: 0,
          ttl: 120 + Math.random() * 160,
          size: 18 + Math.random() * 36,
          alpha: 0.04 + Math.random() * 0.06,
          seed: Math.random() * 1000,
        });
      }
    };

    const nearestEdgeInfluence = (x, y) => {
      let nearest = null;
      let minDist = 1e9;
      for (let i = 0; i < edgesPx.length; i += 1) {
        const { a, b } = edgesPx[i];
        const abx = b.x - a.x;
        const aby = b.y - a.y;
        const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (y - a.y) * aby) / (abx * abx + aby * aby + 1e-6)));
        const px = a.x + abx * t;
        const py = a.y + aby * t;
        const dx = px - x;
        const dy = py - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < minDist) {
          minDist = d2;
          nearest = { dx, dy, tx: abx, ty: aby, dist: Math.sqrt(d2) };
        }
      }
      if (!nearest) return { ax: 0, ay: 0 };
      const tLen = Math.hypot(nearest.tx, nearest.ty) || 1;
      const tangentX = nearest.tx / tLen;
      const tangentY = nearest.ty / tLen;
      const towardX = nearest.dx / (nearest.dist + 1);
      const towardY = nearest.dy / (nearest.dist + 1);
      const snap = Math.max(0, 1 - nearest.dist / 120);
      return {
        ax: tangentX * 0.014 + towardX * 0.03 * snap,
        ay: tangentY * 0.014 + towardY * 0.03 * snap,
      };
    };

    const draw = (ts) => {
      const dt = Math.min(33, ts - lastTs || 16);
      lastTs = ts;
      time += dt;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#030711');
      bg.addColorStop(0.5, '#050d1f');
      bg.addColorStop(1, '#070b16');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      if (vapor.length < MAX_VAPOR * 0.75) spawnVapor(2);

      for (let i = vapor.length - 1; i >= 0; i -= 1) {
        const p = vapor[i];
        p.life += 1;
        if (p.life > p.ttl) {
          vapor.splice(i, 1);
          continue;
        }

        const n = fractalNoise(p.x, p.y, time + p.seed);
        const angle = n * Math.PI * 2;
        const flowX = Math.cos(angle) * 0.02;
        const flowY = Math.sin(angle) * 0.02;
        const edge = nearestEdgeInfluence(p.x, p.y);

        p.vx = (p.vx + flowX + edge.ax) * 0.985;
        p.vy = (p.vy + flowY + edge.ay - 0.0022) * 0.985;
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.size *= 1.0018;

        const fade = Math.max(0, 1 - p.life / p.ttl);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        g.addColorStop(0, `rgba(215, 225, 235, ${p.alpha * fade * 1.2})`);
        g.addColorStop(0.35, `rgba(170, 185, 205, ${p.alpha * fade * 0.82})`);
        g.addColorStop(1, 'rgba(120, 135, 155, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(120, 180, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.shadowColor = 'rgba(120, 180, 255, 0.32)';
      ctx.shadowBlur = 7;
      edgesPx.forEach(({ a, b }) => {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      stars.forEach((s, i) => {
        const tw = 0.5 + 0.5 * Math.sin(time * 0.0018 + s.twinkleSeed + i * 0.17);
        const r = s.r + tw * 0.9;
        ctx.fillStyle = `rgba(220, 238, 255, ${0.36 + tw * 0.55})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [constellation]);

  return (
    <section className="hero-vape">
      <canvas ref={canvasRef} className="hero-vape-canvas" aria-hidden="true" />
      <div className="hero-vape-overlay">
        <p className="hero-vape-kicker">Облако пара</p>
        <h1>Космический вейп-шоп с живым паром</h1>
        <p>
          Созвездие в форме облака и реалистичный поток пара с мягкой турбулентностью.
          Выбирайте устройства, жидкости и комплектующие в нашем каталоге.
        </p>
        <div className="hero-vape-actions">
          <Link to="/catalog" className="hero-vape-btn hero-vape-btn-primary">Перейти в каталог</Link>
          <Link to="/contacts" className="hero-vape-btn hero-vape-btn-secondary">Контакты и магазины</Link>
        </div>
      </div>
    </section>
  );
}
