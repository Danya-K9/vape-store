import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './HeroCarousel.css';

const SLIDE_DURATION = 5000;

const mainSlides = [
  {
    id: 1,
    image: 'https://images.pexels.com/photos/14195357/pexels-photo-14195357.jpeg?auto=compress&w=900',
    title: 'Скидка при покупке трех флаконов солевой жидкости',
    badge: '-50%',
  },
  {
    id: 2,
    image: 'https://sun6-23.userapi.com/s/v1/ig2/P3iG3K4fKmcg_Zru-zmAWUfQtc9Ch3gNrCzaCAxSrirLMa90wQxZtHZOyG9PRDYSutl11lTb5TavcfpxV7HkY1jZ.jpg?size=1600x1600&quality=95&crop=0,0,1600,1600&ava=1',
    title: 'Жидкости для вейпа',
    badge: null,
  },
  {
    id: 3,
    image: 'https://cdn.pixabay.com/photo/2018/09/14/19/20/vape-3677946_1280.jpg',
    title: 'POD системы',
    badge: '-30%',
  },
  {
    id: 4,
    image: 'https://th.bing.com/th/id/OIP.6B7YY7ehhpfnp8EinLOX7gHaEP?w=280&h=180&c=7&r=0&o=7&pid=1.7&rm=3',
    title: 'Одноразки',
    badge: '-20%',
  },
];

const sideBanners = [
  {
    id: 'side1',
    image: 'https://images.pexels.com/photos/14279339/pexels-photo-14279339.jpeg?auto=compress&w=600',
    badge: '-50%',
  },
  {
    id: 'side2',
    image: 'https://cdn.pixabay.com/photo/2018/09/14/19/20/vape-3677946_1280.jpg',
    badge: '-20%',
  },
];

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const goToSlide = useCallback((index) => {
    setActiveIndex(index);
    setProgress(0);
  }, []);

  const next = useCallback(() => {
    goToSlide((activeIndex + 1) % mainSlides.length);
  }, [activeIndex, goToSlide]);

  const prev = useCallback(() => {
    goToSlide((activeIndex - 1 + mainSlides.length) % mainSlides.length);
  }, [activeIndex, goToSlide]);

  useEffect(() => {
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
  }, [activeIndex, next]);

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
              {mainSlides.map((slide, i) => (
                <div
                  key={slide.id}
                  className={`hero-slide ${i === activeIndex ? 'active' : ''}`}
                  style={{ backgroundImage: `url(${slide.image})` }}
                >
                  {slide.badge && (
                    <span className="hero-slide-badge">{slide.badge}</span>
                  )}
                  <p className="hero-slide-title">{slide.title}</p>
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
            {mainSlides.map((_, i) => (
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
          {sideBanners.map((banner) => (
            <Link key={banner.id} to="/catalog" className="hero-side-banner">
              <div
                className="hero-side-banner-bg"
                style={{ backgroundImage: `url(${banner.image})` }}
              />
              {banner.badge && (
                <span className="hero-side-badge">{banner.badge}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
