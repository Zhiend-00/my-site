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
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import multer from 'multer';
import AdmZip from 'adm-zip';
import XLSX from 'xlsx';

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

// Почтовый транспорт
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const upload = multer({ dest: 'uploads/temp/' });

async function sendVerificationEmail(email, token) {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Подтверждение Email на Forgotten Team',
    html: `<h2>Подтверждение регистрации</h2><p>Перейдите по ссылке:</p><a href="${verificationUrl}">${verificationUrl}</a>`,
  });
}

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Восстановление пароля на Forgotten Team',
    html: `<h2>Сброс пароля</h2><p>Перейдите по ссылке:</p><a href="${resetUrl}">${resetUrl}</a><p>Ссылка действительна 1 час.</p>`,
  });
}

async function sendAdminFeedbackNotification(feedback) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('⚠️ ADMIN_EMAIL не задан в .env, уведомление не отправлено');
    return; // молча выходим, но не ломаем запрос
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: adminEmail,
      subject: `Новое сообщение от ${feedback.name}`,
      html: `
        <h2>Новое сообщение из формы обратной связи</h2>
        <p><strong>Имя:</strong> ${feedback.name}</p>
        <p><strong>Email:</strong> ${feedback.email}</p>
        <p><strong>Сообщение:</strong></p>
        <p>${feedback.message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p>Просмотреть в админ-панели: <a href="${process.env.FRONTEND_URL}/admin">${process.env.FRONTEND_URL}/admin</a></p>
      `,
    });
    console.log(`📧 Уведомление о новом сообщении отправлено на ${adminEmail}`);
  } catch (error) {
    console.error('❌ Ошибка отправки уведомления администратору:', error);
    throw new Error('Не удалось отправить письмо администратору. Проверьте настройки почты.');
  }
}

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

const requireVerified = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  if (!req.user || !req.user.emailVerified) {
    return res.status(403).json({ message: 'Подтвердите email для доступа к этому действию' });
  }
  next();
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, emailVerified: user.emailVerified },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

async function createNotification(userId, type, message, link = null) {
  try {
    await prisma.notification.create({
      data: { userId: BigInt(userId), type, message, link }
    });
  } catch (e) {
    console.error('Ошибка создания уведомления:', e);
  }
}

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(PUBLIC_DIR));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ========== Аутентификация ==========
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email и пароль обязательны' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Пользователь уже существует' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const newUser = await prisma.user.create({
      data: {
        username: username || email.split('@')[0],
        email,
        password: hashedPassword,
        avatar: '/uploads/avatars/default.png',
        role: 'user',
        verificationToken,
        emailVerified: false,
      },
    });
    sendVerificationEmail(email, verificationToken).catch(err => console.error('Ошибка отправки:', err));
    res.status(201).json({ message: 'Регистрация успешна. Проверьте почту для подтверждения email.', email });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/auth/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'Токен не предоставлен' });
  const user = await prisma.user.findUnique({ where: { verificationToken: token } });
  if (!user) return res.status(400).json({ message: 'Недействительный токен' });
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null },
  });
  res.json({ message: 'Email успешно подтверждён' });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email обязателен' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ message: 'Если email зарегистрирован, на него отправлена инструкция' });
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 3600000);
  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordToken: resetToken, resetPasswordExpires: resetExpires },
  });
  await sendPasswordResetEmail(email, resetToken);
  res.json({ message: 'Инструкция по сбросу пароля отправлена на email' });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: 'Токен и пароль обязательны' });
  const user = await prisma.user.findUnique({ where: { resetPasswordToken: token } });
  if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    return res.status(400).json({ message: 'Токен недействителен или истёк' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null },
  });
  res.json({ message: 'Пароль успешно изменён' });
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
  const user = await prisma.user.findUnique({
    where: { id: BigInt(req.user.id) },
    include: { favorites: true, userMangaStatus: true },
  });
  if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
  const { password, ...rest } = user;
  res.json(rest);
});

// ========== Манга ==========
app.get('/api/manga', async (req, res) => {
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
});

