import './SocialCarousel.css';

const cards = [
  {
    id: 'telegram',
    title: 'МЫ В TELEGRAM',
    link: 'https://t.me/OblakoPara_Orsha',
    image: '/telegram-card.png',
  },
  {
    id: 'instagram',
    title: 'МЫ В INSTAGRAM',
    link: 'https://instagram.com',
    image: '/instagram-card.png',
  },
];

export default function SocialCarousel() {
  return (
    <section className="social-carousel-section">
      <div className="social-carousel-wrap">
        <div className="social-carousel-viewport">
          {cards.map((card) => (
            <a
              key={card.id}
              href={card.link}
              target="_blank"
              rel="noreferrer"
              className="social-carousel-card"
            >
              <div className="social-card-bg" style={{ backgroundImage: `url(${card.image})` }} />
              <div className="social-card-content">
                {card.id === 'telegram' && (
                  <span className="social-card-icon" style={{ color: '#29b6f6' }}>✈</span>
                )}
                {card.id === 'instagram' && (
                  <span className="social-card-icon social-icon-instagram">📷</span>
                )}
                <span className="social-card-title">{card.title}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
