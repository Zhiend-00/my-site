import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from '@napi-rs/canvas';  // если используете @napi-rs/canvas
// import { createCanvas } from 'canvas';         // если используете canvas

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coversDir = path.join(__dirname, 'public', 'covers');
if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });

const titles = [
  'О моем перерождении в меч',
  'Лунный бог, приключение и другой мир',
  'Меня выгнали из пати героя...',
  'Приди же в Мир Демонов, Ирума-кун!',
  'Восьмой сын? Я не могу этого принять!',
  'Моя дочь... достигла S-ранга'
];

for (let id = 1; id <= 6; id++) {
  const canvas = createCanvas(300, 450);
  const ctx = canvas.getContext('2d');

  // Цветной фон
  const hue = (id * 70) % 360;
  ctx.fillStyle = `hsl(${hue}, 70%, 45%)`;
  ctx.fillRect(0, 0, 300, 450);

  // Полупрозрачный прямоугольник под текст
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(10, 360, 280, 70);

  // Название манги
  ctx.fillStyle = 'white';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(titles[id - 1], 150, 395);

  // Сохраняем
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(coversDir, `cover-${id}.png`), buffer);
  console.log(`✅ Обложка cover-${id}.png создана`);
}
console.log('Готово.');