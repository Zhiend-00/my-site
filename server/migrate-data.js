// server/migrate-data.js
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function migrate() {
  console.log('🔄 Начинаем миграцию данных из db.json...');
  
  const dbPath = path.join(__dirname, 'db.json');
  if (!fs.existsSync(dbPath)) {
    console.error('❌ db.json не найден!');
    return;
  }

  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // 1. Пользователи
  if (db.users && db.users.length) {
    for (const user of db.users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          username: user.username,
          email: user.email,
          password: hashedPassword,
          role: user.role || 'user',
          avatar: user.avatar || '/uploads/avatars/default.png',
          createdAt: user.created_at ? new Date(user.created_at) : undefined,
        },
      });
    }
    console.log(`✅ Перенесено пользователей: ${db.users.length}`);
  }

  // 2. Манга
  if (db.manga && db.manga.length) {
    for (const m of db.manga) {
      await prisma.manga.upsert({
        where: { id: BigInt(m.id) },
        update: {},
        create: {
          id: BigInt(m.id),
          title: m.title,
          alternativeTitles: m.alternative_titles || [],
          description: m.description,
          coverImage: m.cover_image,
          author: m.author,
          artist: m.artist,
          status: m.status,
          year: m.year,
          genres: m.genres || [],
          rating: m.rating || 0,
          views: BigInt(m.views || 0),
          chaptersCount: m.chapters_count || 0,
          createdAt: m.created_at ? new Date(m.created_at) : new Date(),
        },
      });
    }
    console.log(`✅ Перенесено манги: ${db.manga.length}`);
  }

  // 3. Главы
  if (db.chapters && db.chapters.length) {
    for (const ch of db.chapters) {
      await prisma.chapter.upsert({
        where: { id: ch.id },
        update: {},
        create: {
          id: ch.id,
          mangaId: BigInt(ch.manga_id),
          chapterNumber: ch.chapter_number,
          title: ch.title,
          pagesCount: ch.pages_count || 0,
          views: ch.views || 0,
          createdAt: ch.created_at ? new Date(ch.created_at) : new Date(),
        },
      });
    }
    console.log(`✅ Перенесено глав: ${db.chapters.length}`);
  }

  // 4. Прогресс чтения
  if (db.reading_progress && db.reading_progress.length) {
    let imported = 0;
    for (const prog of db.reading_progress) {
      try {
        const userExists = await prisma.user.findUnique({ where: { id: BigInt(prog.userId) } });
        const mangaExists = await prisma.manga.findUnique({ where: { id: BigInt(prog.manga_id) } });
        const chapterExists = await prisma.chapter.findUnique({ where: { id: prog.chapter_id } });

        if (!userExists || !mangaExists || !chapterExists) {
          console.warn(`⚠️ Пропущен прогресс: пользователь=${prog.userId}, манга=${prog.manga_id}, глава=${prog.chapter_id}`);
          continue;
        }

        await prisma.readingProgress.upsert({
          where: {
            userId_mangaId: { userId: BigInt(prog.userId), mangaId: BigInt(prog.manga_id) },
          },
          update: {},
          create: {
            userId: BigInt(prog.userId),
            mangaId: BigInt(prog.manga_id),
            chapterId: prog.chapter_id,
            pageNumber: prog.page_number || 1,
            createdAt: prog.created_at ? new Date(prog.created_at) : new Date(),
          },
        });
        imported++;
      } catch (e) {
        console.warn(`⚠️ Ошибка при импорте прогресса: ${e.message}`);
      }
    }
    console.log(`✅ Перенесено прогресса: ${imported} из ${db.reading_progress.length}`);
  }

  // 5. Статусы манги
  if (db.userMangaStatus && db.userMangaStatus.length) {
    let imported = 0;
    for (const st of db.userMangaStatus) {
      try {
        const userExists = await prisma.user.findUnique({ where: { id: BigInt(st.userId) } });
        const mangaExists = await prisma.manga.findUnique({ where: { id: BigInt(st.mangaId) } });

        if (!userExists || !mangaExists) {
          console.warn(`⚠️ Пропущен статус: пользователь=${st.userId}, манга=${st.mangaId}`);
          continue;
        }

        await prisma.userMangaStatus.upsert({
          where: {
            userId_mangaId: { userId: BigInt(st.userId), mangaId: BigInt(st.mangaId) },
          },
          update: {},
          create: {
            userId: BigInt(st.userId),
            mangaId: BigInt(st.mangaId),
            status: st.status,
          },
        });
        imported++;
      } catch (e) {
        console.warn(`⚠️ Ошибка при импорте статуса: ${e.message}`);
      }
    }
    console.log(`✅ Перенесено статусов: ${imported} из ${db.userMangaStatus.length}`);
  }

  // 6. Категории форума
  if (db.forum_categories && db.forum_categories.length) {
    for (const cat of db.forum_categories) {
      await prisma.forumCategory.upsert({
        where: { id: BigInt(cat.id) },
        update: {},
        create: {
          id: BigInt(cat.id),
          name: cat.name,
          description: cat.description,
          slug: cat.slug,
          topicsCount: cat.topics_count || 0,
          postsCount: cat.posts_count || 0,
          icon: cat.icon,
          order: cat.order,
        },
      });
    }
    console.log(`✅ Перенесено категорий форума: ${db.forum_categories.length}`);
  }

  // 7. Темы форума (с проверками)
  if (db.forum_topics && db.forum_topics.length) {
    let imported = 0;
    for (const topic of db.forum_topics) {
      try {
        // Проверяем наличие обязательных полей
        if (!topic.id || !topic.category_id || !topic.author_id) {
          console.warn(`⚠️ Пропущена тема: отсутствуют id, category_id или author_id (id=${topic.id})`);
          continue;
        }

        // Проверяем существование категории и автора
        const categoryExists = await prisma.forumCategory.findUnique({ where: { id: BigInt(topic.category_id) } });
        const authorExists = await prisma.user.findUnique({ where: { id: BigInt(topic.author_id) } });

        if (!categoryExists || !authorExists) {
          console.warn(`⚠️ Пропущена тема id=${topic.id}: категория=${topic.category_id}, автор=${topic.author_id} не найдены`);
          continue;
        }

        await prisma.forumTopic.upsert({
          where: { id: BigInt(topic.id) },
          update: {},
          create: {
            id: BigInt(topic.id),
            categoryId: BigInt(topic.category_id),
            title: topic.title,
            content: topic.content,
            authorId: BigInt(topic.author_id),
            views: topic.views || 0,
            postsCount: topic.posts_count || 0,
            isPinned: topic.is_pinned || false,
            isLocked: topic.is_locked || false,
            createdAt: topic.created_at ? new Date(topic.created_at) : new Date(),
          },
        });
        imported++;
      } catch (e) {
        console.warn(`⚠️ Ошибка при импорте темы ${topic.id}: ${e.message}`);
      }
    }
    console.log(`✅ Перенесено тем форума: ${imported} из ${db.forum_topics.length}`);
  }

  // 8. Посты форума (с проверками)
  if (db.forum_posts && db.forum_posts.length) {
    let imported = 0;
    for (const post of db.forum_posts) {
      try {
        if (!post.id || !post.topic_id || !post.author_id) {
          console.warn(`⚠️ Пропущен пост: отсутствуют id, topic_id или author_id (id=${post.id})`);
          continue;
        }

        const topicExists = await prisma.forumTopic.findUnique({ where: { id: BigInt(post.topic_id) } });
        const authorExists = await prisma.user.findUnique({ where: { id: BigInt(post.author_id) } });

        if (!topicExists || !authorExists) {
          console.warn(`⚠️ Пропущен пост id=${post.id}: тема=${post.topic_id}, автор=${post.author_id} не найдены`);
          continue;
        }

        await prisma.forumPost.upsert({
          where: { id: BigInt(post.id) },
          update: {},
          create: {
            id: BigInt(post.id),
            topicId: BigInt(post.topic_id),
            content: post.content,
            authorId: BigInt(post.author_id),
            likes: post.likes || 0,
            createdAt: post.created_at ? new Date(post.created_at) : new Date(),
          },
        });
        imported++;
      } catch (e) {
        console.warn(`⚠️ Ошибка при импорте поста ${post.id}: ${e.message}`);
      }
    }
    console.log(`✅ Перенесено постов форума: ${imported} из ${db.forum_posts.length}`);
  }

  console.log('🎉 Миграция завершена!');
}

migrate()
  .catch(e => {
    console.error('Ошибка миграции:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });