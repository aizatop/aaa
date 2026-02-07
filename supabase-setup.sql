-- ============================================
-- 🚀 Supabase Setup Script for Alive Project
-- ============================================
-- Выполните этот SQL в Supabase SQL Editor

-- ============================================
-- 📋 Создание таблицы профилей пользователей
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);

-- ============================================
-- 💬 Создание таблицы сообщений чата
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    username TEXT NOT NULL,
    user_id TEXT NOT NULL,
    room_id TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS messages_room_id_idx ON messages(room_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);

-- ============================================
-- 🔒 Настройка Row Level Security (RLS)
-- ============================================

-- Включаем RLS для таблицы profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Включаем RLS для таблицы messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 📝 Создание RLS политик для таблицы profiles
-- ============================================

-- Политика: пользователи могут просматривать свой профиль
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Политика: пользователи могут создавать свой профиль
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут обновлять свой профиль
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Политика: пользователи могут удалять свой профиль
CREATE POLICY "Users can delete own profile" ON profiles
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 📝 Создание RLS политик для таблицы messages
-- ============================================

-- Политика: все могут просматривать сообщения
CREATE POLICY "Anyone can view messages" ON messages
    FOR SELECT USING (true);

-- Политика: аутентифицированные пользователи могут отправлять сообщения
CREATE POLICY "Authenticated users can insert messages" ON messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 🔄 Создание триггера для обновления updated_at
-- ============================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для таблицы profiles
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 🎯 Настройка Realtime для таблицы messages
-- ============================================

-- Включаем Realtime для таблицы messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
-- ✅ Проверка создания таблиц
-- ============================================

-- Проверяем, что таблицы созданы
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'messages')
ORDER BY table_name;

-- ============================================
-- 🎉 Готово!
-- ============================================
-- Теперь ваш сайт полностью готов к работе с Supabase!
-- 
-- Что работает:
-- ✅ Регистрация и вход пользователей
-- ✅ Сохранение профилей
-- ✅ Чат в реальном времени
-- ✅ Безопасные RLS политики
-- ✅ Realtime подписки
-- 
-- Тестирование:
-- 1. Зарегистрируйте нового пользователя
-- 2. Отправьте сообщение в чате
-- 3. Откройте сайт в другой вкладке
-- 4. Проверьте realtime обновления
