import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import AgeGate from './AgeGate';
import './Layout.css';

export default function Layout() {
  const location = useLocation();

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
