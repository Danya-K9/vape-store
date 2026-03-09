import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const stores = await prisma.store.findMany();
    res.json(stores);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
