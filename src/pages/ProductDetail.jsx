import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { products as localProducts } from '../data/products';
import { productsApi } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { favoritesApi } from '../lib/api';
import ProductImageCarousel from '../components/ProductImageCarousel';
import './ProductDetail.css';

const RECENTLY_VIEWED_KEY = 'recentlyViewedProducts';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [fav, setFav] = useState(false);
  const [qty, setQty] = useState(1);
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      const local = localProducts.find((p) => p.id === numId);
      if (local) { setProduct(local); return; }
    }
    productsApi.get(id).then(setProduct).catch(() => setProduct(null));
  }, [id]);

  useEffect(() => {
    productsApi.list().then((items) => {
      if (!Array.isArray(items) || items.length === 0) return;
      const storedIds = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
      const list = storedIds
        .filter((storedId) => storedId !== id)
        .map((storedId) => items.find((item) => item.id === storedId))
        .filter(Boolean)
        .slice(0, 5);
      setRecentProducts(list);
    }).catch(() => setRecentProducts([]));
  }, [id]);

  useEffect(() => {
    if (!product?.id) return;
    const storedIds = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    const nextIds = [product.id, ...storedIds.filter((storedId) => storedId !== product.id)].slice(0, 6);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(nextIds));
  }, [product?.id]);

  const handleAddToCart = () => {
    if (product) addToCart(product, qty);
  };

  const SPEC_LABELS = {
    manufacturer: 'Производитель',
    puffCount: 'Кол-во затяжек',
    nicotineType: 'Тип никотина',
    flavor: 'Вкус',
    country: 'Страна производства',
    charging: 'Зарядка',
    powerAdj: 'Регулировка мощности',
    watts: 'Ватты',
    resistance: 'Сопротивление',
    battery: 'Ёмкость АКБ (мАч)',
    supplier: 'Поставщик',
    tobacco: 'Наличие табака',
    weight: 'Вес',
    coalType: 'Тип углей',
    packCount: 'Кол-во в пачке',
    strength: 'Крепость (мг/мл)',
    volume: 'Объём (мл)',
    vgpg: 'VG/PG',
    color: 'Цвет',
    display: 'Дисплей',
  };

  // Показываем все заполненные характеристики для товара,
  // чтобы всё, что добавлено через фильтры/админку, отображалось на карточке.
  const specs = Object.keys(SPEC_LABELS).filter(
    (k) => product && product[k] !== null && product[k] !== undefined && product[k] !== '',
  );
  const formatSpecValue = (key, val) => {
    if (key === 'charging' || key === 'powerAdj') return val === 'yes' || val === 'есть' ? 'Есть' : val === 'no' || val === 'нет' ? 'Нет' : val;
    return val;
  };

  if (product === null) {
    return (
      <div className="product-detail product-not-found">
        <h1>Товар не найден</h1>
        <Link to="/catalog">Вернуться в каталог</Link>
      </div>
    );
  }

  return (
    <motion.div
      className="product-detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <nav className="breadcrumb">
        <Link to="/">Главная</Link>
        <span>/</span>
        <Link to="/catalog">Каталог</Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="product-detail-grid">
        <motion.div
          className="product-gallery"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="product-main-image">
            {product.category === 'pod-systems' && [product.image, ...(product.images || [])].filter(Boolean).length > 1 ? (
              <ProductImageCarousel
                images={[product.image, ...(product.images || [])].filter(Boolean)}
                alt={product.name}
                className="product-detail-carousel"
              />
            ) : (
              <img
                src={product.image || 'https://images.unsplash.com/photo-1584735175097-719d848f8449?w=600'}
                alt={product.name}
                className={product.blurImage ? 'product-detail-image-blur' : ''}
              />
            )}
            {product.badge && (
              <span className="product-badge">{product.badge}</span>
            )}
          </div>
        </motion.div>

        <motion.div
          className="product-info"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1>{product.name}</h1>
          <div className="product-price">{product.price} руб.</div>
          <p className="product-desc">
            {product.shortDescription || product.description || 'Качественный продукт от проверенного производителя. В наличии в нашем магазине. Оформите бронирование для резерва.'}
          </p>
          {specs.length > 0 && (
            <div className="product-specs">
              <h3>Характеристики</h3>
              <dl>
                {specs.map((key) => (
                  <div key={key} className="product-spec-row">
                    <dt>{SPEC_LABELS[key] || key}</dt>
                    <dd>{formatSpecValue(key, product[key])}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className="product-quantity">
            <button type="button" onClick={() => setQty((x) => Math.max(1, x - 1))}>−</button>
            <input
              type="text"
              inputMode="numeric"
              value={qty}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                if (!raw) { setQty(1); return; }
                setQty(Math.max(1, parseInt(raw, 10) || 1));
              }}
              aria-label="Количество"
            />
            <button type="button" onClick={() => setQty((x) => x + 1)}>+</button>
          </div>
          <div className="product-actions">
            <button className="btn-primary" onClick={handleAddToCart}>Добавить в корзину</button>
          </div>
        </motion.div>
      </div>
      {(product.fullDescription || product.description) && (
        <section className="product-full-desc product-full-desc-wide">
          <h3>Описание</h3>
          <p>{product.fullDescription || product.description}</p>
        </section>
      )}
      {recentProducts.length > 0 && (
        <section className="recently-viewed">
          <h2>Так же вы смотрели</h2>
          <div className="recently-viewed-grid">
            {recentProducts.map((item) => (
              <Link key={item.id} to={`/product/${item.id}`} className="recently-viewed-card">
                <img src={item.image || 'https://images.unsplash.com/photo-1584735175097-719d848f8449?w=600'} alt={item.name} />
                <div>
                  <p>{item.name}</p>
                  <span>{item.price} руб.</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
