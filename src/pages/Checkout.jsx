import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { ordersApi, storesApi } from '../lib/api';
import './Checkout.css';

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [pickupDate, setPickupDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    storesApi.list().then(setStores).catch(() => setStores([]));
  }, []);

  useEffect(() => {
    if (stores.length && !storeId) setStoreId(stores[0].id);
  }, [stores, storeId]);

  useEffect(() => {
    if (cart.length === 0 && !done) navigate('/catalog');
  }, [cart, done, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    if (!storeId) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Укажите имя и номер телефона');
      return;
    }
    if (!pickupDate || pickupDate.trim() === '') {
      alert('Укажите дату получения товара');
      return;
    }
    if (pickupDate < today) {
      alert('Дата получения не может быть в прошлом');
      return;
    }
    setLoading(true);
    try {
      await ordersApi.create({
        storeId,
        paymentMethod,
        pickupDate,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: cart.map((p) => ({ productId: p.id, quantity: p.quantity })),
      });
      setDone(true);
      clearCart();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <motion.div className="checkout-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="checkout-done">
          <h1>Бронь оформлена!</h1>
          <p>Мы уведомили вас о заказе. Ожидайте подтверждения.</p>
          <Link to="/catalog">В каталог</Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="checkout-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <nav className="breadcrumb">
        <Link to="/">Главная</Link>
        <span> / </span>
        <span>Оформление брони</span>
      </nav>
      <h1>Оформление брони</h1>
      <p className="checkout-note">
        Корзина на сайте служит для предварительного бронирования товара.
        Забрать товар вы можете в любом из наших магазинов, которые указаны ниже.
      </p>

      <form onSubmit={handleSubmit} className="checkout-form">
        <div className="checkout-form-main">
          <div className="checkout-section">
            <h2>Ваши контактные данные</h2>
            <div className="checkout-contact-fields">
              <input
                type="text"
                placeholder="Ваше имя"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <input
                type="tel"
                placeholder="Ваш номер телефона"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="checkout-section">
            <h2>Выберите магазин</h2>
            {stores.map((s) => (
              <label key={s.id} className="checkout-store">
                <input
                  type="radio"
                  name="store"
                  value={s.id}
                  checked={storeId === s.id}
                  onChange={() => setStoreId(s.id)}
                />
                <span>{s.address}</span>
                <span className="checkout-store-hours">{s.hours}</span>
              </label>
            ))}
            {stores.length === 0 && <p>Нет доступных магазинов</p>}
          </div>

          <div className="checkout-section">
            <h2>Дата получения товара</h2>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              required
              className="checkout-date-input"
            />
          </div>

          <div className="checkout-section">
            <h2>Способ оплаты</h2>
            <label className="checkout-payment">
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
              />
              Наличные
            </label>
            <label className="checkout-payment">
              <input
                type="radio"
                name="payment"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
              />
              Карта
            </label>
          </div>
        </div>

        <aside className="checkout-form-side">
          <div className="checkout-summary">
            <h2>Ваш заказ ({cart.length})</h2>
            <div className="checkout-items-list">
              {cart.map((item) => (
                <div key={item.id} className="checkout-item">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{item.price * item.quantity} руб.</span>
                </div>
              ))}
            </div>
            <div className="checkout-total">
              <span>Итого:</span>
              <strong>{total.toFixed(0)} руб.</strong>
            </div>
            <button type="submit" className="btn-checkout" disabled={loading || !storeId || !pickupDate}>
              {loading ? 'Отправка...' : 'Оформить бронь'}
            </button>
          </div>
        </aside>
      </form>
    </motion.div>
  );
}
