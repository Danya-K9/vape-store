import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usersApi, ordersApi, authApi } from '../lib/api';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ phone: '', telegram: '' });
  const [initialForm, setInitialForm] = useState({ phone: '', telegram: '' });
  const [saving, setSaving] = useState(false);
  const [saveNotification, setSaveNotification] = useState(null);
  const [passForm, setPassForm] = useState({ code: '', newPassword: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passCodeSent, setPassCodeSent] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    usersApi.me().then((u) => {
      setProfile(u);
      const data = { phone: u.phone || '', telegram: u.telegram || '' };
      setForm(data);
      setInitialForm(data);
    }).catch(() => logout());
    ordersApi.list().then(setOrders).catch(() => setOrders([]));
  }, [user, navigate, logout]);

  const handleRequestPasswordCode = async () => {
    try {
      await authApi.requestPasswordCode();
      setPassCodeSent(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassLoading(true);
    try {
      await authApi.changePasswordWithCode({ code: passForm.code, newPassword: passForm.newPassword });
      setPassForm({ code: '', newPassword: '' });
      setPassCodeSent(false);
      setSaveNotification('Пароль успешно изменён');
      setTimeout(() => setSaveNotification(null), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setPassLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const u = await usersApi.update(form);
      setProfile(u);
      setInitialForm({ phone: u.phone || '', telegram: u.telegram || '' });
      setSaveNotification('Данные сохранены');
      setTimeout(() => setSaveNotification(null), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const hasProfileChanges = initialForm.phone !== form.phone || initialForm.telegram !== form.telegram;

  if (!user) return null;

  return (
    <motion.div
      className="profile-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {saveNotification && (
        <div className="profile-save-notification">{saveNotification}</div>
      )}
      <div className="profile-header">
        <h1>Личный кабинет</h1>
        <button className="profile-logout" onClick={logout}>Выйти</button>
      </div>

      <div className="profile-grid">
        <aside className="profile-sidebar">
          <nav className="profile-nav">
            <Link to="/profile" className="active">Профиль</Link>
            <Link to="/favorites">Избранное</Link>
            <Link to="/catalog">Каталог</Link>
            <Link to="/privacy">Персональные данные</Link>
          </nav>
        </aside>

        <div className="profile-content">
          <div className="profile-card">
            <h2>Профиль</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Логин</label>
                <input type="text" value={profile?.login || ''} readOnly disabled />
              </div>
              <div className="form-group">
                <label>Телефон</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+375 (29) 123-45-67"
                />
              </div>
              <div className="form-group">
                <label>Telegram</label>
                <input
                  type="text"
                  value={form.telegram}
                  onChange={(e) => setForm({ ...form, telegram: e.target.value })}
                  placeholder="@username"
                />
              </div>
              {hasProfileChanges && (
                <button type="submit" className="btn-edit" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              )}
            </form>
          </div>

          <div className="profile-card">
            <h2>Сменить пароль</h2>
            <p className="profile-empty">Нажмите «Отправить код в бот» — бот пришлёт вам код в Telegram. Введите код и новый пароль ниже.</p>
            {!passCodeSent ? (
              <button type="button" className="btn-edit" onClick={handleRequestPasswordCode}>
                Отправить код в бот
              </button>
            ) : (
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>Код из бота</label>
                  <input
                    type="text"
                    placeholder="123456"
                    value={passForm.code}
                    onChange={(e) => setPassForm({ ...passForm, code: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Новый пароль</label>
                  <input
                    type="password"
                    placeholder="Минимум 6 символов"
                    value={passForm.newPassword}
                    onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn-edit" disabled={passLoading}>
                  {passLoading ? 'Сохранение...' : 'Сменить пароль'}
                </button>
              </form>
            )}
          </div>

          <div className="profile-card">
            <h2>История бронирования</h2>
            {orders.length > 0 ? (
              <div className="profile-orders">
                {orders.map((o) => (
                  <div key={o.id} className="profile-order">
                    <div>
                      <span>Бронь от {new Date(o.createdAt).toLocaleDateString('ru')}</span>
                      <span className={`order-status order-status-${o.status}`}>
                      {o.status === 'pending' ? 'Ожидает' : o.status === 'confirmed' ? 'Подтверждён' : o.status === 'cancelled' ? 'Отменён' : o.status}
                    </span>
                    </div>
                    <p>{o.store?.address}</p>
                    <p>Оплата: {o.paymentMethod === 'cash' ? 'Наличные' : 'Карта'}</p>
                    <p><strong>{o.total} руб.</strong></p>
                    <p>{new Date(o.createdAt).toLocaleDateString('ru')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="profile-empty">У вас пока нет заказов</p>
            )}
            <Link to="/catalog" className="btn-edit">В каталог</Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
