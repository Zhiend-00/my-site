import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from '@napi-rs/canvas'; // или 'canvas'

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const chaptersDir = path.join(__dirname, 'public', 'chapters');

const chapters = [
  { mangaId: 1, chapter: 1, pages: 34 },
  { mangaId: 1, chapter: 2, pages: 29 },
  { mangaId: 2, chapter: 1, pages: 25 },
  { mangaId: 2, chapter: 2, pages: 25 },
  { mangaId: 3, chapter: 1, pages: 29 },
  { mangaId: 3, chapter: 2, pages: 23 },
  { mangaId: 4, chapter: 1, pages: 45 },
  { mangaId: 4, chapter: 2, pages: 30 },
  { mangaId: 5, chapter: 1, pages: 38 },
  { mangaId: 5, chapter: 2, pages: 35 },
  { mangaId: 6, chapter: 1, pages: 35 },
  { mangaId: 6, chapter: 2, pages: 36 },
];

for (const ch of chapters) {
  const dir = path.join(chaptersDir, ch.mangaId.toString(), `chapter${ch.chapter}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (let page = 1; page <= ch.pages; page++) {
    const filePath = path.join(dir, `${page}.png`);
    if (fs.existsSync(filePath)) continue;

    const canvas = createCanvas(800, 1200);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 800, 1200);

    ctx.fillStyle = 'black';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Страница ${page}`, 400, 500);

    ctx.font = '20px Arial';
    ctx.fillText(`Манга ${ch.mangaId} — Глава ${ch.chapter}`, 400, 550);

    fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
  }
  console.log(`✅ Глава ${ch.chapter} манги ${ch.mangaId} (${ch.pages} стр.)`);
}
console.log('Готово.');