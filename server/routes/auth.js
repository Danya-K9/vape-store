import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { login, password, phone, telegram } = req.body;
    if (!login || !password) return res.status(400).json({ error: 'Логин и пароль обязательны' });
    const exists = await prisma.user.findUnique({ where: { login } });
    if (exists) return res.status(400).json({ error: 'Логин занят' });
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { login, password: hash, phone: phone || null, telegram: telegram || null },
    });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, login: user.login, phone: user.phone, telegram: user.telegram } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) return res.status(400).json({ error: 'Логин и пароль обязательны' });
    const user = await prisma.user.findUnique({ where: { login } });
    if (!user) return res.status(401).json({ error: 'Неверный логин или пароль' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Неверный логин или пароль' });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user.id, login: user.login, phone: user.phone, telegram: user.telegram },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) return res.status(400).json({ error: 'Логин и пароль обязательны' });
    const admin = await prisma.admin.findUnique({ where: { login } });
    if (!admin) return res.status(401).json({ error: 'Неверный логин или пароль' });
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(401).json({ error: 'Неверный логин или пароль' });
    const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/register-with-code', async (req, res) => {
  try {
    const { login, code, password } = req.body;
    if (!login || !code || !password) return res.status(400).json({ error: 'Логин, код и пароль обязательны' });
    const authCode = await prisma.authCode.findFirst({
      where: { login, code, type: 'register' },
      orderBy: { createdAt: 'desc' },
    });
    if (!authCode || authCode.expiresAt < new Date()) return res.status(400).json({ error: 'Код недействителен или истёк' });
    const exists = await prisma.user.findUnique({ where: { login } });
    if (exists) return res.status(400).json({ error: 'Логин занят' });
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { login, password: hash, telegram: authCode.telegramId },
    });
    await prisma.authCode.deleteMany({ where: { id: authCode.id } });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, login: user.login, phone: user.phone, telegram: user.telegram } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/callback', (req, res) => {
  const token = req.query.token;
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  if (!token) return res.redirect(frontend + '/login');
  res.redirect(`${frontend}/auth/callback?token=${token}`);
});

router.post('/request-password-code', async (req, res) => {
  try {
    const auth = req.headers.authorization?.replace('Bearer ', '');
    if (!auth) return res.status(401).json({ error: 'Нет токена' });
    const { userId } = jwt.verify(auth, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.telegram) return res.status(400).json({ error: 'Telegram не привязан' });
    const code = crypto.randomInt(100000, 999999).toString();
    await prisma.authCode.create({
      data: {
        code,
        type: 'password',
        login: user.login,
        telegramId: user.telegram,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    const { bot } = await import('../telegram/bot.js');
    if (bot) await bot.sendMessage(user.telegram, `Ваш код для смены пароля: *${code}*`, { parse_mode: 'Markdown' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/change-password-with-code', async (req, res) => {
  try {
    const { code, newPassword } = req.body;
    const auth = req.headers.authorization?.replace('Bearer ', '');
    if (!auth) return res.status(401).json({ error: 'Нет токена' });
    const { userId } = jwt.verify(auth, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
    const authCode = await prisma.authCode.findFirst({
      where: { login: user.login, code, type: 'password' },
      orderBy: { createdAt: 'desc' },
    });
    if (!authCode || authCode.expiresAt < new Date()) return res.status(400).json({ error: 'Код недействителен или истёк' });
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
    await prisma.authCode.deleteMany({ where: { id: authCode.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
