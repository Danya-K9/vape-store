import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';
import './Auth.css';

const BOT_LINK = 'https://t.me/VapeShopHelperAdminBot';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginFromUrl = searchParams.get('login') || '';
  const { login } = useAuth();
  const [form, setForm] = useState({ login: loginFromUrl || '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loginFromUrl) setForm((f) => ({ ...f, login: loginFromUrl }));
  }, [loginFromUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await authApi.login({ login: form.login, password: form.password });
      login(token, user);
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  if (loginFromUrl) {
    return (
      <motion.div
        className="auth-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="auth-card">
          <h1>Вход в аккаунт</h1>
          <p className="auth-bot-text">Логин подставлен. Введите пароль:</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Логин</label>
              <input type="text" value={form.login} readOnly disabled />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input
                type="password"
                placeholder="Пароль"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          <p className="auth-switch">
            <Link to="/register">Регистрация</Link>
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="auth-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="auth-card">
        <h1>Вход в аккаунт</h1>
        <p className="auth-bot-text">
          Продолжите авторизацию через Telegram-бота. Напишите в боте команду <strong>/start</strong> — бот предложит войти или зарегистрироваться.
        </p>
        <a
          href={BOT_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-bot"
        >
          Открыть бота @VapeShopHelperAdminBot
        </a>
        <p className="auth-switch">
          Нет аккаунта? <Link to="/register">Регистрация</Link>
        </p>
      </div>
    </motion.div>
  );
}
