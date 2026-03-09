import { Router } from 'express';
import { authUser } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.use(authUser);

router.get('/', async (req, res) => {
  try {
    const favs = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });
    res.json(favs.map((f) => f.product));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId обязателен' });
    await prisma.favorite.upsert({
      where: {
        userId_productId: { userId: req.user.id, productId },
      },
      create: { userId: req.user.id, productId },
      update: {},
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:productId', async (req, res) => {
  try {
    await prisma.favorite.deleteMany({
      where: { userId: req.user.id, productId: req.params.productId },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
