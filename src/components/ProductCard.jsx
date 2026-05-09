import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { favoritesApi } from '../lib/api';
import ProductImageCarousel from './ProductImageCarousel';
import './ProductCard.css';

export default function ProductCard({ product, index = 0, isFavorite = false, onFavoriteChange }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(isFavorite);
  const [loading, setLoading] = useState(false);

  const nicotineType = product.nicotineType
    || (product.category === 'liquids' ? 'Солевой' : product.category === 'disposables' ? 'Солевой' : null);
  const strength = product.strength != null
    ? `${product.strength}%`
    : (product.category === 'disposables' ? '20%' : product.category === 'liquids' ? '20%' : null);

  const stock = product?.stock;
  const hasStockLimit = typeof stock === 'number' && Number.isFinite(stock);
  const maxQty = hasStockLimit ? Math.max(0, stock) : null;
  const clampQty = (next) => {
    const n = Math.max(1, parseInt(next, 10) || 1);
    if (!hasStockLimit) return n;
    return Math.min(n, Math.max(1, maxQty));
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, hasStockLimit ? clampQty(qty) : qty);
  };

  const handleFavorite = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    try {
      if (fav) await favoritesApi.remove(product.id);
      else await favoritesApi.add(product.id);
      setFav(!fav);
      onFavoriteChange?.();
    } catch {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.article
      className="product-card product-card-viking"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Link to={`/product/${product.id}`} className="product-link">
        <div className="product-image-wrap">
          {product.category === 'pod-systems' && [product.image, ...(product.images || [])].filter(Boolean).length > 1 ? (
            <ProductImageCarousel
              images={[product.image, ...(product.images || [])].filter(Boolean)}
              alt={product.name}
              className="product-card-carousel"
            />
          ) : (
            <img
              src={product.image || 'https://images.unsplash.com/photo-1584735175097-719d848f8449?w=400'}
              alt={product.name}
              className={`product-image ${product.blurImage ? 'product-image-blur' : ''}`}
            />
          )}
          {product.badge && (
            <span className={`product-badge product-badge--${product.badge === 'Новинка' ? 'new' : product.badge === 'Советуем' ? 'rec' : 'hit'}`}>
              {product.badge}
            </span>
          )}
          {user && (
            <button
              type="button"
              className={`product-fav-btn ${fav ? 'active' : ''}`}
              onClick={handleFavorite}
              disabled={loading}
              aria-label="Избранное"
            >
              ♥
            </button>
          )}
        </div>
        <h3 className="product-name">{product.name}</h3>
        <div className={`product-meta ${!(nicotineType || strength) ? 'empty' : ''}`}>
          {nicotineType && <span>Тип никотина: {nicotineType}</span>}
          {strength && <span>Крепость: {strength}</span>}
        </div>
        <div className="product-price">{product.price} руб.</div>
      </Link>
      <div className="product-quantity">
        <button
          type="button"
          className="qty-btn"
          onClick={(e) => { e.preventDefault(); setQty((x) => Math.max(1, x - 1)); }}
          disabled={hasStockLimit && maxQty <= 0}
        >
          −
        </button>
        <input
          className="qty-value-input"
          value={qty}
          inputMode="numeric"
          onChange={(e) => {
            const parsed = parseInt(e.target.value.replace(/[^\d]/g, ''), 10);
            setQty(clampQty(Number.isFinite(parsed) && parsed > 0 ? parsed : 1));
          }}
          onClick={(e) => e.preventDefault()}
        />
        <button
          type="button"
          className="qty-btn"
          onClick={(e) => { e.preventDefault(); setQty((x) => clampQty(x + 1)); }}
          disabled={hasStockLimit && maxQty <= qty}
        >
          +
        </button>
      </div>
      {hasStockLimit && (
        <div className="product-stock-hint">Осталось: {Math.max(0, maxQty)} шт.</div>
      )}
      <div className="product-actions">
        <button className="btn-book" onClick={handleAddToCart} disabled={hasStockLimit && maxQty <= 0}>
          Добавить в корзину
        </button>
      </div>
    </motion.article>
  );
}
