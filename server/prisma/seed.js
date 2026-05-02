import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Заполняю базу начальными данными...');

  // Создаём админа (замени email/пароль на свои, если хочешь)
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'admin' },
    create: {
      email: adminEmail,
      password: hashedPassword,
      username: 'Администратор',
      role: 'admin',
      emailVerified: true,
    },
  });
  console.log('✅ Админ создан:', adminEmail, ' / пароль:', adminPassword);

  // Создаём категории форума
  const categories = [
    { name: 'Обсуждения', slug: 'discussions', icon: '💬', order: 1 },
    { name: 'Предложения', slug: 'suggestions', icon: '💡', order: 2 },
  ];

  for (const cat of categories) {
    await prisma.forumCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Категории форума созданы');

  // Создаём тестовую мангу
  await prisma.manga.upsert({
    where: { id: 1n },
    update: {},
    create: {
      id: 1n,
      title: 'Тестовая манга',
      description: 'Это тестовая манга для демонстрации работы сайта.',
      author: 'Автор',
      status: 'ongoing',
      year: 2026,
      genres: ['приключения', 'фэнтези'],
      cover_image: '/uploads/covers/default.png',
    },
  });
  console.log('✅ Тестовая манга добавлена');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка наполнения базы:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });