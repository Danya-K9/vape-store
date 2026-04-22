import { useEffect, useRef } from 'react';

const LAT = 54.508801;
const LNG = 30.426632;
const LOGO_MARKER = '/logo.png?v=5';

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

          const placemark = new window.ymaps.Placemark(
            [LAT, LNG],
            {
              hintContent: 'Облако пара | вейп-шоп',
              balloonContent: 'г. Орша, ул. Владимира Ленина, 17',
            },
            {
              iconLayout: 'default#image',
              iconImageHref: LOGO_MARKER,
              iconImageSize: [40, 40],
              iconImageOffset: [-20, -40],
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
