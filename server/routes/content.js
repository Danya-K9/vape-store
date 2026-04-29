import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();
const REVIEWS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_YANDEX_ORG_ID = '221337875525';

const fallbackYandexReviews = [
  {
    id: 'y-fb-1',
    name: 'Даниил Купчин',
    text: 'Очень приятные цены, не как в других вейп шопах',
    rating: 5,
    date: '18 апреля',
    source: 'yandex',
  },
  {
    id: 'y-fb-2',
    name: 'Денис Кирячек',
    text: 'Побывав в данном вейп-шопе, я подчеркнул для себя несколько приятных особенностей: доступные цены и большой ассортимент, шикарный интерьер, приятный аромат и атмосферная музыка, индивидуальный подход к каждому клиенту. Помогут подобрать любой товар с учетом предпочтений. Одним словом: рекомендую!',
    rating: 5,
    date: '26 апреля',
    source: 'yandex',
  },
  {
    id: 'y-fb-3',
    name: 'Виктория Держинская',
    text: 'Сделали все с душой, персонал приветливый, если надо то посоветуют, и если есть вопросы, то рассказывают и объясняют. Молодцы!',
    rating: 5,
    date: '26 апреля',
    source: 'yandex',
  },
  {
    id: 'y-fb-4',
    name: 'Вадим Майсаков',
    text: 'Хорошое заведение. Большое ассортимент, посоветует и подскажет на свой вкус. Рекомендую.',
    rating: 5,
    date: '26 апреля',
    source: 'yandex',
  },
  {
    id: 'y-fb-5',
    name: 'Анастасия Сидоренко',
    text: 'Покупала на подарок, все рассказали, подсказали, сделали по красоте. Рекомендую.',
    rating: 5,
    date: '26 апреля',
    source: 'yandex',
  },
  {
    id: 'y-fb-6',
    name: 'Катя Гриценя',
    text: 'Вежливый и приятный персонал, всегда подскажет и подберет самое лучшее для тебя.',
    rating: 5,
    date: '22 апреля',
    source: 'yandex',
  },
  {
    id: 'y-fb-7',
    name: 'Карина',
    text: 'Замечательное заведение, все на высшем уровне. Приятные цены и вежливые продавцы.',
    rating: 5,
    date: '26 апреля',
    source: 'yandex',
  },
];

let reviewsCache = {
  expiresAt: 0,
  reviews: fallbackYandexReviews,
};

async function fetchYandexReviews() {
  const apiKey = String(process.env.YANDEX_API_KEY || '').trim();
  const orgId = String(process.env.YANDEX_ORG_ID || DEFAULT_YANDEX_ORG_ID).trim();
  if (!apiKey || !orgId) return fallbackYandexReviews;

  // Best-effort request to Organization Search API.
  // If Yandex returns without reviews field, fallback is used.
  const url = `https://search-maps.yandex.ru/v1/?lang=ru_RU&type=biz&results=1&oid=${encodeURIComponent(orgId)}&apikey=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Yandex API error: ${response.status}`);
  const data = await response.json();
  const company = data?.features?.[0]?.properties?.CompanyMetaData;
  const reviews = company?.Reviews || company?.reviews || [];
  if (!Array.isArray(reviews) || reviews.length === 0) return fallbackYandexReviews;

  return reviews.slice(0, 10).map((r, idx) => ({
    id: String(r.id || `y-${idx}`),
    name: String(r.author || r.authorName || 'Покупатель'),
    text: String(r.text || r.pro || r.comment || '').trim() || 'Без текста',
    rating: Math.max(1, Math.min(5, Number.parseInt(r.rating, 10) || 5)),
    date: String(r.date || r.time || ''),
    source: 'yandex',
  }));
}

const fallbackCategories = [
  { slug: 'liquids', name: 'Жидкости для электронных парогенераторов' },
  { slug: 'disposables', name: 'Одноразовые/многоразовые парогенераторы' },
  { slug: 'pod-systems', name: 'Электронные парогенераторы' },
  { slug: 'pouches', name: 'Никотиновые паучи' },
  { slug: 'hookah-mix', name: 'Смесь для кальянов' },
  { slug: 'hookah-coals', name: 'Угли для кальянов' },
  { slug: 'accessories', name: 'Комплектующие' },
];

router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    if (categories.length > 0) return res.json(categories);
    res.json(fallbackCategories.map((c, index) => ({ ...c, id: c.slug, sortOrder: index })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/blog-posts', async (req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    if (req.query.homeOnly === 'true') {
      return res.json(posts.filter((p) => p.showOnHome));
    }
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/hero-banners', async (req, res) => {
  try {
    const banners = await prisma.heroBanner.findMany({ orderBy: [{ zone: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }] });
    res.json(banners);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/partners', async (req, res) => {
  try {
    const partners = await prisma.partner.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    if (partners.length > 0) return res.json(partners);
    res.json([
      {
        id: 'demo-partner',
        name: 'VapeLab Distribution',
        description: 'Надежный партнер по поставкам оригинальных устройств и жидкостей.',
        website: 'https://example.com',
        image: '/logo.png?v=6',
        sortOrder: 0,
      },
    ]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/faq', async (req, res) => {
  try {
    const items = await prisma.faqItem.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    if (items.length > 0) return res.json(items);
    res.json([
      {
        id: 'demo-faq-1',
        question: 'Как выбрать первую POD-систему?',
        answer: 'Выбирайте устройство с простой заправкой и средней мощностью. В наших магазинах подскажем вариант под ваш бюджет.',
        sortOrder: 0,
      },
      {
        id: 'demo-faq-2',
        question: 'Есть ли гарантия на устройства?',
        answer: 'Да, на весь официальный товар действует гарантия. Сохраняйте чек и обращайтесь в наш магазин.',
        sortOrder: 1,
      },
    ]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/license-docs', async (req, res) => {
  try {
    const docs = await prisma.licenseDocument.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    if (docs.length > 0) return res.json(docs);
    res.json([
      { id: 'demo-doc-1', title: 'Лицензия (демо)', fileUrl: '/docs/license-demo-1.pdf', sortOrder: 0 },
      { id: 'demo-doc-2', title: 'Сертификат соответствия (демо)', fileUrl: '/docs/license-demo-2.pdf', sortOrder: 1 },
    ]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/yandex-reviews', async (req, res) => {
  try {
    const now = Date.now();
    if (reviewsCache.expiresAt > now && Array.isArray(reviewsCache.reviews) && reviewsCache.reviews.length > 0) {
      return res.json(reviewsCache.reviews);
    }

    const reviews = await fetchYandexReviews().catch(() => fallbackYandexReviews);
    reviewsCache = {
      reviews: Array.isArray(reviews) && reviews.length > 0 ? reviews : fallbackYandexReviews,
      expiresAt: now + REVIEWS_CACHE_TTL_MS,
    };
    res.json(reviewsCache.reviews);
  } catch (e) {
    res.json(fallbackYandexReviews);
  }
});

export default router;
