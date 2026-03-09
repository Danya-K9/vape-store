import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authUser } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/me', authUser, async (req, res) => {
  const { password, ...user } = req.user;
  res.json(user);
});

router.patch('/me', authUser, async (req, res) => {
  try {
    const { phone, telegram, password } = req.body;
    const data = {};
    if (phone !== undefined) data.phone = phone;
    if (telegram !== undefined) data.telegram = telegram;
    if (password) data.password = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });
    const { password: _, ...u } = user;
    res.json(u);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
