import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

// 👇 ВСТАВЬ СВОЙ EXTERNAL URL ОТ RENDER БАЗЫ
const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://manga_db_9y4q_user:WLxTqdkSGcQc0ymxSOn1dsIrGzCIqZE1@dpg-d7qqr2mgvqtc73b1up70-a.frankfurt-postgres.render.com/manga_db_9y4q" } }
});

const workbook = XLSX.readFile('../manga-import.xlsx'); // путь к твоему файлу
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

async function importData() {
  console.log(`Найдено ${rows.length} записей для импорта...`);
  for (const row of rows) {
    try {
      await prisma.manga.create({
        data: {
          title: row['Название'] || 'Без названия',
          description: row['Описание'] || '',
          author: row['Автор'] || '',
          status: row['Статус'] || 'ongoing',
          year: row['Год'] ? parseInt(row['Год']) : null,
          genres: row['Жанры'] ? String(row['Жанры']).split(',').map(g => g.trim()) : [],
          alternativeTitles: row['Альтернативные названия'] ? String(row['Альтернативные названия']).split(',').map(s => s.trim()) : [],
          coverImage: row['Обложка'] || '/uploads/covers/default.png',
        },
      });
      console.log(`✅ ${row['Название']}`);
    } catch (e) {
      console.error(`❌ Ошибка в "${row['Название']}":`, e.message);
    }
  }
  console.log('🎉 Импорт завершён!');
}

importData().finally(() => prisma.$disconnect());