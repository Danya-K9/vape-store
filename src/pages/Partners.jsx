import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { contentApi } from '../lib/api';
import './Partners.css';

export default function Partners() {
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    contentApi.partners()
      .then((data) => setPartners(Array.isArray(data) ? data : []))
      .catch(() => setPartners([]));
  }, []);

  return (
    <motion.div className="partners-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <nav className="breadcrumb">
        <Link to="/">Главная</Link>
        <span> — </span>
        <span>Магазин - партнеры</span>
      </nav>
      <h1>Магазин - партнеры</h1>
      <p className="partners-subtitle">Проверенные партнеры, с которыми мы развиваем вейп-культуру и качество сервиса.</p>
      <div className="partners-grid">
        {partners.map((partner) => (
          <article className="partner-card" key={partner.id}>
            <div className="partner-image-wrap">
              <img src={partner.image || '/logo.png?v=6'} alt={partner.name} />
            </div>
            <h2>{partner.name}</h2>
            <p>{partner.description || 'Надежный партнер сети Облако пара.'}</p>
            {partner.website && (
              <a href={partner.website} target="_blank" rel="noreferrer" className="partner-link">
                Перейти на сайт
              </a>
            )}
          </article>
        ))}
      </div>
    </motion.div>
  );
}
