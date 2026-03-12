import { useEffect, useMemo, useState } from 'react';
import './AgeGate.css';

const STORAGE_KEY = 'vape_store_age_gate';

export default function AgeGate({ children }) {
  const [status, setStatus] = useState('unknown'); // unknown | allowed | denied

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'allowed') setStatus('allowed');
      // "denied" не кешируем — при перезагрузке спросим снова
    } catch {
      // ignore
    }
  }, []);

  const modalOpen = status === 'unknown';

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!modalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [modalOpen]);

  const denyView = useMemo(() => (
    <div className="agegate-denied">
      <div className="agegate-denied-card">
        <div className="agegate-badge">18+</div>
        <h1>Доступ ограничен</h1>
        <p>Сайт предназначен только для лиц старше 18 лет.</p>
      </div>
    </div>
  ), []);

  if (status === 'denied') return denyView;

  return (
    <>
      {children}
      {modalOpen && (
        <div className="agegate-overlay" role="dialog" aria-modal="true" aria-label="Подтверждение возраста">
          <div className="agegate-modal">
            <div className="agegate-badge">18+</div>
            <h2>Подтверждение возраста</h2>
            <p>Сайт предназначен только для лиц старше 18 лет. Вам уже есть 18?</p>
            <div className="agegate-actions">
              <button
                type="button"
                className="agegate-btn agegate-btn-yes"
                onClick={() => {
                  try { localStorage.setItem(STORAGE_KEY, 'allowed'); } catch { /* ignore */ }
                  setStatus('allowed');
                }}
              >
                Да, мне есть 18 лет
              </button>
              <button
                type="button"
                className="agegate-btn agegate-btn-no"
                onClick={() => {
                  setStatus('denied');
                }}
              >
                Нет, мне нет 18 лет
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

