-- Создание базы данных
CREATE DATABASE manga_db;

\c manga_db;

-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица манги
CREATE TABLE manga (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    alternative_titles TEXT[],
    description TEXT,
    cover_image TEXT,
    author VARCHAR(255),
    artist VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('ongoing', 'completed', 'hiatus', 'cancelled')),
    year INTEGER,
    genres TEXT[],
    views INTEGER DEFAULT 0,
    rating DECIMAL(4,2) DEFAULT 0,   -- было (3,2), теперь вмещает 10.00
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица глав
CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    manga_id INTEGER REFERENCES manga(id) ON DELETE CASCADE,
    chapter_number DECIMAL(5,2) NOT NULL,
    title VARCHAR(255),
    pages TEXT[],
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(manga_id, chapter_number)
);

-- Таблица избранного
CREATE TABLE favorites (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    manga_id INTEGER REFERENCES manga(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, manga_id)
);

-- Таблица прогресса чтения
CREATE TABLE reading_progress (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    manga_id INTEGER REFERENCES manga(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    page INTEGER DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, manga_id)
);

-- Таблица форума
CREATE TABLE forum_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    manga_id INTEGER REFERENCES manga(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE forum_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX idx_chapters_manga ON chapters(manga_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_progress_user ON reading_progress(user_id);
CREATE INDEX idx_forum_manga ON forum_posts(manga_id);