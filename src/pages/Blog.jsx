import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Seo from '../components/Seo';
import { contentApi } from '../lib/api';
import './Blog.css';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const listRef = useRef(null);
  useEffect(() => {
    contentApi.blogPosts()
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]));
  }, []);

  const dragRef = useRef({ active: false, startX: 0, startScroll: 0 });
  const scrollByCards = (direction) => {
    const el = listRef.current;
    if (!el) return;
    const amount = Math.max(280, Math.floor(el.clientWidth * 0.8));
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  const onPointerDown = (event) => {
    const el = listRef.current;
    if (!el) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startScroll: el.scrollLeft,
    };
    el.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    const el = listRef.current;
    if (!el || !dragRef.current.active) return;
    const delta = event.clientX - dragRef.current.startX;
    el.scrollLeft = dragRef.current.startScroll - delta;
  };

  const onPointerUp = (event) => {
    const el = listRef.current;
    if (!el) return;
    dragRef.current.active = false;
    el.releasePointerCapture?.(event.pointerId);
  };

  return (
    <div className="blog-page">
      <Seo
        title="Блог — Облако Пара"
        description="Новости, советы и статьи о вейпинге, устройствах и жидкостях. Обзоры и рекомендации от «Облако Пара»."
        canonicalPath="/blog"
        ogType="website"
      />
      <div className="blog-header">
        <h1>Блог</h1>
        <p>Новости и статьи о вейпинге</p>
        <div className="blog-controls">
          <button type="button" className="blog-scroll-btn" onClick={() => scrollByCards(-1)} aria-label="Листать блог влево">‹</button>
          <button type="button" className="blog-scroll-btn" onClick={() => scrollByCards(1)} aria-label="Листать блог вправо">›</button>
        </div>
      </div>

      <div
        className="blog-list"
        ref={listRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {posts.map((post, i) => (
          <motion.article
            key={post.id}
            className="blog-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ x: 4 }}
          >
            {post.image && (
              <div className="blog-item-image">
                <img src={post.image} alt={post.title} loading="lazy" decoding="async" />
              </div>
            )}
            <div className="blog-item-content">
              <span className="blog-item-date">{post.dateLabel || post.date}</span>
              <h2>{post.title}</h2>
              <p>
                {post.teaser || 'Информация о новинках в мире электронных парогенераторов и жидкостей.'}
              </p>
              <Link to={`/blog/${post.slug || post.id}`} className="blog-item-link">
                Подробнее
              </Link>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
