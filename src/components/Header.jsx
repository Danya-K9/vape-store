import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import NoticeBar from './NoticeBar';
import DirectorModal from './DirectorModal';
import CheckoutModal from './CheckoutModal';
import { useCart } from '../context/CartContext';
import { PHONE, SOCIAL_ICONS } from '../constants/socialIcons';
import './Header.css';

const PHONE_DISPLAY = '+375 (29) 539-75-10';
const VIBER_LINK = `viber://chat?number=${PHONE.replace(/\D/g, '')}`;

export default function Header() {
  const { cart, total, count, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false); // десктопный/верхний каталог
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false); // каталог внутри бургера
  const [cartOpen, setCartOpen] = useState(false);
  const [directorModalOpen, setDirectorModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const catalogRefCompact = useRef(null);
  const catalogRefNav = useRef(null);
  const [canHover, setCanHover] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      // Гистерезис: не дёргать панель около нуля.
      setScrolled((prev) => {
        if (y > 20) return true;
        if (y < 5) return false;
        return prev;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCanHover(!!mql.matches);
    update();
    mql.addEventListener?.('change', update);
    return () => mql.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    // Десктопный дропдаун закрываем по клику вне (бургер‑каталог живёт отдельно).
    if (!catalogOpen) return;
    const handleClickOutside = (e) => {
      const inside = catalogRefCompact.current?.contains(e.target) || catalogRefNav.current?.contains(e.target);
      if (!inside) setCatalogOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [catalogOpen]);

  const dropdownStyle = scrolled
    ? {}
    : {
        position: 'fixed',
        top: 260,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(320px, 100%)',
        right: 'auto',
      };

  return (
    <header className={`header header-light ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="header-notice-wrap">
        <NoticeBar />
      </div>

      <div className="header-utility">
          <div className="header-utility-inner">
            <nav className="header-links">
              <Link to="/delivery">Доставка</Link>
              <span className="link-dot">•</span>
              <Link to="/payment">Оплата</Link>
              <span className="link-dot">•</span>
              <Link to="/about">О нас</Link>
              <span className="link-dot">•</span>
              <Link to="/contacts">Контакты и магазины</Link>
            </nav>
            <div className="header-utility-right">
              <a href={VIBER_LINK} className="header-social-icon viber" aria-label="Viber"><img src={SOCIAL_ICONS.viber} alt="" /></a>
              <a href="https://t.me/Manager_VapeStoree" className="header-social-icon telegram" target="_blank" rel="noreferrer" aria-label="Telegram"><img src={SOCIAL_ICONS.telegram} alt="" /></a>
              <a href={`https://wa.me/${PHONE.replace(/\D/g, '')}`} className="header-social-icon whatsapp" target="_blank" rel="noreferrer" aria-label="WhatsApp"><img src={SOCIAL_ICONS.whatsapp} alt="" /></a>
              <a href={`tel:${PHONE.replace(/\D/g, '')}`} className="header-phone">{PHONE_DISPLAY}</a>
              <button type="button" className="header-director-btn" onClick={() => setDirectorModalOpen(true)}>НАПИСАТЬ ДИРЕКТОРУ</button>
            </div>
          </div>
      </div>

      <div className="header-main-bar">
        <div className="header-main-inner">
          <button
            className="burger-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Меню"
            aria-expanded={menuOpen}
          >
            <span></span><span></span><span></span>
          </button>
          <div className="header-logo-catalog">
            <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
              {scrolled ? (
                <span className="logo-compact">
                  <img src="/logo-store.png" alt="VAPE STORE" className="logo-img" />
                  <span className="logo-text">
                    <span className="logo-brand">VAPE STORE</span>
                    <span className="logo-tagline">VAPE SHOP</span>
                  </span>
                </span>
              ) : (
                <span className="logo-compact logo-expanded">
                  <img src="/logo-store.png" alt="VAPE STORE" className="logo-img" />
                  <span className="logo-text">
                    <span className="logo-brand">VAPE STORE</span>
                    <span className="logo-tagline">VAPE SHOP</span>
                  </span>
                </span>
              )}
            </Link>
            {scrolled && (
              <div
                ref={catalogRefCompact}
                className="nav-catalog-trigger nav-catalog-compact"
              >
                <button
                  type="button"
                  className={`btn-catalog btn-catalog-compact ${catalogOpen ? 'open' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setCatalogOpen((prev) => !prev); }}
                  aria-expanded={catalogOpen}
                  aria-haspopup="true"
                >
                  ☰ КАТАЛОГ
                </button>
                <div className={`catalog-dropdown ${catalogOpen ? 'open' : ''}`} style={dropdownStyle}>
                  <Link to="/catalog/disposables" onClick={() => setCatalogOpen(false)}>Одноразки</Link>
                  <Link to="/catalog/liquids" onClick={() => setCatalogOpen(false)}>Жидкости</Link>
                  <Link to="/catalog/pouches" onClick={() => setCatalogOpen(false)}>Никотиновые паучи</Link>
                  <Link to="/catalog/pod-systems" onClick={() => setCatalogOpen(false)}>Электронные парогенераторы</Link>
                  <Link to="/catalog/accessories" onClick={() => setCatalogOpen(false)}>Комплектующие</Link>
                  <Link to="/about" onClick={() => setCatalogOpen(false)}>Иное</Link>
                </div>
              </div>
            )}
          </div>
          <div className={`header-center ${scrolled ? 'header-center-compact' : ''}`}>
            {!scrolled && (
              <>
                <span className="header-socials-label">Мы в соц. сетях</span>
                <div className="header-socials-row">
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="header-social-icon instagram" aria-label="Instagram"><img src={SOCIAL_ICONS.instagram} alt="" /></a>
                  <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="header-social-icon tiktok" aria-label="TikTok"><img src={SOCIAL_ICONS.tiktok} alt="" /></a>
                  <a href="https://youtube.com" target="_blank" rel="noreferrer" className="header-social-icon youtube" aria-label="YouTube"><img src={SOCIAL_ICONS.youtube} alt="" /></a>
                </div>
              </>
            )}
            <div className="header-search">
              <input
                type="text"
                placeholder="Я хочу купить..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/catalog?search=${encodeURIComponent(searchVal)}`)}
              />
              <button type="button" className="search-btn" onClick={() => navigate(`/catalog?search=${encodeURIComponent(searchVal)}`)}>🔍</button>
            </div>
            {scrolled && (
              <div className="header-compact-contacts">
                <a href={VIBER_LINK} className="header-social-icon viber" aria-label="Viber"><img src={SOCIAL_ICONS.viber} alt="" /></a>
                <a href="https://t.me/Manager_VapeStoree" className="header-social-icon telegram" target="_blank" rel="noreferrer" aria-label="Telegram"><img src={SOCIAL_ICONS.telegram} alt="" /></a>
                <a href={`https://wa.me/${PHONE.replace(/\D/g, '')}`} className="header-social-icon whatsapp" target="_blank" rel="noreferrer" aria-label="WhatsApp"><img src={SOCIAL_ICONS.whatsapp} alt="" /></a>
                <a href={`tel:${PHONE.replace(/\D/g, '')}`} className="header-phone">{PHONE_DISPLAY}</a>
              </div>
            )}
          </div>
          <div className="header-actions">
            <button className="header-cart-trigger" onClick={() => setCartOpen(!cartOpen)} title="Корзина">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              <span>Корзина</span>
              {count > 0 && <span className="cart-count">{count}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className={`header-nav-bar ${scrolled ? 'header-nav-hidden' : ''}`}>
        <div className="header-nav-inner">
          <div
            ref={catalogRefNav}
            className="nav-catalog-trigger"
          >
            <button
              type="button"
              className={`btn-catalog ${catalogOpen ? 'open' : ''}`}
              onClick={(e) => { e.stopPropagation(); setCatalogOpen((prev) => !prev); }}
              aria-expanded={catalogOpen}
              aria-haspopup="true"
            >
              ☰ КАТАЛОГ
            </button>
            <div className={`catalog-dropdown ${catalogOpen ? 'open' : ''}`} style={dropdownStyle}>
              <Link to="/catalog/disposables" onClick={() => setCatalogOpen(false)}>Одноразки</Link>
              <Link to="/catalog/liquids" onClick={() => setCatalogOpen(false)}>Жидкости</Link>
              <Link to="/catalog/pouches" onClick={() => setCatalogOpen(false)}>Никотиновые паучи</Link>
              <Link to="/catalog/pod-systems" onClick={() => setCatalogOpen(false)}>Электронные парогенераторы</Link>
              <Link to="/catalog/accessories" onClick={() => setCatalogOpen(false)}>Комплектующие</Link>
              <Link to="/about" onClick={() => setCatalogOpen(false)}>Иное</Link>
            </div>
          </div>
          <nav className="nav-categories">
            <Link to="/catalog/disposables" className={location.pathname.includes('/disposables') ? 'active' : ''}>Одноразки</Link>
            <Link to="/catalog/liquids" className={location.pathname.includes('/liquids') ? 'active' : ''}>Жидкости</Link>
            <Link to="/catalog/pouches" className={location.pathname.includes('/pouches') ? 'active' : ''}>Никотиновые паучи</Link>
            <Link to="/catalog/pod-systems" className={location.pathname.includes('/pod-systems') ? 'active' : ''}>Электронные парогенераторы</Link>
            <Link to="/catalog/accessories" className={location.pathname.includes('/accessories') ? 'active' : ''}>Комплектующие</Link>
            <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>Иное</Link>
          </nav>
        </div>
      </div>

      <DirectorModal isOpen={directorModalOpen} onClose={() => setDirectorModalOpen(false)} />
      <CheckoutModal isOpen={checkoutModalOpen} onClose={() => setCheckoutModalOpen(false)} />
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              className="mobile-menu"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-menu-header">
                <span>Меню</span>
                <button type="button" className="mobile-menu-close" onClick={() => setMenuOpen(false)} aria-label="Закрыть">×</button>
              </div>
              <div className="mobile-menu-section">
                <button
                  type="button"
                  className={`mobile-catalog-btn ${mobileCatalogOpen ? 'open' : ''}`}
                  onClick={() => setMobileCatalogOpen((v) => !v)}
                  aria-expanded={mobileCatalogOpen}
                >
                  ☰ Каталог
                </button>
                {mobileCatalogOpen && (
                  <div className="mobile-catalog-links">
                    <Link to="/catalog/disposables" onClick={() => { setMobileCatalogOpen(false); setMenuOpen(false); }}>Одноразки</Link>
                    <Link to="/catalog/liquids" onClick={() => { setMobileCatalogOpen(false); setMenuOpen(false); }}>Жидкости</Link>
                    <Link to="/catalog/pod-systems" onClick={() => { setMobileCatalogOpen(false); setMenuOpen(false); }}>Электронные парогенераторы</Link>
                    <Link to="/catalog/accessories" onClick={() => { setMobileCatalogOpen(false); setMenuOpen(false); }}>Комплектующие</Link>
                    <Link to="/catalog/pouches" onClick={() => { setMobileCatalogOpen(false); setMenuOpen(false); }}>Никотиновые паучи</Link>
                  </div>
                )}
              </div>
              <div className="mobile-menu-links">
                <Link to="/" onClick={() => setMenuOpen(false)}>Главная</Link>
                <Link to="/delivery" onClick={() => setMenuOpen(false)}>Доставка</Link>
                <Link to="/payment" onClick={() => setMenuOpen(false)}>Оплата</Link>
                <Link to="/about" onClick={() => setMenuOpen(false)}>О нас</Link>
                <Link to="/contacts" onClick={() => setMenuOpen(false)}>Контакты и магазины</Link>
              </div>
              <div className="mobile-menu-footer">
                <a href={`tel:${PHONE.replace(/\\D/g, '')}`} className="mobile-menu-phone">{PHONE_DISPLAY}</a>
                <div className="mobile-menu-socials">
                  <a href={VIBER_LINK} className="header-social-icon viber" aria-label="Viber"><img src={SOCIAL_ICONS.viber} alt="" /></a>
                  <a href="https://t.me/Manager_VapeStoree" className="header-social-icon telegram" target="_blank" rel="noreferrer" aria-label="Telegram"><img src={SOCIAL_ICONS.telegram} alt="" /></a>
                  <a href={`https://wa.me/${PHONE.replace(/\\D/g, '')}`} className="header-social-icon whatsapp" target="_blank" rel="noreferrer" aria-label="WhatsApp"><img src={SOCIAL_ICONS.whatsapp} alt="" /></a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {cartOpen && (
          <motion.div className="cart-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCartOpen(false)}>
            <motion.div className="cart-drawer" initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()}>
              <div className="cart-header">
                <h3>Корзина</h3>
                <button onClick={() => setCartOpen(false)} className="cart-close">×</button>
              </div>
              {cart.length > 0 ? (
                <>
                <div className="cart-items">
                    {cart.map((item) => (
                      <div key={item.id} className="cart-item">
                        <img src={item.image || '/placeholder.svg'} alt={item.name} />
                        <div>
                          <span>{item.name}</span>
                          <div>
                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                            <button type="button" className="cart-item-remove" onClick={() => removeFromCart(item.id)}>×</button>
                          </div>
                          <span>{item.price * item.quantity} руб.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="cart-checkout"
                    onClick={() => {
                      setCartOpen(false);
                      setCheckoutModalOpen(true);
                    }}
                  >
                    Оформить заказ — {total.toFixed(0)} руб.
                  </button>
                </>
              ) : (
                <div className="cart-empty"><p>Корзина пуста</p></div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}