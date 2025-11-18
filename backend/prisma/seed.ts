import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '../generated/prisma/client';
const ITEMS_COUNT = 50000;

const prisma = new PrismaClient();
async function main() {
  console.log('Начало заполнения базы данных...');

  await prisma.item.deleteMany();
  console.log('Существующие записи удалены.');

  let name = (i) => `${i}-item`;
  try {
    const itemNamePath = path.join(__dirname, './itemName.txt');
    const data = await readFile(itemNamePath, { encoding: 'utf8' });
    name = (i) => `${i}-${data}`;
  } catch (error) {
    console.error(error);
  }
  for (let i = 0; i < ITEMS_COUNT; i++) {
    await prisma.item.create({
      data: {
        name: name(i),
        created_at: new Date(),
      },
    });
  }

  console.log(`Создано ${ITEMS_COUNT} записей Item.`);
  console.log('Заполнение базы данных завершено.');
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
