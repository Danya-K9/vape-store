import { useState, useEffect, useCallback, useRef } from 'react';
import './ProductImageCarousel.css';

const SLIDE_DURATION = 4000;

export default function ProductImageCarousel({ images = [], alt = '', className = '' }) {
  const allImages = Array.isArray(images) && images.length > 0 ? images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, index: 0 });
  const dragOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  dragOffsetRef.current = dragOffset;
  isDraggingRef.current = isDragging;

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
    if (allImages.length <= 1 || isDragging) return;
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
  }, [activeIndex, next, allImages.length, isDragging]);

  const handlePointerDown = useCallback((e) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX ?? e.touches?.[0]?.clientX ?? 0,
      index: activeIndex,
    };
    setDragOffset(0);
  }, [activeIndex]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    if (e.cancelable && e.type.startsWith('touch')) e.preventDefault();
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const delta = dragStartRef.current.x - x;
    const maxDrag = 120;
    setDragOffset(Math.max(-maxDrag, Math.min(maxDrag, delta)));
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragOffset(0);
  }, [isDragging]);

  useEffect(() => {
    const handlePointerUpGlobal = () => {
      if (!isDraggingRef.current) return;
      setIsDragging(false);
      const offset = dragOffsetRef.current;
      const threshold = 50;
      if (offset > threshold) prev();
      else if (offset < -threshold) next();
      setDragOffset(0);
    };
    window.addEventListener('mouseup', handlePointerUpGlobal);
    window.addEventListener('touchend', handlePointerUpGlobal);
    return () => {
      window.removeEventListener('mouseup', handlePointerUpGlobal);
      window.removeEventListener('touchend', handlePointerUpGlobal);
    };
  }, [prev, next]);

  if (allImages.length === 0) return null;
  if (allImages.length === 1) {
    return (
      <div className={`product-image-carousel ${className}`}>
        <img src={allImages[0]} alt={alt} className="product-carousel-single" />
      </div>
    );
  }

  return (
    <div
      className={`product-image-carousel ${className}`}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div
        className="product-carousel-slides product-carousel-slides-sliding"
        style={{
          transform: `translateX(calc(-${activeIndex * 100}% - ${dragOffset}px))`,
          transition: isDragging ? 'none' : 'transform 0.4s ease',
        }}
      >
        {allImages.map((src, i) => (
          <div
            key={i}
            className="product-carousel-slide product-carousel-slide-tile"
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
      </div>
      <div className="product-carousel-indicators">
        {allImages.map((_, i) => (
          <button
            key={i}
            type="button"
            className="product-carousel-indicator"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToSlide(i); }}
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
