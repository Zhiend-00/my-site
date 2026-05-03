import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashExistingPasswords() {
  console.log('🔄 Проверяем пароли пользователей...');
  const users = await prisma.user.findMany();
  let updated = 0;

  for (const user of users) {
    // Если пароль не начинается с $2a$ — значит он не хеширован
    if (!user.password.startsWith('$2a$')) {
      const hashed = await bcrypt.hash(user.password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
      });
      console.log(`✅ Обновлён пароль для ${user.email} (был "${user.password}")`);
      updated++;
    } else {
      console.log(`⏩ Пропущен ${user.email} (уже хеширован)`);
    }
  }

  console.log(`🎉 Готово! Обновлено пользователей: ${updated}`);
  await prisma.$disconnect();
}

hashExistingPasswords().catch(e => {
  console.error('❌ Ошибка:', e);
  prisma.$disconnect();
  process.exit(1);
});