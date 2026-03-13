import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto';

let bot = null;
const userState = new Map(); // chatId -> { step, login, password }
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
/** Telegram требует HTTPS для inline keyboard URL. При HTTP отправляем URL отдельной строкой — Telegram обычно делает его кликабельным. */
const canUseInlineUrl = (url) => url && url.startsWith('https://');
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
    const keyboard = {
      inline_keyboard: [
        [{ text: '📝 Регистрация', callback_data: 'register' }],
        [{ text: '🔐 Вход', callback_data: 'login' }],
      ],
    };
    await bot.sendMessage(
      chatId,
      'Привет! Я бот «Облако пара».\n\nПродолжите авторизацию — выберите действие:',
      { reply_markup: keyboard }
    );
  });

  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    await bot.answerCallbackQuery(query.id);

    if (data === 'register') {
      userState.set(chatId, { step: 'reg_login' });
      await bot.sendMessage(chatId, 'Введите логин для регистрации:');
      return;
    }
    if (data === 'login') {
      const { prisma } = await import('../lib/prisma.js');
      const user = await prisma.user.findFirst({
        where: { telegram: String(chatId) },
      });
      if (user) {
        const loginLink = `${FRONTEND_URL}/login?login=${encodeURIComponent(user.login)}`;
        const opts = canUseInlineUrl(loginLink)
          ? { reply_markup: { inline_keyboard: [[{ text: 'Войти на сайт', url: loginLink }]] } }
          : {};
        const msg = canUseInlineUrl(loginLink)
          ? 'Переход на сайт для входа. Логин уже подставлен — введите только пароль.\n\nНажмите кнопку ниже.'
          : `Переход на сайт для входа. Логин уже подставлен — введите только пароль.\n\n${loginLink}`;
        await bot.sendMessage(chatId, msg, opts);
      } else {
        userState.set(chatId, { step: 'login_login' });
        await bot.sendMessage(chatId, 'Введите логин (Telegram не привязан к аккаунту):');
      }
      return;
    }
  });

  bot.on('message', async (msg) => {
    const text = (msg.text || '').trim();
    const chatId = msg.chat.id;
    if (text.startsWith('/')) return;

    const state = userState.get(chatId);
    if (!state) return;

    try {
      const bcrypt = (await import('bcryptjs')).default;
      const { prisma } = await import('../lib/prisma.js');
      const jwt = (await import('jsonwebtoken')).default;

      if (state.step === 'reg_login') {
        const login = text;
        const exists = await prisma.user.findUnique({ where: { login } });
        if (exists) {
          await bot.sendMessage(chatId, 'Этот логин уже занят. Введите другой:');
          return;
        }
        const code = crypto.randomInt(100000, 999999).toString();
        await prisma.authCode.create({
          data: {
            code,
            type: 'register',
            login,
            telegramId: String(chatId),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          },
        });
        userState.delete(chatId);
        const regLink = `${FRONTEND_URL}/register?code=${code}&login=${encodeURIComponent(login)}`;
        await bot.sendMessage(
          chatId,
          `Ваш код подтверждения: ${code}\n\nВведите этот код и пароль на сайте:\n\n${regLink}`,
          {}
        );
        return;
      }

      if (state.step === 'login_login') {
        const login = text;
        const loginLink = `${FRONTEND_URL}/login?login=${encodeURIComponent(login)}`;
        userState.delete(chatId);
        const opts = canUseInlineUrl(loginLink)
          ? { reply_markup: { inline_keyboard: [[{ text: 'Войти на сайт', url: loginLink }]] } }
          : {};
        const msg = canUseInlineUrl(loginLink)
          ? 'Переход на сайт для входа. Введите пароль на сайте.\n\nНажмите кнопку ниже.'
          : `Переход на сайт для входа. Введите пароль на сайте.\n\n${loginLink}`;
        await bot.sendMessage(chatId, msg, opts);
        return;
      }

      if (state.step === 'login_password') {
        const { login } = state;
        const password = text;
        const user = await prisma.user.findUnique({ where: { login } });
        if (!user) {
          userState.delete(chatId);
          await bot.sendMessage(chatId, 'Неверный логин или пароль.');
          return;
        }
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
          userState.delete(chatId);
          await bot.sendMessage(chatId, 'Неверный логин или пароль.');
          return;
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { telegram: String(chatId) },
        });
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        const authLink = `${FRONTEND_URL}/auth/callback?token=${token}`;
        userState.delete(chatId);
        const opts = canUseInlineUrl(authLink)
          ? { reply_markup: { inline_keyboard: [[{ text: 'Войти на сайт', url: authLink }]] } }
          : {};
        const authMsg = canUseInlineUrl(authLink)
          ? 'Вход выполнен! Нажмите кнопку ниже для перехода на сайт.'
          : `Вход выполнен! Перейдите по ссылке:\n\n${authLink}`;
        await bot.sendMessage(chatId, authMsg, opts);
        return;
      }

      if (state.step === 'changepass_login') {
        const login = text;
        const user = await prisma.user.findFirst({
          where: { login, telegram: String(chatId) },
        });
        if (!user) {
          userState.delete(chatId);
          await bot.sendMessage(chatId, 'Пользователь не найден или Telegram не привязан.');
          return;
        }
        const code = crypto.randomInt(100000, 999999).toString();
        await prisma.authCode.create({
          data: {
            code,
            type: 'password',
            login,
            telegramId: String(chatId),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          },
        });
        userState.delete(chatId);
        const changeLink = `${FRONTEND_URL}/profile?changepass=1&code=${code}&login=${encodeURIComponent(login)}`;
        await bot.sendMessage(
          chatId,
          `Ваш код для смены пароля: ${code}\n\nВведите код и новый пароль на сайте:\n\n${changeLink}`,
          {}
        );
      }
    } catch (e) {
      userState.delete(chatId);
      await bot.sendMessage(chatId, 'Ошибка: ' + e.message);
    }
  });

  bot.onText(/\/changepass/, async (msg) => {
    const chatId = msg.chat.id;
    userState.set(chatId, { step: 'changepass_login' });
    await bot.sendMessage(chatId, 'Введите логин для смены пароля:');
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
    '🛒 Новая бронь!',
    `Клиент: ${customerLine}`,
    `Магазин: ${order.store?.address || order.storeId}`,
    `Дата получения: ${pickup}`,
    `Оплата: ${order.paymentMethod === 'cash' ? 'Наличные' : 'Карта'}`,
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
    ? `✅ Ваша бронь подтверждена! Заказ: ${shortId}...`
    : `❌ Ваша бронь отменена. Заказ: ${shortId}...`;
  try {
    await bot.sendMessage(String(telegramId), msg);
  } catch (e) {
    console.error('Telegram user notification error:', e.message);
  }
}

export { bot };
