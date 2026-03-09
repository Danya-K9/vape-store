import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { blogPosts } from '../data/products';
import './Blog.css';

export default function Blog() {
  return (
    <motion.div
      className="blog-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="blog-header">
        <h1>Блог</h1>
        <p>Новости и статьи о вейпинге</p>
      </div>

      <div className="blog-list">
        {blogPosts.map((post, i) => (
          <motion.article
            key={post.id}
            className="blog-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ x: 4 }}
          >
            <div className="blog-item-image">
              <img
                src={post.image || 'https://images.unsplash.com/photo-1566150960911-7c5e8d60b247?w=280'}
                alt={post.title}
              />
            </div>
            <div className="blog-item-content">
              <span className="blog-item-date">{post.date}</span>
              <h2>{post.title}</h2>
              <p>
                Информация о новинках в мире электронных парогенераторов и жидкостей.
              </p>
              <Link to={`/blog/${post.id}`} className="blog-item-link">
                Подробнее
              </Link>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.div>
  );
}
