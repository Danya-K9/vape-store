import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

const API_BASE = '/api';
const SUPPLIER_OPTIONS = ['Частное предприятие "ВП Импорт"', 'ЧП Лох'];

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
  const [categories, setCategories] = useState([
    { slug: 'liquids', name: 'Жидкости для электронных парогенераторов' },
    { slug: 'disposables', name: 'Одноразовые/многоразовые парогенераторы' },
    { slug: 'pod-systems', name: 'Электронные парогенераторы' },
    { slug: 'pouches', name: 'Никотиновые паучи' },
    { slug: 'hookah-mix', name: 'Смесь для кальянов' },
    { slug: 'hookah-coals', name: 'Угли для кальянов' },
    { slug: 'accessories', name: 'Комплектующие' },
  ]);
  const [categoryForm, setCategoryForm] = useState({ slug: '', name: '', sortOrder: 0 });
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryError, setCategoryError] = useState('');
  const [productError, setProductError] = useState('');
  const [productNameSearch, setProductNameSearch] = useState('');
  const [productFieldErrors, setProductFieldErrors] = useState({});
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogForm, setBlogForm] = useState({ title: '', slug: '', dateLabel: '', teaser: '', description: '', image: '', showOnHome: true, sortOrder: 0 });
  const [blogImageFile, setBlogImageFile] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);
  const [blogError, setBlogError] = useState('');
  const [heroBanners, setHeroBanners] = useState([]);
  const [heroForm, setHeroForm] = useState({ zone: 'main', title: '', discountText: '', image: '', sortOrder: 0 });
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [partners, setPartners] = useState([]);
  const [partnerForm, setPartnerForm] = useState({ name: '', description: '', website: '', image: '', sortOrder: 0 });
  const [partnerImageFile, setPartnerImageFile] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [faqItems, setFaqItems] = useState([]);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', sortOrder: 0 });
  const [editingFaq, setEditingFaq] = useState(null);
  const [licenseDocs, setLicenseDocs] = useState([]);
  const [licenseForm, setLicenseForm] = useState({ title: '', fileUrl: '', sortOrder: 0 });
  const [licensePdfFile, setLicensePdfFile] = useState(null);
  const [editingLicenseDoc, setEditingLicenseDoc] = useState(null);

  const headers = () => ({ Authorization: `Bearer ${token}` });

  const productSearchLower = productNameSearch.trim().toLowerCase();
  const productsFilteredByName = productSearchLower
    ? products.filter((p) => (p.name || '').toLowerCase().includes(productSearchLower))
    : products;

  useEffect(() => {
    if (!token) return;
    fetchProducts();
    fetchCategories();
  }, [token]);

  useEffect(() => {
    if (token && tab === 'filters') fetchFilterOptions();
  }, [token, tab, filterCategory]);
  useEffect(() => {
    if (!token) return;
    if (tab === 'categories') fetchCategories();
    if (tab === 'blog') fetchBlogPosts();
    if (tab === 'hero') fetchHeroBanners();
    if (tab === 'partners') fetchPartners();
    if (tab === 'faq') fetchFaqItems();
    if (tab === 'license-docs') fetchLicenseDocs();
  }, [token, tab]);

  async function fetchUsers() {
    try {
      const r = await fetch(`${API_BASE}/admin/users`, { headers: headers() });
      if (r.status === 401) { logout(); return; }
      const data = await r.json();
      setUsers(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) setError('Ошибка загрузки пользователей');
    } catch {
      setUsers([]);
      setError('Не удалось загрузить пользователей');
    }
  }

  async function fetchProducts() {
    try {
      const r = await fetch(`${API_BASE}/admin/products`, { headers: headers() });
      if (r.status === 401) { logout(); return; }
      const data = await r.json();
      setProducts(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) setError('Ошибка загрузки товаров');
    } catch {
      setProducts([]);
      setError('Не удалось загрузить товары');
    }
  }

  async function fetchFilterOptions() {
    try {
      const r = await fetch(`${API_BASE}/admin/filters?category=${encodeURIComponent(filterCategory)}`, { headers: headers() });
      if (r.status === 401) { logout(); return; }
      const data = await r.json();
      setFilterOptions(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) setError('Ошибка загрузки фильтров');
    } catch {
      setFilterOptions([]);
      setError('Не удалось загрузить фильтры');
    }
  }

  async function fetchOrders() {
    try {
      const r = await fetch(`${API_BASE}/admin/orders`, { headers: headers() });
      if (r.status === 401) { logout(); return; }
      const data = await r.json();
      setOrders(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) setError('Ошибка загрузки заказов');
    } catch {
      setOrders([]);
      setError('Не удалось загрузить заказы');
    }
  }

  async function fetchCategories() {
    try {
      const r = await fetch(`${API_BASE}/admin/categories`, { headers: headers() });
      if (r.status === 401) { logout(); return; }
      const data = await r.json();
      setCategories(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) setError('Ошибка загрузки категорий');
    } catch {
      setCategories([]);
      setError('Не удалось загрузить категории');
    }
  }

  const saveCategory = async () => {
    setCategoryError('');
    const body = { ...categoryForm, sortOrder: Number(categoryForm.sortOrder || 0) };
    const request = editingCategory
      ? fetch(`${API_BASE}/admin/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      : fetch(`${API_BASE}/admin/categories`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    const resp = await request;
    const text = await resp.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return {}; } })() : {};
    if (!resp.ok) {
      setCategoryError(data?.error || 'Не удалось сохранить категорию');
      return;
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
    try {
      const r = await fetch(`${API_BASE}/admin/blog-posts`, { headers: headers() });
      if (r.status === 401) { logout(); return; }
      const data = await r.json();
      setBlogPosts(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) setError('Ошибка загрузки блога');
    } catch {
      setBlogPosts([]);
      setError('Не удалось загрузить блог');
    }
  }

  const saveBlogPost = async () => {
    setBlogError('');
    if (!blogForm.title?.trim()) {
      setBlogError('Введите заголовок статьи');
      return;
    }
    if (!blogForm.description?.trim()) {
      setBlogError('Введите текст статьи');
      return;
    }
    const body = new FormData();
    Object.entries(blogForm).forEach(([k, v]) => {
      if (k === 'id') return;
      if (v !== undefined && v !== null) body.append(k, v);
    });
    body.set('showOnHome', String(!!blogForm.showOnHome));
    if (blogImageFile) body.set('image', blogImageFile);
    const url = editingBlog ? `${API_BASE}/admin/blog-posts/${editingBlog.id}` : `${API_BASE}/admin/blog-posts`;
    const resp = await fetch(url, { method: editingBlog ? 'PATCH' : 'POST', headers: headers(), body });
    const text = await resp.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;
    if (!resp.ok) {
      setBlogError(data?.error || 'Не удалось сохранить пост');
      return;
    }
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
    try {
      const r = await fetch(`${API_BASE}/admin/hero-banners`, { headers: headers() });
      if (r.status === 401) { logout(); return; }
      const data = await r.json();
      setHeroBanners(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) setError('Ошибка загрузки баннеров');
    } catch {
      setHeroBanners([]);
      setError('Не удалось загрузить баннеры');
    }
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

  async function fetchPartners() {
    try {
      const r = await fetch(`${API_BASE}/admin/partners`, { headers: headers() });
      if (r.status === 401) { logout(); return; }
      const data = await r.json();
      setPartners(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) setError('Ошибка загрузки партнеров');
    } catch {
      setPartners([]);
      setError('Не удалось загрузить партнеров');
    }
  }

  const savePartner = async () => {
    const body = new FormData();
    Object.entries(partnerForm).forEach(([k, v]) => {
      if (v !== undefined && v !== null) body.append(k, v);
    });
    if (partnerImageFile) body.set('image', partnerImageFile);
    const url = editingPartner ? `${API_BASE}/admin/partners/${editingPartner.id}` : `${API_BASE}/admin/partners`;
    await fetch(url, { method: editingPartner ? 'PATCH' : 'POST', headers: headers(), body });
    setEditingPartner(null);
    setPartnerImageFile(null);
    setPartnerForm({ name: '', description: '', website: '', image: '', sortOrder: 0 });
    fetchPartners();
  };

  const deletePartner = async (id) => {
    if (!confirm('Удалить партнера?')) return;
    await fetch(`${API_BASE}/admin/partners/${id}`, { method: 'DELETE', headers: headers() });
    fetchPartners();
  };

  async function fetchFaqItems() {
    try {
      const r = await fetch(`${API_BASE}/admin/faq`, { headers: headers() });
      if (r.status === 401) { logout(); return; }
      const data = await r.json();
      setFaqItems(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) setError('Ошибка загрузки FAQ');
    } catch {
      setFaqItems([]);
      setError('Не удалось загрузить FAQ');
    }
  }

  const saveFaq = async () => {
    const url = editingFaq ? `${API_BASE}/admin/faq/${editingFaq.id}` : `${API_BASE}/admin/faq`;
    await fetch(url, {
      method: editingFaq ? 'PATCH' : 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...faqForm, sortOrder: Number(faqForm.sortOrder || 0) }),
    });
    setEditingFaq(null);
    setFaqForm({ question: '', answer: '', sortOrder: 0 });
    fetchFaqItems();
  };

  const deleteFaq = async (id) => {
    if (!confirm('Удалить вопрос?')) return;
    await fetch(`${API_BASE}/admin/faq/${id}`, { method: 'DELETE', headers: headers() });
    fetchFaqItems();
  };

  async function fetchLicenseDocs() {
    try {
      const r = await fetch(`${API_BASE}/admin/license-docs`, { headers: headers() });
      if (r.status === 401) { logout(); return; }
      const data = await r.json();
      setLicenseDocs(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) setError('Ошибка загрузки PDF документов');
    } catch {
      setLicenseDocs([]);
      setError('Не удалось загрузить PDF документы');
    }
  }

  const saveLicenseDoc = async () => {
    const body = new FormData();
    if (licenseForm.title) body.set('title', licenseForm.title);
    if (licenseForm.fileUrl) body.set('fileUrl', licenseForm.fileUrl);
    body.set('sortOrder', String(Number(licenseForm.sortOrder || 0)));
    if (licensePdfFile) body.set('file', licensePdfFile);
    const url = editingLicenseDoc ? `${API_BASE}/admin/license-docs/${editingLicenseDoc.id}` : `${API_BASE}/admin/license-docs`;
    const resp = await fetch(url, { method: editingLicenseDoc ? 'PATCH' : 'POST', headers: headers(), body });
    if (!resp.ok) {
      const text = await resp.text();
      const data = text ? (() => { try { return JSON.parse(text); } catch { return {}; } })() : {};
      alert(data?.error || 'Не удалось сохранить PDF документ');
      return;
    }
    setEditingLicenseDoc(null);
    setLicensePdfFile(null);
    setLicenseForm({ title: '', fileUrl: '', sortOrder: 0 });
    fetchLicenseDocs();
  };

  const deleteLicenseDoc = async (id) => {
    if (!confirm('Удалить PDF документ?')) return;
    await fetch(`${API_BASE}/admin/license-docs/${id}`, { method: 'DELETE', headers: headers() });
    fetchLicenseDocs();
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
    setProductError('');
    const nextFieldErrors = {};
    const name = String(form.name || '').trim();
    const shortDescription = String(form.shortDescription || '').trim();
    const fullDescription = String(form.fullDescription || '').trim();
    const legacyDescription = String(form.description || '').trim();
    const activeDescription = fullDescription || legacyDescription;
    if (!name) nextFieldErrors.name = 'Введите название товара';
    const parsedPrice = Number.parseFloat(form.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) nextFieldErrors.price = 'Введите корректную цену';
    if (shortDescription.length > 1000) nextFieldErrors.shortDescription = 'Краткое описание: максимум 1000 символов';
    if (activeDescription.length > 2500) nextFieldErrors.description = 'Полное описание: максимум 2500 символов';
    if (Object.keys(nextFieldErrors).length > 0) {
      setProductFieldErrors(nextFieldErrors);
      setProductError('Исправьте ошибки в полях товара');
      return;
    }
    setProductFieldErrors({});
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
    const request = editing && editing !== 'new'
      ? fetch(`${API_BASE}/admin/products/${editing.id}`, {
        method: 'PATCH',
        headers: headers(),
        body,
      })
      : fetch(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers: headers(),
        body,
      });
    const resp = await request;
    const text = await resp.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return {}; } })() : {};
    if (!resp.ok) {
      setProductError(data?.error || 'Не удалось сохранить товар');
      return;
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
        <button className={tab === 'partners' ? 'active' : ''} onClick={() => setTab('partners')}>Партнеры</button>
        <button className={tab === 'faq' ? 'active' : ''} onClick={() => setTab('faq')}>FAQ</button>
        <button className={tab === 'license-docs' ? 'active' : ''} onClick={() => setTab('license-docs')}>PDF лицензий</button>
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
          {categoryError && <p className="admin-error" style={{ marginBottom: 8 }}>{categoryError}</p>}
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
            <input placeholder="Slug (необязательно)" value={blogForm.slug} onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })} />
            <input placeholder="Дата (например 27 апреля 2026)" value={blogForm.dateLabel} onChange={(e) => setBlogForm({ ...blogForm, dateLabel: e.target.value })} />
            <input type="number" placeholder="Порядок" value={blogForm.sortOrder} onChange={(e) => setBlogForm({ ...blogForm, sortOrder: e.target.value })} />
          </div>
          <p style={{ margin: '0 0 8px', color: '#555', fontSize: 13 }}>
            Slug — это часть ссылки статьи (например `/blog/novosti-vejpa`). Можно не заполнять: система создаст его автоматически.
          </p>
          <div className="admin-form-row" style={{ marginBottom: 8 }}>
            <input placeholder="Короткий анонс" value={blogForm.teaser} onChange={(e) => setBlogForm({ ...blogForm, teaser: e.target.value })} style={{ width: 420 }} />
            <input type="file" accept="image/*" onChange={(e) => { setBlogImageFile(e.target.files?.[0] || null); if (e.target.files?.[0]) setBlogForm({ ...blogForm, image: '' }); }} />
            <input placeholder="URL картинки" value={blogForm.image} onChange={(e) => { setBlogForm({ ...blogForm, image: e.target.value }); if (e.target.value) setBlogImageFile(null); }} disabled={!!blogImageFile} style={{ width: 280 }} />
            <label><input type="checkbox" checked={!!blogForm.showOnHome} onChange={(e) => setBlogForm({ ...blogForm, showOnHome: e.target.checked })} /> Показывать на главной</label>
          </div>
          <textarea value={blogForm.description} onChange={(e) => setBlogForm({ ...blogForm, description: e.target.value.slice(0, 2500) })} rows={6} style={{ width: '100%', marginBottom: 8 }} placeholder="Текст статьи" />
          <p style={{ margin: '0 0 10px', color: '#666' }}>{blogForm.description.length}/2500</p>
          {blogError && <p className="admin-error" style={{ marginBottom: 10 }}>{blogError}</p>}
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

      {tab === 'partners' && (
        <section className="admin-section">
          <h2>Магазин - партнеры</h2>
          <div className="admin-form-row" style={{ marginBottom: 10 }}>
            <input placeholder="Название партнера" value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} />
            <input placeholder="Сайт (https://...)" value={partnerForm.website} onChange={(e) => setPartnerForm({ ...partnerForm, website: e.target.value })} />
            <input type="number" placeholder="Порядок" value={partnerForm.sortOrder} onChange={(e) => setPartnerForm({ ...partnerForm, sortOrder: e.target.value })} />
          </div>
          <div className="admin-form-row" style={{ marginBottom: 10 }}>
            <input
              placeholder="Описание"
              value={partnerForm.description}
              onChange={(e) => setPartnerForm({ ...partnerForm, description: e.target.value.slice(0, 1000) })}
              style={{ width: 420 }}
            />
            <input type="file" accept="image/*" onChange={(e) => { setPartnerImageFile(e.target.files?.[0] || null); if (e.target.files?.[0]) setPartnerForm({ ...partnerForm, image: '' }); }} />
            <input placeholder="URL картинки" value={partnerForm.image} onChange={(e) => { setPartnerForm({ ...partnerForm, image: e.target.value }); if (e.target.value) setPartnerImageFile(null); }} disabled={!!partnerImageFile} />
            <button onClick={savePartner}>{editingPartner ? 'Сохранить' : 'Добавить партнера'}</button>
            {editingPartner && <button onClick={() => { setEditingPartner(null); setPartnerImageFile(null); setPartnerForm({ name: '', description: '', website: '', image: '', sortOrder: 0 }); }}>Отмена</button>}
          </div>
          <p style={{ margin: '0 0 10px', color: '#666' }}>
            Осталось символов для описания: {1000 - (partnerForm.description?.length || 0)}
          </p>
          <table>
            <thead><tr><th>Название</th><th>Сайт</th><th>Порядок</th><th></th></tr></thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.website || '-'}</td>
                  <td>{p.sortOrder}</td>
                  <td>
                    <button onClick={() => { setEditingPartner(p); setPartnerImageFile(null); setPartnerForm({ name: p.name || '', description: p.description || '', website: p.website || '', image: p.image || '', sortOrder: p.sortOrder || 0 }); }}>Ред.</button>
                    <button onClick={() => deletePartner(p.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'faq' && (
        <section className="admin-section">
          <h2>FAQ</h2>
          <div className="admin-form-row" style={{ marginBottom: 8 }}>
            <input placeholder="Вопрос" value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} style={{ width: 420 }} />
            <input type="number" placeholder="Порядок" value={faqForm.sortOrder} onChange={(e) => setFaqForm({ ...faqForm, sortOrder: e.target.value })} />
          </div>
          <textarea value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} rows={5} style={{ width: '100%', marginBottom: 8 }} placeholder="Ответ" />
          <button onClick={saveFaq}>{editingFaq ? 'Сохранить' : 'Добавить вопрос'}</button>
          {editingFaq && <button onClick={() => { setEditingFaq(null); setFaqForm({ question: '', answer: '', sortOrder: 0 }); }}>Отмена</button>}
          <table style={{ marginTop: 12 }}>
            <thead><tr><th>Вопрос</th><th>Порядок</th><th></th></tr></thead>
            <tbody>
              {faqItems.map((f) => (
                <tr key={f.id}>
                  <td>{f.question}</td>
                  <td>{f.sortOrder}</td>
                  <td>
                    <button onClick={() => { setEditingFaq(f); setFaqForm({ question: f.question || '', answer: f.answer || '', sortOrder: f.sortOrder || 0 }); }}>Ред.</button>
                    <button onClick={() => deleteFaq(f.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'license-docs' && (
        <section className="admin-section">
          <h2>Лицензии и сертификаты (PDF)</h2>
          <p style={{ margin: '0 0 8px', color: '#666' }}>
            Постоянный документ «Реквизиты» отображается на странице автоматически и не редактируется здесь.
          </p>
          <div className="admin-form-row" style={{ marginBottom: 10 }}>
            <input placeholder="Название PDF" value={licenseForm.title} onChange={(e) => setLicenseForm({ ...licenseForm, title: e.target.value })} />
            <input type="number" placeholder="Порядок" value={licenseForm.sortOrder} onChange={(e) => setLicenseForm({ ...licenseForm, sortOrder: e.target.value })} />
          </div>
          <div className="admin-form-row" style={{ marginBottom: 10 }}>
            <input type="file" accept="application/pdf,.pdf" onChange={(e) => { setLicensePdfFile(e.target.files?.[0] || null); if (e.target.files?.[0]) setLicenseForm({ ...licenseForm, fileUrl: '' }); }} />
            <input placeholder="URL PDF (если без загрузки)" value={licenseForm.fileUrl} onChange={(e) => { setLicenseForm({ ...licenseForm, fileUrl: e.target.value }); if (e.target.value) setLicensePdfFile(null); }} disabled={!!licensePdfFile} style={{ width: 320 }} />
            <button onClick={saveLicenseDoc}>{editingLicenseDoc ? 'Сохранить' : 'Добавить PDF'}</button>
            {editingLicenseDoc && <button onClick={() => { setEditingLicenseDoc(null); setLicensePdfFile(null); setLicenseForm({ title: '', fileUrl: '', sortOrder: 0 }); }}>Отмена</button>}
          </div>
          <table>
            <thead><tr><th>Название</th><th>PDF</th><th>Порядок</th><th></th></tr></thead>
            <tbody>
              {licenseDocs.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.title}</td>
                  <td><a href={doc.fileUrl} target="_blank" rel="noreferrer">Открыть</a></td>
                  <td>{doc.sortOrder}</td>
                  <td>
                    <button onClick={() => { setEditingLicenseDoc(doc); setLicensePdfFile(null); setLicenseForm({ title: doc.title || '', fileUrl: doc.fileUrl || '', sortOrder: doc.sortOrder || 0 }); }}>Ред.</button>
                    <button onClick={() => deleteLicenseDoc(doc.id)}>Удалить</button>
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
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
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
          <div className="admin-products-toolbar">
            <button onClick={() => { setEditing('new'); setForm({ name: '', price: 0, category: 'liquids', stock: '', isActive: true, image: '', images: [], description: '', manufacturer: '', supplier: '', puffCount: '', nicotineType: '', flavor: '', country: '', strength: '', volume: '', vgpg: '', charging: '', powerAdj: '', watts: '', resistance: '', battery: '', tobacco: '', weight: '', coalType: '', packCount: '', color: '', display: '', badge: '', blurImage: false }); setImageFile(null); setImageFiles([]); }}>Добавить товар</button>
            <input
              type="search"
              className="admin-product-search"
              placeholder="Поиск по названию товара"
              value={productNameSearch}
              onChange={(e) => setProductNameSearch(e.target.value)}
              aria-label="Поиск по названию товара"
            />
          </div>
          {productError && <p className="admin-error" style={{ marginBottom: 8 }}>{productError}</p>}
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
                        <input className={productFieldErrors.name ? 'input-error' : ''} placeholder="Название" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <input className={productFieldErrors.price ? 'input-error' : ''} type="text" inputMode="decimal" placeholder="Цена" value={form.price ?? ''} onChange={(e) => setForm({ ...form, price: e.target.value.replace(',', '.') })} />
                        <select value={form.category ?? 'liquids'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                          {categories.map((c) => (
                            <option key={c.slug} value={c.slug}>{c.name}</option>
                          ))}
                        </select>
                          <input
                            type="number"
                            placeholder="Остаток"
                            value={form.stock ?? ''}
                            onChange={(e) => setForm({ ...form, stock: e.target.value })}
                            style={{ width: 90 }}
                          />
                          <label><input type="checkbox" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Активен</label>
                        <label><input type="checkbox" checked={form.blurImage ?? false} onChange={(e) => setForm({ ...form, blurImage: e.target.checked })} /> Блюр</label>
                        <label><input type="checkbox" checked={form.showInNew ?? false} onChange={(e) => setForm({ ...form, showInNew: e.target.checked })} /> Новинки</label>
                        <label><input type="checkbox" checked={form.showInBestsellers ?? false} onChange={(e) => setForm({ ...form, showInBestsellers: e.target.checked })} /> Лидеры</label>
                      </div>
                      <div className="admin-form-row admin-form-specs">
                        {(() => {
                          const cat = form.category ?? 'liquids';
                          if (cat === 'liquids') {
                            return (
                              <>
                                <select value={form.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Поставщик</option>{SUPPLIER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
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
                                <select value={form.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Поставщик</option>{SUPPLIER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
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
                                <select value={form.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Поставщик</option>{SUPPLIER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
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
                                <select value={form.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Поставщик</option>{SUPPLIER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
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
                                <select value={form.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Поставщик</option>{SUPPLIER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
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
                                <select value={form.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Поставщик</option>{SUPPLIER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                                <input placeholder="Крепость" type="number" value={form.strength ?? ''} onChange={(e) => setForm({ ...form, strength: e.target.value })} />
                                <input placeholder="Наличие табака" value={form.tobacco ?? ''} onChange={(e) => setForm({ ...form, tobacco: e.target.value })} />
                                <input placeholder="Вес" value={form.weight ?? ''} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                              </>
                            );
                          }
                          if (cat === 'hookah-coals') {
                            return (
                              <>
                                <select value={form.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Поставщик</option>{SUPPLIER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                                <input placeholder="Тип углей" value={form.coalType ?? ''} onChange={(e) => setForm({ ...form, coalType: e.target.value })} />
                                <input placeholder="Кол-во в пачке" value={form.packCount ?? ''} onChange={(e) => setForm({ ...form, packCount: e.target.value })} />
                                <input placeholder="Производитель" value={form.manufacturer ?? ''} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <textarea
                        className={productFieldErrors.shortDescription ? 'input-error' : ''}
                        placeholder="Краткое описание (до 1000)"
                        value={form.shortDescription ?? ''}
                        onChange={(e) => setForm({ ...form, shortDescription: e.target.value.slice(0, 1000) })}
                        rows={2}
                        style={{ width: '100%', marginBottom: 4 }}
                      />
                      <p style={{ margin: '0 0 8px', color: '#666', fontSize: 12 }}>{(form.shortDescription || '').length}/1000</p>
                      <textarea
                        className={productFieldErrors.description ? 'input-error' : ''}
                        placeholder="Полное описание (до 2500)"
                        value={form.fullDescription ?? form.description ?? ''}
                        onChange={(e) => setForm({ ...form, fullDescription: e.target.value.slice(0, 2500), description: e.target.value.slice(0, 2500) })}
                        rows={4}
                        style={{ width: '100%', marginBottom: 4 }}
                      />
                      <p style={{ margin: '0 0 8px', color: '#666', fontSize: 12 }}>{(form.fullDescription ?? form.description ?? '').length}/2500</p>
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
              {productsFilteredByName.map((p) => (
                <tr key={p.id}>
                  {editing?.id === p.id ? (
                    <td colSpan="10" className="admin-product-edit-cell">
                      <div className="admin-product-form">
                        <div className="admin-form-row">
                          <input className={productFieldErrors.name ? 'input-error' : ''} placeholder="Название" value={form.name ?? p.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                          <input className={productFieldErrors.price ? 'input-error' : ''} type="text" inputMode="decimal" placeholder="Цена" value={form.price ?? p.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(',', '.') })} />
                          <select value={form.category ?? p.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                            {categories.map((c) => (
                              <option key={c.slug} value={c.slug}>{c.name}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Остаток"
                            value={form.stock ?? (p.stock ?? '')}
                            onChange={(e) => setForm({ ...form, stock: e.target.value })}
                            style={{ width: 90 }}
                          />
                          <label><input type="checkbox" checked={form.isActive ?? p.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Активен</label>
                          <label><input type="checkbox" checked={form.blurImage ?? p.blurImage ?? false} onChange={(e) => setForm({ ...form, blurImage: e.target.checked })} /> Блюр</label>
                          <label><input type="checkbox" checked={form.showInNew ?? p.showInNew} onChange={(e) => setForm({ ...form, showInNew: e.target.checked })} /> Новинки</label>
                          <label><input type="checkbox" checked={form.showInBestsellers ?? p.showInBestsellers} onChange={(e) => setForm({ ...form, showInBestsellers: e.target.checked })} /> Лидеры</label>
                        </div>
                        <div className="admin-form-row admin-form-specs">
                          {(() => {
                            const cat = form.category ?? p.category ?? 'disposables';
                            if (cat === 'liquids') {
                              return (
                                <>
                                  <select value={form.supplier ?? p.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Поставщик</option>{SUPPLIER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
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
                                  <select value={form.supplier ?? p.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Поставщик</option>{SUPPLIER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
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
                                  <select value={form.supplier ?? p.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Поставщик</option>{SUPPLIER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
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
                                  <select value={form.supplier ?? p.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Поставщик</option>{SUPPLIER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
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
                                  <select value={form.supplier ?? p.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Поставщик</option>{SUPPLIER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
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
                                  <select value={form.supplier ?? p.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Поставщик</option>{SUPPLIER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                                  <input placeholder="Крепость" type="number" value={form.strength ?? p.strength ?? ''} onChange={(e) => setForm({ ...form, strength: e.target.value })} />
                                  <input placeholder="Наличие табака" value={form.tobacco ?? p.tobacco ?? ''} onChange={(e) => setForm({ ...form, tobacco: e.target.value })} />
                                  <input placeholder="Вес" value={form.weight ?? p.weight ?? ''} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                                </>
                              );
                            }
                            if (cat === 'hookah-coals') {
                              return (
                                <>
                                  <select value={form.supplier ?? p.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Поставщик</option>{SUPPLIER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                                  <input placeholder="Тип углей" value={form.coalType ?? p.coalType ?? ''} onChange={(e) => setForm({ ...form, coalType: e.target.value })} />
                                  <input placeholder="Кол-во в пачке" value={form.packCount ?? p.packCount ?? ''} onChange={(e) => setForm({ ...form, packCount: e.target.value })} />
                                  <input placeholder="Производитель" value={form.manufacturer ?? p.manufacturer ?? ''} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
                                </>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <textarea
                          className={productFieldErrors.shortDescription ? 'input-error' : ''}
                          placeholder="Краткое описание (до 1000)"
                          value={form.shortDescription ?? p.shortDescription ?? ''}
                          onChange={(e) => setForm({ ...form, shortDescription: e.target.value.slice(0, 1000) })}
                          rows={2}
                          style={{ width: '100%', marginBottom: 4 }}
                        />
                        <p style={{ margin: '0 0 8px', color: '#666', fontSize: 12 }}>{(form.shortDescription ?? p.shortDescription ?? '').length}/1000</p>
                        <textarea
                          className={productFieldErrors.description ? 'input-error' : ''}
                          placeholder="Полное описание (до 2500)"
                          value={form.fullDescription ?? form.description ?? p.fullDescription ?? p.description ?? ''}
                          onChange={(e) => setForm({ ...form, fullDescription: e.target.value.slice(0, 2500), description: e.target.value.slice(0, 2500) })}
                          rows={4}
                          style={{ width: '100%', marginBottom: 4 }}
                        />
                        <p style={{ margin: '0 0 8px', color: '#666', fontSize: 12 }}>{(form.fullDescription ?? form.description ?? p.fullDescription ?? p.description ?? '').length}/2500</p>
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
