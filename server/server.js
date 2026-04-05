const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const port = 3000;
const path = require('path');
const express = require('express');
const fs = require('fs');

server.use(middlewares);
server.use(jsonServer.bodyParser);

// ========== ПРАВИЛЬНЫЕ ПУТИ ==========
const PROJECT_ROOT = 'E:/!Диплом 2.0/Forgotten-team-master';
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const CHAPTERS_DIR = path.join(PUBLIC_DIR, 'chapters');
const COVERS_DIR = path.join(PUBLIC_DIR, 'covers');

console.log('\n📁 НАСТРОЙКА ПУТЕЙ:');
console.log(`   Корень: ${PROJECT_ROOT}`);
console.log(`   Public: ${PUBLIC_DIR}`);
console.log(`   Главы: ${CHAPTERS_DIR}`);
console.log(`   Обложки: ${COVERS_DIR}`);
console.log(`   Папка глав существует: ${fs.existsSync(CHAPTERS_DIR)}`);

// Создаем папки если их нет
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
if (!fs.existsSync(CHAPTERS_DIR)) fs.mkdirSync(CHAPTERS_DIR, { recursive: true });
if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });

// Пустое PNG изображение
const emptyPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

// Создаем тестовую обложку
const testCover = path.join(COVERS_DIR, 'test.png');
if (!fs.existsSync(testCover)) {
  fs.writeFileSync(testCover, emptyPNG);
}

// ========== CORS ==========
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ========== ТЕСТОВЫЕ ЭНДПОИНТЫ ==========
server.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

server.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Сервер работает!',
    chaptersDir: CHAPTERS_DIR,
    coversDir: COVERS_DIR,
    chaptersExists: fs.existsSync(CHAPTERS_DIR)
  });
});

server.get('/api/test-image', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.send(emptyPNG);
});

// ========== ДИАГНОСТИКА ==========
server.get('/api/debug/folder/:mangaId/:chapterNum', (req, res) => {
  const { mangaId, chapterNum } = req.params;
  const folderPath = path.join(CHAPTERS_DIR, mangaId, `chapter${chapterNum}`);
  
  console.log(`🔍 Диагностика: ${folderPath}`);
  
  if (!fs.existsSync(folderPath)) {
    return res.json({ 
      exists: false, 
      path: folderPath,
      error: 'Папка не найдена'
    });
  }
  
  const files = fs.readdirSync(folderPath);
  const pngFiles = files.filter(f => f.endsWith('.png')).sort();
  
  // Получаем размеры файлов
  const fileDetails = pngFiles.map(f => {
    const filePath = path.join(folderPath, f);
    const stats = fs.statSync(filePath);
    return {
      name: f,
      size: stats.size,
      path: filePath
    };
  });
  
  res.json({
    exists: true,
    path: folderPath,
    totalFiles: files.length,
    pngFiles: fileDetails,
    firstFile: pngFiles[0],
    exampleUrl: `/api/page/${mangaId}/chapter${chapterNum}/${pngFiles[0]?.replace('.png', '')}`
  });
});

// ========== ОСНОВНОЙ ЭНДПОИНТ ДЛЯ СТРАНИЦ - НОВАЯ ВЕРСИЯ ==========
server.get('/api/page/:mangaId/:chapter/:page', (req, res) => {
  const { mangaId, chapter, page } = req.params;
  
  // Убираем .png если есть
  let cleanPage = page.replace(/\.png$/, '');
  
  // Формируем путь
  const imagePath = path.join(CHAPTERS_DIR, mangaId, chapter, `${cleanPage}.png`);
  
  console.log(`\n🖼️ ЗАПРОС СТРАНИЦЫ:`);
  console.log(`   URL: /api/page/${mangaId}/${chapter}/${page}`);
  console.log(`   Путь: ${imagePath}`);
  console.log(`   Существует: ${fs.existsSync(imagePath)}`);
  
  if (fs.existsSync(imagePath)) {
    try {
      // Читаем файл напрямую
      const imageBuffer = fs.readFileSync(imagePath);
      console.log(`   ✅ Файл прочитан, размер: ${imageBuffer.length} байт`);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', imageBuffer.length);
      res.send(imageBuffer);
    } catch (err) {
      console.log(`   ❌ Ошибка чтения: ${err.message}`);
      res.setHeader('Content-Type', 'image/png');
      res.send(emptyPNG);
    }
  } else {
    console.log(`   ❌ Файл не найден`);
    const dirPath = path.dirname(imagePath);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      console.log(`   Доступные файлы: ${files.join(', ')}`);
    }
    res.setHeader('Content-Type', 'image/png');
    res.send(emptyPNG);
  }
});