app.get('/api/manga/:id', async (req, res) => {
  const id = BigInt(req.params.id);
  const manga = await prisma.manga.findUnique({
    where: { id },
    include: { chapters: { orderBy: { chapterNumber: 'asc' } } },
  });
  if (!manga) return res.status(404).json({ error: 'Манга не найдена' });
  await prisma.manga.update({ where: { id }, data: { views: { increment: 1 } } });
  const result = { ...manga, cover_image: manga.coverImage, chapters_count: manga.chapters.length };
  res.json(result);
});

app.post('/api/manga', authenticateToken, requireAdmin, async (req, res) => {
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
});

app.patch('/api/manga/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = BigInt(req.params.id);
  const { title, description, author, cover_image, status, genres, year } = req.body;
  const updated = await prisma.manga.update({
    where: { id },
    data: { title, description, coverImage: cover_image, author, status, year: year ? parseInt(year) : null, genres, updatedAt: new Date() },
  });
  res.json(updated);
});

app.delete('/api/manga/:id', authenticateToken, requireAdmin, async (req, res) => {
  await prisma.manga.delete({ where: { id: BigInt(req.params.id) } });
  res.json({ message: 'Манга удалена' });
});

// Подписка на мангу
app.post('/api/manga/:id/subscribe', authenticateToken, async (req, res) => {
  try {
    const mangaId = BigInt(req.params.id);
    const userId = BigInt(req.user.id);
    const existing = await prisma.chapterSubscription.findUnique({
      where: { userId_mangaId: { userId, mangaId } }
    });
    if (existing) {
      await prisma.chapterSubscription.delete({ where: { id: existing.id } });
      res.json({ subscribed: false, message: 'Подписка отменена' });
    } else {
      await prisma.chapterSubscription.create({ data: { userId, mangaId } });
      res.json({ subscribed: true, message: 'Подписка оформлена' });
    }
  } catch (error) {
    console.error('Ошибка подписки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/manga/:id/subscription', authenticateToken, async (req, res) => {
  const mangaId = BigInt(req.params.id);
  const userId = BigInt(req.user.id);
  const sub = await prisma.chapterSubscription.findUnique({
    where: { userId_mangaId: { userId, mangaId } }
  });
  res.json({ subscribed: !!sub });
});

// Рейтинг
app.post('/api/manga/:id/rate', authenticateToken, requireVerified, async (req, res) => {
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
  const agg = await prisma.rating.aggregate({ where: { mangaId }, _avg: { value: true } });
  const avgRating = agg._avg.value || 0;
  await prisma.manga.update({ where: { id: mangaId }, data: { rating: avgRating } });
  res.json({ message: 'Оценка сохранена', rating: avgRating });
});

// Комментарии к манге
app.get('/api/manga/:id/comments', async (req, res) => {
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
});

app.post('/api/manga/:id/comments', authenticateToken, requireVerified, async (req, res) => {
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
});

// ========== Главы ==========
app.get('/api/chapters', async (req, res) => {
  const { page = 1, limit = 100, mangaId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  const where = mangaId ? { mangaId: BigInt(mangaId) } : {};
  const [chapters, total] = await Promise.all([
    prisma.chapter.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { manga: { select: { title: true } } } }),
    prisma.chapter.count({ where }),
  ]);
  const result = chapters.map(ch => ({
    ...ch,
    manga_id: ch.mangaId.toString(),
    manga_title: ch.manga?.title,
  }));
  res.json({ chapters: result, total, page: parseInt(page), totalPages: Math.ceil(total / take) });
});

app.get('/api/chapters/:id', async (req, res) => {
  const chapter = await prisma.chapter.findUnique({
    where: { id: parseFloat(req.params.id) },
    include: { manga: true },
  });
  if (!chapter) return res.status(404).json({ error: 'Глава не найдена' });
  res.json(chapter);
});

app.get('/api/chapters/:id/pages', async (req, res) => {
  const chapterId = parseFloat(req.params.id);
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, include: { pages: { orderBy: { pageNumber: 'asc' } } } });
  if (!chapter) return res.status(404).json({ error: 'Глава не найдена' });
  await prisma.chapter.update({ where: { id: chapterId }, data: { views: { increment: 1 } } });
  const pages = chapter.pages.map(p => ({ page_number: p.pageNumber, image_url: p.imageUrl }));
  res.json({ chapter_id: chapter.id, manga_id: chapter.mangaId, chapter_number: chapter.chapterNumber, title: chapter.title, pages, total_pages: pages.length });
});

