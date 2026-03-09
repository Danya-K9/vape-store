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

router.post('/products', upload.single('image'), async (req, res) => {
  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.image || null;
    const data = {
      name: req.body.name,
      description: req.body.description || null,
      image: imageUrl || req.body.image,
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

router.patch('/products/:id', upload.single('image'), async (req, res) => {
  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const body = { ...req.body };
    if (imageUrl) body.image = imageUrl;
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
