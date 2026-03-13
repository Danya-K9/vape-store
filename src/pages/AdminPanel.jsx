import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

const API_BASE = (() => {
  const raw = import.meta?.env?.VITE_API_URL;
  const base = raw ? String(raw).trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '') : '';
  if (!base) return '/api';
  return base.endsWith('/api') ? base : `${base}/api`;
})();

export default function AdminPanel() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('products');
  const [filterOptions, setFilterOptions] = useState([]);
  const [filterCategory, setFilterCategory] = useState('disposables');
  const [filterForm, setFilterForm] = useState({ filterKey: 'manufacturer', value: '' });
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]); // Extra images for pod-systems

  const headers = () => ({ Authorization: `Bearer ${token}` });

  useEffect(() => {
    if (!token) return;
    fetchProducts();
  }, [token]);

  useEffect(() => {
    if (token && tab === 'filters') fetchFilterOptions();
  }, [token, tab, filterCategory]);

  const fetchUsers = async () => {
    const r = await fetch(`${API_BASE}/admin/users`, { headers: headers() });
    if (r.status === 401) { logout(); return; }
    setUsers(await r.json());
  };

  const fetchProducts = async () => {
    const r = await fetch(`${API_BASE}/admin/products`, { headers: headers() });
    if (r.status === 401) { logout(); return; }
    setProducts(await r.json());
  };

  const fetchFilterOptions = async () => {
    const r = await fetch(`${API_BASE}/admin/filters?category=${encodeURIComponent(filterCategory)}`, { headers: headers() });
    if (r.status === 401) { logout(); return; }
    setFilterOptions(await r.json());
  };

  const fetchOrders = async () => {
    const r = await fetch(`${API_BASE}/admin/orders`, { headers: headers() });
    if (r.status === 401) { logout(); return; }
    setOrders(await r.json());
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const r = await fetch(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });
    const text = await r.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return {}; } })() : {};
    if (!r.ok) { setError(data.error || 'Ошибка входа'); return; }
    localStorage.setItem('adminToken', data.token);
    setToken(data.token);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
  };

  const deleteUser = async (id) => {
    if (!confirm('Удалить пользователя?')) return;
    await fetch(`${API_BASE}/admin/users/${id}`, { method: 'DELETE', headers: headers() });
    fetchUsers();
  };

  const saveUser = async () => {
    if (editing && editing !== 'new') {
      await fetch(`${API_BASE}/admin/users/${editing.id}`, {
        method: 'PATCH',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setEditing(null);
    setForm({});
    fetchUsers();
  };

  const deleteProduct = async (id) => {
    if (!confirm('Удалить товар?')) return;
    await fetch(`${API_BASE}/admin/products/${id}`, { method: 'DELETE', headers: headers() });
    fetchProducts();
  };

  const saveProduct = async () => {
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v != null && v !== '' && k !== 'id' && k !== 'image' && k !== 'images') body.append(k, v);
    });
    if (imageFile) {
      body.append('image', imageFile);
    } else if (form.image) {
      body.append('image', form.image);
    }
    const cat = form.category ?? (editing && editing !== 'new' ? editing.category : 'disposables');
    if (cat === 'pod-systems' && (imageFiles.length > 0 || (Array.isArray(form.images) && form.images.length > 0))) {
      imageFiles.forEach((f) => body.append('images', f));
      if (Array.isArray(form.images) && form.images.length > 0) {
        body.append('imagesJson', JSON.stringify(form.images));
      }
    }
    if (editing && editing !== 'new') {
      await fetch(`${API_BASE}/admin/products/${editing.id}`, {
        method: 'PATCH',
        headers: headers(),
        body,
      });
    } else {
      await fetch(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers: headers(),
        body,
      });
    }
    setEditing(null);
    setForm({});
    setImageFile(null);
    setImageFiles([]);
    fetchProducts();
  };

  const addFilterOption = async () => {
    if (!filterForm.value?.trim()) return;
    await fetch(`${API_BASE}/admin/filters`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: filterCategory, filterKey: filterForm.filterKey, value: filterForm.value.trim() }),
    });
    setFilterForm({ ...filterForm, value: '' });
    fetchFilterOptions();
  };

  const deleteFilterOption = async (id) => {
    if (!confirm('Удалить вариант?')) return;
    await fetch(`${API_BASE}/admin/filters/${id}`, { method: 'DELETE', headers: headers() });
    fetchFilterOptions();
  };

  const updateOrderStatus = async (id, status) => {
    await fetch(`${API_BASE}/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  };

  if (!token) {
    return (
      <div className="admin-login-page">
        <form className="admin-login-form" onSubmit={handleLogin}>
          <h1>Админ-панель</h1>
          <input
            placeholder="Логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="admin-error">{error}</p>}
          <button type="submit">Войти</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Админ-панель</h1>
        <button onClick={() => navigate('/')}>На сайт</button>
        <button onClick={logout}>Выход</button>
      </header>
      <nav className="admin-tabs">
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Товары</button>
        <button className={tab === 'filters' ? 'active' : ''} onClick={() => setTab('filters')}>Фильтры</button>
      </nav>

      {tab === 'filters' && (
        <section className="admin-section">
          <h2>Управление вариантами фильтров по категориям</h2>
          <p style={{ marginBottom: 16, color: '#666' }}>Добавляйте, удаляйте варианты для фильтрации (производители, вкусы и т.д.). Они будут отображаться в каталоге.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="disposables">Одноразовые парогенераторы</option>
              <option value="liquids">Жидкости для электронных парогенераторов</option>
              <option value="pod-systems">Электронные парогенераторы</option>
              <option value="pouches">Никотиновые паучи</option>
              <option value="accessories">Комплектующие</option>
            </select>
            <select value={filterForm.filterKey} onChange={(e) => setFilterForm({ ...filterForm, filterKey: e.target.value })}>
              <option value="manufacturer">Производитель</option>
              <option value="flavor">Вкус</option>
              <option value="nicotineType">Тип никотина</option>
              <option value="puffCount">Кол-во затяжек</option>
              <option value="strength">Крепость</option>
              <option value="volume">Объём</option>
              <option value="vgpg">VG/PG</option>
              <option value="charging">Зарядка</option>
              <option value="powerAdj">Регулировка мощности</option>
              <option value="battery">Ёмкость АКБ</option>
              <option value="country">Страна</option>
              <option value="color">Цвет</option>
              <option value="display">Дисплей</option>
            </select>
            <input placeholder="Новое значение" value={filterForm.value} onChange={(e) => setFilterForm({ ...filterForm, value: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addFilterOption()} />
            <button onClick={addFilterOption}>Добавить</button>
          </div>
          <table>
            <thead><tr><th>Фильтр</th><th>Значение</th><th></th></tr></thead>
            <tbody>
              {filterOptions.map((o) => (
                <tr key={o.id}>
                  <td>{o.filterKey}</td>
                  <td>{o.value}</td>
                  <td><button onClick={() => deleteFilterOption(o.id)}>Удалить</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filterOptions.length === 0 && <p style={{ color: '#888' }}>Нет добавленных вариантов. Используются значения по умолчанию.</p>}
        </section>
      )}

      {false && tab === 'users' && (
        <section className="admin-section">
          <button onClick={() => { setEditing('new'); setForm({ login: '', password: '', phone: '', telegram: '' }); }}>Добавить</button>
          <table>
            <thead>
              <tr><th>Логин</th><th>Пароль</th><th>Телефон</th><th>Telegram</th><th></th></tr>
            </thead>
            <tbody>
              {editing === 'new' && (
                <tr>
                  <td><input placeholder="Логин" value={form.login ?? ''} onChange={(e) => setForm({ ...form, login: e.target.value })} /></td>
                  <td><input type="password" placeholder="Пароль" value={form.password ?? ''} onChange={(e) => setForm({ ...form, password: e.target.value })} /></td>
                  <td><input placeholder="Телефон" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></td>
                  <td><input placeholder="Telegram" value={form.telegram ?? ''} onChange={(e) => setForm({ ...form, telegram: e.target.value })} /></td>
                  <td><button onClick={saveUser}>Сохранить</button><button onClick={() => setEditing(null)}>Отмена</button></td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id}>
                  {editing?.id === u.id ? (
                    <>
                      <td><input value={form.login ?? u.login} onChange={(e) => setForm({ ...form, login: e.target.value })} /></td>
                      <td><input type="password" placeholder="Новый пароль" value={form.password ?? ''} onChange={(e) => setForm({ ...form, password: e.target.value })} /></td>
                      <td><input value={form.phone ?? u.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></td>
                      <td><input value={form.telegram ?? u.telegram ?? ''} onChange={(e) => setForm({ ...form, telegram: e.target.value })} /></td>
                      <td><button onClick={saveUser}>Сохранить</button><button onClick={() => setEditing(null)}>Отмена</button></td>
                    </>
                  ) : (
                    <>
                      <td>{u.login}</td>
                      <td>{u.password}</td>
                      <td>{u.phone || '-'}</td>
                      <td>{u.telegram || '-'}</td>
                      <td><button onClick={() => { setEditing(u); setForm({}); }}>Ред.</button><button onClick={() => deleteUser(u.id)}>Удалить</button></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'products' && (
        <section className="admin-section">
          <button onClick={() => { setEditing('new'); setForm({ name: '', price: 0, category: 'disposables', image: '', images: [], description: '', manufacturer: '', puffCount: '', nicotineType: '', flavor: '', country: '', strength: '', volume: '', vgpg: '', charging: '', powerAdj: '', battery: '', color: '', display: '', badge: '' }); setImageFile(null); setImageFiles([]); }}>Добавить товар</button>
          <table>
            <thead>
              <tr><th>Название</th><th>Цена</th><th>Категория</th><th>Новинки</th><th>Лидеры</th><th></th></tr>
            </thead>
            <tbody>
              {editing === 'new' && (
                <tr>
                  <td colSpan="10" className="admin-product-edit-cell">
                    <div className="admin-product-form">
                      <div className="admin-form-row">
                        <input placeholder="Название" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <input type="number" placeholder="Цена" value={form.price ?? ''} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                        <select value={form.category ?? 'disposables'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                          <option value="disposables">Одноразовые парогенераторы</option>
                          <option value="liquids">Жидкости для электронных парогенераторов</option>
                          <option value="pod-systems">Электронные парогенераторы</option>
                          <option value="pouches">Никотиновые паучи</option>
                          <option value="accessories">Комплектующие</option>
                        </select>
                        <label><input type="checkbox" checked={form.showInNew ?? false} onChange={(e) => setForm({ ...form, showInNew: e.target.checked })} /> Новинки</label>
                        <label><input type="checkbox" checked={form.showInBestsellers ?? false} onChange={(e) => setForm({ ...form, showInBestsellers: e.target.checked })} /> Лидеры</label>
                      </div>
                      <div className="admin-form-row admin-form-specs">
                        {(() => {
                          const cat = form.category ?? 'disposables';
                          if (cat === 'liquids') {
                            return (
                              <>
                                <select
                                  value={form.nicotineType ?? ''}
                                  onChange={(e) => setForm({ ...form, nicotineType: e.target.value })}
                                >
                                  <option value="">Тип никотина</option>
                                  <option value="Без никотина">Без никотина</option>
                                  <option value="Солевой">Солевой</option>
                                  <option value="Щелочной">Щелочной</option>
                                </select>
                                <input
                                  placeholder="Вкус"
                                  value={form.flavor ?? ''}
                                  onChange={(e) => setForm({ ...form, flavor: e.target.value })}
                                />
                                <input
                                  placeholder="Крепость"
                                  type="number"
                                  value={form.strength ?? ''}
                                  onChange={(e) => setForm({ ...form, strength: e.target.value })}
                                />
                                <input
                                  placeholder="Объём (мл)"
                                  type="number"
                                  value={form.volume ?? ''}
                                  onChange={(e) => setForm({ ...form, volume: e.target.value })}
                                />
                                <input
                                  placeholder="VG/PG"
                                  value={form.vgpg ?? ''}
                                  onChange={(e) => setForm({ ...form, vgpg: e.target.value })}
                                />
                              </>
                            );
                          }
                          if (cat === 'disposables') {
                            return (
                              <>
                                <input
                                  placeholder="Производитель"
                                  value={form.manufacturer ?? ''}
                                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                                />
                                <input
                                  placeholder="Кол-во затяжек"
                                  type="number"
                                  value={form.puffCount ?? ''}
                                  onChange={(e) => setForm({ ...form, puffCount: e.target.value })}
                                />
                                <select
                                  value={form.nicotineType ?? ''}
                                  onChange={(e) => setForm({ ...form, nicotineType: e.target.value })}
                                >
                                  <option value="">Тип никотина</option>
                                  <option value="Без никотина">Без никотина</option>
                                  <option value="Солевой">Солевой</option>
                                  <option value="Щелочной">Щелочной</option>
                                </select>
                                <input
                                  placeholder="Вкус"
                                  value={form.flavor ?? ''}
                                  onChange={(e) => setForm({ ...form, flavor: e.target.value })}
                                />
                                <input
                                  placeholder="Крепость"
                                  type="number"
                                  value={form.strength ?? ''}
                                  onChange={(e) => setForm({ ...form, strength: e.target.value })}
                                />
                                <input
                                  placeholder="Объём (мл)"
                                  type="number"
                                  value={form.volume ?? ''}
                                  onChange={(e) => setForm({ ...form, volume: e.target.value })}
                                />
                                <input
                                  placeholder="VG/PG"
                                  value={form.vgpg ?? ''}
                                  onChange={(e) => setForm({ ...form, vgpg: e.target.value })}
                                />
                                <input
                                  placeholder="Зарядка (есть/нет)"
                                  value={form.charging ?? ''}
                                  onChange={(e) => setForm({ ...form, charging: e.target.value })}
                                />
                                <input
                                  placeholder="Регулировка мощности"
                                  value={form.powerAdj ?? ''}
                                  onChange={(e) => setForm({ ...form, powerAdj: e.target.value })}
                                />
                                <input
                                  placeholder="Ёмкость АКБ"
                                  type="number"
                                  value={form.battery ?? ''}
                                  onChange={(e) => setForm({ ...form, battery: e.target.value })}
                                />
                              </>
                            );
                          }
                          if (cat === 'pouches') {
                            return (
                              <>
                                <input
                                  placeholder="Производитель"
                                  value={form.manufacturer ?? ''}
                                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                                />
                                <select
                                  value={form.nicotineType ?? ''}
                                  onChange={(e) => setForm({ ...form, nicotineType: e.target.value })}
                                >
                                  <option value="">Тип никотина</option>
                                  <option value="Без никотина">Без никотина</option>
                                  <option value="Солевой">Солевой</option>
                                  <option value="Щелочной">Щелочной</option>
                                </select>
                                <input
                                  placeholder="Вкус"
                                  value={form.flavor ?? ''}
                                  onChange={(e) => setForm({ ...form, flavor: e.target.value })}
                                />
                                <input
                                  placeholder="Крепость"
                                  type="number"
                                  value={form.strength ?? ''}
                                  onChange={(e) => setForm({ ...form, strength: e.target.value })}
                                />
                              </>
                            );
                          }
                          if (cat === 'pod-systems') {
                            return (
                              <>
                                <input
                                  placeholder="Производитель"
                                  value={form.manufacturer ?? ''}
                                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                                />
                                <input
                                  placeholder="Регулировка мощности"
                                  value={form.powerAdj ?? ''}
                                  onChange={(e) => setForm({ ...form, powerAdj: e.target.value })}
                                />
                                <input
                                  placeholder="Ёмкость АКБ"
                                  type="number"
                                  value={form.battery ?? ''}
                                  onChange={(e) => setForm({ ...form, battery: e.target.value })}
                                />
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <textarea placeholder="Описание" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={{ width: '100%', marginBottom: 8 }} />
                      <div className="admin-form-row">
                        <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; setImageFile(f || null); if (f) setForm({ ...form, image: '' }); e.target.value = ''; }} title="Файл" />
                        <input placeholder="URL картинки" value={form.image ?? ''} onChange={(e) => { setForm({ ...form, image: e.target.value }); if (e.target.value) setImageFile(null); }} style={{ width: '200px' }} disabled={!!imageFile} />
                        {imageFile && <span style={{ fontSize: 11, color: '#0a0' }}>Файл: {imageFile.name}</span>}
                        {(form.category ?? 'disposables') === 'pod-systems' && (
                          <>
                            <label style={{ marginLeft: 12 }}>Доп. фото (расцветки):</label>
                            <input type="file" accept="image/*" multiple onChange={(e) => { const files = Array.from(e.target.files || []); setImageFiles(files); e.target.value = ''; }} />
                            {imageFiles.length > 0 && <span style={{ fontSize: 11, color: '#0a0' }}>+{imageFiles.length} файл(ов)</span>}
                          </>
                        )}
                        <button onClick={saveProduct}>Сохранить</button>
                        <button onClick={() => { setEditing(null); setImageFile(null); setImageFiles([]); }}>Отмена</button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {products.map((p) => (
                <tr key={p.id}>
                  {editing?.id === p.id ? (
                    <td colSpan="10" className="admin-product-edit-cell">
                      <div className="admin-product-form">
                        <div className="admin-form-row">
                          <input placeholder="Название" value={form.name ?? p.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                          <input type="number" placeholder="Цена" value={form.price ?? p.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                          <select value={form.category ?? p.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                            <option value="disposables">Одноразовые парогенераторы</option>
                            <option value="liquids">Жидкости для электронных парогенераторов</option>
                            <option value="pod-systems">Электронные парогенераторы</option>
                            <option value="pouches">Никотиновые паучи</option>
                            <option value="accessories">Комплектующие</option>
                          </select>
                          <label><input type="checkbox" checked={form.showInNew ?? p.showInNew} onChange={(e) => setForm({ ...form, showInNew: e.target.checked })} /> Новинки</label>
                          <label><input type="checkbox" checked={form.showInBestsellers ?? p.showInBestsellers} onChange={(e) => setForm({ ...form, showInBestsellers: e.target.checked })} /> Лидеры</label>
                        </div>
                        <div className="admin-form-row admin-form-specs">
                          {(() => {
                            const cat = form.category ?? p.category ?? 'disposables';
                            if (cat === 'liquids') {
                              return (
                                <>
                                  <select
                                    value={form.nicotineType ?? p.nicotineType ?? ''}
                                    onChange={(e) => setForm({ ...form, nicotineType: e.target.value })}
                                  >
                                    <option value="">Тип никотина</option>
                                    <option value="Без никотина">Без никотина</option>
                                    <option value="Солевой">Солевой</option>
                                    <option value="Щелочной">Щелочной</option>
                                  </select>
                                  <input
                                    placeholder="Вкус"
                                    value={form.flavor ?? p.flavor ?? ''}
                                    onChange={(e) => setForm({ ...form, flavor: e.target.value })}
                                  />
                                  <input
                                    placeholder="Крепость"
                                    type="number"
                                    value={form.strength ?? p.strength ?? ''}
                                    onChange={(e) => setForm({ ...form, strength: e.target.value })}
                                  />
                                  <input
                                    placeholder="Объём (мл)"
                                    type="number"
                                    value={form.volume ?? p.volume ?? ''}
                                    onChange={(e) => setForm({ ...form, volume: e.target.value })}
                                  />
                                  <input
                                    placeholder="VG/PG"
                                    value={form.vgpg ?? p.vgpg ?? ''}
                                    onChange={(e) => setForm({ ...form, vgpg: e.target.value })}
                                  />
                                </>
                              );
                            }
                            if (cat === 'disposables') {
                              return (
                                <>
                                  <input
                                    placeholder="Производитель"
                                    value={form.manufacturer ?? p.manufacturer ?? ''}
                                    onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                                  />
                                  <input
                                    placeholder="Кол-во затяжек"
                                    type="number"
                                    value={form.puffCount ?? p.puffCount ?? ''}
                                    onChange={(e) => setForm({ ...form, puffCount: e.target.value })}
                                  />
                                  <select
                                    value={form.nicotineType ?? p.nicotineType ?? ''}
                                    onChange={(e) => setForm({ ...form, nicotineType: e.target.value })}
                                  >
                                    <option value="">Тип никотина</option>
                                    <option value="Без никотина">Без никотина</option>
                                    <option value="Солевой">Солевой</option>
                                    <option value="Щелочной">Щелочной</option>
                                  </select>
                                  <input
                                    placeholder="Вкус"
                                    value={form.flavor ?? p.flavor ?? ''}
                                    onChange={(e) => setForm({ ...form, flavor: e.target.value })}
                                  />
                                  <input
                                    placeholder="Крепость"
                                    type="number"
                                    value={form.strength ?? p.strength ?? ''}
                                    onChange={(e) => setForm({ ...form, strength: e.target.value })}
                                  />
                                  <input
                                    placeholder="Объём (мл)"
                                    type="number"
                                    value={form.volume ?? p.volume ?? ''}
                                    onChange={(e) => setForm({ ...form, volume: e.target.value })}
                                  />
                                  <input
                                    placeholder="VG/PG"
                                    value={form.vgpg ?? p.vgpg ?? ''}
                                    onChange={(e) => setForm({ ...form, vgpg: e.target.value })}
                                  />
                                  <input
                                    placeholder="Зарядка (есть/нет)"
                                    value={form.charging ?? p.charging ?? ''}
                                    onChange={(e) => setForm({ ...form, charging: e.target.value })}
                                  />
                                  <input
                                    placeholder="Регулировка мощности"
                                    value={form.powerAdj ?? p.powerAdj ?? ''}
                                    onChange={(e) => setForm({ ...form, powerAdj: e.target.value })}
                                  />
                                  <input
                                    placeholder="Ёмкость АКБ"
                                    type="number"
                                    value={form.battery ?? p.battery ?? ''}
                                    onChange={(e) => setForm({ ...form, battery: e.target.value })}
                                  />
                                </>
                              );
                            }
                            if (cat === 'pouches') {
                              return (
                                <>
                                  <input
                                    placeholder="Производитель"
                                    value={form.manufacturer ?? p.manufacturer ?? ''}
                                    onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                                  />
                                  <select
                                    value={form.nicotineType ?? p.nicotineType ?? ''}
                                    onChange={(e) => setForm({ ...form, nicotineType: e.target.value })}
                                  >
                                    <option value="">Тип никотина</option>
                                    <option value="Без никотина">Без никотина</option>
                                    <option value="Солевой">Солевой</option>
                                    <option value="Щелочной">Щелочной</option>
                                  </select>
                                  <input
                                    placeholder="Вкус"
                                    value={form.flavor ?? p.flavor ?? ''}
                                    onChange={(e) => setForm({ ...form, flavor: e.target.value })}
                                  />
                                  <input
                                    placeholder="Крепость"
                                    type="number"
                                    value={form.strength ?? p.strength ?? ''}
                                    onChange={(e) => setForm({ ...form, strength: e.target.value })}
                                  />
                                </>
                              );
                            }
                            if (cat === 'pod-systems') {
                              return (
                                <>
                                  <input
                                    placeholder="Производитель"
                                    value={form.manufacturer ?? p.manufacturer ?? ''}
                                    onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                                  />
                                  <input
                                    placeholder="Регулировка мощности"
                                    value={form.powerAdj ?? p.powerAdj ?? ''}
                                    onChange={(e) => setForm({ ...form, powerAdj: e.target.value })}
                                  />
                                  <input
                                    placeholder="Ёмкость АКБ"
                                    type="number"
                                    value={form.battery ?? p.battery ?? ''}
                                    onChange={(e) => setForm({ ...form, battery: e.target.value })}
                                  />
                                </>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <textarea placeholder="Описание" value={form.description ?? p.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={{ width: '100%', marginBottom: 8 }} />
                        <div className="admin-form-row">
                          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; setImageFile(f || null); if (f) setForm({ ...form, image: '' }); e.target.value = ''; }} title="Файл" />
                          <input placeholder="URL картинки" value={form.image ?? p.image ?? ''} onChange={(e) => { setForm({ ...form, image: e.target.value }); if (e.target.value) setImageFile(null); }} style={{ width: '200px' }} disabled={!!imageFile} />
                          {imageFile && <span style={{ fontSize: 11, color: '#0a0' }}>{imageFile.name}</span>}
                          {(form.category ?? p.category ?? 'disposables') === 'pod-systems' && (
                            <>
                              <label style={{ marginLeft: 12 }}>Доп. фото:</label>
                              <input type="file" accept="image/*" multiple onChange={(e) => { setImageFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
                              {imageFiles.length > 0 && <span style={{ fontSize: 11, color: '#0a0' }}>+{imageFiles.length} файл(ов)</span>}
                              {(p.images?.length > 0) && <span style={{ fontSize: 11, color: '#666' }}>Есть: {p.images.length} доп. фото</span>}
                            </>
                          )}
                          <button onClick={saveProduct}>Сохранить</button>
                          <button onClick={() => { setEditing(null); setImageFile(null); setImageFiles([]); }}>Отмена</button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td>{p.name}</td>
                      <td>{p.price} BYN</td>
                      <td>{p.category}</td>
                      <td>{p.showInNew ? 'Да' : 'Нет'}</td>
                      <td>{p.showInBestsellers ? 'Да' : 'Нет'}</td>
                      <td><button onClick={() => { setEditing(p); setForm({ ...p }); setImageFile(null); }}>Ред.</button><button onClick={() => deleteProduct(p.id)}>Удалить</button></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {false && tab === 'orders' && (
        <section className="admin-section">
          <table>
            <thead>
              <tr><th>ID</th><th>Клиент</th><th>Магазин</th><th>Оплата</th><th>Сумма</th><th>Статус</th><th>Действия</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{String(o.id).slice(0, 8)}</td>
                  <td>{o.user?.login || o.userId}</td>
                  <td>{o.store?.address}</td>
                  <td>{o.paymentMethod === 'cash' ? 'Наличные' : 'Карта'}</td>
                  <td>{o.total} BYN</td>
                  <td>{o.status}</td>
                  <td>
                    {o.status === 'pending' && (
                      <>
                        <button onClick={() => updateOrderStatus(o.id, 'confirmed')}>Подтвердить</button>
                        <button onClick={() => updateOrderStatus(o.id, 'cancelled')}>Отменить</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
