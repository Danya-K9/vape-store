import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import './BlogHomeCarousel.css';

const INTERVAL_MS = 6000;

function excerptFor(post) {
  if (post.excerpt) return post.excerpt;
  const first = (post.description || '').split(/\n\n+/)[0]?.trim();
  return first ? `${first.slice(0, 140)}${first.length > 140 ? '…' : ''}` : '';
}

export default function BlogHomeCarousel({ posts }) {
  const list = Array.isArray(posts) ? posts : [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (list.length <= 1) return undefined;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % list.length);
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, [list.length]);

  const goTo = useCallback(
    (i) => {
      if (list.length === 0) return;
      setIndex(((i % list.length) + list.length) % list.length);
    },
    [list.length],
  );

  if (list.length === 0) return null;

  const post = list[index];

  return (
    <div className="blog-home-carousel">
      <AnimatePresence mode="wait" initial={false}>
        <motion.article
          key={post.id}
          className="blog-featured blog-card-viking blog-home-carousel-card"
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4 }}
        >
          <Link to={`/blog/${post.slug || post.id}`} className="blog-featured-link blog-card-link">
            <div className="blog-featured-text blog-card-text">
              <span className="blog-date">{post.date}</span>
              <h3>{post.title}</h3>
              <p className="blog-home-carousel-excerpt">{excerptFor(post)}</p>
              <span className="blog-link">Читать статью →</span>
            </div>
            <div className="blog-featured-image blog-card-image">
              <img src={post.image} alt={post.title} />
            </div>
          </Link>
        </motion.article>
      </AnimatePresence>
      {list.length > 1 && (
        <div className="blog-home-carousel-dots" role="tablist" aria-label="Статьи блога">
          {list.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`blog-home-carousel-dot ${i === index ? 'active' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