app.post('/api/chapters', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { manga_id, chapter_number, title } = req.body;
    const manga = await prisma.manga.findUnique({ where: { id: BigInt(manga_id) } });
    if (!manga) return res.status(404).json({ message: 'Манга не найдена' });
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

    // Уведомления подписчикам
    const subscribers = await prisma.chapterSubscription.findMany({
      where: { mangaId: BigInt(manga_id) },
      select: { userId: true }
    });
    for (const sub of subscribers) {
      await createNotification(
        sub.userId,
        'new_chapter',
        `Вышла новая глава "${chapter.title}" манги "${manga.title}"`,
        `/chapter/${chapter.id}`
      );
    }
    const readingUsers = await prisma.userMangaStatus.findMany({
      where: { mangaId: BigInt(manga_id), status: 'reading' },
      select: { userId: true },
    });
    for (const u of readingUsers) {
      await createNotification(u.userId, 'new_chapter', `Вышла новая глава "${chapter.title}"`, `/chapter/${chapter.id}`);
    }

    res.status(201).json(chapter);
  } catch (error) {
    console.error('Ошибка создания главы:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.patch('/api/chapters/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = parseFloat(req.params.id);
  const { title, chapter_number } = req.body;
  const updated = await prisma.chapter.update({
    where: { id },
    data: { title, chapterNumber: chapter_number, updatedAt: new Date() },
  });
  res.json(updated);
});

app.delete('/api/chapters/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = parseFloat(req.params.id);
  const chapter = await prisma.chapter.findUnique({ where: { id } });
  if (!chapter) return res.status(404).json({ message: 'Глава не найдена' });
  await prisma.chapter.delete({ where: { id } });
  const chaptersCount = await prisma.chapter.count({ where: { mangaId: chapter.mangaId } });
  await prisma.manga.update({ where: { id: chapter.mangaId }, data: { chaptersCount } });
  res.json({ message: 'Глава удалена' });
});

// ========== Прогресс и статусы ==========
app.get('/api/progress/:mangaId', authenticateToken, async (req, res) => {
  const mangaId = req.params.mangaId;
  if (!mangaId || mangaId === 'undefined') return res.status(400).json({ message: 'mangaId обязателен' });
  const progress = await prisma.readingProgress.findUnique({
    where: { userId_mangaId: { userId: BigInt(req.user.id), mangaId: BigInt(mangaId) } },
  });
  res.json(progress || null);
});

app.get('/api/progress', authenticateToken, async (req, res) => {
  const progress = await prisma.readingProgress.findMany({
    where: { userId: BigInt(req.user.id) },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(progress);
});

app.post('/api/progress', authenticateToken, async (req, res) => {
  const { manga_id, chapter_id, page_number } = req.body;
  if (!manga_id || !chapter_id) return res.status(400).json({ message: 'manga_id и chapter_id обязательны' });
  const progress = await prisma.readingProgress.upsert({
    where: { userId_mangaId: { userId: BigInt(req.user.id), mangaId: BigInt(manga_id) } },
    update: { chapterId: parseFloat(chapter_id), pageNumber: page_number || 1 },
    create: { userId: BigInt(req.user.id), mangaId: BigInt(manga_id), chapterId: parseFloat(chapter_id), pageNumber: page_number || 1 },
  });
  res.json({ message: 'Прогресс сохранён', progress });
});

app.get('/api/user/:userId/status', async (req, res) => {
  const statuses = await prisma.userMangaStatus.findMany({ where: { userId: BigInt(req.params.userId) } });
  res.json(statuses);
});

app.post('/api/user/:userId/status', authenticateToken, async (req, res) => {
  const userId = BigInt(req.params.userId);
  if (req.user.id !== userId.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Доступ запрещён' });
  const { mangaId, status } = req.body;
  if (!['reading', 'planned', 'dropped', 'completed'].includes(status)) return res.status(400).json({ message: 'Недопустимый статус' });
  const result = await prisma.userMangaStatus.upsert({
    where: { userId_mangaId: { userId, mangaId: BigInt(mangaId) } },
    update: { status },
    create: { userId, mangaId: BigInt(mangaId), status },
  });
  res.json({ message: 'Статус обновлён', result });
});

// ========== Уведомления ==========
app.get('/api/notifications', authenticateToken, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: BigInt(req.user.id) },
    orderBy: { createdAt: 'desc' },
  });
  res.json(notifications);
});

