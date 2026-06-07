import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const CHAPTERS_DIR = path.join(__dirname, '../public/chapters');

async function fixPages() {
  console.log(' ПРИНУДИТЕЛЬНАЯ СИНХРОНИЗАЦИЯ СТРАНИЦ\n');
  console.log('=' .repeat(60));
  
  // Получаем все главы из БД
  const chapters = await prisma.chapter.findMany();
  console.log(` Найдено глав в БД: ${chapters.length}\n`);
  
  let totalPagesCreated = 0;
  let chaptersWithPages = 0;
  let chaptersWithoutPages = 0;
  
  for (const chapter of chapters) {
    const mangaId = chapter.mangaId.toString();
    const chapterNum = chapter.chapterNumber;
    const chapterDir = path.join(CHAPTERS_DIR, mangaId, `chapter${chapterNum}`);
    
    console.log(` Манга ${mangaId}, Глава ${chapterNum}`);
    console.log(`   Путь: ${chapterDir}`);
    
    if (fs.existsSync(chapterDir)) {
      const files = fs.readdirSync(chapterDir).filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
      console.log(`    Найдено файлов: ${files.length}`);
      
      if (files.length > 0) {
        // Сортируем файлы
        files.sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || 0);
          const numB = parseInt(b.match(/\d+/)?.[0] || 0);
          return numA - numB;
        });
        
        // Удаляем старые записи
        const deleted = await prisma.page.deleteMany({ where: { chapterId: chapter.id } });
        console.log(`   ️ Удалено старых записей: ${deleted.count}`);
        
        // Создаем новые записи
        const pagesData = [];
        for (let i = 0; i < files.length; i++) {
          pagesData.push({
            chapterId: chapter.id,
            pageNumber: i + 1,
            imageUrl: `/uploads/chapters/${mangaId}/chapter${chapterNum}/${files[i]}`,
          });
        }
        
        const created = await prisma.page.createMany({ data: pagesData });
        console.log(`    СОЗДАНО СТРАНИЦ: ${created.count}`);
        
        // Обновляем количество страниц в главе
        if (chapter.pagesCount !== files.length) {
          await prisma.chapter.update({
            where: { id: chapter.id },
            data: { pagesCount: files.length }
          });
          console.log(`    Обновлено pagesCount: ${chapter.pagesCount} → ${files.length}`);
        }
        
        totalPagesCreated += files.length;
        chaptersWithPages++;
      } else {
        console.log(`   ️ НЕТ ИЗОБРАЖЕНИЙ в папке!`);
        chaptersWithoutPages++;
      }
    } else {
      console.log(`    ПАПКА НЕ СУЩЕСТВУЕТ: ${chapterDir}`);
      chaptersWithoutPages++;
    }
    console.log('');
  }
  
  console.log('=' .repeat(60));
  console.log(`\n РЕЗУЛЬТАТ:`);
  console.log(`    Глав с файлами: ${chaptersWithPages}`);
  console.log(`    Глав без файлов: ${chaptersWithoutPages}`);
  console.log(`    ВСЕГО СОЗДАНО СТРАНИЦ: ${totalPagesCreated}`);
  
  await prisma.$disconnect();
}

fixPages().catch(e => {
  console.error(' ОШИБКА:', e);
  prisma.$disconnect();
});