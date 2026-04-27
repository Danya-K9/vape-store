import { useState, useEffect, useRef } from 'react';
import './NoticeBar.css';

const messages = [
  'Доставка временно не доступна!',
  'Вся информация на сайте представлена в информационных целях о реализуемой продукции и не является рекламой.',
  'Мы не осуществляем реализацию никотиносодержащей продукции и устройств для ее потребления дистанционным способом.',
  'Продукция, представленная на сайте предназначена только для лиц, достигших 18 лет.',
];

const trackItems = [...messages, messages[0]];

export default function NoticeBar() {
  const [index, setIndex] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => {
        if (i === trackItems.length - 1) {
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
            transform: `translateX(-${index * 100}%)`,
            transition: noTransition ? 'none' : 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            width: `${trackItems.length * 100}%`,
          }}
        >
          {trackItems.map((msg, i) => (
            <span key={`${i}-${msg.slice(0, 16)}`} className="notice-text" style={{ flexBasis: `${100 / trackItems.length}%` }}>
              {msg}
            </span>
          ))}
        </div>
      </div>
      <span className="notice-chevron">›</span>
    </div>
  );
}