// ========== ОБЛОЖКИ ==========
server.get('/api/cover/:mangaId', (req, res) => {
  const { mangaId } = req.params;
  const coverPath = path.join(COVERS_DIR, `cover-${mangaId}.png`);
  
  console.log(`\n🖼️ ЗАПРОС ОБЛОЖКИ: ${mangaId}`);
  console.log(`   Путь: ${coverPath}`);
  
  if (fs.existsSync(coverPath)) {
    try {
      const imageBuffer = fs.readFileSync(coverPath);
      res.setHeader('Content-Type', 'image/png');
      res.send(imageBuffer);
    } catch (err) {
      res.sendFile(testCover);
    }
  } else {
    res.sendFile(testCover);
  }
});

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function findUserByToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const match = token.match(/^token-(\d+)$/);
  if (!match) return null;
  const userId = parseInt(match[1]);
  const db = router.db;
  return db.get('users').find({ id: userId }).value();
}

// ========== СИНХРОНИЗАЦИЯ ==========
function syncAllFromFiles() {
  const db = router.db;
  console.log('\n🔄 Синхронизация...');
  
  let mangaIds = [];
  if (fs.existsSync(CHAPTERS_DIR)) {
    mangaIds = fs.readdirSync(CHAPTERS_DIR).filter(f => {
      const fullPath = path.join(CHAPTERS_DIR, f);
      return fs.statSync(fullPath).isDirectory() && !isNaN(parseInt(f));
    });
  }
  
  mangaIds.forEach(mangaIdStr => {
    const mangaId = parseInt(mangaIdStr);
    const coverPath = path.join(COVERS_DIR, `cover-${mangaId}.png`);
    if (!fs.existsSync(coverPath)) {
      fs.writeFileSync(coverPath, emptyPNG);
    }
    
    const existing = db.get('manga').find({ id: mangaId }).value();
    if (!existing) {
      db.get('manga').push({
        id: mangaId,
        title: `Манга ${mangaId}`,
        description: 'Описание отсутствует',
        cover_image: `/api/cover/${mangaId}`,
        status: 'ongoing',
        rating: 0,
        views: 0,
        chapters_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).write();
    }
  });
  
  const newChapters = [];
  mangaIds.forEach(mangaIdStr => {
    const mangaId = parseInt(mangaIdStr);
    const mangaPath = path.join(CHAPTERS_DIR, mangaIdStr);
    
    const chapterFolders = fs.readdirSync(mangaPath).filter(f => {
      const fullPath = path.join(mangaPath, f);
      return fs.statSync(fullPath).isDirectory() && f.startsWith('chapter');
    });
    
    chapterFolders.forEach(chapterFolder => {
      const match = chapterFolder.match(/chapter(\d+)/);
      if (!match) return;
      const chapterNum = parseInt(match[1]);
      const chapterPath = path.join(mangaPath, chapterFolder);
      const pageCount = fs.readdirSync(chapterPath).filter(f => f.endsWith('.png')).length;
      
      const existing = db.get('chapters').find({ manga_id: mangaId, chapter_number: chapterNum }).value();
      if (!existing) {
        newChapters.push({
          id: Date.now() + Math.random(),
          manga_id: mangaId,
          chapter_number: chapterNum,
          title: `Глава ${chapterNum}`,
          pages_count: pageCount,
          views: 0,
          created_at: new Date().toISOString()
        });
      } else if (existing.pages_count !== pageCount) {
        db.get('chapters').find({ id: existing.id }).assign({ pages_count: pageCount }).write();
      }
    });
  });
  
  if (newChapters.length > 0) {
    db.get('chapters').push(...newChapters).write();
  }
  
  const allManga = db.get('manga').value();
  allManga.forEach(m => {
    const count = db.get('chapters').filter({ manga_id: m.id }).size().value();
    db.get('manga').find({ id: m.id }).assign({ chapters_count: count }).write();
  });
  
  console.log(`   ✅ Синхронизировано: ${mangaIds.length} манги, ${newChapters.length} новых глав`);
}

// ========== API ЭНДПОИНТЫ ==========
server.get('/api/chapters/:id/pages', (req, res) => {
  const chapterId = parseFloat(req.params.id);
  const db = router.db;
  const chapter = db.get('chapters').find({ id: chapterId }).value();
  
  if (!chapter) {
    return res.status(404).json({ error: 'Глава не найдена' });
  }
  
  const mangaId = chapter.manga_id;
  const chapterNum = chapter.chapter_number;
  const chapterPath = path.join(CHAPTERS_DIR, mangaId.toString(), `chapter${chapterNum}`);
  
  console.log(`\n📖 Запрос страниц главы ${chapterId}`);
  console.log(`   Путь: ${chapterPath}`);
  
  if (!fs.existsSync(chapterPath)) {
    console.log(`   ❌ Папка не найдена`);
    return res.json({ 
      chapter_id: chapterId, 
      manga_id: mangaId, 
      chapter_number: chapterNum, 
      title: chapter.title, 
      pages: [], 
      total_pages: 0 
    });
  }
  
  const files = fs.readdirSync(chapterPath).filter(f => f.endsWith('.png')).sort((a, b) => {
    const numA = parseInt(a.match(/(\d+)\.png/)?.[1] || 0);
    const numB = parseInt(b.match(/(\d+)\.png/)?.[1] || 0);
    return numA - numB;
  });
  
  const pages = files.map((file, index) => ({
    page_number: index + 1,
    image_url: `/api/page/${mangaId}/chapter${chapterNum}/${index + 1}`,
    file_name: file
  }));
  
  console.log(`   ✅ Найдено ${pages.length} страниц`);
  
  res.json({ 
    chapter_id: chapterId, 
    manga_id: mangaId, 
    chapter_number: chapterNum, 
    title: chapter.title, 
    pages: pages, 
    total_pages: pages.length 
  });
});

server.get('/api/chapters/:id', (req, res) => {
  const db = router.db;
  const id = parseFloat(req.params.id);
  const chapter = db.get('chapters').find({ id }).value();
  if (!chapter) return res.status(404).json({ error: 'Глава не найдена' });
  res.json(chapter);
});

server.get('/api/manga/:id', (req, res) => {
  const db = router.db;
  const id = parseInt(req.params.id);
  const manga = db.get('manga').find({ id }).value();
  if (!manga) return res.status(404).json({ error: 'Манга не найдена' });
  const chapters = db.get('chapters').filter({ manga_id: id }).sortBy('chapter_number').value();
  res.json({ ...manga, chapters });
});

server.get('/api/manga', (req, res) => {
  const db = router.db;
  res.json(db.get('manga').value());
});

// ========== АУТЕНТИФИКАЦИЯ ==========
server.post('/api/auth/register', (req, res) => {
  const db = router.db;
  const { username, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email и пароль обязательны' });
  const existing = db.get('users').find({ email }).value();
  if (existing) return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
  const newUser = {
    id: Date.now(),
    username: username || email.split('@')[0],
    email,
    password,
    avatar: '/api/cover/default',
    role: 'user',
    created_at: new Date().toISOString(),
    favorites: [],
    reading_history: []
  };
  db.get('users').push(newUser).write();
  const { password: _, ...userWithoutPassword } = newUser;
  const token = `token-${newUser.id}`;
  res.status(201).json({ user: userWithoutPassword, token });
});

server.post('/api/auth/login', (req, res) => {
  const db = router.db;
  const { email, password } = req.body;
  const user = db.get('users').find({ email }).value();
  if (!user || user.password !== password) return res.status(401).json({ message: 'Неверный email или пароль' });
  const { password: _, ...userWithoutPassword } = user;
  const token = `token-${user.id}`;
  res.json({ user: userWithoutPassword, token });
});

server.get('/api/auth/profile', (req, res) => {
  const user = findUserByToken(req.headers.authorization);
  if (!user) return res.status(401).json({ message: 'Не авторизован' });
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

server.get('/api/user/:userId/status', (req, res) => {
  const db = router.db;
  const userId = parseInt(req.params.userId);
  const statuses = db.get('userMangaStatus').filter({ userId }).value();
  res.json(statuses);
});

server.post('/api/user/:userId/status', (req, res) => {
  const db = router.db;
  const userId = parseInt(req.params.userId);
  const { mangaId, status } = req.body;
  if (!mangaId || !status) return res.status(400).json({ message: 'mangaId и status обязательны' });
  const allowed = ['reading', 'planned', 'dropped', 'completed'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Недопустимый статус' });
  const existing = db.get('userMangaStatus').find({ userId, mangaId }).value();
  const now = new Date().toISOString();
  if (existing) {
    db.get('userMangaStatus').find({ userId, mangaId }).assign({ status, updatedAt: now }).write();
    res.json({ message: 'Статус обновлён' });
  } else {
    db.get('userMangaStatus').push({ id: Date.now(), userId, mangaId, status, createdAt: now, updatedAt: now }).write();
    res.status(201).json({ message: 'Статус добавлен' });
  }
});

server.delete('/api/user/:userId/status/:mangaId', (req, res) => {
  const db = router.db;
  const userId = parseInt(req.params.userId);
  const mangaId = parseInt(req.params.mangaId);
  db.get('userMangaStatus').remove({ userId, mangaId }).write();
  res.json({ message: 'Статус удалён' });
});

server.get('/api/progress/:mangaId', (req, res) => {
  const db = router.db;
  const mangaId = parseInt(req.params.mangaId);
  const userId = parseInt(req.query.userId);
  if (!userId) return res.status(400).json({ message: 'userId обязателен' });
  const progress = db.get('reading_progress').find({ userId, manga_id: mangaId }).value();
  res.json(progress || null);
});

server.post('/api/progress', (req, res) => {
  const db = router.db;
  const { userId, manga_id, chapter_id, page_number } = req.body;
  if (!userId || !manga_id || !chapter_id) return res.status(400).json({ message: 'Недостаточно данных' });
  const existing = db.get('reading_progress').find({ userId, manga_id }).value();
  const now = new Date().toISOString();
  if (existing) {
    db.get('reading_progress').find({ userId, manga_id }).assign({ chapter_id, page_number: page_number || 1, updated_at: now }).write();
  } else {
    db.get('reading_progress').push({ id: Date.now(), userId, manga_id, chapter_id, page_number: page_number || 1, created_at: now, updated_at: now }).write();
  }
  res.json({ message: 'Прогресс сохранён' });
});

server.post('/api/sync-all', (req, res) => {
  syncAllFromFiles();
  res.json({ message: 'Синхронизация выполнена' });
});

server.get('/api/search', (req, res) => {
  const db = router.db;
  const query = req.query.q?.toLowerCase() || '';
  if (!query) return res.json([]);
  const results = db.get('manga').filter(m => m.title.toLowerCase().includes(query)).value();
  res.json(results);
});

// ========== ЗАПУСК ==========
server.use('/api', router);

syncAllFromFiles();

server.listen(port, () => {
  console.log(`\n✅ Сервер запущен на http://localhost:${port}`);
  console.log(`\n🔍 ПРОВЕРЬ ЭТИ ССЫЛКИ В БРАУЗЕРЕ:`);
  console.log(`   1. Тест сервера: http://localhost:${port}/api/test`);
  console.log(`   2. Тест изображения: http://localhost:${port}/api/test-image`);
  console.log(`   3. Диагностика манги 2: http://localhost:${port}/api/debug/folder/2/1`);
  console.log(`   4. Страница 1: http://localhost:${port}/api/page/2/chapter1/1`);
  console.log(`   5. Обложка: http://localhost:${port}/api/cover/2`);
});