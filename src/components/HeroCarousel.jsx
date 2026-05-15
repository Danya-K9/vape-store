import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { contentApi } from '../lib/api';
import './HeroCarousel.css';

const MAIN_SLIDE_DURATION = 5000;
const SIDE1_DURATION = 3600;
const SIDE2_DURATION = 6100;
const TICK_MS = 50;

const MAIN_SLIDE_LINKS = [
  '/catalog/liquids',
  '/catalog/pod-systems',
  '/catalog/pouches',
  '/catalog/disposables',
];

function getMainSlideLink(index, firstBlogLink) {
  if (index === 0 && firstBlogLink) return firstBlogLink;
  return MAIN_SLIDE_LINKS[index] || '/catalog';
}

function getSideBannerLink(bannerId) {
  if (bannerId === 'side1') return '/blog/vizitka';
  if (bannerId === 'side2') return '/catalog/hookah-coals';
  return '/catalog';
}

export default function HeroCarousel() {
  const [mainSlidesData, setMainSlidesData] = useState([]);
  const [sideBannersData, setSideBannersData] = useState([]);
  const [bannersLoaded, setBannersLoaded] = useState(false);
  const [firstBlogLink, setFirstBlogLink] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [sideState, setSideState] = useState(() => ({
    side1: { index: 0, progress: 0 },
    side2: { index: 0, progress: 0 },
  }));

  useEffect(() => {
    let cancelled = false;
    Promise.all([contentApi.heroBanners(), contentApi.blogPosts()])
      .then(([data, posts]) => {
        if (cancelled) return;
        const banners = Array.isArray(data) ? data : [];
        const main = banners
          .filter((b) => b.zone === 'main' && b.image)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((b) => ({
            id: b.id,
            image: b.image,
            title: b.title || '',
            discountText: b.discountText || '',
          }));
        setMainSlidesData(main);

        const sideTop = banners
          .filter((b) => b.zone === 'side-top' && b.image)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((b) => b.image);
        const sideBottom = banners
          .filter((b) => b.zone === 'side-bottom' && b.image)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((b) => b.image);

        const sides = [];
        if (sideTop.length > 0) sides.push({ id: 'side1', slides: sideTop });
        if (sideBottom.length > 0) sides.push({ id: 'side2', slides: sideBottom });
        setSideBannersData(sides);

        const first = Array.isArray(posts) ? posts[0] : null;
        const slugOrId = first?.slug || first?.id;
        if (slugOrId) setFirstBlogLink(`/blog/${slugOrId}`);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setBannersLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  const goToSlide = useCallback((index) => {
    setActiveIndex(index);
    setProgress(0);
  }, []);

  const mainCount = mainSlidesData.length;

  const next = useCallback(() => {
    if (mainCount < 1) return;
    goToSlide((activeIndex + 1) % mainCount);
  }, [activeIndex, goToSlide, mainCount]);

  const prev = useCallback(() => {
    if (mainCount < 1) return;
    goToSlide((activeIndex - 1 + mainCount) % mainCount);
  }, [activeIndex, goToSlide, mainCount]);

  useEffect(() => {
    if (mainCount < 1) return undefined;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          next();
          return 0;
        }
        return p + (100 / (MAIN_SLIDE_DURATION / TICK_MS));
      });
      setSideState((prevState) => {
        const slides1Len = sideBannersData.find((b) => b.id === 'side1')?.slides?.length || 1;
        const slides2Len = sideBannersData.find((b) => b.id === 'side2')?.slides?.length || 1;
        const step1 = 100 / (SIDE1_DURATION / TICK_MS);
        const step2 = 100 / (SIDE2_DURATION / TICK_MS);
        const next1Progress = prevState.side1.progress + step1;
        const next2Progress = prevState.side2.progress + step2;
        const side1 = next1Progress >= 100
          ? { index: (prevState.side1.index + 1) % slides1Len, progress: 0 }
          : { index: prevState.side1.index, progress: next1Progress };
        const side2 = next2Progress >= 100
          ? { index: (prevState.side2.index + 1) % slides2Len, progress: 0 }
          : { index: prevState.side2.index, progress: next2Progress };
        return { side1, side2 };
      });
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [activeIndex, next, sideBannersData, mainCount]);

  const handleProgressClick = (index) => {
    goToSlide(index);
  };

  if (!bannersLoaded) {
    return <section className="hero-carousel hero-carousel--loading" aria-hidden="true" />;
  }

  if (mainCount === 0 && sideBannersData.length === 0) {
    return null;
  }

  return (
    <section className="hero-carousel">
      <div className="hero-carousel-inner">
        {mainCount > 0 && (
          <div className="hero-main-area">
            <Link to={getMainSlideLink(activeIndex, firstBlogLink)} className="hero-main-slide-wrap">
              <button
                type="button"
                className="hero-arrow hero-arrow-left"
                onClick={(e) => {
                  e.preventDefault();
                  prev();
                }}
                aria-label="Предыдущий слайд"
              >
                ‹
              </button>
              <div className="hero-slides">
                {mainSlidesData.map((slide, i) => (
                  <div
                    key={slide.id}
                    className={`hero-slide ${i === activeIndex ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${slide.image})` }}
                  >
                    <p className="hero-slide-title">{slide.title}</p>
                    {slide.discountText && <span className="hero-discount-badge">{slide.discountText}</span>}
                    <span className="hero-slide-cta">Подробнее</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="hero-arrow hero-arrow-right"
                onClick={(e) => {
                  e.preventDefault();
                  next();
                }}
                aria-label="Следующий слайд"
              >
                ›
              </button>
            </Link>
            <div className="hero-indicators">
              {mainSlidesData.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className="hero-indicator"
                  onClick={() => handleProgressClick(i)}
                  aria-label={`Слайд ${i + 1}`}
                >
                  <span
                    className="hero-indicator-fill"
                    style={{
                      width: i === activeIndex ? `${progress}%` : i < activeIndex ? '100%' : '0%',
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        {sideBannersData.length > 0 && (
          <div className="hero-side-banners">
            {sideBannersData.map((banner) => (
              <Link key={banner.id} to={getSideBannerLink(banner.id)} className="hero-side-banner">
                {banner.slides.map((img, index) => (
                  <div
                    key={`${banner.id}-${img}-${index}`}
                    className={`hero-side-banner-bg ${index === (sideState[banner.id]?.index ?? 0) ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${img})` }}
                  />
                ))}
                <span className="hero-side-indicators" aria-hidden="true">
                  {banner.slides.map((_, i) => (
                    <span key={i} className="hero-side-indicator">
                      <span
                        className="hero-side-indicator-fill"
                        style={{
                          width: i === (sideState[banner.id]?.index ?? 0)
                            ? `${sideState[banner.id]?.progress ?? 0}%`
                            : i < (sideState[banner.id]?.index ?? 0)
                              ? '100%'
                              : '0%',
                        }}
                      />
                    </span>
                  ))}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
