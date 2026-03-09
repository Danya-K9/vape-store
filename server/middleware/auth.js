import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export async function authUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Нет токена' });
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Недействительный токен' });
  }
}

export async function authAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Нет токена' });
  try {
    const { adminId } = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) return res.status(403).json({ error: 'Доступ запрещён' });
    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ error: 'Недействительный токен' });
  }
}
