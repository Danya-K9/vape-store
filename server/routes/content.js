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

export default router;
