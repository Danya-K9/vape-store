import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import AgeGate from './AgeGate';
import SmokeTrailCanvas from './SmokeTrailCanvas';
import './Layout.css';

const SIDE_TEXT = 'ОБЛАКО ПАРА ВЕЙП ШОП';

export default function Layout() {
  const location = useLocation();
  const sideChars = SIDE_TEXT.split('');
  const mainRef = useRef(null);
  const [sideTop, setSideTop] = useState(24);
  const isHome = location.pathname === '/';
  const sideCharLoop = useMemo(
    () => [...sideChars, ...sideChars, ...sideChars],
    [sideChars]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateSideTop = () => {
      if (!isHome) {
        setSideTop(Math.max(20, Math.round(window.innerHeight * 0.36)));
        return;
      }
      const hero = document.querySelector('.hero-carousel');
      if (!hero) {
        setSideTop(Math.max(20, Math.round(window.innerHeight * 0.36)));
        return;
      }
      const heroRect = hero.getBoundingClientRect();
      const topFromHero = heroRect.bottom + 8;
      const clamped = Math.min(
        Math.max(20, topFromHero),
        Math.max(20, window.innerHeight - 280)
      );
      setSideTop(Math.round(clamped));
    };

    updateSideTop();
    window.addEventListener('resize', updateSideTop);
    window.addEventListener('scroll', updateSideTop, { passive: true });
    const delayed = window.setTimeout(updateSideTop, 80);
    return () => {
      window.clearTimeout(delayed);
      window.removeEventListener('resize', updateSideTop);
      window.removeEventListener('scroll', updateSideTop);
    };
  }, [isHome, location.pathname]);

  return (
    <AgeGate>
      <div className="layout">
        <Header />
        <div className="layout-body">
          <main
            className="main-content"
            ref={mainRef}
            style={{ '--side-strip-top': `${sideTop}px` }}
          >
            <SmokeTrailCanvas enabled={isHome} />
            <aside className="side-marquee side-marquee-left" aria-hidden="true">
              <div className="side-marquee-track">
                {sideCharLoop.map((char, idx) => (
                  <span key={`left-${idx}`} className="side-marquee-char">
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </div>
            </aside>
            <aside className="side-marquee side-marquee-right" aria-hidden="true">
              <div className="side-marquee-track">
                {sideCharLoop.map((char, idx) => (
                  <span key={`right-${idx}`} className="side-marquee-char">
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </div>
            </aside>
            <motion.div
              className="layout-page-content"
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
        <Footer />
      </div>
    </AgeGate>
  );
}
