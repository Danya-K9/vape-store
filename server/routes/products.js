import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { category, search, newOnly, bestsellers, priceMin, priceMax, manufacturer, puffCount, nicotineType, flavor, country, strength, volume, vgpg } = req.query;
    const where = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (newOnly === 'true') where.showInNew = true;
    if (bestsellers === 'true') where.showInBestsellers = true;
    if (priceMin) where.price = { ...where.price, gte: parseFloat(priceMin) };
    if (priceMax) where.price = { ...where.price, lte: parseFloat(priceMax) };
    if (manufacturer) where.manufacturer = { in: manufacturer.split(',') };
    if (puffCount) where.puffCount = { in: puffCount.split(',').map(Number) };
    if (nicotineType) where.nicotineType = { in: nicotineType.split(',') };
    if (flavor) where.flavor = { in: flavor.split(',') };
    if (country) where.country = { in: country.split(',') };
    if (strength) where.strength = { in: strength.split(',').map(Number) };
    if (volume) where.volume = { in: volume.split(',').map(Number) };
    if (vgpg) where.vgpg = { in: vgpg.split(',') };
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
