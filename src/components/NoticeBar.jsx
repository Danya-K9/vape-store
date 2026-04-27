import { useState, useEffect } from 'react';
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
        <span key={index} className="notice-text notice-text-animated">{messages[index]}</span>
      </div>
      <span className="notice-chevron">›</span>
    </div>
  );
}
