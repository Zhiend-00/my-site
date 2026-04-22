// server/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

BigInt.prototype.toJSON = function() {
  return this.toString();
};

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const CHAPTERS_DIR = path.join(PUBLIC_DIR, 'chapters');
const COVERS_DIR = path.join(PUBLIC_DIR, 'covers');
const AVATARS_DIR = path.join(PUBLIC_DIR, 'avatars');

[PUBLIC_DIR, CHAPTERS_DIR, COVERS_DIR, AVATARS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const emptyPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(PUBLIC_DIR));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ========== Вспомогательные функции ==========
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Требуется авторизация' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Недействительный токен' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ запрещён' });
  }
  next();
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Утилита для создания уведомлений
async function createNotification(userId, type, message, link = null) {
  try {
    await prisma.notification.create({
      data: { userId: BigInt(userId), type, message, link }
    });
  } catch (e) {
    console.error('Ошибка создания уведомления:', e);
  }
}

// ========== Аутентификация ==========
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email и пароль обязательны' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username: username || email.split('@')[0],
        email,
        password: hashedPassword,
        avatar: '/uploads/avatars/default.png',
        role: 'user',
      },
    });
    const token = generateToken(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Неверный email или пароль' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Неверный email или пароль' });
    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(req.user.id) },
      include: { favorites: true, userMangaStatus: true },
    });
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Ошибка профиля:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ========== Манга ==========
app.get('/api/manga', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, genres } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const where = {};
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (status && status !== 'all') where.status = status;
    if (genres) where.genres = { hasSome: genres.split(',').map(g => g.trim()) };
    const [manga, total] = await Promise.all([
      prisma.manga.findMany({
        where, skip, take,
        orderBy: { updatedAt: 'desc' },
        include: { chapters: { select: { id: true, chapterNumber: true, title: true, createdAt: true }, orderBy: { chapterNumber: 'asc' } } },
      }),
      prisma.manga.count({ where }),
    ]);
    const result = manga.map(m => ({
      ...m,
      cover_image: m.coverImage,
      chapters_count: m.chapters.length,
      chapters: m.chapters.map(c => ({ ...c, id: c.id.toString() })),
    }));
    res.json({ manga: result, total, page: parseInt(page), totalPages: Math.ceil(total / take) });
  } catch (error) {
    console.error('Ошибка получения манги:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/manga/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const manga = await prisma.manga.findUnique({
      where: { id },
      include: { chapters: { orderBy: { chapterNumber: 'asc' } } },
    });
    if (!manga) return res.status(404).json({ error: 'Манга не найдена' });
    await prisma.manga.update({ where: { id }, data: { views: { increment: 1 } } });
    const result = { ...manga, cover_image: manga.coverImage, chapters_count: manga.chapters.length };
    res.json(result);
  } catch (error) {
    console.error('Ошибка получения манги:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/manga', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, author, cover_image, status, genres, year } = req.body;
    const newManga = await prisma.manga.create({
      data: {
        title,
        description: description || '',
        coverImage: cover_image || '/uploads/covers/default.png',
        author: author || '',
        status: status || 'ongoing',
        year: year ? parseInt(year) : null,
        genres: genres || [],
        alternativeTitles: [],
      },
    });
    res.status(201).json(newManga);
  } catch (error) {
    console.error('Ошибка создания манги:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.patch('/api/manga/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const { title, description, author, cover_image, status, genres, year } = req.body;
    const updated = await prisma.manga.update({
      where: { id },
      data: {
        title, description, coverImage: cover_image, author, status,
        year: year ? parseInt(year) : null, genres, updatedAt: new Date(),
      },
    });
    res.json(updated);
  } catch (error) {
    console.error('Ошибка обновления манги:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.delete('/api/manga/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await prisma.manga.delete({ where: { id: BigInt(req.params.id) } });
    res.json({ message: 'Манга удалена' });
  } catch (error) {
    console.error('Ошибка удаления манги:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ========== Рейтинг манги ==========
app.post('/api/manga/:id/rate', authenticateToken, async (req, res) => {
  try {
    const mangaId = BigInt(req.params.id);
    const userId = BigInt(req.user.id);
    const { rating } = req.body;
    if (typeof rating !== 'number' || rating < 1 || rating > 10) {
      return res.status(400).json({ message: 'Рейтинг должен быть числом от 1 до 10' });
    }
    await prisma.rating.upsert({
      where: { userId_mangaId: { userId, mangaId } },
      update: { value: rating },
      create: { userId, mangaId, value: rating },
    });
    // Пересчёт среднего рейтинга
    const agg = await prisma.rating.aggregate({
      where: { mangaId },
      _avg: { value: true },
    });
    const avgRating = agg._avg.value || 0;
    await prisma.manga.update({
      where: { id: mangaId },
      data: { rating: avgRating },
    });
    res.json({ message: 'Оценка сохранена', rating: avgRating });
  } catch (error) {
    console.error('Ошибка оценки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/manga/:id/rating', authenticateToken, async (req, res) => {
  try {
    const mangaId = BigInt(req.params.id);
    const userId = BigInt(req.user.id);
    const userRating = await prisma.rating.findUnique({
      where: { userId_mangaId: { userId, mangaId } },
    });
    res.json({ userRating: userRating?.value || 0 });
  } catch (error) {
    console.error('Ошибка получения рейтинга:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ========== Комментарии к манге ==========
app.get('/api/manga/:id/comments', async (req, res) => {
  try {
    const mangaId = BigInt(req.params.id);
    const comments = await prisma.mangaComment.findMany({
      where: { mangaId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { username: true } } },
    });
    res.json(comments.map(c => ({
      id: c.id.toString(),
      content: c.content,
      createdAt: c.createdAt,
      authorName: c.author.username,
    })));
  } catch (error) {
    console.error('Ошибка получения комментариев:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/manga/:id/comments', authenticateToken, async (req, res) => {
  try {
    const mangaId = BigInt(req.params.id);
    const authorId = BigInt(req.user.id);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Комментарий не может быть пустым' });
    const comment = await prisma.mangaComment.create({
      data: { mangaId, authorId, content: content.trim() },
      include: { author: { select: { username: true } } },
    });
    res.status(201).json({
      id: comment.id.toString(),
      content: comment.content,
      createdAt: comment.createdAt,
      authorName: comment.author.username,
    });
  } catch (error) {
    console.error('Ошибка добавления комментария:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ========== Главы и страницы ==========
// ... (существующие эндпоинты глав и страниц остаются без изменений)

app.get('/api/chapters', async (req, res) => {
  try {
    const { page = 1, limit = 100, mangaId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const where = mangaId ? { mangaId: BigInt(mangaId) } : {};
    const [chapters, total] = await Promise.all([
      prisma.chapter.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: { manga: { select: { title: true } } },
      }),
      prisma.chapter.count({ where }),
    ]);
    const result = chapters.map(ch => ({
      ...ch,
      manga_id: ch.mangaId.toString(),
      manga_title: ch.manga?.title,
    }));
    res.json({ chapters: result, total, page: parseInt(page), totalPages: Math.ceil(total / take) });
  } catch (error) {
    console.error('Ошибка получения глав:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/chapters/:id', async (req, res) => {
  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id: parseFloat(req.params.id) },
      include: { manga: true },
    });
    if (!chapter) return res.status(404).json({ error: 'Глава не найдена' });
    res.json(chapter);
  } catch (error) {
    console.error('Ошибка получения главы:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/chapters/:id/pages', async (req, res) => {
  try {
    const chapterId = parseFloat(req.params.id);
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { pages: { orderBy: { pageNumber: 'asc' } } },
    });
    if (!chapter) return res.status(404).json({ error: 'Глава не найдена' });
    await prisma.chapter.update({ where: { id: chapterId }, data: { views: { increment: 1 } } });
    const pages = chapter.pages.map(p => ({ page_number: p.pageNumber, image_url: p.imageUrl }));
    res.json({ chapter_id: chapter.id, manga_id: chapter.mangaId, chapter_number: chapter.chapterNumber, title: chapter.title, pages, total_pages: pages.length });
  } catch (error) {
    console.error('Ошибка получения страниц:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/chapters', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { manga_id, chapter_number, title } = req.body;
    const chapter = await prisma.chapter.create({
      data: {
        id: parseFloat(`${Date.now()}.${Math.floor(Math.random()*1000)}`),
        mangaId: BigInt(manga_id),
        chapterNumber: chapter_number,
        title: title || `Глава ${chapter_number}`,
        pagesCount: 0,
      },
    });
    const chaptersCount = await prisma.chapter.count({ where: { mangaId: BigInt(manga_id) } });
    await prisma.manga.update({ where: { id: BigInt(manga_id) }, data: { chaptersCount } });
    // Создаём уведомления подписчикам (заглушка)
    const usersWithStatus = await prisma.userMangaStatus.findMany({
      where: { mangaId: BigInt(manga_id), status: 'reading' },
      select: { userId: true },
    });
    for (const u of usersWithStatus) {
      await createNotification(u.userId, 'new_chapter', `Вышла новая глава "${chapter.title}"`, `/chapter/${chapter.id}`);
    }
    res.status(201).json(chapter);
  } catch (error) {
    console.error('Ошибка создания главы:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.patch('/api/chapters/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseFloat(req.params.id);
    const { title, chapter_number } = req.body;
    const updated = await prisma.chapter.update({
      where: { id },
      data: { title, chapterNumber: chapter_number, updatedAt: new Date() },
    });
    res.json(updated);
  } catch (error) {
    console.error('Ошибка обновления главы:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.delete('/api/chapters/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseFloat(req.params.id);
    const chapter = await prisma.chapter.findUnique({ where: { id } });
    if (!chapter) return res.status(404).json({ message: 'Глава не найдена' });
    await prisma.chapter.delete({ where: { id } });
    const chaptersCount = await prisma.chapter.count({ where: { mangaId: chapter.mangaId } });
    await prisma.manga.update({ where: { id: chapter.mangaId }, data: { chaptersCount } });
    res.json({ message: 'Глава удалена' });
  } catch (error) {
    console.error('Ошибка удаления главы:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/page/:mangaId/:chapter/:page', (req, res) => {
  const { mangaId, chapter, page } = req.params;
  const cleanPage = page.replace(/\.png$/, '');
  const imagePath = path.join(CHAPTERS_DIR, mangaId, chapter, `${cleanPage}.png`);
  if (fs.existsSync(imagePath)) res.sendFile(imagePath);
  else { res.setHeader('Content-Type', 'image/png'); res.send(emptyPNG); }
});

app.get('/api/cover/:mangaId', (req, res) => {
  const { mangaId } = req.params;
  const coverPath = path.join(COVERS_DIR, `cover-${mangaId}.png`);
  if (fs.existsSync(coverPath)) res.sendFile(coverPath);
  else { res.setHeader('Content-Type', 'image/png'); res.send(emptyPNG); }
});

// ========== Прогресс и статусы ==========
app.get('/api/progress/:mangaId', authenticateToken, async (req, res) => {
  try {
    const mangaId = req.params.mangaId;
    if (!mangaId || mangaId === 'undefined') {
      return res.status(400).json({ message: 'mangaId обязателен' });
    }
    const progress = await prisma.readingProgress.findUnique({
      where: {
        userId_mangaId: { userId: BigInt(req.user.id), mangaId: BigInt(mangaId) },
      },
    });
    res.json(progress || null);
  } catch (error) {
    console.error('Ошибка прогресса:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/progress', authenticateToken, async (req, res) => {
  try {
    const { manga_id, chapter_id, page_number } = req.body;
    const data = { mangaId: BigInt(manga_id), chapterId: parseFloat(chapter_id), pageNumber: page_number || 1 };
    const progress = await prisma.readingProgress.upsert({
      where: { userId_mangaId: { userId: BigInt(req.user.id), mangaId: data.mangaId } },
      update: data,
      create: { userId: BigInt(req.user.id), ...data },
    });
    res.json({ message: 'Прогресс сохранён', progress });
  } catch (error) {
    console.error('Ошибка сохранения прогресса:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/user/:userId/status', async (req, res) => {
  const statuses = await prisma.userMangaStatus.findMany({ where: { userId: BigInt(req.params.userId) } });
  res.json(statuses);
});

app.post('/api/user/:userId/status', authenticateToken, async (req, res) => {
  try {
    const userId = BigInt(req.params.userId);
    if (req.user.id !== userId.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Доступ запрещён' });
    const { mangaId, status } = req.body;
    if (!['reading','planned','dropped','completed'].includes(status)) return res.status(400).json({ message: 'Недопустимый статус' });
    const result = await prisma.userMangaStatus.upsert({
      where: { userId_mangaId: { userId, mangaId: BigInt(mangaId) } },
      update: { status },
      create: { userId, mangaId: BigInt(mangaId), status },
    });
    res.json({ message: 'Статус обновлён', result });
  } catch (error) {
    console.error('Ошибка статуса:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.delete('/api/user/:userId/status/:mangaId', authenticateToken, async (req, res) => {
  try {
    const userId = BigInt(req.params.userId), mangaId = BigInt(req.params.mangaId);
    if (req.user.id !== userId.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Доступ запрещён' });
    await prisma.userMangaStatus.delete({ where: { userId_mangaId: { userId, mangaId } } });
    res.json({ message: 'Статус удалён' });
  } catch (error) {
    console.error('Ошибка удаления статуса:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ========== Уведомления ==========
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: BigInt(req.user.id) },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications);
  } catch (error) {
    console.error('Ошибка получения уведомлений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.notification.updateMany({
      where: { id, userId: BigInt(req.user.id) },
      data: { read: true },
    });
    res.json({ message: 'Прочитано' });
  } catch (error) {
    console.error('Ошибка обновления уведомления:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ========== Админка ==========
app.post('/api/admin/sync', authenticateToken, requireAdmin, async (req, res) => {
  // ... (без изменений)
});

app.post('/api/admin/sync-pages', authenticateToken, requireAdmin, async (req, res) => {
  // ... (без изменений)
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, username: true, email: true, role: true, createdAt: true } });
  res.json(users);
});

app.patch('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await prisma.user.update({ where: { id: BigInt(req.params.id) }, data: { role: req.body.role } });
    res.json(user);
  } catch (error) {
    console.error('Ошибка обновления роли:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: BigInt(req.params.id) } });
    res.json({ message: 'Пользователь удалён' });
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Админ-управление форумом (категории, темы, посты) – добавьте ранее предоставленный код

// ========== Админ: Обратная связь ==========
app.get('/api/admin/feedback', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const feedback = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(feedback);
  } catch (error) {
    console.error('Ошибка получения обратной связи:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.patch('/api/admin/feedback/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const { status } = req.body;
    const updated = await prisma.feedback.update({ where: { id }, data: { status } });
    res.json(updated);
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.delete('/api/admin/feedback/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.feedback.delete({ where: { id } });
    res.json({ message: 'Сообщение удалено' });
  } catch (error) {
    console.error('Ошибка удаления сообщения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/admin/feedback/:id/reply', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    const feedback = await prisma.feedback.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!feedback) return res.status(404).json({ message: 'Сообщение не найдено' });
    // Здесь можно реализовать отправку email через nodemailer
    console.log(`Отправка ответа на ${feedback.email}: ${message}`);
    await prisma.feedback.update({ where: { id: feedback.id }, data: { status: 'replied' } });
    res.json({ message: 'Ответ отправлен' });
  } catch (error) {
    console.error('Ошибка отправки ответа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ========== Форум ==========
app.get('/api/forum_categories', async (req, res) => {
  const categories = await prisma.forumCategory.findMany({ orderBy: { order: 'asc' } });
  res.json(categories);
});

app.get('/api/forum_topics', async (req, res) => {
  const { categoryId, page = 1, limit = 20 } = req.query;
  const where = categoryId ? { categoryId: BigInt(categoryId) } : {};
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  const [topics, total] = await Promise.all([
    prisma.forumTopic.findMany({
      where, skip, take,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: { author: { select: { username: true } }, category: { select: { name: true } } },
    }),
    prisma.forumTopic.count({ where }),
  ]);
  res.json({ topics: topics.map(t => ({ ...t, author_name: t.author?.username, category_name: t.category?.name })), total, page: parseInt(page), totalPages: Math.ceil(total / take) });
});

app.post('/api/forum_topics', authenticateToken, async (req, res) => {
  try {
    const { title, content, categoryId } = req.body;
    const topic = await prisma.forumTopic.create({
      data: {
        title, content,
        categoryId: BigInt(categoryId),
        authorId: BigInt(req.user.id),
      },
    });
    await prisma.forumCategory.update({ where: { id: BigInt(categoryId) }, data: { topicsCount: { increment: 1 } } });
    res.status(201).json(topic);
  } catch (error) {
    console.error('Ошибка создания темы:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/forum_topics/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const topic = await prisma.forumTopic.findUnique({
      where: { id },
      include: {
        author: { select: { username: true } },
        category: true,
        posts: { include: { author: { select: { username: true } } }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!topic) return res.status(404).json({ error: 'Тема не найдена' });
    await prisma.forumTopic.update({ where: { id }, data: { views: { increment: 1 } } });
    res.json({ ...topic, author_name: topic.author?.username, posts: topic.posts.map(p => ({ ...p, author_name: p.author?.username })) });
  } catch (error) {
    console.error('Ошибка получения темы:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/forum_posts', authenticateToken, async (req, res) => {
  try {
    const { topicId, content } = req.body;
    const topic = await prisma.forumTopic.findUnique({ where: { id: BigInt(topicId) } });
    if (!topic) return res.status(404).json({ message: 'Тема не найдена' });
    if (topic.isLocked) return res.status(403).json({ message: 'Тема закрыта' });
    const post = await prisma.forumPost.create({
      data: { content, topicId: BigInt(topicId), authorId: BigInt(req.user.id) },
      include: { author: { select: { username: true } } },
    });
    await prisma.forumTopic.update({ where: { id: BigInt(topicId) }, data: { postsCount: { increment: 1 } } });
    // Уведомление автору темы
    if (topic.authorId !== BigInt(req.user.id)) {
      await createNotification(topic.authorId, 'forum_reply', `${req.user.username} ответил в теме "${topic.title}"`, `/forum/topic/${topicId}`);
    }
    res.status(201).json({ ...post, author_name: post.author.username });
  } catch (error) {
    console.error('Ошибка создания поста:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Лайки постов
app.post('/api/forum_posts/:id/like', authenticateToken, async (req, res) => {
  try {
    const postId = BigInt(req.params.id);
    const userId = BigInt(req.user.id);
    const existing = await prisma.forumPostLike.findUnique({ where: { postId_userId: { postId, userId } } });
    if (existing) return res.status(400).json({ message: 'Вы уже поставили лайк' });
    await prisma.forumPostLike.create({ data: { postId, userId } });
    const post = await prisma.forumPost.update({
      where: { id: postId },
      data: { likes: { increment: 1 } },
      include: { author: { select: { id: true } } },
    });
    // Уведомление автору поста
    if (post.author.id !== userId) {
      await createNotification(post.author.id, 'like', `${req.user.username} поставил лайк вашему посту`, `/forum/topic/${post.topicId}#post-${postId}`);
    }
    res.json({ likes: post.likes });
  } catch (error) {
    console.error('Ошибка лайка:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.delete('/api/forum_posts/:id/like', authenticateToken, async (req, res) => {
  try {
    const postId = BigInt(req.params.id);
    const userId = BigInt(req.user.id);
    await prisma.forumPostLike.delete({ where: { postId_userId: { postId, userId } } });
    const post = await prisma.forumPost.update({
      where: { id: postId },
      data: { likes: { decrement: 1 } },
    });
    res.json({ likes: post.likes });
  } catch (error) {
    console.error('Ошибка удаления лайка:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Публичные данные для главной страницы
app.get('/api/forum/posts/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const posts = await prisma.forumPost.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { username: true } },
        topic: { select: { title: true } },
      },
    });
    res.json(posts.map(p => ({
      id: p.id.toString(),
      topicId: p.topicId.toString(),
      topicTitle: p.topic.title,
      authorName: p.author.username,
      createdAt: p.createdAt,
    })));
  } catch (error) {
    console.error('Ошибка получения последних постов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/forum/topics/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const topics = await prisma.forumTopic.findMany({
      take: limit,
      orderBy: { postsCount: 'desc' },
    });
    res.json(topics);
  } catch (error) {
    console.error('Ошибка получения популярных тем:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ========== Обратная связь ==========
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const feedback = await prisma.feedback.create({ data: { name, email, message, ip: req.ip } });
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Ошибка отправки feedback:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить главы манги
app.get('/api/manga/:id/chapters', async (req, res) => {
  try {
    const mangaId = BigInt(req.params.id);
    const chapters = await prisma.chapter.findMany({
      where: { mangaId },
      orderBy: { chapterNumber: 'asc' },
    });
    res.json(chapters);
  } catch (error) {
    console.error('Ошибка получения глав манги:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ========== Запуск ==========
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});