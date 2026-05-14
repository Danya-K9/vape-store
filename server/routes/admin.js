import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authAdmin } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { sendTelegramOrderStatusToUser } from '../telegram/bot.js';
import {
  decrementStockForOrderInTx,
  restoreStockForOrderInTx,
} from '../lib/orderStock.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();
const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Только изображения'));
  },
});

const uploadProductFiles = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Только изображения'));
  },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 50 },
]);

const pdfStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (_, file, cb) => {
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalExt = path.extname(file.originalname || '').toLowerCase();
    const ext = originalExt === '.pdf' ? '.pdf' : '.pdf';
    cb(null, `${base}${ext}`);
  },
});

const uploadPdfFile = multer({
  storage: pdfStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) cb(null, true);
    else cb(new Error('Только PDF файлы'));
  },
}).single('file');

router.use(authAdmin);

const CATEGORY_FALLBACK = [
  { slug: 'liquids', name: 'Жидкости для электронных парогенераторов', sortOrder: 0 },
  { slug: 'disposables', name: 'Одноразовые/многоразовые парогенераторы', sortOrder: 1 },
  { slug: 'pod-systems', name: 'Электронные парогенераторы', sortOrder: 2 },
  { slug: 'pouches', name: 'Никотиновые паучи', sortOrder: 3 },
  { slug: 'hookah-mix', name: 'Смесь для кальянов', sortOrder: 4 },
  { slug: 'hookah-coals', name: 'Угли для кальянов', sortOrder: 5 },
  { slug: 'accessories', name: 'Комплектующие', sortOrder: 6 },
];

const HERO_ZONE_LIMITS = {
  main: 4,
  'side-top': 3,
  'side-bottom': 3,
};

function normalizeSlug(value = '') {
  const source = String(value)
    .trim()
    .toLowerCase();
  const translitMap = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return source
    .split('')
    .map((char) => translitMap[char] ?? char)
    .join('')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
}