app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: BigInt(req.params.id), userId: BigInt(req.user.id) },
    data: { read: true },
  });
  res.json({ message: 'Прочитано' });
});

// ========== Форум (публичное API) ==========
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

app.post('/api/forum_topics', authenticateToken, requireVerified, async (req, res) => {
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
});

app.get('/api/forum_topics/:id', async (req, res) => {
  const topic = await prisma.forumTopic.findUnique({
    where: { id: BigInt(req.params.id) },
    include: {
      author: { select: { username: true } },
      category: true,
      posts: { include: { author: { select: { username: true } } }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!topic) return res.status(404).json({ error: 'Тема не найдена' });
  await prisma.forumTopic.update({ where: { id: BigInt(req.params.id) }, data: { views: { increment: 1 } } });
  res.json({ ...topic, author_name: topic.author?.username, posts: topic.posts.map(p => ({ ...p, author_name: p.author?.username })) });
});

app.post('/api/forum_posts', authenticateToken, requireVerified, async (req, res) => {
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
    if (topic.authorId !== BigInt(req.user.id)) {
      await createNotification(topic.authorId, 'forum_reply', `${req.user.username} ответил в теме "${topic.title}"`, `/forum/topic/${topicId}`);
    }
    res.status(201).json({ ...post, author_name: post.author.username });
  } catch (error) {
    console.error('Ошибка создания поста:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Последние посты форума
app.get('/api/forum/posts/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const posts = await prisma.forumPost.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { username: true } },
        topic: { select: { title: true, id: true } },
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

// Популярные темы
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

// ========== Админские маршруты ==========
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, username: true, email: true, role: true, createdAt: true } });
  res.json(users);
});

app.patch('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const user = await prisma.user.update({ where: { id: BigInt(req.params.id) }, data: { role: req.body.role } });
  res.json(user);
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  await prisma.user.delete({ where: { id: BigInt(req.params.id) } });
  res.json({ message: 'Пользователь удалён' });
});

app.get('/api/admin/forum/categories', authenticateToken, requireAdmin, async (req, res) => {
  const categories = await prisma.forumCategory.findMany({ orderBy: { order: 'asc' } });
  res.json(categories);
});

app.post('/api/admin/forum/categories', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, slug, icon, order } = req.body;
  const category = await prisma.forumCategory.create({
    data: { name, description, slug, icon, order },
  });
  res.status(201).json(category);
});

app.patch('/api/admin/forum/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = BigInt(req.params.id);
  const updated = await prisma.forumCategory.update({ where: { id }, data: req.body });
  res.json(updated);
});

app.delete('/api/admin/forum/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  await prisma.forumCategory.delete({ where: { id: BigInt(req.params.id) } });
  res.json({ message: 'Категория удалена' });
});

app.get('/api/admin/forum/topics', authenticateToken, requireAdmin, async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  const [topics, total] = await Promise.all([
    prisma.forumTopic.findMany({ skip, take, orderBy: { createdAt: 'desc' }, include: { author: { select: { username: true } } } }),
    prisma.forumTopic.count(),
  ]);
  res.json({ topics, total, page: parseInt(page), totalPages: Math.ceil(total / take) });
});

