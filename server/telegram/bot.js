import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '../lib/prisma.js';
import { decrementStockForOrderInTx } from '../lib/orderStock.js';

let bot = null;
const ADMIN_TELEGRAM_ID = '7004487732';
const ORDER_ACTION_RE = /^(order_confirm|order_cancel):(.+)$/;

export function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN не задан, бот не запущен');
    return;
  }
  bot = new TelegramBot(token, { polling: true });

  bot.on('polling_error', (err) => {
    if (err?.code === 'ETELEGRAM' && String(err.message || '').includes('409')) {
      console.warn('Telegram polling 409 conflict (another getUpdates in progress), ignoring.');
      return;
    }
    console.error('Telegram polling error:', err);
  });

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, 'Бот "Облако пара" работает в режиме уведомлений. Сюда приходят новые бронирования и сообщения директору.');
  });

  bot.on('callback_query', async (q) => {
    try {
      const fromChatId = String(q?.message?.chat?.id ?? '');
      if (!fromChatId || fromChatId !== String(ADMIN_TELEGRAM_ID)) {
        await bot.answerCallbackQuery(q.id, { text: 'Недостаточно прав', show_alert: true });
        return;
      }

      const data = String(q?.data ?? '');
      const match = data.match(ORDER_ACTION_RE);
      if (!match) {
        await bot.answerCallbackQuery(q.id);
        return;
      }
      const action = match[1]; // order_confirm | order_cancel
      const orderId = match[2];

      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { store: true, items: { include: { product: true } } },
        });
        if (!order) return { ok: false, code: 'not_found' };
        if (order.status !== 'pending') return { ok: false, code: 'already_processed', status: order.status };

        if (action === 'order_confirm') {
          const dec = await decrementStockForOrderInTx(tx, order);
          if (!dec.ok) return dec;
        }

        const status = action === 'order_confirm' ? 'confirmed' : 'cancelled';
        const updated = await tx.order.update({ where: { id: orderId }, data: { status } });
        return { ok: true, status: updated.status, shortId: String(updated.id).slice(0, 8) };
      });

      if (!result.ok) {
        const msg = result.code === 'out_of_stock'
          ? `Нет остатков: ${result.productName} (нужно ${result.need}, есть ${result.have})`
          : result.code === 'already_processed'
            ? `Заказ уже обработан: ${result.status}`
            : 'Заказ не найден';
        await bot.answerCallbackQuery(q.id, { text: msg, show_alert: true });
        return;
      }

      await bot.answerCallbackQuery(q.id, { text: result.status === 'confirmed' ? 'Подтверждено' : 'Отменено' });
      if (q?.message?.chat?.id && q?.message?.message_id) {
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
          chat_id: q.message.chat.id,
          message_id: q.message.message_id,
        });
      }
    } catch (e) {
      console.error('Telegram callback error:', e?.message || e);
      try { await bot.answerCallbackQuery(q.id, { text: 'Ошибка обработки', show_alert: true }); } catch (_) {}
    }
  });

  console.log('Telegram bot started');
}

export async function sendTelegramDirectorMessage(data) {
  if (!bot || !ADMIN_TELEGRAM_ID) return;
  const lines = [
    '📬 Сообщение для директора',
    '',
    `👤 Имя: ${data.name}`,
    `📧 Email: ${data.email}`,
    `📱 Телефон: ${data.phone || '—'}`,
    '',
    `💬 Сообщение:\n${data.message}`,
  ];
  try {
    await bot.sendMessage(ADMIN_TELEGRAM_ID, lines.join('\n'));
    if (data.fileBuffer && data.fileName) {
      await bot.sendDocument(ADMIN_TELEGRAM_ID, data.fileBuffer, {
        caption: `Файл: ${data.fileName}`,
        filename: data.fileName,
      });
    }
  } catch (e) {
    console.error('Telegram director message error:', e.message);
  }
}

export async function sendTelegramOrderNotification(order) {
  if (!bot || !ADMIN_TELEGRAM_ID) return;
  const pickup = order.pickupDate ? new Date(order.pickupDate).toLocaleDateString('ru') : '—';
  const customerLine = order.customerName || order.customerPhone
    ? `${order.customerName || ''} ${order.customerPhone || ''}`.trim()
    : (order.user?.login || order.userId || '—');
  const lines = [
    '🛒 Новое бронирование!',
    `Клиент: ${customerLine}`,
    `Магазин: ${order.store?.address || order.storeId}`,
    `Дата получения: ${pickup}`,
    `Оплата: ${order.paymentMethod === 'cash' ? 'Наличные' : order.paymentMethod === 'qr' ? 'QR-код' : 'Карта'}`,
    `Сумма: ${order.total} BYN`,
    '',
    'Товары:',
    ...order.items.map((i) => `• ${i.product?.name || i.productId} x${i.quantity} — ${i.price * i.quantity} BYN`),
  ];
  try {
    await bot.sendMessage(ADMIN_TELEGRAM_ID, lines.join('\n'), {
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Подтвердить', callback_data: `order_confirm:${order.id}` },
          { text: '❌ Отменить', callback_data: `order_cancel:${order.id}` },
        ]],
      },
    });
  } catch (e) {
    console.error('Telegram notification error:', e.message);
  }
}

export async function sendTelegramOrderStatusToUser(telegramId, orderId, status) {
  if (!bot || !telegramId) return;
  const shortId = String(orderId || '').slice(0, 8);
  const msg = status === 'confirmed'
    ? `✅ Ваше бронирование подтверждено! Заказ: ${shortId}...`
    : `❌ Ваше бронирование отменено. Заказ: ${shortId}...`;
  try {
    await bot.sendMessage(String(telegramId), msg);
  } catch (e) {
    console.error('Telegram user notification error:', e.message);
  }
}

export { bot };