function parseSortOrder(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function buildUniqueBlogSlug(rawValue, excludeId = null) {
  const base = normalizeSlug(rawValue || 'post');
  let candidate = base || 'post';
  let index = 1;
  while (true) {
    const existing = await prisma.blogPost.findFirst({
      where: excludeId
        ? { slug: candidate, NOT: { id: excludeId } }
        : { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${base || 'post'}-${index}`;
    index += 1;
  }
}

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { _count: { select: { orders: true, favorites: true } } },
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { login, password, phone, telegram } = req.body;
    if (!login || !password) return res.status(400).json({ error: 'Логин и пароль обязательны' });
    const exists = await prisma.user.findUnique({ where: { login } });
    if (exists) return res.status(400).json({ error: 'Логин занят' });
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { login, password: hash, phone: phone || null, telegram: telegram || null },
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { login, password, phone, telegram } = req.body;
    const data = {};
    if (login !== undefined) data.login = login;
    if (phone !== undefined) data.phone = phone;
    if (telegram !== undefined) data.telegram = telegram;
    if (password) data.password = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/products', (req, res, next) => {
  uploadProductFiles(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const imgFiles = (req.files?.image || [])[0];
    const extraFiles = req.files?.images || [];
    const imageUrl = req.body.image || (imgFiles ? `/uploads/${imgFiles.filename}` : null);
    const extraUrls = extraFiles.map((f) => `/uploads/${f.filename}`);
    let imagesArr = extraUrls;
    if (req.body.images) {
      try {
        const parsed = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
        if (Array.isArray(parsed)) imagesArr = [...extraUrls, ...parsed.filter(Boolean)];
      } catch (_) {}
    }
    const name = String(req.body.name || '').trim();
    const parsedPrice = Number.parseFloat(req.body.price);
    const shortDescription = req.body.shortDescription ? String(req.body.shortDescription).trim() : null;
    const fullDescriptionRaw = req.body.fullDescription ?? req.body.description;
    const fullDescription = fullDescriptionRaw ? String(fullDescriptionRaw).trim() : null;
    if (!name) return res.status(400).json({ error: 'Название товара обязательно' });
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return res.status(400).json({ error: 'Укажите корректную цену' });
    if (shortDescription && shortDescription.length > 1000) return res.status(400).json({ error: 'Краткое описание не должно быть длиннее 1000 символов' });
    if (fullDescription && fullDescription.length > 2500) return res.status(400).json({ error: 'Полное описание не должно быть длиннее 2500 символов' });
    const data = {
      name,
      shortDescription,
      fullDescription,
      description: fullDescription,
      image: imageUrl,
      images: imagesArr,
      price: parsedPrice,
      category: req.body.category || 'disposables',
      stock: req.body.stock !== undefined && req.body.stock !== ''
        ? parseInt(req.body.stock, 10)
        : null,
      isActive: req.body.isActive === undefined
        ? true
        : (req.body.isActive === 'true' || req.body.isActive === true),
      badge: req.body.badge || null,
      blurImage: req.body.blurImage === 'true' || req.body.blurImage === true,
      showInNew: req.body.showInNew === 'true' || req.body.showInNew === true,
      showInBestsellers: req.body.showInBestsellers === 'true' || req.body.showInBestsellers === true,
      manufacturer: req.body.manufacturer || null,
      puffCount: req.body.puffCount ? parseInt(req.body.puffCount, 10) : null,
      nicotineType: req.body.nicotineType || null,
      flavor: req.body.flavor || null,
      country: req.body.country || null,
      strength: req.body.strength ? parseInt(req.body.strength, 10) : null,
      volume: req.body.volume ? parseInt(req.body.volume, 10) : null,
      vgpg: req.body.vgpg || null,
      charging: req.body.charging || null,
      powerAdj: req.body.powerAdj || null,
      watts: req.body.watts || null,
      resistance: req.body.resistance || null,
      battery: req.body.battery ? parseInt(req.body.battery, 10) : null,
      supplier: req.body.supplier || null,
      tobacco: req.body.tobacco || null,
      weight: req.body.weight || null,
      coalType: req.body.coalType || null,
      packCount: req.body.packCount || null,
      color: req.body.color || null,
      display: req.body.display || null,
    };
    const product = await prisma.product.create({ data });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/products/:id', (req, res, next) => {
  uploadProductFiles(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const imgFiles = (req.files?.image || [])[0];
    const extraFiles = req.files?.images || [];
    const body = { ...req.body };
    if (imgFiles) body.image = `/uploads/${imgFiles.filename}`;
    if (body.name !== undefined && !String(body.name).trim()) {
      return res.status(400).json({ error: 'Название товара обязательно' });
    }
    if (body.price !== undefined) {
      const parsedPrice = Number.parseFloat(body.price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return res.status(400).json({ error: 'Укажите корректную цену' });
      body.price = parsedPrice;
    }
    if (body.shortDescription !== undefined) {
      body.shortDescription = body.shortDescription ? String(body.shortDescription).trim() : null;
      if (body.shortDescription && body.shortDescription.length > 1000) {
        return res.status(400).json({ error: 'Краткое описание не должно быть длиннее 1000 символов' });
      }
    }
    if (body.fullDescription !== undefined || body.description !== undefined) {
      const fullDescription = body.fullDescription ?? body.description;
      body.fullDescription = fullDescription ? String(fullDescription).trim() : null;
      body.description = body.fullDescription;
      if (body.fullDescription && body.fullDescription.length > 2500) {
        return res.status(400).json({ error: 'Полное описание не должно быть длиннее 2500 символов' });
      }
    }
    let imagesArr = [];
    if (body.imagesJson) {
      try {
        const parsed = typeof body.imagesJson === 'string' ? JSON.parse(body.imagesJson) : body.imagesJson;
        if (Array.isArray(parsed)) imagesArr = parsed.filter(Boolean);
      } catch (_) {}
    } else if (body.images !== undefined) {
      try {
        const parsed = typeof body.images === 'string' ? JSON.parse(body.images) : body.images;
        if (Array.isArray(parsed)) imagesArr = parsed.filter(Boolean);
      } catch (_) {}
    }
    if (extraFiles.length > 0) {
      const extraUrls = extraFiles.map((f) => `/uploads/${f.filename}`);
      body.images = [...extraUrls, ...imagesArr];
    } else if (imagesArr.length > 0) {
      body.images = imagesArr;
    }
    const numFields = ['puffCount', 'strength', 'volume', 'battery', 'stock'];
    numFields.forEach((f) => {
      if (body[f] !== undefined) body[f] = parseFloat(body[f]) || parseInt(body[f], 10) || null;
    });
    if (body.showInNew !== undefined) body.showInNew = body.showInNew === 'true' || body.showInNew === true;
    if (body.showInBestsellers !== undefined) body.showInBestsellers = body.showInBestsellers === 'true' || body.showInBestsellers === true;
    if (body.blurImage !== undefined) body.blurImage = body.blurImage === 'true' || body.blurImage === true;
    if (body.isActive !== undefined) body.isActive = body.isActive === 'true' || body.isActive === true;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: body,
    });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const FAQ_QUESTION_MAX = 1000;
const FAQ_ANSWER_MAX = 2000;
const PARTNER_DESCRIPTION_MAX = 2000;

function parseAnalyticsDateStart(iso) {
  const s = String(iso || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(y, mo, d, 0, 0, 0, 0);
}

function parseAnalyticsDateEnd(iso) {
  const s = String(iso || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(y, mo, d, 23, 59, 59, 999);
}

/** Продажи: подтверждённые брони, дата — по времени подтверждения (updatedAt). */
router.get('/analytics/sales', async (req, res) => {
  try {
    const from = parseAnalyticsDateStart(req.query.from);
    const to = parseAnalyticsDateEnd(req.query.to);
    if (!from || !to || from > to) {
      return res.status(400).json({ error: 'Укажите период: from и to в формате YYYY-MM-DD' });
    }
    const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
    const categoryNames = Object.fromEntries(categories.map((c) => [c.slug, c.name]));

    const orders = await prisma.order.findMany({
      where: {
        status: 'confirmed',
        updatedAt: { gte: from, lte: to },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    const byCat = {};
    for (const order of orders) {
      for (const item of order.items) {
        const pr = item.product;
        if (!pr) continue;
        const slug = pr.category || 'unknown';
        if (!byCat[slug]) {
          byCat[slug] = { quantity: 0, sum: 0, products: new Map() };
        }
        const lineSum = (Number(item.price) || 0) * (Number(item.quantity) || 0);
        byCat[slug].quantity += Number(item.quantity) || 0;
        byCat[slug].sum += lineSum;
        const cur = byCat[slug].products.get(pr.id) || {
          productId: pr.id,
          name: pr.name,
          quantity: 0,
          sum: 0,
        };
        cur.quantity += Number(item.quantity) || 0;
        cur.sum += lineSum;
        byCat[slug].products.set(pr.id, cur);
      }
    }

    const byCategory = Object.entries(byCat)
      .map(([slug, v]) => {
        const topProducts = Array.from(v.products.values())
          .sort((a, b) => b.quantity - a.quantity || b.sum - a.sum)
          .slice(0, 5)
          .map((p) => ({
            productId: p.productId,
            name: p.name,
            quantity: p.quantity,
            sum: Math.round(p.sum * 100) / 100,
          }));
        return {
          category: slug,
          categoryName: categoryNames[slug] || slug,
          quantity: v.quantity,
          sum: Math.round(v.sum * 100) / 100,
          topProducts,
        };
      })
      .sort((a, b) => b.sum - a.sum);

    res.json({
      from: req.query.from,
      to: req.query.to,
      ordersCount: orders.length,
      byCategory,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Списание остатков с полки (касса): только товары с числовым stock. */
router.post('/cashier/sell', async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const discountPercent = Math.min(100, Math.max(0, Number.parseFloat(req.body.discountPercent) || 0));
    if (!items.length) {
      return res.status(400).json({ error: 'Добавьте товары в чек' });
    }

    const normalized = items.map((raw) => ({
      productId: String(raw.productId || '').trim(),
      quantity: Number.parseInt(String(raw.quantity ?? '1'), 10),
      sourceOrderId: raw.sourceOrderId ? String(raw.sourceOrderId).trim() : null,
      unitPrice: raw.unitPrice != null && Number.isFinite(Number(raw.unitPrice)) ? Number(raw.unitPrice) : null,
    }));

    for (const line of normalized) {
      if (!line.productId || !Number.isFinite(line.quantity) || line.quantity < 1) {
        return res.status(400).json({ error: 'Некорректная позиция в чеке' });
      }
    }

    const orderIds = [...new Set(normalized.map((i) => i.sourceOrderId).filter(Boolean))];

    const result = await prisma.$transaction(async (tx) => {
      for (const oid of orderIds) {
        const order = await tx.order.findUnique({
          where: { id: oid },
          include: { items: true },
        });
        if (!order || order.status !== 'pending') {
          throw Object.assign(new Error('Бронь не найдена или уже обработана'), { status: 400 });
        }
        for (const oi of order.items) {
          if (!oi.productId) continue;
          const sumInCart = normalized
            .filter((i) => i.sourceOrderId === oid && i.productId === oi.productId)
            .reduce((a, i) => a + i.quantity, 0);
          if (sumInCart !== oi.quantity) {
            throw Object.assign(
              new Error(
                `Чек должен совпадать с бронью #${String(oid).slice(0, 8)}: товар ${oi.productId.slice(0, 8)}… — нужно ${oi.quantity} шт. в чеке`,
              ),
              { status: 400 },
            );
          }
        }
      }

      const qtyByProduct = new Map();
      for (const line of normalized) {
        qtyByProduct.set(line.productId, (qtyByProduct.get(line.productId) || 0) + line.quantity);
      }

      let subtotal = 0;
      for (const line of normalized) {
        const p = await tx.product.findUnique({ where: { id: line.productId } });
        if (!p) throw Object.assign(new Error('Товар не найден'), { status: 400 });
        const unit = line.unitPrice != null ? line.unitPrice : p.price;
        subtotal += unit * line.quantity;
      }

      const lines = [];
      for (const [productId, totalQty] of qtyByProduct) {
        const p = await tx.product.findUnique({ where: { id: productId } });
        if (!p) throw Object.assign(new Error('Товар не найден'), { status: 400 });
        if (p.stock === null || p.stock === undefined) {
          throw Object.assign(
            new Error(`«${p.name}»: не ведётся остаток на складе — списание через кассу недоступно`),
            { status: 400 },
          );
        }
        if (totalQty > p.stock) {
          throw Object.assign(
            new Error(`«${p.name}»: недостаточно (в наличии ${p.stock}, в чеке ${totalQty})`),
            { status: 400 },
          );
        }
        const nextStock = p.stock - totalQty;
        await tx.product.update({
          where: { id: productId },
          data: { stock: nextStock, isActive: nextStock > 0 },
        });
        const unitPrice = p.price;
        lines.push({ productId, quantity: totalQty, price: unitPrice, name: p.name });
      }

      for (const oid of orderIds) {
        await tx.order.update({
          where: { id: oid, status: 'pending' },
          data: { status: 'confirmed' },
        });
      }

      const total = Math.round(subtotal * (1 - discountPercent / 100) * 100) / 100;
      return { subtotal, total, discountPercent, lines, completedOrderIds: orderIds };
    });

    res.json({ ok: true, ...result });
  } catch (e) {
    const msg = String(e.message || '');
    if (e.status === 400 || /недостаточно|не найден|некорректн|не ведётся остаток|совпадать|обработана/i.test(msg)) {
      return res.status(400).json({ error: msg || 'Ошибка' });
    }
    res.status(500).json({ error: msg });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { user: true, store: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/filters', async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) return res.status(400).json({ error: 'category required' });
    const options = await prisma.filterOption.findMany({
      where: { category },
      orderBy: [{ filterKey: 'asc' }, { sortOrder: 'asc' }, { value: 'asc' }],
    });
    res.json(options);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/filters', async (req, res) => {
  try {
    const { category, filterKey, value, sortOrder } = req.body;
    if (!category || !filterKey || value === undefined) {
      return res.status(400).json({ error: 'category, filterKey, value required' });
    }
    const opt = await prisma.filterOption.create({
      data: { category, filterKey, value: String(value), sortOrder: sortOrder ?? 0 },
    });
    res.json(opt);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Такой вариант уже есть' });
    res.status(500).json({ error: e.message });
  }
});

