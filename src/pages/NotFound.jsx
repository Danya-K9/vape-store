import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <motion.div
      className="not-found"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        textAlign: 'center',
        padding: '80px 20px',
      }}
    >
      <img
        src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400"
        alt="Страница не найдена"
        style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 24 }}
      />
      <h1 style={{ fontSize: '48px', color: '#fff', marginBottom: '16px' }}>404</h1>
      <p style={{ color: '#888', marginBottom: '24px' }}>Страница не найдена</p>
      <Link
        to="/"
        style={{
          color: '#000',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Вернуться на главную
      </Link>
    </motion.div>
  );
}
