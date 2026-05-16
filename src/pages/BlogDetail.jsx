import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Seo from '../components/Seo';
import { contentApi } from '../lib/api';
import './BlogDetail.css';

export default function BlogDetail() {
  const { id } = useParams();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    contentApi.blogPosts()
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]));
  }, []);

  const post = posts.find((p) => String(p.id) === id || p.slug === id);
  const canonicalSlug = post?.slug || id;
  const seoTitle = post?.title ? `${post.title} — Блог «Облако Пара»` : 'Статья — Блог «Облако Пара»';
  const seoDescription = post?.teaser || post?.description || 'Статья из блога вейп-шопа «Облако Пара».';
  const seoImage = post?.image || '/logo.png?v=6';

  if (!post) {
    return (
      <div className="blog-detail">
        <p>Статья не найдена.</p>
        <Link to="/blog">← Вернуться в блог</Link>
      </div>
    );
  }

  return (
    <article className="blog-detail">
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={`/blog/${canonicalSlug}`}
        image={seoImage}
        ogType="article"
      />
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
      <span className="blog-detail-date">{post.dateLabel || post.date}</span>
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
    </article>
  );
}