router.patch('/filters/:id', async (req, res) => {
  try {
    const { value, sortOrder } = req.body;
    const data = {};
    if (value !== undefined) data.value = String(value);
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    const opt = await prisma.filterOption.update({
      where: { id: req.params.id },
      data,
    });
    res.json(opt);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/filters/:id', async (req, res) => {
  try {
    await prisma.filterOption.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус' });
    }

    const prev = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { user: true, items: { include: { product: true } } },
    });
    if (!prev) return res.status(404).json({ error: 'Не найден' });
    if (prev.status === 'cancelled') {
      return res.status(400).json({ error: 'Заказ уже отменён' });
    }
    if (prev.status === status) {
      const unchanged = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { user: true, store: true, items: { include: { product: true } } },
      });
      return res.json(unchanged);
    }

    if (status === 'confirmed' && prev.status === 'pending') {
      try {
        await prisma.$transaction(async (tx) => {
          const dec = await decrementStockForOrderInTx(tx, prev);
          if (!dec.ok) {
            const msg = dec.code === 'out_of_stock'
              ? `Нет остатков: ${dec.productName} (нужно ${dec.need}, есть ${dec.have})`
              : 'Ошибка списания';
            throw Object.assign(new Error(msg), { status: 400 });
          }
          await tx.order.update({ where: { id: prev.id }, data: { status } });
        });
      } catch (e) {
        if (e.status === 400) return res.status(400).json({ error: e.message });
        throw e;
      }
    } else if (status === 'cancelled' && prev.status === 'confirmed') {
      await prisma.$transaction(async (tx) => {
        await restoreStockForOrderInTx(tx, prev);
        await tx.order.update({ where: { id: prev.id }, data: { status } });
      });
    } else if (status === 'cancelled' && prev.status === 'pending') {
      await prisma.order.update({ where: { id: prev.id }, data: { status } });
    } else {
      return res.status(400).json({ error: `Смена статуса ${prev.status} → ${status} не поддерживается` });
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { user: true, store: true, items: { include: { product: true } } },
    });

    if ((status === 'confirmed' || status === 'cancelled') && prev?.user?.telegram) {
      await sendTelegramOrderStatusToUser(prev.user.telegram, order.id, status);
    }
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    if (categories.length > 0) return res.json(categories);
    const created = await Promise.all(CATEGORY_FALLBACK.map((item) => prisma.category.create({ data: item })));
    res.json(created);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const slug = normalizeSlug(req.body.slug || req.body.name);
    const name = String(req.body.name || '').trim();
    if (!slug || !name) return res.status(400).json({ error: 'slug/name обязательны' });
    const category = await prisma.category.create({
      data: { slug, name, sortOrder: parseSortOrder(req.body.sortOrder, 0) },
    });
    res.json(category);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Категория с таким slug уже есть' });
    res.status(500).json({ error: e.message });
  }
});

