import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();
const SEARCH_SPEC_FIELDS = [
  'manufacturer',
  'puffCount',
  'nicotineType',
  'flavor',
  'country',
  'strength',
  'volume',
  'vgpg',
  'charging',
  'powerAdj',
  'battery',
  'watts',
  'resistance',
  'supplier',
  'tobacco',
  'weight',
  'coalType',
  'packCount',
  'color',
  'display',
];

const normalizeSearchTokens = (searchValue) => String(searchValue || '')
  .toLowerCase()
  .split(/\s+/)
  .map((token) => token.trim())
  .filter(Boolean);

const calculateSearchScore = (product, tokens) => {
  if (tokens.length === 0) return 0;
  const name = String(product.name || '').toLowerCase();
  const shortDescription = String(product.shortDescription || '').toLowerCase();
  const fullDescription = String(product.fullDescription || product.description || '').toLowerCase();
  const specs = SEARCH_SPEC_FIELDS
    .map((field) => String(product[field] ?? '').toLowerCase())
    .join(' ');
  let score = 0;
  tokens.forEach((token) => {
    if (name.includes(token)) score += 6;
    if (shortDescription.includes(token)) score += 4;
    if (fullDescription.includes(token)) score += 3;
    if (specs.includes(token)) score += 2;
  });
  return score;
};

router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      newOnly,
      bestsellers,
      priceMin,
      priceMax,
      manufacturer,
      puffCount,
      nicotineType,
      flavor,
      country,
      strength,
      volume,
      vgpg,
      charging,
      powerAdj,
      battery,
      watts,
      resistance,
      supplier,
      tobacco,
      weight,
      coalType,
      packCount,
      color,
      display,
    } = req.query;
    const where = {};
    const minPriceParsed = Number.parseFloat(priceMin);
    const maxPriceParsed = Number.parseFloat(priceMax);
    if (category) where.category = category;
    const searchTokens = normalizeSearchTokens(search);
    if (searchTokens.length > 0) {
      // Smart search for MySQL: each token can match name/description/specs.
      // Avoid Prisma `mode: 'insensitive'` because it's not supported on MySQL.
      where.AND = searchTokens.map((token) => ({
        OR: [
          { name: { contains: token } },
          { shortDescription: { contains: token } },
          { fullDescription: { contains: token } },
          { description: { contains: token } },
          ...SEARCH_SPEC_FIELDS.map((field) => ({ [field]: { contains: token } })),
        ],
      }));
    }
    if (newOnly === 'true') where.showInNew = true;
    if (bestsellers === 'true') where.showInBestsellers = true;
    if (Number.isFinite(minPriceParsed)) where.price = { ...where.price, gte: minPriceParsed };
    if (Number.isFinite(maxPriceParsed)) where.price = { ...where.price, lte: maxPriceParsed };
    if (manufacturer) where.manufacturer = { in: manufacturer.split(',') };
    if (puffCount) where.puffCount = { in: puffCount.split(',').map(Number) };
    if (nicotineType) where.nicotineType = { in: nicotineType.split(',') };
    if (flavor) where.flavor = { in: flavor.split(',') };
    if (country) where.country = { in: country.split(',') };
    if (strength) where.strength = { in: strength.split(',').map(Number) };
    if (volume) where.volume = { in: volume.split(',').map(Number) };
    if (vgpg) where.vgpg = { in: vgpg.split(',') };
    if (charging) where.charging = { in: charging.split(',') };
    if (powerAdj) where.powerAdj = { in: powerAdj.split(',') };
    if (battery) where.battery = { in: battery.split(',').map(Number) };
    if (watts) where.watts = { in: watts.split(',') };
    if (resistance) where.resistance = { in: resistance.split(',') };
    if (supplier) where.supplier = { in: supplier.split(',') };
    if (tobacco) where.tobacco = { in: tobacco.split(',') };
    if (weight) where.weight = { in: weight.split(',') };
    if (coalType) where.coalType = { in: coalType.split(',') };
    if (packCount) where.packCount = { in: packCount.split(',') };
    if (color) where.color = { in: color.split(',') };
    if (display) where.display = { in: display.split(',') };
    let products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    if (searchTokens.length > 0) {
      const tokens = searchTokens;
      products = products
        .map((product) => ({ product, score: calculateSearchScore(product, tokens) }))
        .sort((a, b) => b.score - a.score || new Date(b.product.createdAt) - new Date(a.product.createdAt))
        .map((entry) => entry.product);
    }
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
