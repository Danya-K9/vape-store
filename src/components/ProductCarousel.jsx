import { useState, useCallback, useEffect, useMemo } from 'react';
import ProductCard from './ProductCard';
import './ProductCarousel.css';

const VISIBLE_DESKTOP = 5;
const VISIBLE_TABLET = 4;
const VISIBLE_MOBILE = 2;
const AUTO_SLIDE_INTERVAL = 10000;

function getVisibleCount() {
  if (typeof window === 'undefined') return VISIBLE_DESKTOP;
  if (window.innerWidth < 768) return VISIBLE_MOBILE;
  if (window.innerWidth < 1100) return VISIBLE_TABLET;
  return VISIBLE_DESKTOP;
}

export default function ProductCarousel({ products = [] }) {
  const safeProducts = Array.isArray(products) ? products : [];
  const items = useMemo(() => safeProducts.slice(0, 10), [safeProducts]);
  const totalItems = items.length;
  const extendedItems = useMemo(() => [...items, ...items, ...items], [items]);
  const [visibleCount, setVisibleCount] = useState(VISIBLE_DESKTOP);
  const [currentIndex, setCurrentIndex] = useState(totalItems);
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    const update = () => setVisibleCount(getVisibleCount());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    setIsTransitioning(false);
    setCurrentIndex(totalItems);
    const t = setTimeout(() => setIsTransitioning(true), 0);
    return () => clearTimeout(t);
  }, [visibleCount, totalItems]);

  const stepPercent = extendedItems.length > 0 ? (100 / extendedItems.length) : 0;
  const offsetPercent = currentIndex * stepPercent;

  const goToPage = useCallback(
    (index) => {
      if (totalItems <= 0) return;
      const safe = ((index % totalItems) + totalItems) % totalItems;
      setIsTransitioning(true);
      setCurrentIndex(totalItems + safe);
    },
    [totalItems]
  );

  const next = useCallback(() => {
    if (totalItems <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((i) => i + 1);
  }, [totalItems]);

  const prev = useCallback(() => {
    if (totalItems <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((i) => i - 1);
  }, [totalItems]);

  useEffect(() => {
    if (!isTransitioning) return;
    if (totalItems <= 1) return;
    const idx = currentIndex;
    if (idx >= totalItems * 2) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(totalItems + (idx % totalItems));
      }, 700);
      return () => clearTimeout(timer);
    }
    if (idx < totalItems) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(totalItems + idx);
      }, 700);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentIndex, isTransitioning, totalItems]);

  useEffect(() => {
    if (totalItems <= 1) return undefined;
    const timer = setInterval(next, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [next, totalItems]);

  const activeDot = totalItems > 0
    ? ((currentIndex - totalItems) % totalItems + totalItems) % totalItems
    : 0;

  return (
    <div className="product-carousel">
      <div className="product-carousel-viewport">
        <div
          className="product-carousel-track"
          style={{
            width: visibleCount > 0 ? `${(extendedItems.length / visibleCount) * 100}%` : '100%',
            transform: `translateX(-${offsetPercent}%)`,
            transition: isTransitioning
              ? 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)'
              : 'none',
          }}
        >
          {extendedItems.map((product, i) => (
            <div
              key={`${product.id}-${i}`}
              className="product-carousel-item"
              style={{ flex: `0 0 ${100 / Math.max(1, extendedItems.length)}%` }}
            >
              <ProductCard product={product} index={i} />
            </div>
          ))}
        </div>
      </div>
      <div className="product-carousel-nav">
        <div className="product-carousel-arrows">
          <button
            type="button"
            className="product-carousel-arrow"
            onClick={prev}
            aria-label="Предыдущий товар"
          >
            ‹
          </button>
          <button
            type="button"
            className="product-carousel-arrow"
            onClick={next}
            aria-label="Следующий товар"
          >
            ›
          </button>
        </div>
        <div className="product-carousel-dots">
          {Array.from({ length: totalItems }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`product-carousel-dot ${i === activeDot ? 'active' : ''}`}
              onClick={() => goToPage(i)}
              aria-label={`Товар ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
