import { useState, useEffect, useRef } from 'react';
import './NoticeBar.css';

const messages = [
  'Доставка временно не доступна!',
  'Продукция, представленная на сайте предназначена только для лиц достигших 18 лет.',
];

// [msg0, msg1, msg0] — всегда сдвиг влево, при 2→0 мгновенный сброс
const trackItems = [messages[0], messages[1], messages[0]];

export default function NoticeBar() {
  const [index, setIndex] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => {
        if (i === 2) {
          setNoTransition(true);
          return 0;
        }
        return i + 1;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (noTransition) {
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setNoTransition(false));
      });
      return () => cancelAnimationFrame(t);
    }
  }, [noTransition]);

  return (
    <div className="notice-bar">
      <span className="notice-chevron">‹</span>
      <div className="notice-content">
        <div
          className="notice-track"
          style={{
            transform: `translateX(-${index * (100 / trackItems.length)}%)`,
            transition: noTransition ? 'none' : 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {trackItems.map((msg, i) => (
            <span key={i} className="notice-text">
              {msg}
            </span>
          ))}
        </div>
      </div>
      <span className="notice-chevron">›</span>
    </div>
  );
}
