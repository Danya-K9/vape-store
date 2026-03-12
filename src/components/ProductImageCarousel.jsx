import { useState, useEffect, useCallback } from 'react';
import './ProductImageCarousel.css';

const SLIDE_DURATION = 4000;

export default function ProductImageCarousel({ images = [], alt = '', className = '' }) {
  const allImages = Array.isArray(images) && images.length > 0 ? images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const goToSlide = useCallback((index) => {
    setActiveIndex(index);
    setProgress(0);
  }, []);

  const next = useCallback(() => {
    goToSlide((activeIndex + 1) % allImages.length);
  }, [activeIndex, goToSlide, allImages.length]);

  const prev = useCallback(() => {
    goToSlide((activeIndex - 1 + allImages.length) % allImages.length);
  }, [activeIndex, goToSlide, allImages.length]);

  useEffect(() => {
    if (allImages.length <= 1) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          next();
          return 0;
        }
        return p + (100 / (SLIDE_DURATION / 50));
      });
    }, 50);
    return () => clearInterval(interval);
  }, [activeIndex, next, allImages.length]);

  if (allImages.length === 0) return null;
  if (allImages.length === 1) {
    return (
      <div className={`product-image-carousel ${className}`}>
        <img src={allImages[0]} alt={alt} className="product-carousel-single" />
      </div>
    );
  }

  return (
    <div className={`product-image-carousel ${className}`}>
      <div className="product-carousel-slides">
        {allImages.map((src, i) => (
          <div
            key={i}
            className={`product-carousel-slide ${i === activeIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
      </div>
      <button
        type="button"
        className="product-carousel-arrow product-carousel-arrow-left"
        onClick={(e) => { e.preventDefault(); prev(); }}
        aria-label="Предыдущее фото"
      >
        ‹
      </button>
      <button
        type="button"
        className="product-carousel-arrow product-carousel-arrow-right"
        onClick={(e) => { e.preventDefault(); next(); }}
        aria-label="Следующее фото"
      >
        ›
      </button>
      <div className="product-carousel-indicators">
        {allImages.map((_, i) => (
          <button
            key={i}
            type="button"
            className="product-carousel-indicator"
            onClick={(e) => { e.preventDefault(); goToSlide(i); }}
            aria-label={`Фото ${i + 1}`}
          >
            <span
              className="product-carousel-indicator-fill"
              style={{
                width: i === activeIndex ? `${progress}%` : i < activeIndex ? '100%' : '0%',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