router.patch('/categories/:id', async (req, res) => {
  try {
    const data = {};
    if (req.body.slug !== undefined) data.slug = normalizeSlug(req.body.slug);
    if (req.body.name !== undefined) data.name = String(req.body.name).trim();
    if (req.body.sortOrder !== undefined) data.sortOrder = parseSortOrder(req.body.sortOrder, 0);
    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    res.json(category);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Категория с таким slug уже есть' });
    res.status(500).json({ error: e.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/blog-posts', async (req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/blog-posts', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const image = req.file ? `/uploads/${req.file.filename}` : (req.body.image || null);
    const title = String(req.body.title || '').trim();
    const slug = await buildUniqueBlogSlug(req.body.slug || title);
    const description = String(req.body.description || '').trim();
    if (!title || !description) return res.status(400).json({ error: 'Нужны: заголовок и текст статьи' });
    if (description.length > 2500) return res.status(400).json({ error: 'Описание не должно быть длиннее 2500 символов' });
    const post = await prisma.blogPost.create({
      data: {
        slug,
        title,
        dateLabel: String(req.body.dateLabel || new Date().toLocaleDateString('ru-RU')),
        teaser: req.body.teaser ? String(req.body.teaser).trim() : null,
        description,
        image,
        showOnHome: parseBool(req.body.showOnHome, true),
        sortOrder: parseSortOrder(req.body.sortOrder, 0),
      },
    });
    res.json(post);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Пост с таким slug уже есть' });
    res.status(500).json({ error: e.message });
  }
});

router.patch('/blog-posts/:id', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const current = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: 'Пост не найден' });
    const data = {};
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    else if (req.body.image !== undefined) data.image = req.body.image || null;
    if (req.body.slug !== undefined) {
      data.slug = await buildUniqueBlogSlug(req.body.slug || req.body.title || current.title, req.params.id);
    } else if (req.body.title !== undefined) {
      data.slug = await buildUniqueBlogSlug(current.slug || req.body.title, req.params.id);
    }
    if (req.body.title !== undefined) data.title = String(req.body.title).trim();
    if (req.body.dateLabel !== undefined) data.dateLabel = String(req.body.dateLabel).trim();
    if (req.body.teaser !== undefined) data.teaser = req.body.teaser ? String(req.body.teaser).trim() : null;
    if (req.body.description !== undefined) {
      const description = String(req.body.description).trim();
      if (description.length > 2500) return res.status(400).json({ error: 'Описание не должно быть длиннее 2500 символов' });
      data.description = description;
    }
    if (req.body.showOnHome !== undefined) data.showOnHome = parseBool(req.body.showOnHome, true);
    if (req.body.sortOrder !== undefined) data.sortOrder = parseSortOrder(req.body.sortOrder, 0);
    const post = await prisma.blogPost.update({ where: { id: req.params.id }, data });
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/blog-posts/:id', async (req, res) => {
  try {
    await prisma.blogPost.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/hero-banners', async (req, res) => {
  try {
    const banners = await prisma.heroBanner.findMany({ orderBy: [{ zone: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }] });
    res.json(banners);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/hero-banners', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const zone = String(req.body.zone || '');
    if (!HERO_ZONE_LIMITS[zone]) return res.status(400).json({ error: 'Некорректная зона' });
    const count = await prisma.heroBanner.count({ where: { zone } });
    if (count >= HERO_ZONE_LIMITS[zone]) return res.status(400).json({ error: `Лимит для зоны ${zone}: ${HERO_ZONE_LIMITS[zone]}` });
    const image = req.file ? `/uploads/${req.file.filename}` : (req.body.image || '');
    if (!image) return res.status(400).json({ error: 'image обязателен' });
    const banner = await prisma.heroBanner.create({
      data: {
        zone,
        image,
        title: req.body.title ? String(req.body.title).trim() : null,
        discountText: zone === 'main' && req.body.discountText ? String(req.body.discountText).trim() : null,
        sortOrder: parseSortOrder(req.body.sortOrder, count),
      },
    });
    res.json(banner);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/hero-banners/:id', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const current = await prisma.heroBanner.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: 'Баннер не найден' });
    const data = {};
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    else if (req.body.image !== undefined) data.image = req.body.image || null;
    if (req.body.title !== undefined) data.title = req.body.title ? String(req.body.title).trim() : null;
    if (req.body.discountText !== undefined) data.discountText = current.zone === 'main' && req.body.discountText ? String(req.body.discountText).trim() : null;
    if (req.body.sortOrder !== undefined) data.sortOrder = parseSortOrder(req.body.sortOrder, current.sortOrder);
    const banner = await prisma.heroBanner.update({ where: { id: req.params.id }, data });
    res.json(banner);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/hero-banners/:id', async (req, res) => {
  try {
    await prisma.heroBanner.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/partners', async (req, res) => {
  try {
    const partners = await prisma.partner.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    res.json(partners);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/partners', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Название партнера обязательно' });
    const descRaw = req.body.description ? String(req.body.description).trim() : '';
    if (descRaw.length > PARTNER_DESCRIPTION_MAX) {
      return res.status(400).json({ error: `Описание не длиннее ${PARTNER_DESCRIPTION_MAX} символов` });
    }
    const partner = await prisma.partner.create({
      data: {
        name,
        description: descRaw || null,
        website: req.body.website ? String(req.body.website).trim() : null,
        image: req.file ? `/uploads/${req.file.filename}` : (req.body.image || null),
        sortOrder: parseSortOrder(req.body.sortOrder, 0),
      },
    });
    res.json(partner);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/partners/:id', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const data = {};
    if (req.body.name !== undefined) data.name = String(req.body.name).trim();
    if (req.body.description !== undefined) {
      const d = req.body.description ? String(req.body.description).trim() : '';
      if (d.length > PARTNER_DESCRIPTION_MAX) {
        return res.status(400).json({ error: `Описание не длиннее ${PARTNER_DESCRIPTION_MAX} символов` });
      }
      data.description = d || null;
    }
    if (req.body.website !== undefined) data.website = req.body.website ? String(req.body.website).trim() : null;
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    else if (req.body.image !== undefined) data.image = req.body.image || null;
    if (req.body.sortOrder !== undefined) data.sortOrder = parseSortOrder(req.body.sortOrder, 0);
    const partner = await prisma.partner.update({ where: { id: req.params.id }, data });
    res.json(partner);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/partners/:id', async (req, res) => {
  try {
    await prisma.partner.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/faq', async (req, res) => {
  try {
    const items = await prisma.faqItem.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/faq', async (req, res) => {
  try {
    const question = String(req.body.question || '').trim();
    const answer = String(req.body.answer || '').trim();
    if (!question || !answer) return res.status(400).json({ error: 'Вопрос и ответ обязательны' });
    if (question.length > FAQ_QUESTION_MAX) {
      return res.status(400).json({ error: `Вопрос не длиннее ${FAQ_QUESTION_MAX} символов` });
    }
    if (answer.length > FAQ_ANSWER_MAX) {
      return res.status(400).json({ error: `Ответ не длиннее ${FAQ_ANSWER_MAX} символов` });
    }
    const item = await prisma.faqItem.create({
      data: { question, answer, sortOrder: parseSortOrder(req.body.sortOrder, 0) },
    });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/faq/:id', async (req, res) => {
  try {
    const data = {};
    if (req.body.question !== undefined) {
      const q = String(req.body.question).trim();
      if (q.length > FAQ_QUESTION_MAX) {
        return res.status(400).json({ error: `Вопрос не длиннее ${FAQ_QUESTION_MAX} символов` });
      }
      data.question = q;
    }
    if (req.body.answer !== undefined) {
      const a = String(req.body.answer).trim();
      if (a.length > FAQ_ANSWER_MAX) {
        return res.status(400).json({ error: `Ответ не длиннее ${FAQ_ANSWER_MAX} символов` });
      }
      data.answer = a;
    }
    if (req.body.sortOrder !== undefined) data.sortOrder = parseSortOrder(req.body.sortOrder, 0);
    const item = await prisma.faqItem.update({ where: { id: req.params.id }, data });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/faq/:id', async (req, res) => {
  try {
    await prisma.faqItem.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/license-docs', async (req, res) => {
  try {
    const docs = await prisma.licenseDocument.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/license-docs', (req, res, next) => {
  uploadPdfFile(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const uploadedFileUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const fileUrl = String(req.body.fileUrl || uploadedFileUrl).trim();
    if (!title || !fileUrl) return res.status(400).json({ error: 'Название и ссылка на PDF обязательны' });
    const doc = await prisma.licenseDocument.create({
      data: { title, fileUrl, sortOrder: parseSortOrder(req.body.sortOrder, 0) },
    });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/license-docs/:id', (req, res, next) => {
  uploadPdfFile(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const data = {};
    if (req.body.title !== undefined) data.title = String(req.body.title).trim();
    if (req.body.fileUrl !== undefined) data.fileUrl = String(req.body.fileUrl).trim();
    if (req.file) data.fileUrl = `/uploads/${req.file.filename}`;
    if (req.body.sortOrder !== undefined) data.sortOrder = parseSortOrder(req.body.sortOrder, 0);
    const doc = await prisma.licenseDocument.update({ where: { id: req.params.id }, data });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/license-docs/:id', async (req, res) => {
  try {
    await prisma.licenseDocument.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
