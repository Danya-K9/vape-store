import { Router } from 'express';
import { authUser } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { sendTelegramOrderNotification } from '../telegram/bot.js';

const router = Router();

// История заказов по-прежнему доступна только авторизованным пользователям
router.get('/', authUser, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { store: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Создание брони теперь доступно без авторизации
router.post('/', async (req, res) => {
  try {
    const { storeId, paymentMethod, pickupDate, items, customerName, customerPhone } = req.body;
    if (!storeId || !paymentMethod || !items?.length) {
      return res.status(400).json({ error: 'Укажите магазин, способ оплаты и товары' });
    }
    if (!customerName || !customerPhone) {
      return res.status(400).json({ error: 'Укажите имя и телефон' });
    }
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const priceMap = Object.fromEntries(products.map((p) => [p.id, p.price]));
    let total = 0;
    const orderItems = items.map((i) => {
      const price = priceMap[i.productId] || 0;
      total += price * (i.quantity || 1);
      return {
        productId: i.productId,
        quantity: i.quantity || 1,
        price,
      };
    });
    const order = await prisma.order.create({
      data: {
        userId: null,
        storeId,
        paymentMethod,
        total,
        pickupDate: pickupDate ? new Date(pickupDate) : null,
        status: 'pending',
        customerName: String(customerName).trim(),
        customerPhone: String(customerPhone).trim(),
        items: { create: orderItems },
      },
      include: { store: true, items: { include: { product: true } }, user: true },
    });
    await sendTelegramOrderNotification(order);
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
