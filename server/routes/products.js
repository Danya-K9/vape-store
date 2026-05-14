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

const pushAnd = (where, clause) => {
  if (!clause) return;
  if (!Array.isArray(where.AND)) where.AND = [];
  where.AND.push(clause);
};

const stringContainsAnyOr = (field, csv) => {
  const vals = String(csv || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!vals.length) return null;
  return { OR: vals.map((v) => ({ [field]: { contains: v } })) };
};

const buildTokenSearchConditions = (token) => {
  const conditions = [
    { name: { contains: token } },
    { shortDescription: { contains: token } },
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
  const flavor = String(product.flavor ?? '').toLowerCase();
  const specs = SEARCH_SPEC_FIELDS
    .map((field) => String(product[field] ?? '').toLowerCase())
    .join(' ');
  let score = 0;
  tokens.forEach((token) => {
    if (name.includes(token)) score += 6;
    if (flavor.includes(token)) score += 8;
    if (shortDescription.includes(token)) score += 4;
    if (fullDescription.includes(token)) score += 1;
    if (specs.includes(token)) score += 2;
  });
  return score;
};

/** Текстовые поля, по которым разумно искать слова (без «левых» совпадений в числовых/служебных полях). */
const PRIMARY_SEARCH_TEXT_FIELDS = [
  'name',
  'flavor',
  'shortDescription',
  'manufacturer',
  'color',
  'display',
  'country',
  'nicotineType',
  'charging',
  'powerAdj',
  'vgpg',
  'resistance',
  'watts',
];

function buildPrimarySearchBlob(p) {
  return PRIMARY_SEARCH_TEXT_FIELDS.map((f) => String(p[f] ?? '').toLowerCase()).join('\n');
}

/** Токен целиком в «человеческих» полях или точное совпадение числа (ёмкость, крепость и т.д.). */
function productMatchesSearchToken(p, token) {
  const t = String(token || '').toLowerCase().trim();
  if (!t) return true;
  const blob = buildPrimarySearchBlob(p);
  if (blob.includes(t)) return true;
  if (/^\d+$/.test(t)) {
    const n = Number.parseInt(t, 10);
    const fields = [p.puffCount, p.strength, p.volume, p.battery];
    return fields.some((v) => v != null && Number(v) === n);
  }
  return false;
}

function filterProductsBySearchTokens(products, tokens) {
  if (!tokens.length) return products;
  return products.filter((p) => tokens.every((tok) => productMatchesSearchToken(p, tok)));
}

function applyProductFilters(where, q) {
  const {
    category,
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
  } = q;

  const minPriceParsed = Number.parseFloat(priceMin);
  const maxPriceParsed = Number.parseFloat(priceMax);
  if (newOnly === 'true') where.showInNew = true;
  if (bestsellers === 'true') where.showInBestsellers = true;
  if (Number.isFinite(minPriceParsed)) where.price = { ...where.price, gte: minPriceParsed };
  if (Number.isFinite(maxPriceParsed)) where.price = { ...where.price, lte: maxPriceParsed };
  if (manufacturer) where.manufacturer = { in: manufacturer.split(',') };
  if (puffCount) where.puffCount = { in: puffCount.split(',').map(Number) };
  if (nicotineType) where.nicotineType = { in: nicotineType.split(',') };
  if (flavor) pushAnd(where, stringContainsAnyOr('flavor', flavor));
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
  if (color) {
    const vals = String(color)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (vals.length) {
      if (category === 'pod-systems' || category === 'disposables') {
        pushAnd(where, {
          OR: vals.map((v) => ({
            OR: [
              { color: { contains: v } },
              { name: { contains: v } },
            ],
          })),
        });
      } else {
        pushAnd(where, stringContainsAnyOr('color', color));
      }
    }
  }
  if (display) {
    const vals = String(display)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (vals.length) {
      if (category === 'pod-systems' || category === 'disposables') {
        pushAnd(where, {
          OR: vals.map((v) => ({
            OR: [
              { display: { contains: v } },
              { name: { contains: v } },
            ],
          })),
        });
      } else {
        pushAnd(where, stringContainsAnyOr('display', display));
      }
    }
  }
}

let supportsStockFields = true;

router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
    } = req.query;

    const where = supportsStockFields
      ? { isActive: true, OR: [{ stock: null }, { stock: { gt: 0 } }] }
      : {};
    if (category) where.category = category;
    const searchTokens = normalizeSearchTokens(search);
    if (searchTokens.length > 0) {
      const existingAnd = Array.isArray(where.AND) ? where.AND : [];
      where.AND = [
        ...existingAnd,
        ...searchTokens.map((token) => ({
          OR: buildTokenSearchConditions(token),
        })),
      ];
    }
    applyProductFilters(where, req.query);

    let products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    if (searchTokens.length > 0) {
      products = filterProductsBySearchTokens(products, searchTokens);
      products = products
        .map((product) => ({ product, score: calculateSearchScore(product, searchTokens) }))
        .sort((a, b) => b.score - a.score || new Date(b.product.createdAt) - new Date(a.product.createdAt))
        .map((entry) => entry.product);
    }
    res.json(products);
  } catch (e) {
    if (supportsStockFields && String(e?.message || '').includes('Unknown argument `isActive`')) {
      supportsStockFields = false;
      try {
        const { category, search } = req.query;
        const fallbackWhere = {};
        if (category) fallbackWhere.category = category;
        const searchTokens = normalizeSearchTokens(search);
        if (searchTokens.length > 0) {
          fallbackWhere.AND = searchTokens.map((token) => ({ OR: buildTokenSearchConditions(token) }));
        }
        applyProductFilters(fallbackWhere, req.query);

        let products = await prisma.product.findMany({ where: fallbackWhere, orderBy: { createdAt: 'desc' } });
        if (searchTokens.length > 0) {
          products = filterProductsBySearchTokens(products, searchTokens);
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
