/**
 * Удаляет все брони (Order + OrderItem). Товары, FAQ, партнёры и прочий контент не трогает.
 * Аналитика в админке строится из подтверждённых заказов — после очистки будет пусто.
 *
 * Запуск на сервере из папки server:
 *   node scripts/clear-orders.js
 *
 * Только посмотреть количество (без удаления):
 *   node scripts/clear-orders.js --dry-run
 */
import 'dotenv/config';
import { prisma } from '../lib/prisma.js';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  const orderCount = await prisma.order.count();
  const itemCount = await prisma.orderItem.count();

  console.log(`Заказов (броней): ${orderCount}`);
  console.log(`Позиций в заказах: ${itemCount}`);
  console.log('Товары (Product) не изменяются.');

  if (dryRun) {
    console.log('\nРежим --dry-run: удаление не выполнялось.');
    return;
  }

  if (orderCount === 0) {
    console.log('\nУдалять нечего.');
    return;
  }

  await prisma.orderItem.deleteMany({});
  const deleted = await prisma.order.deleteMany({});
  console.log(`\nУдалено заказов: ${deleted.count}`);
  console.log('Позиции OrderItem удалены каскадом вместе с заказами.');
  console.log(
    '\nВнимание: если тестовые брони были подтверждены или проданы через кассу, остатки (stock) уже списаны.',
    'Проверьте остатки товаров в админке и при необходимости поправьте вручную.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
