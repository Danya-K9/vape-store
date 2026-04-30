import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './CookieBanner.css';

const COOKIE_KEY = 'cookieConsentAccepted';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const accepted = localStorage.getItem(COOKIE_KEY) === '1';
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Уведомление о cookie">
      <p>
        Мы используем cookie и сервисы аналитики (включая Яндекс), чтобы улучшать работу сайта.
        Продолжая пользоваться сайтом, вы соглашаетесь с обработкой данных согласно{' '}
        <Link to="/privacy">Политике конфиденциальности</Link>.
      </p>
      <button type="button" onClick={accept}>Принять</button>
    </div>
  );
}
