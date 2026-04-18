import { useEffect, useRef } from 'react';
import './YandexMap.css';

/** Координаты магазина — центр карты и метки */
const LAT = 54.508801;
const LNG = 30.426632;
const ZOOM = 16;

let ymapsScriptPromise = null;

function loadYandexMaps(apiKey) {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.ymaps) return Promise.resolve(window.ymaps);
  if (!ymapsScriptPromise) {
    ymapsScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.dataset.yandexMapsApi = '1';
      script.async = true;
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
      script.onload = () => resolve(window.ymaps);
      script.onerror = () => {
        ymapsScriptPromise = null;
        reject(new Error('Yandex Maps script failed'));
      };
      document.head.appendChild(script);
    });
  }
  return ymapsScriptPromise;
}

export default function YandexMap() {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
    if (!apiKey || !containerRef.current) return undefined;

    let cancelled = false;

    loadYandexMaps(apiKey)
      .then((ymaps) => {
        if (cancelled || !containerRef.current) return;
        ymaps.ready(() => {
          if (cancelled || !containerRef.current) return;
          if (mapInstanceRef.current) {
            mapInstanceRef.current.destroy();
            mapInstanceRef.current = null;
          }
          const map = new ymaps.Map(
            containerRef.current,
            {
              center: [LAT, LNG],
              zoom: ZOOM,
              controls: [],
            },
            {
              suppressMapOpenBlock: true,
              yandexMapDisablePoiInteractivity: true,
            },
          );
          map.behaviors.disable('scrollZoom');

          const placemark = new ymaps.Placemark(
            [LAT, LNG],
            {
              hintContent: 'Облако пара — вейп-шоп',
              balloonContent: 'г. Орша, ул. Владимира Ленина, 17',
            },
            {
              iconLayout: 'default#image',
              iconImageHref: '/logo.jpg',
              iconImageSize: [40, 40],
              iconImageOffset: [-20, -40],
            },
          );
          map.geoObjects.add(placemark);
          mapInstanceRef.current = map;
        });
      })
      .catch(() => {
        /* оставляем плейсхолдер в разметке */
      });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const hasKey = Boolean(import.meta.env.VITE_YANDEX_MAPS_API_KEY);

  return (
    <div
      ref={containerRef}
      id="contacts-map"
      className={`yandex-map-root ${hasKey ? '' : 'yandex-map-root--no-key'}`}
      role="region"
      aria-label="Карта — Облако пара, Орша"
    >
      {!hasKey && (
        <p className="yandex-map-placeholder-msg">
          Укажите переменную окружения <code>VITE_YANDEX_MAPS_API_KEY</code> для отображения карты.
        </p>
      )}
    </div>
  );
}
