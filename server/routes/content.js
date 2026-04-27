import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

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

export default router;
