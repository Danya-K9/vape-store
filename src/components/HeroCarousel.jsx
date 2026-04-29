import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './HeroCarousel.css';

const SIDE_DURATION_TOP = 4200;
const SIDE_DURATION_BOTTOM = 5600;
const SIDE_TICK = 50;

const sideBanners = [
  {
    id: 'sideTop',
    slides: [
      'https://images.unsplash.com/photo-1609006152682-39654313bf1b?w=900',
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=900',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900',
    ],
    duration: SIDE_DURATION_TOP,
  },
  {
    id: 'sideBottom',
    slides: [
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=900',
      'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=900',
      'https://images.unsplash.com/photo-1611131642167-5b2d7e9b1f5a?w=900',
    ],
    duration: SIDE_DURATION_BOTTOM,
  },
];

const CONSTELLATION_POINTS = [
  // Five-point star + inner pentagon.
  [0.50, 0.20], [0.60, 0.44], [0.84, 0.44], [0.65, 0.58], [0.74, 0.82],
  [0.50, 0.67], [0.26, 0.82], [0.35, 0.58], [0.16, 0.44], [0.40, 0.44],
  [0.50, 0.34], [0.58, 0.47], [0.53, 0.60], [0.47, 0.60], [0.42, 0.47],
];

const EDGES = [
  [0, 3], [3, 6], [6, 9], [9, 2], [2, 5], [5, 8], [8, 1], [1, 4], [4, 7], [7, 0],
  [10, 11], [11, 12], [12, 13], [13, 14], [14, 10],
  [0, 10], [3, 11], [5, 12], [7, 13], [9, 14],
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
  const [sideState, setSideState] = useState(() => ({
    sideTop: { index: 0, progress: 0 },
    sideBottom: { index: 0, progress: 0 },
  }));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSideState((prev) => {
        const nextState = { ...prev };
        sideBanners.forEach((banner) => {
          const current = prev[banner.id];
          const step = 100 / (banner.duration / SIDE_TICK);
          const nextProgress = current.progress + step;
          nextState[banner.id] = nextProgress >= 100
            ? { index: (current.index + 1) % banner.slides.length, progress: 0 }
            : { index: current.index, progress: nextProgress };
        });
        return nextState;
      });
    }, SIDE_TICK);
    return () => window.clearInterval(interval);
  }, []);

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
      const snap = Math.max(0, 1 - nearest.dist / 140);
      return {
        ax: tangentX * 0.018 + towardX * 0.04 * snap,
        ay: tangentY * 0.018 + towardY * 0.04 * snap,
      };
    };

    const draw = (ts) => {
      const dt = Math.min(33, ts - lastTs || 16);
      lastTs = ts;
      time += dt;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

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
        const flowX = Math.cos(angle) * 0.022;
        const flowY = Math.sin(angle) * 0.022;
        const edge = nearestEdgeInfluence(p.x, p.y);

        p.vx = (p.vx + flowX + edge.ax) * 0.985;
        p.vy = (p.vy + flowY + edge.ay - 0.0022) * 0.985;
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.size *= 1.0018;

        const fade = Math.max(0, 1 - p.life / p.ttl);
        // Soft “vapor” look: slightly bluish-white core -> gray edge.
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        g.addColorStop(0, `rgba(232, 242, 255, ${p.alpha * fade * 1.35})`);
        g.addColorStop(0.35, `rgba(185, 205, 232, ${p.alpha * fade * 0.9})`);
        g.addColorStop(1, 'rgba(120, 135, 155, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Constellation lines (black as requested).
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.lineWidth = 1;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
      ctx.shadowBlur = 4;
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
        ctx.fillStyle = `rgba(0, 0, 0, ${0.26 + tw * 0.42})`;
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
      <div className="hero-vape-grid">
        <Link to="/catalog" className="hero-vape-main" aria-label="Перейти в каталог">
          <canvas ref={canvasRef} className="hero-vape-canvas" aria-hidden="true" />
        </Link>
        <div className="hero-vape-side">
          {sideBanners.map((banner) => (
            <Link
              key={banner.id}
              to="/catalog"
              className="hero-vape-side-card"
              style={{ backgroundImage: `url('${banner.slides[sideState[banner.id].index]}')` }}
              aria-label="Каталог — подборка"
            >
              <span className="hero-vape-side-progress" aria-hidden="true">
                {banner.slides.map((_, idx) => (
                  <span key={idx} className="hero-vape-side-progress-item">
                    <span
                      className="hero-vape-side-progress-fill"
                      style={{
                        width: idx === sideState[banner.id].index
                          ? `${sideState[banner.id].progress}%`
                          : idx < sideState[banner.id].index ? '100%' : '0%',
                      }}
                    />
                  </span>
                ))}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
