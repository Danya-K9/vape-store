import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { contentApi } from '../lib/api';
import './HeroCarousel.css';

const MAIN_SLIDE_DURATION = 5000;
const SIDE1_DURATION = 3600;
const SIDE2_DURATION = 6100;
const TICK_MS = 50;

const mainSlides = [
  {
    id: 1,
    image: 'https://images.pexels.com/photos/14195357/pexels-photo-14195357.jpeg?auto=compress&w=900',
    title: 'Скидка при покупке трех флаконов солевой жидкости',
  },
  {
    id: 2,
    image: 'https://sun6-23.userapi.com/s/v1/ig2/P3iG3K4fKmcg_Zru-zmAWUfQtc9Ch3gNrCzaCAxSrirLMa90wQxZtHZOyG9PRDYSutl11lTb5TavcfpxV7HkY1jZ.jpg?size=1600x1600&quality=95&crop=0,0,1600,1600&ava=1',
    title: 'Жидкости для электронных парогенераторов',
  },
  {
    id: 3,
    image: 'https://cdn.pixabay.com/photo/2018/09/14/19/20/vape-3677946_1280.jpg',
    title: 'Электронные парогенераторы',
  },
  {
    id: 4,
    image: 'https://th.bing.com/th/id/OIP.6B7YY7ehhpfnp8EinLOX7gHaEP?w=280&h=180&c=7&r=0&o=7&pid=1.7&rm=3',
    title: 'Одноразовые/многоразовые парогенераторы',
  },
];

const sideBanners = [
  {
    id: 'side1',
    slides: [
      'https://images.pexels.com/photos/14279339/pexels-photo-14279339.jpeg?auto=compress&w=600',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
      'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600',
    ],
  },
  {
    id: 'side2',
    slides: [
      'https://cdn.pixabay.com/photo/2018/09/14/19/20/vape-3677946_1280.jpg',
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600',
    ],
  },
];

export default function HeroCarousel() {
  const [mainSlidesData, setMainSlidesData] = useState(mainSlides);
  const [sideBannersData, setSideBannersData] = useState(sideBanners);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [sideState, setSideState] = useState(() => ({
    side1: { index: 0, progress: 0 },
    side2: { index: 0, progress: 0 },
  }));

  useEffect(() => {
    contentApi.heroBanners().then((data) => {
      if (!Array.isArray(data) || data.length === 0) return;
      const main = data
        .filter((b) => b.zone === 'main' && b.image)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((b) => ({
          id: b.id,
          image: b.image,
          title: b.title || '',
          discountText: b.discountText || '',
        }));
      const top = data
        .filter((b) => b.zone === 'side-top' && b.image)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((b) => b.image);
      const bottom = data
        .filter((b) => b.zone === 'side-bottom' && b.image)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((b) => b.image);
      if (main.length > 0) setMainSlidesData(main);
      if (top.length > 0 || bottom.length > 0) {
        setSideBannersData([
          { id: 'side1', slides: top.length > 0 ? top : sideBanners[0].slides },
          { id: 'side2', slides: bottom.length > 0 ? bottom : sideBanners[1].slides },
        ]);
      }
    }).catch(() => {});
  }, []);

  const goToSlide = useCallback((index) => {
    setActiveIndex(index);
    setProgress(0);
  }, []);

  const next = useCallback(() => {
    goToSlide((activeIndex + 1) % mainSlidesData.length);
  }, [activeIndex, goToSlide, mainSlidesData.length]);

  const prev = useCallback(() => {
    goToSlide((activeIndex - 1 + mainSlidesData.length) % mainSlidesData.length);
  }, [activeIndex, goToSlide, mainSlidesData.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          next();
          return 0;
        }
        return p + (100 / (MAIN_SLIDE_DURATION / TICK_MS));
      });
      setSideState((prev) => {
        const slides1Len = sideBannersData[0]?.slides?.length || 1;
        const slides2Len = sideBannersData[1]?.slides?.length || 1;

        const step1 = 100 / (SIDE1_DURATION / TICK_MS);
        const step2 = 100 / (SIDE2_DURATION / TICK_MS);

        const next1Progress = prev.side1.progress + step1;
        const next2Progress = prev.side2.progress + step2;

        const side1 = next1Progress >= 100
          ? { index: (prev.side1.index + 1) % slides1Len, progress: 0 }
          : { index: prev.side1.index, progress: next1Progress };

        const side2 = next2Progress >= 100
          ? { index: (prev.side2.index + 1) % slides2Len, progress: 0 }
          : { index: prev.side2.index, progress: next2Progress };

        return { side1, side2 };
      });
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [activeIndex, next, sideBannersData]);

  const handleProgressClick = (index) => {
    goToSlide(index);
  };

  return (
    <section className="hero-carousel">
      <div className="hero-carousel-inner">
        <div className="hero-main-area">
          <Link to="/catalog" className="hero-main-slide-wrap">
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
        <div className="hero-side-banners">
          {sideBannersData.map((banner) => (
            <Link key={banner.id} to="/catalog" className="hero-side-banner">
              {banner.slides.map((img, index) => (
                <div
                  key={img}
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
      </div>
    </section>
  );
}
