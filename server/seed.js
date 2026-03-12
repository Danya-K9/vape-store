import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRODUCTS = [
  { name: 'KLIK KLAK 4000 Киви', price: 40, category: 'disposables', badge: 'Новинка', image: 'https://images.unsplash.com/photo-1584735175097-719d848f8449?w=400', showInNew: true, showInBestsellers: true, manufacturer: 'KLIK KLAK', puffCount: 4000 },
  { name: 'KLIK KLAK 4000 Дыня', price: 40, category: 'disposables', badge: 'Новинка', image: 'https://images.unsplash.com/photo-1611131642167-5b2d7e9b1f5a?w=400', showInNew: true, manufacturer: 'KLIK KLAK', puffCount: 4000 },
  { name: 'PLONQ MAX S 8000 Солнечный заряд', price: 61, category: 'disposables', badge: 'Новинка', image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400', showInNew: true, manufacturer: 'PLONQ', puffCount: 8000 },
  { name: 'Vaporesso XROS 5 mini', price: 119, category: 'pod-systems', badge: 'Новинка', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400', showInNew: true, manufacturer: 'Vaporesso' },
  { name: 'Жидкость Tradewinds Tobacco NST Timeless 6 мг', price: 19, category: 'liquids', badge: 'Советуем', image: 'https://images.unsplash.com/photo-1566150960911-7c5e8d60b247?w=400', manufacturer: 'Tradewinds', strength: 6 },
  { name: 'Жидкость Zenith Salt Draco', price: 23.5, category: 'liquids', badge: 'Хит', image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400', showInBestsellers: true, manufacturer: 'Zenith' },
  { name: 'Паучи никотиновые Glitch EUCLPTS MNT MEDIUM', price: 21, category: 'pouches', badge: 'Советуем', image: 'https://media04.meinbezirk.at/article/2023/05/26/2/34446192_L.jpg?1685110858', manufacturer: 'Glitch' },
  { name: 'Жидкость', price: 25, category: 'liquids', badge: 'Новинка', image: 'https://static.wixstatic.com/media/669d4a_425250bd165449deaec057b3abe04037~mv2.jpg/v1/fill/w_280,h_260,al_c,q_80,enc_auto/ecigmx_004_portada.jpg', manufacturer: 'Tradewinds', strength: 6 },
];

async function main() {
  const adminHash = await bcrypt.hash('qwe123456', 10);
  await prisma.admin.upsert({
    where: { login: 'AdminDanik' },
    create: { login: 'AdminDanik', password: adminHash },
    update: { password: adminHash },
  });
  console.log('Admin created: AdminDanik / qwe123456');

  const storeCount = await prisma.store.count();
  const storeData = {
    address: 'г. Орша, ул. Ленина, 17',
    hours: 'Понедельник ~ пятница: с 10:00 до 20:00\nСуббота: с 10:00 до 19:00\nВоскресенье: Выходной',
    phone: '+375 (44) 599-84-94',
    image: 'https://images.pexels.com/photos/14279339/pexels-photo-14279339.jpeg?auto=compress&w=600',
  };
  if (storeCount === 0) {
    await prisma.store.create({ data: storeData });
  } else {
    const store = await prisma.store.findFirst({ where: { address: storeData.address } })
      || await prisma.store.findFirst({ where: { address: 'г. Орша, ул. Советская, 2В' } });
    if (store) {
      await prisma.store.update({ where: { id: store.id }, data: storeData });
      console.log('Store updated');
    }
  }
  console.log('Store ready');

  const existing = await prisma.product.count();
  if (existing === 0) {
    for (const p of PRODUCTS) {
      await prisma.product.create({ data: p });
    }
    console.log(`Products created: ${PRODUCTS.length}`);
  } else {
    console.log(`Products already exist: ${existing}`);
  }

  console.log('Seed done');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
