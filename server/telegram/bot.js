import TelegramBot from 'node-telegram-bot-api';

let bot = null;
const ADMIN_TELEGRAM_ID = '7004487732';

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
    await bot.sendMessage(ADMIN_TELEGRAM_ID, lines.join('\n'));
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
