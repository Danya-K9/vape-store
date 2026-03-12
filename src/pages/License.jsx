import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './License.css';

export default function License() {
  return (
    <motion.div
      className="license-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <nav className="breadcrumb">
        <Link to="/">Главная</Link>
        <span> — </span>
        <Link to="/about">О нас</Link>
        <span> — </span>
        <span>Лицензия</span>
      </nav>

      <h1>Лицензия</h1>
      <p className="license-hint">
        Здесь будет фотография лицензии. Вы сможете заменить изображение позже.
      </p>

      <div className="license-image-wrap">
        <img
          src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200"
          alt="Лицензия (пример)"
        />
      </div>
    </motion.div>
  );
}