app.patch('/api/admin/forum/topics/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = BigInt(req.params.id);
  const updated = await prisma.forumTopic.update({ where: { id }, data: req.body });
  res.json(updated);
});

app.delete('/api/admin/forum/topics/:id', authenticateToken, requireAdmin, async (req, res) => {
  await prisma.forumTopic.delete({ where: { id: BigInt(req.params.id) } });
  res.json({ message: 'Тема удалена' });
});

app.get('/api/admin/forum/posts', authenticateToken, requireAdmin, async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  const [posts, total] = await Promise.all([
    prisma.forumPost.findMany({ skip, take, orderBy: { createdAt: 'desc' }, include: { author: { select: { username: true } }, topic: { select: { title: true } } } }),
    prisma.forumPost.count(),
  ]);
  res.json({ posts, total, page: parseInt(page), totalPages: Math.ceil(total / take) });
});

app.delete('/api/admin/forum/posts/:id', authenticateToken, requireAdmin, async (req, res) => {
  await prisma.forumPost.delete({ where: { id: BigInt(req.params.id) } });
  res.json({ message: 'Пост удалён' });
});

app.get('/api/admin/feedback', authenticateToken, requireAdmin, async (req, res) => {
  const feedback = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(feedback);
});

app.patch('/api/admin/feedback/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const updated = await prisma.feedback.update({ where: { id: BigInt(req.params.id) }, data: { status } });
  res.json(updated);
});

app.delete('/api/admin/feedback/:id', authenticateToken, requireAdmin, async (req, res) => {
  await prisma.feedback.delete({ where: { id: BigInt(req.params.id) } });
  res.json({ message: 'Удалено' });
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Сохраняем в БД
    const feedback = await prisma.feedback.create({
      data: { name, email, message, ip: req.ip }
    });

    // Пытаемся отправить письмо
    try {
      await sendAdminFeedbackNotification(feedback);
    } catch (emailError) {
      // Письмо не ушло – возвращаем ошибку клиенту
      console.error('Ошибка отправки уведомления:', emailError);
      return res.status(500).json({
        message: 'Ваше сообщение сохранено, но уведомление администратору отправить не удалось. Попробуйте позже.'
      });
    }

    // Всё прошло успешно
    res.status(201).json({
      message: 'Сообщение отправлено! Администратор получит уведомление на почту.',
      feedback
    });
  } catch (error) {
    console.error('Ошибка отправки feedback:', error);
    res.status(500).json({ message: 'Ошибка сервера при сохранении сообщения.' });
  }
});

// server/server.js (фрагмент)

// Ответ администратора на сообщение (отправка email пользователю)
app.post('/api/admin/feedback/:id/reply', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Текст ответа не может быть пустым' });
    }

    const feedbackId = BigInt(req.params.id);
    const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) {
      return res.status(404).json({ message: 'Сообщение не найдено' });
    }

    // Отправляем письмо пользователю
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: feedback.email,
        subject: 'Ответ от администрации Forgotten Team',
        text: message,
        html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
      });
    } catch (emailError) {
      console.error('❌ Ошибка при отправке ответа пользователю:', emailError);
      return res.status(500).json({ 
        message: 'Не удалось отправить письмо. Проверьте настройки почты на сервере.' 
      });
    }

    // Помечаем сообщение как отвеченное
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status: 'replied' },
    });

    res.json({ message: 'Ответ отправлен на почту пользователю.' });
  } catch (error) {
    console.error('Ошибка в маршруте reply:', error);
    res.status(500).json({ message: 'Ошибка сервера при отправке ответа.' });
  }
});

