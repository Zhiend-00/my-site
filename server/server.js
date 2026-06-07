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

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, 'uploads/temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
               file.mimetype === 'application/vnd.ms-excel' ||
               file.originalname.endsWith('.xlsx') || 
               file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Неверный формат файла'), false);
    }
  }
});

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
    return;
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
};

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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
  try {
    const { title, description, author, cover_image, status, genres, year, alternative_titles, artist } = req.body;
    
    const newManga = await prisma.manga.create({
      data: {
        title,
        description: description || '',
        coverImage: cover_image || '/uploads/covers/default.png',
        author: author || '',
        artist: artist || '',
        status: status || 'ongoing',
        year: year ? parseInt(year) : null,
        genres: genres || [],
        alternativeTitles: alternative_titles || [],
      },
    });
    
    res.status(201).json(newManga);
  } catch (error) {
    console.error('Ошибка создания манги:', error);
    res.status(500).json({ message: 'Ошибка создания манги: ' + error.message });
  }
});

app.patch('/api/manga/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = BigInt(req.params.id);
  const { title, description, author, cover_image, status, genres, year, artist, alternative_titles } = req.body;
  const updated = await prisma.manga.update({
    where: { id },
    data: { 
      title, 
      description, 
      coverImage: cover_image, 
      author, 
      artist,
      status, 
      year: year ? parseInt(year) : null, 
      genres, 
      alternativeTitles: alternative_titles,
      updatedAt: new Date() 
    },
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
  try {
    const id = parseFloat(req.params.id);
    const { title, chapter_number, manga_id } = req.body;
    
    // Проверяем, существует ли глава
    const existingChapter = await prisma.chapter.findUnique({ where: { id } });
    if (!existingChapter) {
      return res.status(404).json({ message: 'Глава не найдена' });
    }
    
    // Проверяем, не существует ли уже глава с таким номером в этой манге
    if (chapter_number && chapter_number !== existingChapter.chapterNumber) {
      const duplicate = await prisma.chapter.findFirst({
        where: {
          mangaId: existingChapter.mangaId,
          chapterNumber: chapter_number,
          id: { not: id }
        }
      });
      if (duplicate) {
        return res.status(400).json({ message: 'Глава с таким номером уже существует в этой манге' });
      }
    }
    
    const updated = await prisma.chapter.update({
      where: { id },
      data: { 
        title: title !== undefined ? title : existingChapter.title,
        chapterNumber: chapter_number !== undefined ? chapter_number : existingChapter.chapterNumber,
        updatedAt: new Date() 
      },
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Ошибка обновления главы:', error);
    res.status(500).json({ message: 'Ошибка сервера: ' + error.message });
  }
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

// ========== ЗАГРУЗКА ГЛАВЫ ZIP (исправленная) ==========
app.post('/api/admin/upload-chapter', authenticateToken, requireAdmin, upload.single('pages'), async (req, res) => {
  try {
    console.log('📤 Начало загрузки главы...');
    console.log('Body:', req.body);
    console.log('File:', req.file ? req.file.originalname : 'нет файла');
    
    const { mangaId, chapterNumber, title } = req.body;
    
    if (!mangaId || !chapterNumber) {
      return res.status(400).json({ message: 'mangaId и chapterNumber обязательны' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    const manga = await prisma.manga.findUnique({ where: { id: BigInt(mangaId) } });
    if (!manga) {
      return res.status(404).json({ message: 'Манга не найдена' });
    }

    // ПРОВЕРЯЕМ, существует ли уже такая глава
    const existingChapter = await prisma.chapter.findFirst({
      where: {
        mangaId: BigInt(mangaId),
        chapterNumber: parseInt(chapterNumber)
      }
    });

    if (existingChapter) {
      // Если глава существует, удаляем старые страницы и перезаписываем
      console.log(`⚠️ Глава ${chapterNumber} уже существует, обновляем...`);
      await prisma.page.deleteMany({ where: { chapterId: existingChapter.id } });
      
      const chapterDir = path.join(CHAPTERS_DIR, mangaId.toString(), `chapter${chapterNumber}`);
      if (fs.existsSync(chapterDir)) {
        fs.rmSync(chapterDir, { recursive: true, force: true });
      }
      fs.mkdirSync(chapterDir, { recursive: true });
      
      const zip = new AdmZip(req.file.path);
      const entries = zip.getEntries();
      
      const imageEntries = entries.filter(entry => {
        const ext = path.extname(entry.entryName).toLowerCase();
        return !entry.isDirectory && ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext);
      });
      
      imageEntries.sort((a, b) => {
        const aName = path.basename(a.entryName);
        const bName = path.basename(b.entryName);
        return aName.localeCompare(bName, undefined, { numeric: true });
      });

      let pageNumber = 1;
      const pagesData = [];
      
      for (const entry of imageEntries) {
        const ext = path.extname(entry.entryName).toLowerCase();
        const fileName = `${pageNumber}${ext}`;
        const filePath = path.join(chapterDir, fileName);
        fs.writeFileSync(filePath, entry.getData());
        pagesData.push({
          pageNumber: pageNumber,
          imageUrl: `/uploads/chapters/${mangaId}/chapter${chapterNumber}/${fileName}`,
        });
        pageNumber++;
      }

      // Обновляем существующую главу
      const updatedChapter = await prisma.chapter.update({
        where: { id: existingChapter.id },
        data: {
          title: title || `Глава ${chapterNumber}`,
          pagesCount: pagesData.length,
          updatedAt: new Date()
        }
      });

      for (const page of pagesData) {
        await prisma.page.create({
          data: {
            chapterId: existingChapter.id,
            pageNumber: page.pageNumber,
            imageUrl: page.imageUrl,
          },
        });
      }

      fs.unlinkSync(req.file.path);
      
      console.log(`✅ Глава ${chapterNumber} обновлена, страниц: ${pagesData.length}`);
      
      return res.json({ 
        message: `Глава ${chapterNumber} обновлена (${pagesData.length} стр.)`, 
        chapter: updatedChapter
      });
    }

    // Новая глава - создаем с нуля
    const chapterDir = path.join(CHAPTERS_DIR, mangaId.toString(), `chapter${chapterNumber}`);
    if (!fs.existsSync(chapterDir)) {
      fs.mkdirSync(chapterDir, { recursive: true });
    }

    const zip = new AdmZip(req.file.path);
    const entries = zip.getEntries();
    
    const imageEntries = entries.filter(entry => {
      const ext = path.extname(entry.entryName).toLowerCase();
      return !entry.isDirectory && ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext);
    });
    
    imageEntries.sort((a, b) => {
      const aName = path.basename(a.entryName);
      const bName = path.basename(b.entryName);
      return aName.localeCompare(bName, undefined, { numeric: true });
    });

    if (imageEntries.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'В ZIP архиве нет изображений' });
    }

    let pageNumber = 1;
    const pagesData = [];
    
    for (const entry of imageEntries) {
      const ext = path.extname(entry.entryName).toLowerCase();
      const fileName = `${pageNumber}${ext}`;
      const filePath = path.join(chapterDir, fileName);
      fs.writeFileSync(filePath, entry.getData());
      pagesData.push({
        pageNumber: pageNumber,
        imageUrl: `/uploads/chapters/${mangaId}/chapter${chapterNumber}/${fileName}`,
      });
      pageNumber++;
    }

    fs.unlinkSync(req.file.path);

    // Генерируем уникальный ID для главы
    const chapterId = parseFloat(`${Date.now()}.${Math.floor(Math.random()*10000)}`);
    
    const chapter = await prisma.chapter.create({
      data: {
        id: chapterId,
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
    await prisma.manga.update({ 
      where: { id: BigInt(mangaId) }, 
      data: { chaptersCount } 
    });

    console.log(`✅ Новая глава ${chapterNumber} создана, страниц: ${pagesData.length}`);
    
    res.json({ 
      message: `Глава ${chapterNumber} успешно загружена (${pagesData.length} стр.)`, 
      chapter: {
        id: chapter.id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        pagesCount: chapter.pagesCount
      }
    });
  } catch (error) {
    console.error('❌ Ошибка загрузки главы:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Ошибка сервера: ' + error.message });
  }
});

// ========== ИМПОРТ ИЗ EXCEL (исправленный) ==========
app.post('/api/admin/import-manga', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    console.log('📥 Начало импорта из Excel...');
    
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    // Читаем Excel файл
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    
    console.log(`📊 Найдено ${rows.length} записей для импорта`);
    
    let imported = 0;
    let errors = [];
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Получаем название (поддерживаем разные варианты)
        let title = row['title'] || row['Название'] || row['название'] || '';
        title = String(title).trim();
        
        if (!title) {
          errors.push(`Строка ${i + 2}: отсутствует название`);
          continue;
        }

        // Проверяем, существует ли уже такая манга
        const existing = await prisma.manga.findFirst({
          where: { title: title }
        });

        if (existing) {
          console.log(`⚠️ Манга "${title}" уже существует, пропускаем`);
          skipped++;
          continue;
        }

        // Парсим альтернативные названия
        let alternativeTitles = [];
        const altTitlesRaw = row['alternative_titles'] || row['Альтернативные названия'] || '';
        if (altTitlesRaw) {
          const altStr = String(altTitlesRaw);
          alternativeTitles = altStr.split(',').map(s => s.trim().replace(/[\[\]"]/g, '')).filter(s => s);
        }

        // Парсим описание
        let description = row['description'] || row['Описание'] || '';
        description = String(description).trim();

        // Парсим обложку
        let coverImage = row['cover_image'] || row['Обложка'] || '';
        coverImage = String(coverImage).trim();
        if (!coverImage || coverImage === '') {
          coverImage = '/uploads/covers/default.png';
        }

        // Парсим автора
        let author = row['author'] || row['Автор'] || '';
        author = String(author).trim();

        // Парсим художника
        let artist = row['artist'] || row['Художник'] || '';
        artist = String(artist).trim();

        // Парсим статус
        let status = row['status'] || row['Статус'] || 'ongoing';
        status = String(status).toLowerCase().trim();
        if (!['ongoing', 'completed', 'hiatus', 'cancelled'].includes(status)) {
          status = 'ongoing';
        }

        // Парсим год
        let year = null;
        const yearRaw = row['year'] || row['Год'];
        if (yearRaw && !isNaN(parseInt(yearRaw))) {
          year = parseInt(yearRaw);
        }

        // Парсим жанры
        let genres = [];
        const genresRaw = row['genres'] || row['Жанры'] || '';
        if (genresRaw) {
          const genresStr = String(genresRaw);
          genres = genresStr.split(',').map(g => g.trim().replace(/[\[\]"]/g, '')).filter(g => g);
        }

        // Парсим рейтинг
        let rating = 0;
        const ratingRaw = row['rating'] || row['Рейтинг'];
        if (ratingRaw && !isNaN(parseFloat(ratingRaw))) {
          rating = parseFloat(ratingRaw);
        }

        // Парсим просмотры
        let views = 0;
        const viewsRaw = row['views'] || row['Просмотры'];
        if (viewsRaw && !isNaN(parseInt(viewsRaw))) {
          views = parseInt(viewsRaw);
        }

        // Парсим количество глав
        let chaptersCount = 0;
        const chaptersCountRaw = row['chapters_count'] || row['Количество глав'];
        if (chaptersCountRaw && !isNaN(parseInt(chaptersCountRaw))) {
          chaptersCount = parseInt(chaptersCountRaw);
        }

        const mangaData = {
          title: title,
          alternativeTitles: alternativeTitles,
          description: description,
          coverImage: coverImage,
          author: author,
          artist: artist,
          status: status,
          year: year,
          genres: genres,
          rating: rating,
          views: BigInt(views),
          chaptersCount: chaptersCount,
        };

        await prisma.manga.create({ data: mangaData });
        imported++;
        console.log(`✅ Импортирована: ${title}`);

      } catch (rowError) {
        console.error(`❌ Ошибка в строке ${i + 2}:`, rowError);
        errors.push(`Строка ${i + 2}: ${rowError.message}`);
      }
    }

    // Удаляем временный файл
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.log(`🎉 Импорт завершен: добавлено ${imported}, пропущено ${skipped}, ошибок: ${errors.length}`);
    
    let message = `Импортировано ${imported} записей`;
    if (skipped > 0) message += `, пропущено (уже существуют): ${skipped}`;
    if (errors.length > 0) message += `, ошибок: ${errors.length}`;
    
    res.json({ 
      message: message,
      imported: imported,
      skipped: skipped,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('❌ Ошибка импорта из Excel:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Ошибка импорта из Excel: ' + error.message });
  }
});

// ========== ЗАГРУЗКА ОБЛОЖКИ ==========
app.post('/api/admin/upload-cover', authenticateToken, requireAdmin, upload.single('cover'), async (req, res) => {
  try {
    console.log('📤 Загрузка обложки...');
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileName = `cover-${Date.now()}${ext}`;
    const filePath = path.join(COVERS_DIR, fileName);
    
    fs.copyFileSync(req.file.path, filePath);
    fs.unlinkSync(req.file.path);
    
    const coverUrl = `/uploads/covers/${fileName}`;
    
    console.log(`✅ Обложка загружена: ${coverUrl}`);
    
    res.json({ 
      message: 'Обложка загружена', 
      coverUrl: coverUrl 
    });
  } catch (error) {
    console.error('❌ Ошибка загрузки обложки:', error);
    res.status(500).json({ message: 'Ошибка загрузки обложки: ' + error.message });
  }
});

// ========== ИМПОРТ ИЗ EXCEL ==========
app.post('/api/admin/import-manga', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    console.log('📥 Начало импорта из Excel...');
    
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    // Читаем Excel файл
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    console.log(`📊 Найдено ${rows.length} записей для импорта`);
    
    let imported = 0;
    let errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Парсим данные из строки
        const title = row['title'] || row['Название'] || '';
        if (!title) {
          errors.push(`Строка ${i + 2}: отсутствует название`);
          continue;
        }

        // Парсим альтернативные названия
        let alternativeTitles = [];
        const altTitlesRaw = row['alternative_titles'] || row['Альтернативные названия'] || '';
        if (altTitlesRaw) {
          if (typeof altTitlesRaw === 'string') {
            alternativeTitles = altTitlesRaw.split(',').map(s => s.trim().replace(/[\[\]"]/g, '')).filter(s => s);
          } else if (Array.isArray(altTitlesRaw)) {
            alternativeTitles = altTitlesRaw;
          }
        }

        // Парсим жанры
        let genres = [];
        const genresRaw = row['genres'] || row['Жанры'] || '';
        if (genresRaw) {
          if (typeof genresRaw === 'string') {
            genres = genresRaw.split(',').map(s => s.trim().replace(/[\[\]"]/g, '')).filter(s => s);
          } else if (Array.isArray(genresRaw)) {
            genres = genresRaw;
          }
        }

        // Парсим год
        let year = null;
        const yearRaw = row['year'] || row['Год'];
        if (yearRaw && !isNaN(parseInt(yearRaw))) {
          year = parseInt(yearRaw);
        }

        // Парсим рейтинг
        let rating = 0;
        const ratingRaw = row['rating'] || row['Рейтинг'];
        if (ratingRaw && !isNaN(parseFloat(ratingRaw))) {
          rating = parseFloat(ratingRaw);
        }

        // Парсим просмотры
        let views = 0;
        const viewsRaw = row['views'] || row['Просмотры'];
        if (viewsRaw && !isNaN(parseInt(viewsRaw))) {
          views = parseInt(viewsRaw);
        }

        // Парсим количество глав
        let chaptersCount = 0;
        const chaptersCountRaw = row['chapters_count'] || row['Количество глав'];
        if (chaptersCountRaw && !isNaN(parseInt(chaptersCountRaw))) {
          chaptersCount = parseInt(chaptersCountRaw);
        }

        const mangaData = {
          title: title,
          alternativeTitles: alternativeTitles,
          description: row['description'] || row['Описание'] || '',
          coverImage: row['cover_image'] || row['Обложка'] || '/uploads/covers/default.png',
          author: row['author'] || row['Автор'] || '',
          artist: row['artist'] || row['Художник'] || '',
          status: row['status'] || row['Статус'] || 'ongoing',
          year: year,
          genres: genres,
          rating: rating,
          views: BigInt(views),
          chaptersCount: chaptersCount,
        };

        // Проверяем, существует ли уже манга с таким названием
        const existing = await prisma.manga.findFirst({
          where: { title: mangaData.title }
        });

        if (existing) {
          console.log(`⚠️ Манга "${title}" уже существует, пропускаем`);
          errors.push(`Строка ${i + 2}: манга "${title}" уже существует`);
          continue;
        }

        await prisma.manga.create({ data: mangaData });
        imported++;
        console.log(`✅ Импортирована: ${title}`);

      } catch (rowError) {
        console.error(`❌ Ошибка в строке ${i + 2}:`, rowError);
        errors.push(`Строка ${i + 2}: ${rowError.message}`);
      }
    }

    // Удаляем временный файл
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.log(`🎉 Импорт завершен: добавлено ${imported}, ошибок: ${errors.length}`);
    
    res.json({ 
      message: `Импортировано ${imported} записей${errors.length > 0 ? `, ошибок: ${errors.length}` : ''}`,
      imported: imported,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('❌ Ошибка импорта из Excel:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Ошибка импорта из Excel: ' + error.message });
  }
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

    const feedback = await prisma.feedback.create({
      data: { name, email, message, ip: req.ip }
    });

    try {
      await sendAdminFeedbackNotification(feedback);
    } catch (emailError) {
      console.error('Ошибка отправки уведомления:', emailError);
      return res.status(500).json({
        message: 'Ваше сообщение сохранено, но уведомление администратору отправить не удалось. Попробуйте позже.'
      });
    }

    res.status(201).json({
      message: 'Сообщение отправлено! Администратор получит уведомление на почту.',
      feedback
    });
  } catch (error) {
    console.error('Ошибка отправки feedback:', error);
    res.status(500).json({ message: 'Ошибка сервера при сохранении сообщения.' });
  }
});

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

app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  const [usersCount, mangaCount, viewsTotal, popular] = await Promise.all([
    prisma.user.count(),
    prisma.manga.count(),
    prisma.manga.aggregate({ _sum: { views: true } }),
    prisma.manga.findMany({ orderBy: { views: 'desc' }, take: 5, select: { title: true, views: true } }),
  ]);
  res.json({ users: usersCount, manga: mangaCount, totalViews: viewsTotal._sum.views || 0, popular });
});

app.post('/api/admin/sync', authenticateToken, requireAdmin, async (req, res) => {
  res.json({ message: 'Синхронизация выполнена (функционал в разработке)' });
});

app.get('/api/cover/default', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.send(emptyPNG);
});

app.get('/api/manga/:id/chapters', async (req, res) => {
  const mangaId = BigInt(req.params.id);
  const chapters = await prisma.chapter.findMany({
    where: { mangaId },
    orderBy: { chapterNumber: 'asc' },
    select: { id: true, chapterNumber: true, title: true, pagesCount: true, createdAt: true },
  });
  res.json(chapters);
});

// Раздача статики
app.use(express.static(path.join(__dirname, '../dist')));



// Раздача статики из папки dist (путь подкорректируйте под своё расположение)
app.use(express.static(path.join(__dirname, '../dist')));

// Для Vue Router в режиме history: все не-API запросы отправляем на index.html

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ========== СИНХРОНИЗАЦИЯ СТРАНИЦ (РАБОЧАЯ) ==========
app.post('/api/admin/sync-pages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔄 НАЧАЛО СИНХРОНИЗАЦИИ СТРАНИЦ...');
    
    // Получаем все главы из БД
    const chapters = await prisma.chapter.findMany();
    console.log(`📊 Найдено глав в БД: ${chapters.length}`);
    
    let updatedChapters = 0;
    let totalPagesCreated = 0;
    const errors = [];
    
    for (const chapter of chapters) {
      const mangaId = chapter.mangaId.toString();
      const chapterNum = chapter.chapterNumber;
      const chapterDir = path.join(CHAPTERS_DIR, mangaId, `chapter${chapterNum}`);
      
      console.log(`📁 Проверяем папку: ${chapterDir}`);
      
      if (fs.existsSync(chapterDir)) {
        const files = fs.readdirSync(chapterDir).filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
        console.log(`📄 Найдено файлов в папке: ${files.length}`);
        
        if (files.length > 0) {
          // Сортируем файлы по номеру страницы
          files.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || 0);
            const numB = parseInt(b.match(/\d+/)?.[0] || 0);
            return numA - numB;
          });
          
          // Удаляем старые записи страниц
          const deleted = await prisma.page.deleteMany({ where: { chapterId: chapter.id } });
          console.log(`🗑️ Удалено старых записей страниц: ${deleted.count}`);
          
          // Создаем новые записи
          const pagesData = [];
          for (let i = 0; i < files.length; i++) {
            pagesData.push({
              chapterId: chapter.id,
              pageNumber: i + 1,
              imageUrl: `/uploads/chapters/${mangaId}/chapter${chapterNum}/${files[i]}`,
            });
          }
          
          const created = await prisma.page.createMany({ data: pagesData });
          console.log(`✅ Создано новых записей страниц: ${created.count}`);
          
          // Обновляем количество страниц в главе
          if (chapter.pagesCount !== files.length) {
            await prisma.chapter.update({
              where: { id: chapter.id },
              data: { pagesCount: files.length }
            });
            console.log(`📊 Обновлено количество страниц в главе ${chapterNum}: ${files.length}`);
          }
          
          updatedChapters++;
          totalPagesCreated += files.length;
        } else {
          console.log(`⚠️ В папке нет изображений для главы ${chapterNum}`);
        }
      } else {
        console.log(`❌ Папка не существует: ${chapterDir}`);
        errors.push(`Глава ${chapterNum} манги ${mangaId}: папка не найдена`);
      }
    }
    
    console.log(`\n🎉 СИНХРОНИЗАЦИЯ ЗАВЕРШЕНА!`);
    console.log(`📊 Обновлено глав: ${updatedChapters}`);
    console.log(`📄 Создано страниц: ${totalPagesCreated}`);
    
    res.json({ 
      success: true,
      message: `Синхронизация завершена: обновлено ${updatedChapters} глав, создано ${totalPagesCreated} страниц`,
      updatedChapters,
      totalPagesCreated,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('❌ Ошибка синхронизации страниц:', error);
    res.status(500).json({ success: false, message: 'Ошибка синхронизации: ' + error.message });
  }
});

// ========== ПОЛНАЯ СИНХРОНИЗАЦИЯ (РАБОЧАЯ) ==========
app.post('/api/admin/sync', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔄 НАЧАЛО ПОЛНОЙ СИНХРОНИЗАЦИИ...');
    
    // 1. Синхронизируем страницы
    const chapters = await prisma.chapter.findMany();
    let updatedChapters = 0;
    let totalPagesCreated = 0;
    
    for (const chapter of chapters) {
      const mangaId = chapter.mangaId.toString();
      const chapterNum = chapter.chapterNumber;
      const chapterDir = path.join(CHAPTERS_DIR, mangaId, `chapter${chapterNum}`);
      
      if (fs.existsSync(chapterDir)) {
        const files = fs.readdirSync(chapterDir).filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
        
        if (files.length > 0) {
          files.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || 0);
            const numB = parseInt(b.match(/\d+/)?.[0] || 0);
            return numA - numB;
          });
          
          await prisma.page.deleteMany({ where: { chapterId: chapter.id } });
          
          const pagesData = [];
          for (let i = 0; i < files.length; i++) {
            pagesData.push({
              chapterId: chapter.id,
              pageNumber: i + 1,
              imageUrl: `/uploads/chapters/${mangaId}/chapter${chapterNum}/${files[i]}`,
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
        }
      }
    }
    
    // 2. Обновляем количество глав в манге
    const mangaListAll = await prisma.manga.findMany();
    for (const manga of mangaListAll) {
      const chaptersCount = await prisma.chapter.count({ where: { mangaId: manga.id } });
      if (manga.chaptersCount !== chaptersCount) {
        await prisma.manga.update({
          where: { id: manga.id },
          data: { chaptersCount }
        });
      }
    }
    
    console.log(`\n🎉 ПОЛНАЯ СИНХРОНИЗАЦИЯ ЗАВЕРШЕНА!`);
    console.log(`📊 Обновлено глав: ${updatedChapters}`);
    console.log(`📄 Создано страниц: ${totalPagesCreated}`);
    
    res.json({ 
      success: true,
      message: `Полная синхронизация завершена! Обновлено: ${updatedChapters} глав, ${totalPagesCreated} страниц`,
      updatedChapters,
      totalPagesCreated
    });
  } catch (error) {
    console.error('❌ Ошибка полной синхронизации:', error);
    res.status(500).json({ success: false, message: 'Ошибка синхронизации: ' + error.message });
  }
});

// ========== ПРЯМАЯ ЗАГРУЗКА СТРАНИЦ ПО ФАЙЛАМ ==========
app.get('/api/chapters/:id/real-pages', async (req, res) => {
  try {
    const chapterId = parseFloat(req.params.id);
    
    // Получаем главу из БД
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) {
      return res.status(404).json({ error: 'Глава не найдена' });
    }
    
    const mangaId = chapter.mangaId.toString();
    const chapterNum = chapter.chapterNumber;
    const chapterDir = path.join(CHAPTERS_DIR, mangaId, `chapter${chapterNum}`);
    
    // ЧИТАЕМ ФАЙЛЫ ПРЯМО С ДИСКА
    if (!fs.existsSync(chapterDir)) {
      return res.status(404).json({ error: 'Папка с изображениями не найдена', path: chapterDir });
    }
    
    const files = fs.readdirSync(chapterDir).filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'Нет изображений в папке', path: chapterDir });
    }
    
    // Сортируем по номеру страницы
    files.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.match(/\d+/)?.[0] || 0);
      return numA - numB;
    });
    
    // ФОРМИРУЕМ СТРАНИЦЫ ПРЯМО ИЗ ФАЙЛОВ (БЕЗ БД)
    const pages = files.map((file, index) => ({
      page_number: index + 1,
      image_url: `/uploads/chapters/${mangaId}/chapter${chapterNum}/${file}`
    }));
    
    res.json({
      chapter_id: chapter.id,
      manga_id: chapter.mangaId,
      chapter_number: chapter.chapterNumber,
      title: chapter.title,
      pages: pages,
      total_pages: pages.length,
      from_disk: true  // маркер, что страницы из файлов
    });
    
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ПОЛУЧИТЬ РЕАЛЬНОЕ КОЛИЧЕСТВО СТРАНИЦ ИЗ ПАПКИ ==========
app.get('/api/admin/chapter-pages-count/:chapterId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const chapterId = parseFloat(req.params.chapterId);
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    
    if (!chapter) {
      return res.status(404).json({ error: 'Глава не найдена' });
    }
    
    const mangaId = chapter.mangaId.toString();
    const chapterNum = chapter.chapterNumber;
    const chapterDir = path.join(CHAPTERS_DIR, mangaId, `chapter${chapterNum}`);
    
    let pagesCount = 0;
    
    if (fs.existsSync(chapterDir)) {
      const files = fs.readdirSync(chapterDir).filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
      pagesCount = files.length;
    }
    
    res.json({
      chapterId: chapter.id,
      pagesCount: pagesCount,
      path: chapterDir
    });
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ОБНОВИТЬ КОЛИЧЕСТВО СТРАНИЦ В БД ==========
app.post('/api/admin/sync-chapter-pages/:chapterId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const chapterId = parseFloat(req.params.chapterId);
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    
    if (!chapter) {
      return res.status(404).json({ error: 'Глава не найдена' });
    }
    
    const mangaId = chapter.mangaId.toString();
    const chapterNum = chapter.chapterNumber;
    const chapterDir = path.join(CHAPTERS_DIR, mangaId, `chapter${chapterNum}`);
    
    let pagesCount = 0;
    
    if (fs.existsSync(chapterDir)) {
      const files = fs.readdirSync(chapterDir).filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
      pagesCount = files.length;
      
      await prisma.chapter.update({
        where: { id: chapter.id },
        data: { pagesCount: pagesCount }
      });
    }
    
    res.json({
      success: true,
      chapterId: chapter.id,
      pagesCount: pagesCount
    });
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== СМЕНА ПАРОЛЯ (ИСПРАВЛЕНО) ==========
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = BigInt(req.user.id);
    
    console.log('🔄 Смена пароля для пользователя:', userId);
    
    // Проверяем обязательные поля
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Новый пароль должен содержать минимум 6 символов' });
    }
    
    // Получаем пользователя из БД через Prisma
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Проверяем текущий пароль
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Неверный текущий пароль' });
    }
    
    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Обновляем пароль в БД через Prisma
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Пароль успешно изменен для пользователя:', userId);
    res.json({ message: 'Пароль успешно изменен' });
    
  } catch (error) {
    console.error('❌ Ошибка смены пароля:', error);
    res.status(500).json({ message: 'Ошибка сервера: ' + error.message });
  }
});

// ========== ЗАПУСК СЕРВЕРА ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});