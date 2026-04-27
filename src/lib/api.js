const API = (() => {
  const raw = import.meta?.env?.VITE_API_URL;
  const base = raw ? String(raw).trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '') : '';
  // If user provides only an origin (e.g. https://app), normalize to https://app/api
  if (!base) return '/api';
  return base.endsWith('/api') ? base : `${base}/api`;
})();

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  if (!contentType.includes('application/json')) {
    throw new Error(`API вернул не JSON (${res.status}). Проверь VITE_API_URL и /api роуты.`);
  }
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || 'Ошибка запроса');
  return data;
}

export async function apiForm(path, formData, method = 'POST') {
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method, headers, body: formData });
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  if (!contentType.includes('application/json')) {
    throw new Error(`API вернул не JSON (${res.status}). Проверь VITE_API_URL и /api роуты.`);
  }
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || 'Ошибка запроса');
  return data;
}

export const authApi = {
  register: (body) => api('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => api('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  registerWithCode: (body) => api('/auth/register-with-code', { method: 'POST', body: JSON.stringify(body) }),
  requestPasswordCode: () => api('/auth/request-password-code', { method: 'POST' }),
  changePasswordWithCode: (body) => api('/auth/change-password-with-code', { method: 'POST', body: JSON.stringify(body) }),
};

export const productsApi = {
  list: (params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    );
    const q = new URLSearchParams(clean).toString();
    return api(`/products${q ? `?${q}` : ''}`);
  },
  get: (id) => api(`/products/${id}`),
};

export const usersApi = {
  me: () => api('/users/me'),
  update: (body) => api('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
};

export const favoritesApi = {
  list: () => api('/favorites'),
  add: (productId) => api('/favorites', { method: 'POST', body: JSON.stringify({ productId }) }),
  remove: (productId) => api(`/favorites/${productId}`, { method: 'DELETE' }),
};

export const ordersApi = {
  list: () => api('/orders'),
  create: (body) => api('/orders', { method: 'POST', body: JSON.stringify({ ...body, pickupDate: body.pickupDate || null }) }),
};

export const storesApi = {
  list: () => api('/stores'),
};

export const filtersApi = {
  list: (category) => api(`/filters?category=${encodeURIComponent(category)}`),
};

export const contentApi = {
  categories: () => api('/content/categories'),
  blogPosts: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
    ).toString();
    return api(`/content/blog-posts${q ? `?${q}` : ''}`);
  },
  heroBanners: () => api('/content/hero-banners'),
};
