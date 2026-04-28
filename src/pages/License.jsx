import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { contentApi } from '../lib/api';
import './License.css';

const REQUISITES_DOC = {
  id: 'static-requisites',
  title: 'Реквизиты',
  fileUrl: '/docs/requisites.pdf',
};

export default function License() {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    contentApi.licenseDocs()
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch(() => setDocs([]));
  }, []);

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
        <span>Лицензия и сертификаты</span>
      </nav>

      <h1>Лицензия и сертификаты</h1>

      <div className="license-docs-grid">
        {[...docs, REQUISITES_DOC].map((doc) => (
          <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer" className="license-doc-card">
            <span className="license-doc-icon">PDF</span>
            <div>
              <h3>{doc.title}</h3>
              <p>Открыть документ</p>
            </div>
          </a>
        ))}
      </div>
    </motion.div>
  );
}

