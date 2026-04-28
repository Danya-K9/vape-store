import { useMemo, useState, useCallback, useEffect } from 'react';
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
  const [visibleCount, setVisibleCount] = useState(VISIBLE_DESKTOP);
  const items = useMemo(() => safeProducts.slice(0, 10), [safeProducts]);
  const pageCount = Math.max(1, Math.ceil(items.length / Math.max(1, visibleCount)));
  const pages = useMemo(() => {
    const result = [];
    for (let i = 0; i < pageCount; i += 1) {
      result.push(items.slice(i * visibleCount, (i + 1) * visibleCount));
    }
    return result;
  }, [items, pageCount, visibleCount]);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const update = () => setVisibleCount(getVisibleCount());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    setPageIndex(0);
  }, [visibleCount, items.length]);

  const goToPage = useCallback(
    (page) => {
      const safePage = ((page % pageCount) + pageCount) % pageCount;
      setPageIndex(safePage);
    },
    [pageCount]
  );

  const next = useCallback(() => {
    setPageIndex((i) => (i + 1) % pageCount);
  }, [pageCount]);

  const prev = useCallback(() => {
    setPageIndex((i) => (i - 1 + pageCount) % pageCount);
  }, [pageCount]);

  useEffect(() => {
    if (pageCount <= 1) return undefined;
    const timer = setInterval(next, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [next, pageCount]);

  return (
    <div className="product-carousel">
      <div className="product-carousel-viewport">
        <div
          className="product-carousel-track"
          style={{ transform: `translateX(-${pageIndex * 100}%)` }}
        >
          {pages.map((page, pIdx) => (
            <div key={pIdx} className="product-carousel-page">
              {page.map((product, i) => (
                <div
                  key={`${product.id}-${pIdx}-${i}`}
                  className="product-carousel-item"
                  style={{ flex: `0 0 ${100 / Math.max(1, visibleCount)}%` }}
                >
                  <ProductCard product={product} index={i} />
                </div>
              ))}
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
            aria-label="Предыдущая страница"
          >
            ‹
          </button>
          <button
            type="button"
            className="product-carousel-arrow"
            onClick={next}
            aria-label="Следующая страница"
          >
            ›
          </button>
        </div>
        <div className="product-carousel-dots">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`product-carousel-dot ${i === pageIndex ? 'active' : ''}`}
              onClick={() => goToPage(i)}
              aria-label={`Страница ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
