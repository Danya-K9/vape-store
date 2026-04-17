import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';
import './Auth.css';

const BOT_LINK = 'https://t.me/Manager_OblakoPara';

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const codeFromUrl = searchParams.get('code');
  const loginFromUrl = searchParams.get('login');
  const [form, setForm] = useState({
    code: codeFromUrl || '',
    login: loginFromUrl || '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      code: codeFromUrl || f.code,
      login: loginFromUrl || f.login,
    }));
  }, [codeFromUrl, loginFromUrl]);

  const hasCode = codeFromUrl && loginFromUrl;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await authApi.registerWithCode({
        login: form.login,
        code: form.code,
        password: form.password,
      });
      login(token, user);
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  if (hasCode) {
    return (
      <motion.div
        className="auth-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="auth-card">
          <h1>Завершение регистрации</h1>
          <p className="auth-bot-text">
            Введите код из бота и пароль:
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Код из бота</label>
              <input
                type="text"
                placeholder="123456"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Логин</label>
              <input
                type="text"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input
                type="password"
                placeholder="Минимум 6 символов"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
          <p className="auth-switch">
            <Link to="/register">Начать заново</Link>
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
        <h1>Регистрация</h1>
        <p className="auth-bot-text">
          Для быстрой связи по регистрации напишите менеджеру в Telegram.
        </p>
        <a
          href={BOT_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-bot"
        >
          Открыть Telegram менеджера
        </a>
        <p className="auth-switch">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </motion.div>
  );
}
