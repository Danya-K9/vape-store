import { useState, useCallback, useEffect } from 'react';
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
  const items = safeProducts.slice(0, 10);
  const totalPages = items.length;
  const extendedItems = [...items, ...items, ...items];
  const [currentIndex, setCurrentIndex] = useState(totalPages);
  const [visibleCount, setVisibleCount] = useState(VISIBLE_DESKTOP);
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    const update = () => setVisibleCount(getVisibleCount());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const offsetPercent = (currentIndex / extendedItems.length) * 100;

  const goToPage = useCallback(
    (page) => {
      const safePage = ((page % totalPages) + totalPages) % totalPages;
      setCurrentIndex(totalPages + safePage);
    },
    [totalPages]
  );

  const next = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((i) => i + 1);
  }, []);

  const prev = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((i) => i - 1);
  }, []);

  useEffect(() => {
    if (!isTransitioning) return;
    const idx = currentIndex;
    if (idx >= totalPages * 2) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(totalPages + (idx % totalPages));
      }, 600);
      return () => clearTimeout(timer);
    }
    if (idx < totalPages) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(totalPages + idx);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isTransitioning, totalPages]);

  useEffect(() => {
    const timer = setInterval(next, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  const currentPage = ((currentIndex - totalPages) % totalPages + totalPages) % totalPages;

  return (
    <div className="product-carousel">
      <div className="product-carousel-viewport">
        <div
          className="product-carousel-track"
          style={{
            width: `${(extendedItems.length / visibleCount) * 100}%`,
            transform: `translateX(-${offsetPercent}%)`,
            transition: isTransitioning
              ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              : 'none',
          }}
        >
          {extendedItems.map((product, i) => (
            <div
              key={`${product.id}-${i}`}
              className="product-carousel-item"
              style={{ flex: `0 0 ${100 / extendedItems.length}%` }}
            >
              <ProductCard product={product} index={i} />
            </div>
          ))}
        </div>
      </div>
      <div className="product-carousel-nav">
        <div className="product-carousel-dots">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`product-carousel-dot ${i === currentPage ? 'active' : ''}`}
              onClick={() => goToPage(i)}
              aria-label={`Страница ${i + 1}`}
            />
          ))}
        </div>
        <div className="product-carousel-arrows">
          <button type="button" className="product-carousel-arrow" onClick={prev} aria-label="Предыдущий">
            ‹
          </button>
          <button type="button" className="product-carousel-arrow" onClick={next} aria-label="Следующий">
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
