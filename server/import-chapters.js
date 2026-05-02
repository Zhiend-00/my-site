import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://manga_db_9y4q_user:WLxTqdkSGcQc0ymxSOn1dsIrGzCIqZE1@dpg-d7qqr2mgvqtc73b1up70-a.frankfurt-postgres.render.com/manga_db_9y4q" } } // ← твой External URL
});

const chaptersBaseDir = path.join(__dirname, 'public', 'uploads', 'chapters');

async function importChapters() {
  const mangaDirs = fs.readdirSync(chaptersBaseDir);
  for (const mangaId of mangaDirs) {
    const mangaPath = path.join(chaptersBaseDir, mangaId);
    if (!fs.statSync(mangaPath).isDirectory()) continue;
    const chapterDirs = fs.readdirSync(mangaPath);
    for (const chapterDirName of chapterDirs) {
      const match = chapterDirName.match(/^chapter(\d+)$/);
      if (!match) continue;
      const chapterNumber = parseInt(match[1]);
      const chapterPath = path.join(mangaPath, chapterDirName);
      const pageFiles = fs.readdirSync(chapterPath).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
      
      if (pageFiles.length === 0) continue;

      const chapter = await prisma.chapter.upsert({
        where: { unique_manga_chapter: { mangaId: BigInt(mangaId), chapterNumber } },
        update: { pagesCount: pageFiles.length },
        create: {
          id: parseFloat(`${Date.now()}.${Math.floor(Math.random()*1000)}`),
          mangaId: BigInt(mangaId),
          chapterNumber,
          title: `Глава ${chapterNumber}`,
          pagesCount: pageFiles.length,
        },
      });

      for (const [idx, fileName] of pageFiles.entries()) {
        const pageNumber = idx + 1;
        const imageUrl = `/uploads/chapters/${mangaId}/chapter${chapterNumber}/${fileName}`;
        await prisma.page.upsert({
          where: { chapterId_pageNumber: { chapterId: chapter.id, pageNumber } },
          update: { imageUrl },
          create: { chapterId: chapter.id, pageNumber, imageUrl },
        });
      }
      console.log(`✅ Глава ${chapterNumber} манги ${mangaId} добавлена (${pageFiles.length} стр.)`);
    }
  }
  console.log('🎉 Импорт глав завершён!');
}

importChapters().catch(e => console.error(e)).finally(() => prisma.$disconnect());