import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

export const pageTransitionVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function getTransition(reducedMotion, isAdmin) {
  if (reducedMotion) {
    return { duration: 0.01 };
  }
  if (isAdmin) {
    return { duration: 0.15, ease: EASE };
  }
  return { duration: 0.42, ease: EASE };
}

export default function PageTransition() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/vapeAdminDanik');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const transition = getTransition(reducedMotion, isAdmin);

  const scrollToTop = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  return (
    <AnimatePresence mode="wait" onExitComplete={scrollToTop}>
      <motion.div
        key={location.pathname}
        className="page-transition"
        variants={reducedMotion ? undefined : pageTransitionVariants}
        initial={reducedMotion ? false : 'initial'}
        animate={reducedMotion ? undefined : 'animate'}
        exit={reducedMotion ? undefined : 'exit'}
        transition={transition}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
