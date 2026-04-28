import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import AgeGate from './AgeGate';
import './Layout.css';

const SIDE_TEXT = 'ОБЛАКО ПАРА ВЕЙП ШОП';

export default function Layout() {
  const location = useLocation();
  const sideChars = SIDE_TEXT.split('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <AgeGate>
      <div className="layout">
        <Header />
        <div className="layout-body">
          <main className="main-content">
            <aside className="side-marquee side-marquee-left" aria-hidden="true">
              <div className="side-marquee-track">
                {[...sideChars, ...sideChars].map((char, idx) => (
                  <span key={`left-${idx}`} className="side-marquee-char">
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </div>
            </aside>
            <aside className="side-marquee side-marquee-right" aria-hidden="true">
              <div className="side-marquee-track">
                {[...sideChars, ...sideChars].map((char, idx) => (
                  <span key={`right-${idx}`} className="side-marquee-char">
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </div>
            </aside>
            <motion.div
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
