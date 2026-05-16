import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { contentApi } from '../lib/api';
import './Faq.css';

export default function Faq() {
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    contentApi.faq()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="faq-page">
      <nav className="breadcrumb">
        <Link to="/">Главная</Link>
        <span> — </span>
        <span>FAQ</span>
      </nav>
      <h1>Часто задаваемые вопросы</h1>
      <div className="faq-list">
        {items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <article className={`faq-item ${isOpen ? 'open' : ''}`} key={item.id}>
              <button type="button" className="faq-question" onClick={() => setOpenId(isOpen ? null : item.id)}>
                <span>{item.question}</span>
                <span className="faq-plus">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <div className="faq-answer">{item.answer}</div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
