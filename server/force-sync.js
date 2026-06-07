import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const CHAPTERS_DIR = path.join(__dirname, '../public/chapters');

async function forceSync() {
  console.log('🔧 ПРИНУДИТЕЛЬНАЯ СИНХРОНИЗАЦИЯ СТРАНИЦ...\n');
  
  const chapters = await prisma.chapter.findMany();
  console.log(`📊 Найдено глав в БД: ${chapters.length}\n`);
  
  let updatedChapters = 0;
  let totalPagesCreated = 0;
  
  for (const chapter of chapters) {
    const mangaId = chapter.mangaId.toString();
    const chapterNum = chapter.chapterNumber;
    const chapterDir = path.join(CHAPTERS_DIR, mangaId, `chapter${chapterNum}`);
    
    console.log(`📁 Проверяем: ${chapterDir}`);
    
    if (fs.existsSync(chapterDir)) {
      const files = fs.readdirSync(chapterDir).filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
      console.log(`   📄 Найдено файлов: ${files.length}`);
      
      if (files.length > 0) {
        files.sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || 0);
          const numB = parseInt(b.match(/\d+/)?.[0] || 0);
          return numA - numB;
        });
        
        // Удаляем старые записи
        await prisma.page.deleteMany({ where: { chapterId: chapter.id } });
        
        // Создаем новые записи
        const pagesData = [];
        for (let i = 0; i < files.length; i++) {
          pagesData.push({
            chapterId: chapter.id,
            pageNumber: i + 1,
            imageUrl: `/uploads/chapters/${mangaId}/chapter${chapterNum}/${files[i]}`,
          });
        }
        
        await prisma.page.createMany({ data: pagesData });
        
        // Обновляем количество страниц
        if (chapter.pagesCount !== files.length) {
          await prisma.chapter.update({
            where: { id: chapter.id },
            data: { pagesCount: files.length }
          });
        }
        
        updatedChapters++;
        totalPagesCreated += files.length;
        console.log(`   ✅ Глава ${chapterNum}: ${files.length} страниц\n`);
      } else {
        console.log(`   ⚠️ Нет изображений\n`);
      }
    } else {
      console.log(`   ❌ Папка не существует\n`);
    }
  }
  
  console.log(`\n🎉 ГОТОВО!`);
  console.log(`📊 Обновлено глав: ${updatedChapters}`);
  console.log(`📄 Создано страниц: ${totalPagesCreated}`);
  
  await prisma.$disconnect();
}

forceSync().catch(e => {
  console.error('❌ Ошибка:', e);
  prisma.$disconnect();
});