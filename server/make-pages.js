import fs from 'fs';
import path from 'path';

// 1×1 прозрачный PNG (base64)
const emptyPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
for (const ch of db.chapters) {
  const dir = path.join('uploads', 'chapters', String(ch.manga_id), `chapter${ch.chapter_number}`);
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 1; i <= (ch.pages_count || 10); i++) {
    const file = path.join(dir, `${i}.png`);
    if (!fs.existsSync(file)) fs.writeFileSync(file, emptyPNG);
  }
  console.log(`✅ Глава ${ch.chapter_number} манги ${ch.manga_id}`);
}
console.log('🎉 Готово!');