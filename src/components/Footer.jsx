import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PHONE, SOCIAL_ICONS_FOOTER } from '../constants/socialIcons';
import { contentApi } from '../lib/api';
import './Footer.css';

const PHONE_DISPLAY = '+375 (29) 539-75-10';
const VIBER_LINK = `https://viber.click/${PHONE.replace(/\D/g, '')}`;

export default function Footer() {
  const location = useLocation();
  const [categories, setCategories] = useState([
    { slug: 'liquids', name: 'Жидкости для электронных парогенераторов' },
    { slug: 'disposables', name: 'Одноразовые/многоразовые парогенераторы' },
    { slug: 'pod-systems', name: 'Электронные парогенераторы' },
    { slug: 'pouches', name: 'Никотиновые паучи' },
    { slug: 'hookah-mix', name: 'Смесь для кальянов' },
    { slug: 'hookah-coals', name: 'Угли для кальянов' },
    { slug: 'accessories', name: 'Комплектующие' },
  ]);

  useEffect(() => {
    contentApi.categories().then((data) => {
      if (Array.isArray(data) && data.length > 0) setCategories(data);
    }).catch(() => {});
  }, []);

  return (
    <footer className="footer footer-dark">
      <div className="footer-main">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-brand-row">
              <img src="/logo.png?v=6" alt="Облако пара" className="footer-logo-full" />
              <span className="footer-brand-name">Облако пара</span>
            </div>
            <p className="footer-tagline">Магазин вейпов</p>
            <a href={`tel:${PHONE.replace(/\D/g, '')}`} className="footer-phone">{PHONE_DISPLAY}</a>
            <div className="footer-write">
              <span className="footer-label">Напишите нам</span>
              <div className="footer-messengers">
                <a href={VIBER_LINK} aria-label="Viber" className="msg-icon msg-viber"><img src={SOCIAL_ICONS_FOOTER.viber} alt="" /></a>
                <a href="https://t.me/Manager_OblakoPara" target="_blank" rel="noreferrer" aria-label="Telegram" className="msg-icon msg-telegram"><img src={SOCIAL_ICONS_FOOTER.telegram} alt="" /></a>
                <a href={`https://wa.me/${PHONE.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="msg-icon msg-whatsapp"><img src={SOCIAL_ICONS_FOOTER.whatsapp} alt="" /></a>
              </div>
            </div>
            <div className="footer-socials-block">
              <span className="footer-label">Мы в соц. сетях</span>
              <div className="footer-socials">
                <a href="https://t.me/Manager_OblakoPara" target="_blank" rel="noreferrer" aria-label="Telegram"><img src={SOCIAL_ICONS_FOOTER.telegram} alt="" /></a>
                <a href="https://www.instagram.com/oblakopara_orsha?igsh=MXU1bmJiZHlnNng2MA%3D%3D&utm_source=qr" target="_blank" rel="noreferrer" aria-label="Instagram"><img src={SOCIAL_ICONS_FOOTER.instagram} alt="" /></a>
              </div>
            </div>
          </div>
          <div className="footer-column">
            <h4>Каталог</h4>
            {categories.map((category) => (
              <Link key={category.slug} to={`/catalog/${category.slug}`}>{category.name}</Link>
            ))}
          </div>
          <div className="footer-column">
            <h4>О нас</h4>
            <Link to="/about">История</Link>
            <Link to="/contacts">Магазины</Link>
            <Link to="/partners">Магазин - партнеры</Link>
            <Link to="/privacy">Политика конфиденциальности</Link>
            <Link to="/license">Лицензия и сертификаты</Link>
          </div>
          <div className="footer-column">
            <h4>Гостям</h4>
            <Link to="/faq">FAQ</Link>
            <Link to="/contacts">Контакты</Link>
            <Link to="/delivery">Доставка</Link>
            <Link to="/payment">Оплата</Link>
            {location.pathname === '/contacts' && (
              <Link to="/vapeAdminDanik" className="footer-admin">Админ-панель</Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
