import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authAdmin } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { sendTelegramOrderStatusToUser } from '../telegram/bot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();
const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Только изображения'));
  },
});

const uploadProductFiles = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Только изображения'));
  },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 50 },
]);

router.use(authAdmin);

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
    const data = {
      name: req.body.name,
      description: req.body.description || null,
      image: imageUrl,
      images: imagesArr,
      price: parseFloat(req.body.price),
      category: req.body.category || 'disposables',
      badge: req.body.badge || null,
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
      battery: req.body.battery ? parseInt(req.body.battery, 10) : null,
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
    const numFields = ['price', 'puffCount', 'strength', 'volume', 'battery'];
    numFields.forEach((f) => {
      if (body[f] !== undefined) body[f] = parseFloat(body[f]) || parseInt(body[f], 10) || null;
    });
    if (body.showInNew !== undefined) body.showInNew = body.showInNew === 'true' || body.showInNew === true;
    if (body.showInBestsellers !== undefined) body.showInBestsellers = body.showInBestsellers === 'true' || body.showInBestsellers === true;
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
      include: { user: true },
    });
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
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

export default router;
