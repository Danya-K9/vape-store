import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './DirectorModal.css';

export default function DirectorModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('message', form.message);
      if (file) fd.append('file', file);

      const res = await fetch('/api/director', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Ошибка отправки');
      setForm({ name: '', email: '', phone: '', message: '' });
      setFile(null);
      setFileName('');
      onClose();
      alert('Сообщение отправлено!');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setFileName(f ? f.name : '');
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="director-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="director-modal"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="director-modal-header">
            <h2>Написать директору</h2>
            <button type="button" className="director-modal-close" onClick={onClose} aria-label="Закрыть">×</button>
          </div>
          <form onSubmit={handleSubmit} className="director-modal-form">
            <div className="director-form-group">
              <input
                type="text"
                placeholder="Ваше Имя"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="director-form-group">
              <input
                type="email"
                placeholder="Ваш email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="director-form-group">
              <input
                type="tel"
                placeholder="Номер телефона"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="director-form-group">
              <textarea
                placeholder="Сообщение"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
              />
            </div>
            <div className="director-file-row">
              <label className="director-file-btn">
                Выбор файла
                <input type="file" accept="*/*" onChange={handleFileChange} hidden />
              </label>
              <span className="director-file-name">{fileName || 'Не выбран ни один файл'}</span>
            </div>
            <button type="submit" className="director-submit-btn" disabled={loading}>
              {loading ? 'Отправка...' : 'Отправить'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
