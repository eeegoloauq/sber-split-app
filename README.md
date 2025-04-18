# Sber Split App

<div align="center">
  <img src="frontend/src/assets/logo.png" alt="Sber Split Logo" width="120">
  <h2>Умное разделение чеков с использованием AI</h2>
</div>

## 📋 О проекте

**Sber Split App** — инновационное приложение для анализа чеков и разделения расходов между друзьями и коллегами. Приложение использует AI для автоматического распознавания позиций в чеке и предлагает удобные инструменты для разделения счета.

## ✨ Основные возможности

- 📷 **Сканирование чеков** — загрузка изображений чеков прямо с устройства
- 🤖 **AI распознавание** — автоматическое извлечение позиций и цен с помощью Google Gemini AI
- 👥 **Гибкое разделение** — возможность назначать разные позиции разным участникам
- 📊 **Расчет сумм** — точный и справедливый расчет для каждого участника
- 💾 **История чеков** — сохранение и доступ к ранее обработанным чекам

## 🔧 Технический стек

### Frontend
- **React** — современная библиотека для построения пользовательских интерфейсов
- **React Router** — для маршрутизации между страницами приложения
- **CSS Modules** — для стилизации компонентов
- **React Image Crop** — для обрезки изображений чеков
- **Vite** — для быстрой сборки и разработки

### Backend
- **Node.js + Express** — для серверной логики и API
- **Multer** — для обработки загрузки файлов
- **Google Gemini AI** — для распознавания содержимого чеков
- **CORS** — для обеспечения безопасного взаимодействия между фронтендом и бэкендом

## 🚀 Быстрый старт

### Запуск Backend
```bash
cd back
npm install
npm start
```
Сервер запустится на http://localhost:5000

### Запуск Frontend
```bash
cd frontend
npm install
npm run dev
```
Фронтенд запустится на http://localhost:3000

## 📱 Использование

1. На главной странице нажмите кнопку "Сканировать чек"
2. Загрузите фотографию чека и при необходимости обрежьте её
3. Дождитесь обработки чека системой
4. На странице чека добавьте участников, которые были частью счета
5. Назначьте позиции конкретным участникам, выбирая их аватары
6. Просмотрите итоговые суммы для каждого участника

## 📚 API эндпоинты

### Backend API
- `POST /upload` — Загрузка и обработка изображения чека
- `GET /receipts/:id` — Получение данных обработанного чека

## 🧩 Архитектура проекта

Проект разделен на два основных компонента:

- **Frontend**: React приложение с компонентной структурой для удобного и интуитивного интерфейса
- **Backend**: Node.js сервер для обработки изображений и извлечения данных с использованием AI

## 📄 Лицензия

Проект распространяется под лицензией MIT. 
