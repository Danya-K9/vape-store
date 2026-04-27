import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './NoticeBar.css';

const messages = [
  'Доставка временно не доступна!',
  'Вся информация на сайте представлена в информационных целях о реализуемой продукции и не является рекламой.',
  'Мы не осуществляем реализацию никотиносодержащей продукции и устройств для ее потребления дистанционным способом.',
  'Продукция, представленная на сайте предназначена только для лиц, достигших 18 лет.',
];

export default function NoticeBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="notice-bar">
      <span className="notice-chevron">‹</span>
      <div className="notice-content">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            className="notice-text"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            {messages[index]}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="notice-chevron">›</span>
    </div>
  );
}
