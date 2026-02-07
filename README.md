# AliveAgain - Travel Chat with AI Assistant

[![pages-build-deployment](https://github.com/aizatop/Reboot/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)](https://github.com/aizatop/Reboot/actions)

Project scaffolded with Vite and React.

## 🌍 Описание
Сайт для путешественников с чатом в реальном времени и AI ассистентом.

## ✨ Функции
- 🤖 AI ассистент по путешествиям
- 💬 Чат в реальном времени
- 👥 Регистрация и вход пользователей
- 🌍 Страны с видео и описаниями
- 🎨 Красивый интерфейс с анимациями

## 🚀 Запуск
1. Откройте `index.html` в браузере
2. Зарегистрируйтесь или войдите
3. Нажмите "🤖 AI Помощник" для вопросов
4. Отправляйте сообщения в чат

## 🔧 Технологии
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Supabase (Realtime Database)
- **AI:** Встроенный ассистент с ответами
- **Hosting:** GitHub Pages / Hugging Face Spaces

## 📝 API
- Supabase URL: `https://wjtxswzeibngvwaanusd.supabase.co`
- Realtime подписки на сообщения
- Аутентификация через Supabase Auth

## 🤖 AI Ассистент
Отвечает на вопросы о:
- Странах (Япония, Франция, Италия, Лондон)
- Документах и визах
- Бюджете путешествий
- Достопримечательностях

## 🌐 Деплой
- **GitHub Pages:** Основной хостинг
- **Hugging Face Spaces:** Альтернативный хостинг

## 📱 Тестирование
- Кнопка отправки работает без авторизации (тестовый пользователь)
- AI ассистент доступен через модальное окно
- Realtime чат синхронизирует сообщения

## Demo
Will be published to GitHub Pages from `main` branch (workflow added). After merge the site will be available at: `https://aizatop.github.io/Reboot/` (or repo Pages URL).

## How to run locally

1. npm install
2. npm run dev

## Create a PR (one-liner)
If you pushed a branch named `reboot-from-local-YYYYMMDD-HHMM` (automation included), run:

```bash
# create a PR (requires GitHub CLI):
gh pr create --base main --head <your-branch> --title "chore: publish current workspace" --body "Prepare demo and CI"
```

## Deploy
- CI: GitHub Actions workflow `deploy-gh-pages.yml` builds `dist` and publishes to GitHub Pages.
- A helper workflow `auto-create-pr.yml` will auto-open PRs for branches `reboot-from-local-*`.