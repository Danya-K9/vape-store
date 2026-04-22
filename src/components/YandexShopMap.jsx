import { useEffect, useRef } from 'react';

const LAT = 54.508801;
const LNG = 30.426632;
const LOGO_MARKER = '/logo.png?v=6';
const STORE_HOURS = `Понедельник — пятница: 10:00–20:00
Суббота: 10:00–19:00
Воскресенье: выходной`;

export default function YandexShopMap({ className = '' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || 'f8c58dc8-6b2e-4cdd-8e8f-9651f318eba0';

  useEffect(() => {
    if (!apiKey || !containerRef.current) return undefined;

    let cancelled = false;

    const ensureScript = () =>
      new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && window.ymaps) {
          resolve();
          return;
        }
        const existing = document.querySelector('script[data-yandex-maps-api="1"]');
        if (existing) {
          if (window.ymaps) {
            resolve();
            return;
          }
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', reject);
          return;
        }
        const script = document.createElement('script');
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
        script.async = true;
        script.dataset.yandexMapsApi = '1';
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });

    ensureScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.ymaps) return;
        window.ymaps.ready(() => {
          if (cancelled || !containerRef.current) return;
          if (mapRef.current) {
            mapRef.current.destroy();
            mapRef.current = null;
          }
          const map = new window.ymaps.Map(containerRef.current, {
            center: [LAT, LNG],
            zoom: 16,
            controls: [],
          });
          map.behaviors.disable('scrollZoom');
          map.options.set('suppressMapOpenBlock', true);

          const markerSize = 56;
          const markerLayout = window.ymaps.templateLayoutFactory.createClass(
            `<div style="
              width:${markerSize}px;
              height:${markerSize}px;
              border-radius:50%;
              overflow:hidden;
              box-shadow: 0 10px 25px rgba(0,0,0,0.18);
              border: 2px solid #fff;
              background:#fff;
              display:flex;
              align-items:center;
              justify-content:center;">
                <img src="${LOGO_MARKER}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />
             </div>`,
          );

          const placemark = new window.ymaps.Placemark(
            [LAT, LNG],
            {
              hintContent: 'Облако пара | вейп-шоп',
              balloonContent: `<strong>г. Орша, ул. Владимира Ленина, 17</strong><br/>${STORE_HOURS.replace(/\n/g, '<br/>')}`,
            },
            {
              iconLayout: markerLayout,
              iconShape: {
                type: 'Circle',
                coordinates: [markerSize / 2, markerSize / 2],
                radius: markerSize / 2,
              },
              iconOffset: [-(markerSize / 2), -markerSize],
            },
          );
          map.geoObjects.add(placemark);
          mapRef.current = map;
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div className={`contacts-map-fallback ${className}`.trim()}>
        <p>Интерактивная карта появится после добавления ключа API Яндекс.Карт в переменную окружения VITE_YANDEX_MAPS_API_KEY.</p>
      </div>
    );
  }

  return <div ref={containerRef} className={className} id="map" role="img" aria-label="Карта — Облако пара, Орша" />;
}
