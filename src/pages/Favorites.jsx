import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { favoritesApi } from '../lib/api';
import './Favorites.css';

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    favoritesApi.list().then(setFavorites).catch(() => setFavorites([])).finally(() => setLoading(false));
  }, [user]);

  const onFavoriteChange = () => {
    favoritesApi.list().then(setFavorites).catch(() => setFavorites([]));
  };

  if (!user) {
    return (
      <div className="favorites-page">
        <h1>Избранное</h1>
        <div className="favorites-empty">
          <p>Войдите в аккаунт, чтобы сохранять товары в избранное</p>
          <Link to="/login" className="btn-catalog">Войти</Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="favorites-page"><h1>Избранное</h1><p>Загрузка...</p></div>;

  return (
    <div className="favorites-page">
      <h1>Избранное</h1>
      {favorites.length > 0 ? (
        <div className="favorites-grid">
          {favorites.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} isFavorite onFavoriteChange={onFavoriteChange} />
          ))}
        </div>
      ) : (
        <div className="favorites-empty">
          <img
            src="https://images.unsplash.com/photo-1584735175097-719d848f8449?w=400"
            alt="Пустое избранное"
            className="favorites-empty-image"
          />
          <p>В избранном пока нет товаров</p>
          <Link to="/catalog" className="btn-catalog">
            Перейти в каталог
          </Link>
        </div>
      )}
    </div>
  );
}
