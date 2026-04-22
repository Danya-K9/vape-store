import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCarousel from '../components/ProductCarousel';
import HeroCarousel from '../components/HeroCarousel';
import SocialCarousel from '../components/SocialCarousel';
import { blogPosts, reviews, products as localProducts } from '../data/products';
import { productsApi } from '../lib/api';
import './Home.css';

const BLOG_CAROUSEL_INTERVAL_MS = 6000;
const YANDEX_REVIEWS_URL = 'https://yandex.ru/navi/org/oblako_para/221337875525?si=8ng7m7pyz6fuzp3j7j08u3f798';

const categoryFilters = [
  { id: 'all', name: 'Все' },
  { id: 'liquids', name: 'Жидкости для электронных парогенераторов' },
  { id: 'disposables', name: 'Одноразовые/многоразовые парогенераторы' },
  { id: 'pod-systems', name: 'Электронные парогенераторы' },
  { id: 'pouches', name: 'Никотиновые паучи' },
  { id: 'hookah-mix', name: 'Смесь для кальянов' },
  { id: 'hookah-coals', name: 'Угли для кальянов' },
  { id: 'accessories', name: 'Комплектующие' },
];

export default function Home() {
  const [newFilter, setNewFilter] = useState('all');
  const [bestsellerFilter, setBestsellerFilter] = useState('all');
  const [newProducts, setNewProducts] = useState([]);
  const [bestsellerProducts, setBestsellerProducts] = useState([]);
  const [blogSlide, setBlogSlide] = useState(0);
  const blogSwipeRef = useRef({ startX: 0, deltaX: 0, active: false });
  const blogTimerRef = useRef(null);

  const newFallback = (localProducts || []).filter((p) => p.badge === 'Новинка');
  const bestsellerFallback = (localProducts || []).filter((p) => p.badge === 'Хит' || p.badge === 'Советуем');

  useEffect(() => {
    productsApi.list({ newOnly: 'true' })
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setNewProducts(arr.length > 0 ? arr : newFallback);
      })
      .catch(() => setNewProducts(newFallback));
  }, []);
  useEffect(() => {
    productsApi.list({ bestsellers: 'true' })
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setBestsellerProducts(arr.length > 0 ? arr : bestsellerFallback);
      })
      .catch(() => setBestsellerProducts(bestsellerFallback));
  }, []);

  const blogCount = blogPosts.length;

  const restartBlogTimer = () => {
    if (blogTimerRef.current) window.clearInterval(blogTimerRef.current);
    if (blogCount <= 1) return;
    blogTimerRef.current = window.setInterval(() => {
      setBlogSlide((i) => (i + 1) % blogCount);
    }, BLOG_CAROUSEL_INTERVAL_MS);
  };

  useEffect(() => {
    restartBlogTimer();
    return () => {
      if (blogTimerRef.current) window.clearInterval(blogTimerRef.current);
    };
  }, [blogCount]);

  useEffect(() => {
    // Preload blog images to avoid first-frame jank.
    (blogPosts || []).forEach((p) => {
      if (!p?.image) return;
      const img = new Image();
      img.src = p.image;
    });
  }, []);

  const filteredNew = newFilter === 'all'
    ? newProducts
    : newProducts.filter((p) => p.category === newFilter);
  const filteredBestseller = bestsellerFilter === 'all'
    ? bestsellerProducts
    : bestsellerProducts.filter((p) => p.category === bestsellerFilter);

  const blogFeatured = blogPosts[blogSlide] || blogPosts[0];
  const safeSetBlogSlide = (updater) => {
    setBlogSlide(updater);
    restartBlogTimer();
  };

  const onBlogSwipeStart = (event) => {
    blogSwipeRef.current = { startX: event.clientX, deltaX: 0, active: true };
  };

  const onBlogSwipeMove = (event) => {
    if (!blogSwipeRef.current.active) return;
    blogSwipeRef.current.deltaX = event.clientX - blogSwipeRef.current.startX;
  };

  const onBlogSwipeEnd = () => {
    if (!blogSwipeRef.current.active || blogCount <= 1) return;
    const threshold = 50;
    const { deltaX } = blogSwipeRef.current;
    if (deltaX <= -threshold) {
      safeSetBlogSlide((i) => (i + 1) % blogCount);
    } else if (deltaX >= threshold) {
      safeSetBlogSlide((i) => (i - 1 + blogCount) % blogCount);
    }
    blogSwipeRef.current.active = false;
  };

  const blogPrev = () => safeSetBlogSlide((i) => (i - 1 + blogCount) % blogCount);
  const blogNext = () => safeSetBlogSlide((i) => (i + 1) % blogCount);

  const yandexReviews = useMemo(() => (reviews || []).filter((r) => r.source === 'yandex'), []);
  const randomYandexReviews = useMemo(() => {
    const src = [...yandexReviews];
    for (let i = src.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [src[i], src[j]] = [src[j], src[i]];
    }
    return src.slice(0, 3);
  }, [yandexReviews]);

  return (
    <div className="home">
      <HeroCarousel />

      <section className="section section-promo">
        <motion.h2
          className="section-title section-title-viking"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Ассортимент
        </motion.h2>
        <div className="filter-tabs filter-tabs-viking">
          {categoryFilters.map((f) => (
            <button
              key={f.id}
              className={`filter-tab filter-tab-viking ${newFilter === f.id ? 'active' : ''}`}
              onClick={() => setNewFilter(f.id)}
            >
              {f.name}
            </button>
          ))}
        </div>
        <ProductCarousel products={filteredNew} />
      </section>

      <section className="section section-bestsellers">
        <motion.h2
          className="section-title section-title-viking"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Лидеры продаж
        </motion.h2>
        <div className="filter-tabs filter-tabs-viking">
          {categoryFilters.map((f) => (
            <button
              key={f.id}
              className={`filter-tab filter-tab-viking ${bestsellerFilter === f.id ? 'active' : ''}`}
              onClick={() => setBestsellerFilter(f.id)}
            >
              {f.name}
            </button>
          ))}
        </div>
        <ProductCarousel products={filteredBestseller} />
      </section>

      <section className="section section-about section-about-viking">
        <motion.div
          className="about-content about-content-with-image"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="about-text">
            <h2>Почему покупатели выбирают именно наш вейп шоп?</h2>
            <ul>
              <li>Широкий ассортимент устройств и жидкостей от проверенных брендов</li>
              <li>Гарантия качества на всю продукцию и официальное обслуживание</li>
              <li>Профессиональные консультации на каждом этапе выбора</li>
              <li>Приятные цены и регулярные акции для всех категорий покупателей</li>
              <li>Программа лояльности для наших постоянных клиентов</li>
            </ul>
            <Link to="/about" className="btn-learn-more">
              <span className="btn-learn-arrow">→</span> Узнать больше
            </Link>
          </div>
          <div className="about-image">
            <img
              src="https://images.pexels.com/photos/14279339/pexels-photo-14279339.jpeg?auto=compress&w=600"
              alt="Вейп шоп"
            />
          </div>
        </motion.div>
      </section>

      <SocialCarousel />

      <section className="section section-blog">
        <motion.h2
          className="section-title section-title-viking"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Блог
        </motion.h2>
        <div className="blog-layout">
          <div
            className="blog-featured-carousel"
            onPointerDown={onBlogSwipeStart}
            onPointerMove={onBlogSwipeMove}
            onPointerUp={onBlogSwipeEnd}
            onPointerCancel={onBlogSwipeEnd}
          >
            <motion.article
              key={blogFeatured.id}
              className="blog-featured blog-card-viking"
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              whileHover={{ y: -4 }}
              style={{ willChange: 'transform, opacity' }}
            >
              <Link
                to={`/blog/${blogFeatured.slug || blogFeatured.id}`}
                className="blog-featured-link blog-card-link"
              >
                <div className="blog-featured-text blog-card-text">
                  <span className="blog-date">{blogFeatured.date}</span>
                  <h3>{blogFeatured.title}</h3>
                  {blogFeatured.teaser && (
                    <p className="blog-teaser">{blogFeatured.teaser}</p>
                  )}
                  <span className="blog-link">Читать статью →</span>
                </div>
                <div className="blog-featured-image blog-card-image">
                  <img src={blogFeatured.image} alt="" loading="eager" decoding="async" />
                </div>
              </Link>
            </motion.article>
            <div className="blog-carousel-controls" aria-label="Навигация по блогу">
              <button type="button" className="blog-carousel-arrow" onClick={blogPrev} aria-label="Предыдущая статья">‹</button>
              <div className="blog-carousel-dots" role="tablist" aria-label="Выбор статьи блога">
              {blogPosts.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={i === blogSlide}
                  className={`blog-carousel-dot ${i === blogSlide ? 'active' : ''}`}
                  onClick={() => safeSetBlogSlide(i)}
                  aria-label={`Статья ${i + 1}: ${p.title}`}
                />
              ))}
              </div>
              <button type="button" className="blog-carousel-arrow" onClick={blogNext} aria-label="Следующая статья">›</button>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-reviews">
        <motion.h2
          className="section-title section-title-viking"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Отзывы
        </motion.h2>
        <div className="reviews-one-column">
          <div className="reviews-column reviews-yandex">
            <h3>Облако пара — Яндекс Карты</h3>
            <div className="reviews-column-header">
              <a className="btn-leave-review" href={YANDEX_REVIEWS_URL} target="_blank" rel="noreferrer">Оставить отзыв</a>
            </div>
            <div className="reviews-list">
              {randomYandexReviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  className="review-card"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                >
                  <div className="review-stars" aria-label={`Оценка: ${review.rating} из 5`}>
                    {Array.from({ length: 5 }).map((_, k) => (
                      <span key={k} className={k < review.rating ? 'star active' : 'star'}>★</span>
                    ))}
                  </div>
                  <p className="review-text">&quot;{review.text}&quot;</p>
                  <p className="review-author">{review.name}</p>
                  <p className="review-date">{review.date}</p>
                </motion.div>
              ))}
            </div>
            <a className="btn-more-reviews" href={YANDEX_REVIEWS_URL} target="_blank" rel="noreferrer">Больше отзывов на Яндекс Картах</a>
          </div>
        </div>
      </section>
    </div>
  );
}
