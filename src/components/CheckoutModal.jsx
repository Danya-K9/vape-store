import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { ordersApi, storesApi } from '../lib/api';
import '../pages/Checkout.css';

export default function CheckoutModal({ isOpen, onClose }) {
  const { cart, total, clearCart } = useCart();
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [pickupDate, setPickupDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    storesApi.list().then(setStores).catch(() => setStores([]));
  }, [isOpen]);

  // При каждом новом открытии сбрасываем форму и состояние "готово",
  // чтобы можно было оформить бронь ещё раз без перезагрузки сайта.
  useEffect(() => {
    if (!isOpen) return;
    setDone(false);
    setCustomerName('');
    setCustomerPhone('');
    setPickupDate('');
    setPaymentMethod('cash');
  }, [isOpen]);

  useEffect(() => {
    if (stores.length && !storeId) setStoreId(stores[0].id);
  }, [stores, storeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cart.length) return;
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="checkout-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`checkout-modal ${done ? 'checkout-modal-done' : ''}`}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
        >
          {done ? (
            <div className="checkout-done">
              <h1>Бронь оформлена!</h1>
              <button type="button" className="checkout-done-btn" onClick={onClose}>
                Закрыть
              </button>
            </div>
          ) : (
            <>
              <div className="checkout-modal-top">
                <h2 className="checkout-modal-title">Оформление брони</h2>
                <button type="button" className="checkout-modal-close" onClick={onClose} aria-label="Закрыть">×</button>
              </div>
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
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

