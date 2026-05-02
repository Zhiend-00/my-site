import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Наполняю базу из db.json...');
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'db.json'), 'utf-8'));

  // Пользователи
  if (data.users) {
    for (const u of data.users) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          username: u.username,
          role: u.role || 'user',
          emailVerified: u.email_verified !== undefined ? u.email_verified : true
        },
        create: {
          email: u.email,
          password: hashedPassword,
          username: u.username,
          role: u.role || 'user',
          avatar: u.avatar || '/uploads/avatars/default.png',
          emailVerified: u.email_verified !== undefined ? u.email_verified : true
        }
      });
    }
    console.log('✅ Пользователи');
  }

  // Манга и главы
  if (data.manga) {
    for (const m of data.manga) {
      const manga = await prisma.manga.upsert({
        where: { id: BigInt(m.id) },
        update: {
          title: m.title,
          description: m.description,
          coverImage: m.cover_image,
          author: m.author,
          artist: m.artist,
          status: m.status,
          year: m.year,
          genres: m.genres,
          rating: m.rating || 0,
          views: m.views || 0,
          chaptersCount: m.chapters_count || 0,
          alternativeTitles: m.alternative_titles || []
        },
        create: {
          id: BigInt(m.id),
          title: m.title,
          description: m.description,
          coverImage: m.cover_image,
          author: m.author,
          artist: m.artist,
          status: m.status,
          year: m.year,
          genres: m.genres,
          rating: m.rating || 0,
          views: m.views || 0,
          chaptersCount: m.chapters_count || 0,
          alternativeTitles: m.alternative_titles || []
        }
      });

      // Главы для этой манги (из отдельного массива chapters в db.json)
      const mangaChapters = data.chapters?.filter(c => c.manga_id === m.id) || [];
      for (const ch of mangaChapters) {
        const chapter = await prisma.chapter.upsert({
          where: {
            mangaId_chapterNumber: {
              mangaId: BigInt(m.id),
              chapterNumber: ch.chapter_number
            }
          },
          update: {
            title: ch.title,
            pagesCount: ch.pages_count
          },
          create: {
            id: ch.id,
            mangaId: BigInt(m.id),
            chapterNumber: ch.chapter_number,
            title: ch.title,
            pagesCount: ch.pages_count
          }
        });

        // Страницы для этой главы (если есть в db.json, ищем по chapter_id)
        const chapterPages = data.pages?.filter(p => p.chapter_id === ch.id) || [];
        for (const p of chapterPages) {
          await prisma.page.upsert({
            where: {
              chapterId_pageNumber: {
                chapterId: chapter.id,
                pageNumber: p.page_number
              }
            },
            update: { imageUrl: p.image_url },
            create: {
              chapterId: chapter.id,
              pageNumber: p.page_number,
              imageUrl: p.image_url
            }
          });
        }
      }
    }
    console.log('✅ Манга и главы');
  }

  // Форум: категории
  if (data.forum_categories) {
    for (const cat of data.forum_categories) {
      await prisma.forumCategory.upsert({
        where: { id: BigInt(cat.id) },
        update: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          order: cat.order
        },
        create: {
          id: BigInt(cat.id),
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          order: cat.order,
          topicsCount: cat.topics_count || 0,
          postsCount: cat.posts_count || 0
        }
      });
    }
    console.log('✅ Категории форума');
  }

  // Темы форума
  if (data.forum_topics) {
    for (const t of data.forum_topics) {
      await prisma.forumTopic.upsert({
        where: { id: BigInt(t.id) },
        update: {
          title: t.title,
          content: t.content,
          isPinned: t.is_pinned || false,
          isLocked: t.is_locked || false
        },
        create: {
          id: BigInt(t.id),
          categoryId: BigInt(t.category_id || t.categoryId),
          title: t.title,
          content: t.content,
          authorId: BigInt(t.author_id),
          views: t.views || 0,
          postsCount: t.posts_count || 0,
          isPinned: t.is_pinned || false,
          isLocked: t.is_locked || false
        }
      });
    }
    console.log('✅ Темы форума');
  }

  // Посты форума
  if (data.forum_posts) {
    for (const p of data.forum_posts) {
      await prisma.forumPost.upsert({
        where: { id: BigInt(p.id) },
        update: { content: p.content },
        create: {
          id: BigInt(p.id),
          topicId: BigInt(p.topic_id || p.topicId),
          content: p.content,
          authorId: BigInt(p.author_id),
          likes: p.likes || 0
        }
      });
    }
    console.log('✅ Посты форума');
  }

  // Статусы манги пользователей
  if (data.userMangaStatus) {
    for (const s of data.userMangaStatus) {
      await prisma.userMangaStatus.upsert({
        where: {
          userId_mangaId: {
            userId: BigInt(s.userId),
            mangaId: BigInt(s.mangaId)
          }
        },
        update: { status: s.status },
        create: {
          userId: BigInt(s.userId),
          mangaId: BigInt(s.mangaId),
          status: s.status
        }
      });
    }
    console.log('✅ Статусы манги');
  }

  // Feedback (обратная связь)
  if (data.feedback) {
    for (const fb of data.feedback) {
      await prisma.feedback.upsert({
        where: { id: BigInt(fb.id) },
        update: { status: fb.status, message: fb.message },
        create: {
          id: BigInt(fb.id),
          name: fb.name,
          email: fb.email,
          message: fb.message,
          status: fb.status || 'new',
          ip: fb.ip || '',
          userId: fb.userId ? BigInt(fb.userId) : null
        }
      });
    }
    console.log('✅ Обратная связь');
  }

  console.log('🎉 Все данные загружены!');
}

main()
  .catch(e => {
    console.error('❌ Ошибка наполнения базы:', e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());