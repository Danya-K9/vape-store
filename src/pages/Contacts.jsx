import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PHONE, SOCIAL_ICONS } from '../constants/socialIcons';
import './Contacts.css';

const STORES = [
  {
    id: 1,
    address: 'г. Орша, ул. Ленина, 17',
    hours: 'Понедельник ~ пятница: с 10:00 до 20:00\nСуббота: с 10:00 до 19:00\nВоскресенье: Выходной',
    phone: PHONE,
    image: 'https://images.pexels.com/photos/14279339/pexels-photo-14279339.jpeg?auto=compress&w=600',
  },
];

const VIBER_LINK = `viber://chat?number=${PHONE.replace(/\D/g, '')}`;

export default function Contacts() {
  return (
    <motion.div
      className="contacts-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <nav className="breadcrumb">
        <Link to="/">Главная</Link>
        <span> — </span>
        <Link to="/contacts">Контакты</Link>
        <span> — </span>
        <span>Контакты и магазины</span>
      </nav>
      <h1>Контакты и магазины партнёров</h1>

      <div className="contacts-map-wrap">
        <iframe
          src="https://yandex.ru/map-widget/v1/?ll=30.426720%2C54.508848&z=17&pt=30.426720,54.508848,pm2rdm&l=map"
          title="Яндекс Карта — г. Орша, ул. Владимира Ленина, 17"
          className="contacts-yandex-map"
          frameBorder="0"
          allowFullScreen
        />
        <a
          href="https://yandex.by/maps/10276/orsha/house/ulitsa_vladimira_lenina_17/?ll=30.426720%2C54.508848&z=17"
          target="_blank"
          rel="noreferrer"
          className="contacts-map-link"
        >
          Открыть в Яндекс Картах
        </a>
      </div>

      <div className="contacts-stores">
        {STORES.map((store) => (
          <div key={store.id} className="contact-store-card">
            <div className="contact-store-image">
              <img src={store.image} alt="Магазин" />
            </div>
            <div className="contact-store-info">
              <p className="contact-store-address">{store.address}</p>
              <p className="contact-store-hours">{store.hours}</p>
              <a href={`tel:${store.phone.replace(/\D/g, '')}`} className="contact-store-phone">
                +375 29 539-75-10
              </a>
              <Link to="/catalog" className="btn-details">Подробнее</Link>
            </div>
          </div>
        ))}
      </div>

      <section className="contacts-social-section">
        <h2 className="contacts-social-title">Также с нами можно связаться следующими способами:</h2>
        <div className="contacts-social-grid">
          <a href="https://t.me/Manager_VapeStoree" target="_blank" rel="noreferrer" className="contacts-social-item">
            <img src={SOCIAL_ICONS.telegram} alt="Telegram" className="contacts-social-icon-img" />
            <span className="contacts-social-name">TELEGRAM</span>
            <span className="contacts-social-desc">отвечаем макс. быстро</span>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="contacts-social-item">
            <img src={SOCIAL_ICONS.instagram} alt="Instagram" className="contacts-social-icon-img" />
            <span className="contacts-social-name">INSTAGRAM</span>
            <span className="contacts-social-desc">в direct instagram</span>
          </a>
          <a href={VIBER_LINK} className="contacts-social-item">
            <img src={SOCIAL_ICONS.viber} alt="Viber" className="contacts-social-icon-img" />
            <span className="contacts-social-name">VIBER</span>
            <span className="contacts-social-desc">отвечаем быстро в чат</span>
          </a>
          <a href={`https://wa.me/${PHONE.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="contacts-social-item">
            <img src={SOCIAL_ICONS.whatsapp} alt="WhatsApp" className="contacts-social-icon-img" />
            <span className="contacts-social-name">WHATSAPP</span>
            <span className="contacts-social-desc">отвечаем быстро</span>
          </a>
        </div>
      </section>

      <div className="contacts-banner">
        <span>#VAPESTORE</span>
      </div>
    </motion.div>
  );
}
