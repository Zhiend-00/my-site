import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const CHAPTERS_DIR = path.join(__dirname, '../public/chapters');

async function syncPages() {
  console.log('🔄 Начинаю синхронизацию страниц...');
  
  const chapters = await prisma.chapter.findMany();
  let updatedChapters = 0;
  let totalPagesCreated = 0;
  
  for (const chapter of chapters) {
    const mangaId = chapter.mangaId.toString();
    const chapterNum = chapter.chapterNumber;
    const chapterDir = path.join(CHAPTERS_DIR, mangaId, `chapter${chapterNum}`);
    
    if (fs.existsSync(chapterDir)) {
      const files = fs.readdirSync(chapterDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
      
      if (files.length > 0) {
        files.sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || 0);
          const numB = parseInt(b.match(/\d+/)?.[0] || 0);
          return numA - numB;
        });
        
        await prisma.page.deleteMany({ where: { chapterId: chapter.id } });
        
        const pagesData = [];
        for (let i = 0; i < files.length; i++) {
          const fileName = files[i];
          const ext = path.extname(fileName);
          const pageNumber = i + 1;
          
          pagesData.push({
            chapterId: chapter.id,
            pageNumber: pageNumber,
            imageUrl: `/uploads/chapters/${mangaId}/chapter${chapterNum}/${fileName}`,
          });
        }
        
        await prisma.page.createMany({ data: pagesData });
        
        if (chapter.pagesCount !== files.length) {
          await prisma.chapter.update({
            where: { id: chapter.id },
            data: { pagesCount: files.length }
          });
        }
        
        updatedChapters++;
        totalPagesCreated += files.length;
        console.log(`✅ Глава ${chapterNum} манги ${mangaId}: ${files.length} страниц`);
      }
    }
  }
  
  console.log(`\n🎉 Синхронизация завершена!`);
  console.log(`📊 Обновлено глав: ${updatedChapters}`);
  console.log(`📄 Создано страниц: ${totalPagesCreated}`);
  
  await prisma.$disconnect();
}

syncPages().catch(e => {
  console.error('❌ Ошибка:', e);
  prisma.$disconnect();
});