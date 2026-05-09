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
const NUMERIC_SEARCH_FIELDS = new Set(['puffCount', 'strength', 'volume', 'battery']);

const normalizeSearchTokens = (searchValue) => String(searchValue || '')
  .toLowerCase()
  .split(/\s+/)
  .map((token) => token.trim())
  .filter(Boolean);

const buildTokenSearchConditions = (token) => {
  const conditions = [
    { name: { contains: token } },
    { shortDescription: { contains: token } },
    { fullDescription: { contains: token } },
    { description: { contains: token } },
  ];
  SEARCH_SPEC_FIELDS.forEach((field) => {
    if (NUMERIC_SEARCH_FIELDS.has(field)) {
      const parsed = Number.parseInt(token, 10);
      if (Number.isFinite(parsed)) conditions.push({ [field]: parsed });
      return;
    }
    conditions.push({ [field]: { contains: token } });
  });
  return conditions;
};

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

let supportsStockFields = true;

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
    const where = supportsStockFields
      ? { isActive: true, OR: [{ stock: null }, { stock: { gt: 0 } }] }
      : {};
    const minPriceParsed = Number.parseFloat(priceMin);
    const maxPriceParsed = Number.parseFloat(priceMax);
    if (category) where.category = category;
    const searchTokens = normalizeSearchTokens(search);
    if (searchTokens.length > 0) {
      // Smart search for MySQL: each token can match name/description/specs.
      // Avoid Prisma `mode: 'insensitive'` because it's not supported on MySQL.
      const existingAnd = Array.isArray(where.AND) ? where.AND : [];
      where.AND = [
        ...existingAnd,
        ...searchTokens.map((token) => ({
          OR: buildTokenSearchConditions(token),
        })),
      ];
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
    // Fallback for environments with stale Prisma client before `prisma generate`.
    if (supportsStockFields && String(e?.message || '').includes('Unknown argument `isActive`')) {
      supportsStockFields = false;
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
        const fallbackWhere = {};
        const minPriceParsed = Number.parseFloat(priceMin);
        const maxPriceParsed = Number.parseFloat(priceMax);
        if (category) fallbackWhere.category = category;
        const searchTokens = normalizeSearchTokens(search);
        if (searchTokens.length > 0) {
          fallbackWhere.AND = searchTokens.map((token) => ({ OR: buildTokenSearchConditions(token) }));
        }
        if (newOnly === 'true') fallbackWhere.showInNew = true;
        if (bestsellers === 'true') fallbackWhere.showInBestsellers = true;
        if (Number.isFinite(minPriceParsed)) fallbackWhere.price = { ...fallbackWhere.price, gte: minPriceParsed };
        if (Number.isFinite(maxPriceParsed)) fallbackWhere.price = { ...fallbackWhere.price, lte: maxPriceParsed };
        if (manufacturer) fallbackWhere.manufacturer = { in: manufacturer.split(',') };
        if (puffCount) fallbackWhere.puffCount = { in: puffCount.split(',').map(Number) };
        if (nicotineType) fallbackWhere.nicotineType = { in: nicotineType.split(',') };
        if (flavor) fallbackWhere.flavor = { in: flavor.split(',') };
        if (country) fallbackWhere.country = { in: country.split(',') };
        if (strength) fallbackWhere.strength = { in: strength.split(',').map(Number) };
        if (volume) fallbackWhere.volume = { in: volume.split(',').map(Number) };
        if (vgpg) fallbackWhere.vgpg = { in: vgpg.split(',') };
        if (charging) fallbackWhere.charging = { in: charging.split(',') };
        if (powerAdj) fallbackWhere.powerAdj = { in: powerAdj.split(',') };
        if (battery) fallbackWhere.battery = { in: battery.split(',').map(Number) };
        if (watts) fallbackWhere.watts = { in: watts.split(',') };
        if (resistance) fallbackWhere.resistance = { in: resistance.split(',') };
        if (supplier) fallbackWhere.supplier = { in: supplier.split(',') };
        if (tobacco) fallbackWhere.tobacco = { in: tobacco.split(',') };
        if (weight) fallbackWhere.weight = { in: weight.split(',') };
        if (coalType) fallbackWhere.coalType = { in: coalType.split(',') };
        if (packCount) fallbackWhere.packCount = { in: packCount.split(',') };
        if (color) fallbackWhere.color = { in: color.split(',') };
        if (display) fallbackWhere.display = { in: display.split(',') };
        let products = await prisma.product.findMany({ where: fallbackWhere, orderBy: { createdAt: 'desc' } });
        if (searchTokens.length > 0) {
          products = products
            .map((product) => ({ product, score: calculateSearchScore(product, searchTokens) }))
            .sort((a, b) => b.score - a.score || new Date(b.product.createdAt) - new Date(a.product.createdAt))
            .map((entry) => entry.product);
        }
        res.json(products);
        return;
      } catch (fallbackError) {
        res.status(500).json({ error: fallbackError.message });
        return;
      }
    }
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    if (supportsStockFields && (product.isActive === false || (product.stock != null && product.stock <= 0))) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json(product);
  } catch (e) {
    if (supportsStockFields && String(e?.message || '').includes('Unknown argument `isActive`')) {
      supportsStockFields = false;
      try {
        const product = await prisma.product.findUnique({ where: { id: req.params.id } });
        if (!product) return res.status(404).json({ error: 'Товар не найден' });
        return res.json(product);
      } catch (fallbackError) {
        return res.status(500).json({ error: fallbackError.message });
      }
    }
    res.status(500).json({ error: e.message });
  }
});

export default router;
