import { Link } from 'react-router-dom';
import { PHONE, SOCIAL_ICONS } from '../constants/socialIcons';
import './Footer.css';

const PHONE_DISPLAY = '+375 (29) 539-75-10';
const VIBER_LINK = `viber://chat?number=${PHONE.replace(/\D/g, '')}`;

export default function Footer() {
  return (
    <footer className="footer footer-dark">
      <div className="footer-main">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-brand-row">
              <img src="/logo-store.png" alt="VAPE STORE" className="footer-logo-img" />
              <span className="footer-brand-name">VAPE STORE</span>
            </div>
            <p className="footer-tagline">VAPE SHOP</p>
            <a href={`tel:${PHONE.replace(/\D/g, '')}`} className="footer-phone">{PHONE_DISPLAY}</a>
            <a href="mailto:vikingstradehouse@gmail.com" className="footer-email">vikingstradehouse@gmail.com</a>
            <div className="footer-write">
              <span className="footer-label">Напишите нам</span>
              <div className="footer-messengers">
                <a href={VIBER_LINK} aria-label="Viber" className="msg-icon msg-viber"><img src={SOCIAL_ICONS.viber} alt="" /></a>
                <a href="https://t.me/Manager_VapeStoree" target="_blank" rel="noreferrer" aria-label="Telegram" className="msg-icon msg-telegram"><img src={SOCIAL_ICONS.telegram} alt="" /></a>
                <a href={`https://wa.me/${PHONE.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="msg-icon msg-whatsapp"><img src={SOCIAL_ICONS.whatsapp} alt="" /></a>
              </div>
            </div>
            <div className="footer-socials-block">
              <span className="footer-label">Мы в соц. сетях</span>
              <div className="footer-socials">
                <a href="https://t.me/Orsha_Smoke" target="_blank" rel="noreferrer" aria-label="Telegram"><img src={SOCIAL_ICONS.telegram} alt="" /></a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><img src={SOCIAL_ICONS.instagram} alt="" /></a>
                <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok"><img src={SOCIAL_ICONS.tiktok} alt="" /></a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><img src={SOCIAL_ICONS.youtube} alt="" /></a>
              </div>
            </div>
          </div>
          <div className="footer-column">
            <h4>Каталог</h4>
            <Link to="/catalog/pod-systems">Электронные парогенераторы</Link>
            <Link to="/catalog/liquids">Жидкости для электронных парогенераторов</Link>
            <Link to="/catalog/disposables">Одноразовые парогенераторы</Link>
            <Link to="/catalog/pouches">Никотиновые паучи</Link>
            <Link to="/catalog/accessories">Комплектующие</Link>
          </div>
          <div className="footer-column">
            <h4>О нас</h4>
            <Link to="/about">История</Link>
            <Link to="/contacts">Магазины</Link>
            <Link to="/privacy">Политика конфиденциальности</Link>
          </div>
          <div className="footer-column">
            <h4>Гостям</h4>
            <Link to="/contacts">FAQ</Link>
            <Link to="/contacts">Контакты</Link>
            <Link to="/delivery">Доставка</Link>
            <Link to="/payment">Оплата</Link>
            <Link to="/vapeAdminDanik" className="footer-admin">Админ-панель</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
