// server/generate-chapter-content.mjs
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from '@napi-rs/canvas'; // или 'canvas', смотря что установлено

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const chaptersDir = path.join(__dirname, 'public', 'chapters');

async function main() {
  const chapters = await prisma.chapter.findMany({
    include: { manga: { select: { id: true } } }
  });

  for (const ch of chapters) {
    const mangaId = ch.mangaId.toString();
    const chNum = ch.chapterNumber;
    const pagesCount = ch.pagesCount || 10; // если 0, делаем тестовые 10 стр.
    const dir = path.join(chaptersDir, mangaId, `chapter${chNum}`);
    
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Генерируем страницы, если их нет
    const existingFiles = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
    if (existingFiles.length < pagesCount) {
      for (let i = 1; i <= pagesCount; i++) {
        const ext = '.png';
        const fileName = `${i}${ext}`;
        const filePath = path.join(dir, fileName);
        if (fs.existsSync(filePath)) continue;

        const canvas = createCanvas(800, 1200);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 800, 1200);
        ctx.fillStyle = '#333';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Страница ${i}`, 400, 600);
        ctx.font = '20px Arial';
        ctx.fillText(`Глава ${chNum}`, 400, 650);
        fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
      }
      console.log(`✅ Созданы страницы для главы ${chNum} манги ${mangaId}`);
    }

    // Обновляем pagesCount в базе
    const files = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
    const actualPages = files.length;
    if (actualPages !== ch.pagesCount) {
      await prisma.chapter.update({
        where: { id: ch.id },
        data: { pagesCount: actualPages }
      });
    }

    // Удаляем старые записи pages для этой главы и создаём новые
    await prisma.page.deleteMany({ where: { chapterId: ch.id } });
    
    const pagesData = [];
    for (let i = 1; i <= actualPages; i++) {
      const ext = '.png'; // можно определить по реальному файлу
      const imgUrl = `/uploads/chapters/${mangaId}/chapter${chNum}/${i}${ext}`;
      pagesData.push({
        chapterId: ch.id,
        pageNumber: i,
        imageUrl: imgUrl
      });
    }
    
    await prisma.page.createMany({ data: pagesData });
    console.log(`✅ Обновлены записи pages для главы ${ch.id}`);
  }
  
  console.log('🎉 Готово! Теперь можно читать мангу.');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});