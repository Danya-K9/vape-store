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
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ slug: '', name: '', sortOrder: 0 });
  const [editingCategory, setEditingCategory] = useState(null);
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogForm, setBlogForm] = useState({ title: '', slug: '', dateLabel: '', teaser: '', description: '', image: '', showOnHome: true, sortOrder: 0 });
  const [blogImageFile, setBlogImageFile] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);
  const [heroBanners, setHeroBanners] = useState([]);
  const [heroForm, setHeroForm] = useState({ zone: 'main', title: '', discountText: '', image: '', sortOrder: 0 });
  const [heroImageFile, setHeroImageFile] = useState(null);

  const headers = () => ({ Authorization: `Bearer ${token}` });

  useEffect(() => {
    if (!token) return;
    fetchProducts();
  }, [token]);

  useEffect(() => {
    if (token && tab === 'filters') fetchFilterOptions();
  }, [token, tab, filterCategory]);
  useEffect(() => {
    if (!token) return;
    if (tab === 'categories') fetchCategories();
    if (tab === 'blog') fetchBlogPosts();
    if (tab === 'hero') fetchHeroBanners();
  }, [token, tab]);

  async function fetchUsers() {
    const r = await fetch(`${API_BASE}/admin/users`, { headers: headers() });
    if (r.status === 401) { logout(); return; }
    setUsers(await r.json());
  }

  async function fetchProducts() {
    const r = await fetch(`${API_BASE}/admin/products`, { headers: headers() });
    if (r.status === 401) { logout(); return; }
    setProducts(await r.json());
  }

  async function fetchFilterOptions() {
    const r = await fetch(`${API_BASE}/admin/filters?category=${encodeURIComponent(filterCategory)}`, { headers: headers() });
    if (r.status === 401) { logout(); return; }
    setFilterOptions(await r.json());
  }

  async function fetchOrders() {
    const r = await fetch(`${API_BASE}/admin/orders`, { headers: headers() });
    if (r.status === 401) { logout(); return; }
    setOrders(await r.json());
  }

  async function fetchCategories() {
    const r = await fetch(`${API_BASE}/admin/categories`, { headers: headers() });
    if (r.status === 401) { logout(); return; }
    setCategories(await r.json());
  }

  const saveCategory = async () => {
    const body = { ...categoryForm, sortOrder: Number(categoryForm.sortOrder || 0) };
    if (editingCategory) {
      await fetch(`${API_BASE}/admin/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      await fetch(`${API_BASE}/admin/categories`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    setEditingCategory(null);
    setCategoryForm({ slug: '', name: '', sortOrder: 0 });
    fetchCategories();
  };

  const deleteCategory = async (id) => {
    if (!confirm('Удалить категорию?')) return;
    await fetch(`${API_BASE}/admin/categories/${id}`, { method: 'DELETE', headers: headers() });
    fetchCategories();
  };

  async function fetchBlogPosts() {
    const r = await fetch(`${API_BASE}/admin/blog-posts`, { headers: headers() });
    if (r.status === 401) { logout(); return; }
    setBlogPosts(await r.json());
  }

  const saveBlogPost = async () => {
    const body = new FormData();
    Object.entries(blogForm).forEach(([k, v]) => {
      if (k === 'id') return;
      if (v !== undefined && v !== null) body.append(k, v);
    });
    body.set('showOnHome', String(!!blogForm.showOnHome));
    if (blogImageFile) body.set('image', blogImageFile);
    const url = editingBlog ? `${API_BASE}/admin/blog-posts/${editingBlog.id}` : `${API_BASE}/admin/blog-posts`;
    await fetch(url, { method: editingBlog ? 'PATCH' : 'POST', headers: headers(), body });
    setEditingBlog(null);
    setBlogImageFile(null);
    setBlogForm({ title: '', slug: '', dateLabel: '', teaser: '', description: '', image: '', showOnHome: true, sortOrder: 0 });
    fetchBlogPosts();
  };

  const deleteBlogPost = async (id) => {
    if (!confirm('Удалить пост блога?')) return;
    await fetch(`${API_BASE}/admin/blog-posts/${id}`, { method: 'DELETE', headers: headers() });
    fetchBlogPosts();
  };

  async function fetchHeroBanners() {
    const r = await fetch(`${API_BASE}/admin/hero-banners`, { headers: headers() });
    if (r.status === 401) { logout(); return; }
    setHeroBanners(await r.json());
  }

  const saveHeroBanner = async () => {
    const body = new FormData();
    Object.entries(heroForm).forEach(([k, v]) => {
      if (v !== undefined && v !== null) body.append(k, v);
    });
    if (heroImageFile) body.set('image', heroImageFile);
    await fetch(`${API_BASE}/admin/hero-banners`, { method: 'POST', headers: headers(), body });
    setHeroForm({ zone: 'main', title: '', discountText: '', image: '', sortOrder: 0 });
    setHeroImageFile(null);
    fetchHeroBanners();
  };

  const updateHeroBanner = async (banner) => {
    const body = new FormData();
    body.append('title', banner.title || '');
    body.append('discountText', banner.discountText || '');
    body.append('sortOrder', String(banner.sortOrder || 0));
    await fetch(`${API_BASE}/admin/hero-banners/${banner.id}`, { method: 'PATCH', headers: headers(), body });
    fetchHeroBanners();
  };

  const deleteHeroBanner = async (id) => {
    if (!confirm('Удалить баннер?')) return;
    await fetch(`${API_BASE}/admin/hero-banners/${id}`, { method: 'DELETE', headers: headers() });
    fetchHeroBanners();
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
    if (cat === 'pod-systems' && imageFiles.length > 0) {
      imageFiles.forEach((f) => body.append('images', f));
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
        <button className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')}>Категории</button>
        <button className={tab === 'blog' ? 'active' : ''} onClick={() => setTab('blog')}>Блог</button>
        <button className={tab === 'hero' ? 'active' : ''} onClick={() => setTab('hero')}>Главный экран</button>
      </nav>

      {tab === 'categories' && (
        <section className="admin-section">
          <h2>Категории каталога</h2>
          <div className="admin-form-row" style={{ marginBottom: 12 }}>
            <input placeholder="Slug" value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} />
            <input placeholder="Название" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
            <input type="number" placeholder="Порядок" value={categoryForm.sortOrder} onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: e.target.value })} />
            <button onClick={saveCategory}>{editingCategory ? 'Сохранить' : 'Добавить'}</button>
            {editingCategory && <button onClick={() => { setEditingCategory(null); setCategoryForm({ slug: '', name: '', sortOrder: 0 }); }}>Отмена</button>}
          </div>
          <table>
            <thead><tr><th>Slug</th><th>Название</th><th>Порядок</th><th></th></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>{c.slug}</td>
                  <td>{c.name}</td>
                  <td>{c.sortOrder}</td>
                  <td>
                    <button onClick={() => { setEditingCategory(c); setCategoryForm({ slug: c.slug, name: c.name, sortOrder: c.sortOrder }); }}>Ред.</button>
                    <button onClick={() => deleteCategory(c.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'blog' && (
        <section className="admin-section">
          <h2>Блог (текст до 2500 символов)</h2>
          <div className="admin-form-row" style={{ marginBottom: 8 }}>
            <input placeholder="Название" value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} />
            <input placeholder="Slug" value={blogForm.slug} onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })} />
            <input placeholder="Дата (например 27 апреля 2026)" value={blogForm.dateLabel} onChange={(e) => setBlogForm({ ...blogForm, dateLabel: e.target.value })} />
            <input type="number" placeholder="Порядок" value={blogForm.sortOrder} onChange={(e) => setBlogForm({ ...blogForm, sortOrder: e.target.value })} />
          </div>
          <div className="admin-form-row" style={{ marginBottom: 8 }}>
            <input placeholder="Короткий анонс" value={blogForm.teaser} onChange={(e) => setBlogForm({ ...blogForm, teaser: e.target.value })} style={{ width: 420 }} />
            <input type="file" accept="image/*" onChange={(e) => { setBlogImageFile(e.target.files?.[0] || null); if (e.target.files?.[0]) setBlogForm({ ...blogForm, image: '' }); }} />
            <input placeholder="URL картинки" value={blogForm.image} onChange={(e) => { setBlogForm({ ...blogForm, image: e.target.value }); if (e.target.value) setBlogImageFile(null); }} disabled={!!blogImageFile} style={{ width: 280 }} />
            <label><input type="checkbox" checked={!!blogForm.showOnHome} onChange={(e) => setBlogForm({ ...blogForm, showOnHome: e.target.checked })} /> Показывать на главной</label>
          </div>
          <textarea value={blogForm.description} onChange={(e) => setBlogForm({ ...blogForm, description: e.target.value.slice(0, 2500) })} rows={6} style={{ width: '100%', marginBottom: 8 }} placeholder="Текст статьи" />
          <p style={{ margin: '0 0 10px', color: '#666' }}>{blogForm.description.length}/2500</p>
          <button onClick={saveBlogPost}>{editingBlog ? 'Сохранить пост' : 'Добавить пост'}</button>
          {editingBlog && <button onClick={() => { setEditingBlog(null); setBlogImageFile(null); setBlogForm({ title: '', slug: '', dateLabel: '', teaser: '', description: '', image: '', showOnHome: true, sortOrder: 0 }); }}>Отмена</button>}
          <table style={{ marginTop: 16 }}>
            <thead><tr><th>Заголовок</th><th>Slug</th><th>На главной</th><th></th></tr></thead>
            <tbody>
              {blogPosts.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>{p.slug}</td>
                  <td>{p.showOnHome ? 'Да' : 'Нет'}</td>
                  <td>
                    <button onClick={() => { setEditingBlog(p); setBlogImageFile(null); setBlogForm({ title: p.title || '', slug: p.slug || '', dateLabel: p.dateLabel || '', teaser: p.teaser || '', description: p.description || '', image: p.image || '', showOnHome: p.showOnHome, sortOrder: p.sortOrder || 0 }); }}>Ред.</button>
                    <button onClick={() => deleteBlogPost(p.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'hero' && (
        <section className="admin-section">
          <h2>Баннеры главного экрана</h2>
          <div className="admin-form-row" style={{ marginBottom: 12 }}>
            <select value={heroForm.zone} onChange={(e) => setHeroForm({ ...heroForm, zone: e.target.value })}>
              <option value="main">Большая картинка (макс. 4)</option>
              <option value="side-top">Верхняя мал. картинка (макс. 3)</option>
              <option value="side-bottom">Нижняя мал. картинка (макс. 3)</option>
            </select>
            <input placeholder="Краткий текст" value={heroForm.title} onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })} />
            {heroForm.zone === 'main' && (
              <input placeholder="Кружок скидки (например -15%)" value={heroForm.discountText} onChange={(e) => setHeroForm({ ...heroForm, discountText: e.target.value })} />
            )}
            <input type="number" placeholder="Порядок" value={heroForm.sortOrder} onChange={(e) => setHeroForm({ ...heroForm, sortOrder: e.target.value })} />
            <input type="file" accept="image/*" onChange={(e) => { setHeroImageFile(e.target.files?.[0] || null); if (e.target.files?.[0]) setHeroForm({ ...heroForm, image: '' }); }} />
            <input placeholder="URL картинки" value={heroForm.image} onChange={(e) => { setHeroForm({ ...heroForm, image: e.target.value }); if (e.target.value) setHeroImageFile(null); }} disabled={!!heroImageFile} />
            <button onClick={saveHeroBanner}>Добавить баннер</button>
          </div>
          <table>
            <thead><tr><th>Зона</th><th>Текст</th><th>Скидка</th><th>Порядок</th><th></th></tr></thead>
            <tbody>
              {heroBanners.map((b) => (
                <tr key={b.id}>
                  <td>{b.zone === 'main' ? 'Большая' : b.zone === 'side-top' ? 'Верхняя мал.' : 'Нижняя мал.'}</td>
                  <td><input value={b.title || ''} onChange={(e) => setHeroBanners((prev) => prev.map((x) => x.id === b.id ? { ...x, title: e.target.value } : x))} /></td>
                  <td><input value={b.discountText || ''} disabled={b.zone !== 'main'} onChange={(e) => setHeroBanners((prev) => prev.map((x) => x.id === b.id ? { ...x, discountText: e.target.value } : x))} /></td>
                  <td><input type="number" value={b.sortOrder || 0} onChange={(e) => setHeroBanners((prev) => prev.map((x) => x.id === b.id ? { ...x, sortOrder: Number(e.target.value || 0) } : x))} /></td>
                  <td>
                    <button onClick={() => updateHeroBanner(b)}>Сохранить</button>
                    <button onClick={() => deleteHeroBanner(b.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'filters' && (
        <section className="admin-section">
          <h2>Управление вариантами фильтров по категориям</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="liquids">Жидкости для электронных парогенераторов</option>
              <option value="disposables">Одноразовые/многоразовые парогенераторы</option>
              <option value="pod-systems">Электронные парогенераторы</option>
              <option value="pouches">Никотиновые паучи</option>
              <option value="hookah-mix">Смесь для кальянов</option>
              <option value="hookah-coals">Угли для кальянов</option>
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
              <option value="watts">Ватты</option>
              <option value="resistance">Сопротивление</option>
              <option value="supplier">Поставщик</option>
              <option value="tobacco">Наличие табака</option>
              <option value="weight">Вес</option>
              <option value="coalType">Тип углей</option>
              <option value="packCount">Кол-во в пачке</option>
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
          <button onClick={() => { setEditing('new'); setForm({ name: '', price: 0, category: 'liquids', image: '', images: [], description: '', manufacturer: '', supplier: '', puffCount: '', nicotineType: '', flavor: '', country: '', strength: '', volume: '', vgpg: '', charging: '', powerAdj: '', watts: '', resistance: '', battery: '', tobacco: '', weight: '', coalType: '', packCount: '', color: '', display: '', badge: '' }); setImageFile(null); setImageFiles([]); }}>Добавить товар</button>
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
                        <select value={form.category ?? 'liquids'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                          <option value="liquids">Жидкости для электронных парогенераторов</option>
                          <option value="disposables">Одноразовые/многоразовые парогенераторы</option>
                          <option value="pod-systems">Электронные парогенераторы</option>
                          <option value="pouches">Никотиновые паучи</option>
                          <option value="hookah-mix">Смесь для кальянов</option>
                          <option value="hookah-coals">Угли для кальянов</option>
                          <option value="accessories">Комплектующие</option>
                        </select>
                        <label><input type="checkbox" checked={form.showInNew ?? false} onChange={(e) => setForm({ ...form, showInNew: e.target.checked })} /> Новинки</label>
                        <label><input type="checkbox" checked={form.showInBestsellers ?? false} onChange={(e) => setForm({ ...form, showInBestsellers: e.target.checked })} /> Лидеры</label>
                      </div>
                      <div className="admin-form-row admin-form-specs">
                        {(() => {
                          const cat = form.category ?? 'liquids';
                          if (cat === 'liquids') {
                            return (
                              <>
                                <input
                                  placeholder="Поставщик"
                                  value={form.supplier ?? ''}
                                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
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
                              </>
                            );
                          }
                          if (cat === 'disposables') {
                            return (
                              <>
                                <input
                                  placeholder="Поставщик"
                                  value={form.supplier ?? ''}
                                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                                />
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
                                  placeholder="Поставщик"
                                  value={form.supplier ?? ''}
                                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                                />
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
                                  placeholder="Поставщик"
                                  value={form.supplier ?? ''}
                                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                                />
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
                                  placeholder="Ватты"
                                  value={form.watts ?? ''}
                                  onChange={(e) => setForm({ ...form, watts: e.target.value })}
                                />
                                <input
                                  placeholder="Сопротивление"
                                  value={form.resistance ?? ''}
                                  onChange={(e) => setForm({ ...form, resistance: e.target.value })}
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
                          if (cat === 'accessories') {
                            return (
                              <>
                                <input placeholder="Поставщик" value={form.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                                <input placeholder="Производитель" value={form.manufacturer ?? ''} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
                                <input placeholder="Сопротивление" value={form.resistance ?? ''} onChange={(e) => setForm({ ...form, resistance: e.target.value })} />
                                <input placeholder="Ватты" value={form.watts ?? ''} onChange={(e) => setForm({ ...form, watts: e.target.value })} />
                                <input placeholder="Ёмкость АКБ" type="number" value={form.battery ?? ''} onChange={(e) => setForm({ ...form, battery: e.target.value })} />
                              </>
                            );
                          }
                          if (cat === 'hookah-mix') {
                            return (
                              <>
                                <input placeholder="Поставщик" value={form.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                                <input placeholder="Крепость" type="number" value={form.strength ?? ''} onChange={(e) => setForm({ ...form, strength: e.target.value })} />
                                <input placeholder="Наличие табака" value={form.tobacco ?? ''} onChange={(e) => setForm({ ...form, tobacco: e.target.value })} />
                                <input placeholder="Вес" value={form.weight ?? ''} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                              </>
                            );
                          }
                          if (cat === 'hookah-coals') {
                            return (
                              <>
                                <input placeholder="Поставщик" value={form.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                                <input placeholder="Тип углей" value={form.coalType ?? ''} onChange={(e) => setForm({ ...form, coalType: e.target.value })} />
                                <input placeholder="Кол-во в пачке" value={form.packCount ?? ''} onChange={(e) => setForm({ ...form, packCount: e.target.value })} />
                                <input placeholder="Производитель" value={form.manufacturer ?? ''} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
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
                            <option value="liquids">Жидкости для электронных парогенераторов</option>
                            <option value="disposables">Одноразовые/многоразовые парогенераторы</option>
                            <option value="pod-systems">Электронные парогенераторы</option>
                            <option value="pouches">Никотиновые паучи</option>
                            <option value="hookah-mix">Смесь для кальянов</option>
                            <option value="hookah-coals">Угли для кальянов</option>
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
                                  <input placeholder="Поставщик" value={form.supplier ?? p.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
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
                                  <input placeholder="Поставщик" value={form.supplier ?? p.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
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
                                  <input placeholder="Поставщик" value={form.supplier ?? p.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
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
                                  <input placeholder="Поставщик" value={form.supplier ?? p.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
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
                                  <input placeholder="Ватты" value={form.watts ?? p.watts ?? ''} onChange={(e) => setForm({ ...form, watts: e.target.value })} />
                                  <input placeholder="Сопротивление" value={form.resistance ?? p.resistance ?? ''} onChange={(e) => setForm({ ...form, resistance: e.target.value })} />
                                  <input
                                    placeholder="Ёмкость АКБ"
                                    type="number"
                                    value={form.battery ?? p.battery ?? ''}
                                    onChange={(e) => setForm({ ...form, battery: e.target.value })}
                                  />
                                </>
                              );
                            }
                            if (cat === 'accessories') {
                              return (
                                <>
                                  <input placeholder="Поставщик" value={form.supplier ?? p.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                                  <input placeholder="Производитель" value={form.manufacturer ?? p.manufacturer ?? ''} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
                                  <input placeholder="Сопротивление" value={form.resistance ?? p.resistance ?? ''} onChange={(e) => setForm({ ...form, resistance: e.target.value })} />
                                  <input placeholder="Ватты" value={form.watts ?? p.watts ?? ''} onChange={(e) => setForm({ ...form, watts: e.target.value })} />
                                  <input placeholder="Ёмкость АКБ" type="number" value={form.battery ?? p.battery ?? ''} onChange={(e) => setForm({ ...form, battery: e.target.value })} />
                                </>
                              );
                            }
                            if (cat === 'hookah-mix') {
                              return (
                                <>
                                  <input placeholder="Поставщик" value={form.supplier ?? p.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                                  <input placeholder="Крепость" type="number" value={form.strength ?? p.strength ?? ''} onChange={(e) => setForm({ ...form, strength: e.target.value })} />
                                  <input placeholder="Наличие табака" value={form.tobacco ?? p.tobacco ?? ''} onChange={(e) => setForm({ ...form, tobacco: e.target.value })} />
                                  <input placeholder="Вес" value={form.weight ?? p.weight ?? ''} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                                </>
                              );
                            }
                            if (cat === 'hookah-coals') {
                              return (
                                <>
                                  <input placeholder="Поставщик" value={form.supplier ?? p.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                                  <input placeholder="Тип углей" value={form.coalType ?? p.coalType ?? ''} onChange={(e) => setForm({ ...form, coalType: e.target.value })} />
                                  <input placeholder="Кол-во в пачке" value={form.packCount ?? p.packCount ?? ''} onChange={(e) => setForm({ ...form, packCount: e.target.value })} />
                                  <input placeholder="Производитель" value={form.manufacturer ?? p.manufacturer ?? ''} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
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
