import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageTransition from './PageTransition';
import Header from './Header';
import Footer from './Footer';
import AgeGate from './AgeGate';
import CookieBanner from './CookieBanner';
import './Layout.css';

const SIDE_TEXT = 'ОБЛАКО ПАРА ВЕЙП ШОП';

export default function Layout() {
  const location = useLocation();
  const sideChars = SIDE_TEXT.split('');
  const mainRef = useRef(null);
  const [sideTop, setSideTop] = useState(24);
  const [sideHeight, setSideHeight] = useState(260);
  const isHome = location.pathname === '/';
  const sideCharLoop = useMemo(
    () => [...sideChars, ...sideChars, ...sideChars],
    [sideChars]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateSideTop = () => {
      const STRIP_HEIGHT_DEFAULT = 260;
      const STRIP_HEIGHT_MIN = 170;
      const MARGIN = 16;
      const footer = document.querySelector('.footer-dark');
      const footerRect = footer?.getBoundingClientRect();
      const footerTop = footerRect ? footerRect.top - MARGIN : window.innerHeight - MARGIN;

      if (!isHome) {
        const allowedHeight = Math.max(
          STRIP_HEIGHT_MIN,
          Math.min(STRIP_HEIGHT_DEFAULT, footerTop - MARGIN - STRIP_HEIGHT_MIN)
        );
        setSideHeight(Math.round(allowedHeight));
        setSideTop(Math.round(Math.max(MARGIN, Math.min(window.innerHeight / 2 - allowedHeight / 2, footerTop - allowedHeight))));
        return;
      }
      const hero = document.querySelector('.hero-vape') || document.querySelector('.hero-carousel');
      if (!hero) {
        const allowedHeight = Math.max(
          STRIP_HEIGHT_MIN,
          Math.min(STRIP_HEIGHT_DEFAULT, footerTop - MARGIN - STRIP_HEIGHT_MIN)
        );
        setSideHeight(Math.round(allowedHeight));
        setSideTop(Math.round(Math.max(MARGIN, Math.min(window.innerHeight / 2 - allowedHeight / 2, footerTop - allowedHeight))));
        return;
      }
      const heroRect = hero.getBoundingClientRect();
      const topFromHero = heroRect.bottom + 8;
      const available = Math.max(STRIP_HEIGHT_MIN, footerTop - topFromHero);
      const dynamicHeight = Math.min(STRIP_HEIGHT_DEFAULT, available);
      setSideHeight(Math.round(dynamicHeight));
      const centerTop = window.innerHeight / 2 - dynamicHeight / 2;
      const minTop = Math.max(MARGIN, topFromHero);
      const maxTop = Math.max(minTop, footerTop - dynamicHeight);
      const clampedTop = Math.min(Math.max(centerTop, minTop), maxTop);
      setSideTop(Math.round(clampedTop));
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
            style={{
              '--side-strip-top': `${sideTop}px`,
              '--side-strip-height': `${sideHeight}px`,
            }}
          >
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
            <div className="layout-page-content">
              <PageTransition />
            </div>
          </main>
        </div>
        <Footer />
        <CookieBanner />
      </div>
    </AgeGate>
  );
}
