import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { blogPosts } from '../data/products';
import './BlogDetail.css';

export default function BlogDetail() {
  const { id } = useParams();
  const post = blogPosts.find((p) => String(p.id) === id || p.slug === id);

  if (!post) {
    return (
      <motion.div className="blog-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <p>Статья не найдена.</p>
        <Link to="/blog">← Вернуться в блог</Link>
      </motion.div>
    );
  }

  return (
    <motion.article
      className="blog-detail"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <nav className="breadcrumb">
        <Link to="/">Главная</Link>
        <span> — </span>
        <Link to="/blog">Блог</Link>
        <span> — </span>
        <span>{post.title}</span>
      </nav>
      <div className="blog-detail-image">
        <img src={post.image} alt={post.title} />
      </div>
      <span className="blog-detail-date">{post.date}</span>
      <h1>{post.title}</h1>
      <div className="blog-detail-body">
        {post.description.split(/\n\n+/).map((block, i) => {
          const trimmed = block.trim();
          if (!trimmed) return null;
          if (trimmed.startsWith('## ')) {
            return <h2 key={i}>{trimmed.slice(3)}</h2>;
          }
          const lines = trimmed.split('\n');
          const hasList = lines.some((l) => /^[-;•]\s/.test(l) || /^[а-яё\d]+[.)]\s/i.test(l));
          if (hasList) {
            return (
              <div key={i}>
                {lines.map((line, j) => {
                  if (/^[-;•]\s/.test(line) || /^[а-яё\d]+[.)]\s/i.test(line)) {
                    return <p key={j} className="blog-detail-list-item">• {line.replace(/^[-;•]\s*|^\d+[.)]\s*/i, '').trim()}</p>;
                  }
                  return line ? <p key={j}>{line}</p> : null;
                })}
              </div>
            );
          }
          return <p key={i}>{trimmed}</p>;
        })}
      </div>
      <Link to="/blog" className="blog-detail-back">← Вернуться в блог</Link>
    </motion.article>
  );
}
