import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Простейшая PNG-заглушка (1×1 прозрачный пиксель в base64)
const emptyPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

// Читаем db.json
const dbPath = path.join(__dirname, 'db.json');
if (!fs.existsSync(dbPath)) {
  console.error('❌ db.json не найден!');
  process.exit(1);
}
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const chapters = db.chapters || [];

if (chapters.length === 0) {
  console.log('⚠️ В db.json нет глав. Сначала синхронизируйте данные через POST /api/sync-all');
  process.exit(0);
}

for (const chapter of chapters) {
  const mangaId = chapter.manga_id;
  const chapterNum = chapter.chapter_number;
  const pagesCount = chapter.pages_count || 10;
  const dir = path.join(__dirname, 'uploads', 'chapters', mangaId.toString(), `chapter${chapterNum}`);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Создана папка: ${dir}`);
  }
  
  let created = 0;
  for (let i = 1; i <= pagesCount; i++) {
    const filePath = path.join(dir, `${i}.png`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, emptyPNG);
      created++;
    }
  }
  if (created > 0) {
    console.log(`✅ Создано ${created} страниц для главы ${chapterNum} манги ${mangaId}`);
  } else {
    console.log(`✔️ Глава ${chapterNum} манги ${mangaId} уже имеет страницы`);
  }
}

console.log('\n🎉 Все тестовые страницы созданы! Теперь перезапустите сервер и откройте любую главу.');