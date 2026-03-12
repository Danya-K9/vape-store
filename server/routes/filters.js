import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Public: get filter options for a category
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) return res.status(400).json({ error: 'category required' });
    const options = await prisma.filterOption.findMany({
      where: { category },
      orderBy: [{ filterKey: 'asc' }, { sortOrder: 'asc' }, { value: 'asc' }],
    });
    const grouped = {};
    for (const o of options) {
      if (!grouped[o.filterKey]) grouped[o.filterKey] = [];
      grouped[o.filterKey].push(o.value);
    }
    res.json(grouped);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
