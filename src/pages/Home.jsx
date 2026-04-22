import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCarousel from '../components/ProductCarousel';
import HeroCarousel from '../components/HeroCarousel';
import SocialCarousel from '../components/SocialCarousel';
import { blogPosts, reviews, products as localProducts } from '../data/products';
import { productsApi } from '../lib/api';
import './Home.css';

const BLOG_CAROUSEL_INTERVAL_MS = 6000;

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

  useEffect(() => {
    const n = blogPosts.length;
    if (n <= 1) return undefined;
    const timer = window.setInterval(() => {
      setBlogSlide((i) => (i + 1) % n);
    }, BLOG_CAROUSEL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  const filteredNew = newFilter === 'all'
    ? newProducts
    : newProducts.filter((p) => p.category === newFilter);
  const filteredBestseller = bestsellerFilter === 'all'
    ? bestsellerProducts
    : bestsellerProducts.filter((p) => p.category === bestsellerFilter);

  const blogFeatured = blogPosts[blogSlide] || blogPosts[0];
  const blogCount = blogPosts.length;

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
      setBlogSlide((i) => (i + 1) % blogCount);
    } else if (deltaX >= threshold) {
      setBlogSlide((i) => (i - 1 + blogCount) % blogCount);
    }
    blogSwipeRef.current.active = false;
  };

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
            <AnimatePresence mode="wait">
              <motion.article
                key={blogFeatured.id}
                className="blog-featured blog-card-viking"
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -28 }}
                transition={{ duration: 0.35 }}
                whileHover={{ y: -4 }}
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
                    <img src={blogFeatured.image} alt="" />
                  </div>
                </Link>
              </motion.article>
            </AnimatePresence>
            <div className="blog-carousel-dots" role="tablist" aria-label="Выбор статьи блога">
              {blogPosts.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={i === blogSlide}
                  className={`blog-carousel-dot ${i === blogSlide ? 'active' : ''}`}
                  onClick={() => setBlogSlide(i)}
                  aria-label={`Статья ${i + 1}: ${p.title}`}
                />
              ))}
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
        <div className="reviews-two-columns">
          <div className="reviews-column reviews-google">
            <h3>ОТЗЫВЫ НА VAPE Google</h3>
            <div className="reviews-column-header">
              <span className="reviews-rating">★ 4.6 / 5</span>
              <span className="reviews-count">243 Отзывов</span>
              <button type="button" className="btn-leave-review">ОСТАВИТЬ ОТЗЫВ</button>
            </div>
            <div className="reviews-list">
              {reviews.filter((r) => r.source === 'google').map((review, i) => (
                <motion.div
                  key={review.id}
                  className="review-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <div className="review-stars">
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
          </div>
          <div className="reviews-column reviews-yandex">
            <h3>Облако пара — Яндекс Карты</h3>
            <div className="reviews-column-header">
              <span className="reviews-rating">4,7 ★</span>
              <span className="reviews-count">80 отзывов • 262 оценки</span>
              <button type="button" className="btn-leave-review">Оставить отзыв</button>
            </div>
            <div className="reviews-list">
              {reviews.filter((r) => r.source === 'yandex').map((review, i) => (
                <motion.div
                  key={review.id}
                  className="review-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <div className="review-stars">
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
            <button type="button" className="btn-more-reviews">Больше отзывов на Яндекс Картах</button>
          </div>
        </div>
      </section>
    </div>
  );
}