app.post('/api/admin/upload-chapter', authenticateToken, requireAdmin, upload.single('pages'), async (req, res) => {
  try {
    const { mangaId, chapterNumber, title } = req.body;
    if (!mangaId || !chapterNumber) return res.status(400).json({ message: 'mangaId и chapterNumber обязательны' });
    if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });
    const manga = await prisma.manga.findUnique({ where: { id: BigInt(mangaId) } });
    if (!manga) return res.status(404).json({ message: 'Манга не найдена' });
    const chapterDir = path.join(CHAPTERS_DIR, mangaId.toString(), `chapter${chapterNumber}`);
    if (!fs.existsSync(chapterDir)) fs.mkdirSync(chapterDir, { recursive: true });
    const zip = new AdmZip(req.file.path);
    const entries = zip.getEntries();
    let pageNumber = 1;
    const pagesData = [];
    entries.forEach(entry => {
      if (!entry.isDirectory) {
        const ext = path.extname(entry.entryName).toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
          const fileName = `${pageNumber}${ext}`;
          fs.writeFileSync(path.join(chapterDir, fileName), entry.getData());
          pagesData.push({
            pageNumber: pageNumber,
            imageUrl: `/uploads/chapters/${mangaId}/chapter${chapterNumber}/${fileName}`,
          });
          pageNumber++;
        }
      }
    });
    fs.unlinkSync(req.file.path);
    const chapter = await prisma.chapter.create({
      data: {
        id: parseFloat(`${Date.now()}.${Math.floor(Math.random()*1000)}`),
        mangaId: BigInt(mangaId),
        chapterNumber: parseInt(chapterNumber),
        title: title || `Глава ${chapterNumber}`,
        pagesCount: pagesData.length,
      },
    });
    for (const page of pagesData) {
      await prisma.page.create({
        data: {
          chapterId: chapter.id,
          pageNumber: page.pageNumber,
          imageUrl: page.imageUrl,
        },
      });
    }
    const chaptersCount = await prisma.chapter.count({ where: { mangaId: BigInt(mangaId) } });
    await prisma.manga.update({ where: { id: BigInt(mangaId) }, data: { chaptersCount } });
    res.json({ message: 'Глава загружена', chapter });
  } catch (error) {
    console.error('Ошибка загрузки главы:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/admin/import-manga', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    let imported = 0;
    for (const row of rows) {
      await prisma.manga.create({
        data: {
          title: row['Название'] || '',
          alternativeTitles: row['Альтернативные названия'] ? String(row['Альтернативные названия']).split(',').map(s => s.trim()) : [],
          description: row['Описание'] || '',
          author: row['Автор'] || '',
          artist: row['Художник'] || '',
          status: row['Статус'] || 'ongoing',
          year: row['Год'] ? parseInt(row['Год']) : null,
          genres: row['Жанры'] ? String(row['Жанры']).split(',').map(g => g.trim()) : [],
          coverImage: row['Обложка'] || '',
        },
      });
      imported++;
    }
    fs.unlinkSync(req.file.path);
    res.json({ message: `Импортировано ${imported} записей` });
  } catch (err) {
    console.error('Ошибка импорта:', err);
    res.status(500).json({ message: 'Ошибка импорта из Excel: ' + err.message });
  }
});

app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  const [usersCount, mangaCount, viewsTotal, popular] = await Promise.all([
    prisma.user.count(),
    prisma.manga.count(),
    prisma.manga.aggregate({ _sum: { views: true } }),
    prisma.manga.findMany({ orderBy: { views: 'desc' }, take: 5, select: { title: true, views: true } }),
  ]);
  res.json({ users: usersCount, manga: mangaCount, totalViews: viewsTotal._sum.views || 0, popular });
});

// Синхронизация (заглушка)
app.post('/api/admin/sync', authenticateToken, requireAdmin, async (req, res) => {
  res.json({ message: 'Синхронизация выполнена (функционал в разработке)' });
});

// Дефолтная обложка
app.get('/api/cover/default', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.send(emptyPNG);
});

// Отдача обложек по ID манги
// Список глав конкретной манги
app.get('/api/manga/:id/chapters', async (req, res) => {
  const mangaId = BigInt(req.params.id);
  const chapters = await prisma.chapter.findMany({
    where: { mangaId },
    orderBy: { chapterNumber: 'asc' },
    select: { id: true, chapterNumber: true, title: true, pagesCount: true, createdAt: true },
  });
  res.json(chapters);
});
// Запуск
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});