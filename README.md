# SurpriseBot — готовый MVP

Telegram Bot + Telegram Mini App для создания интерактивных цифровых сюрпризов.

## Что внутри

- Python 3.11+
- aiogram 3
- FastAPI + Uvicorn
- vanilla HTML/CSS/JS, без React/Vue
- JSON storage через отдельный repository layer
- Telegram `initData` HMAC validation на backend
- Main Mini App / `startapp=<surprise_id>`
- одноразовое увеличение `open_count` на запуск просмотра
- повторное открытие всегда начинается со Scene 1
- визуальный редактор сцен
- drag & drop объектов мышью и пальцем
- текст, фото, кнопки, emoji, эффекты
- фон и переходы `tap`, `automatic`, `timer`
- Preview использует тот же Player, что и получатель
- эффекты вынесены в отдельные модули
- загрузка изображений с лимитом
- My Surprises
- шаблоны
- 🎲 Удиви меня
- отправка готового сообщения ботом с кнопкой `🎁 Открыть сюрприз`
- Telegram fullscreen с безопасным fallback
- Telegram light/dark theme
- `prefers-reduced-motion`
- Amvera persistent storage `/data`

## Структура

surprisebox/
├── run.py
├── amvera.yaml
├── requirements.txt
├── .env.example
│
├── bot/
│   ├── bot.py
│   ├── handlers/
│   │   └── start.py
│   └── keyboards/
│       └── main.py
│
├── backend/
│   ├── main.py
│   ├── services/
│   │   ├── auth.py
│   │   └── schema.py
│   └── storage/
│       └── json_repository.py
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── app.css
│   └── js/
│       ├── app.js
│       ├── core/
│       ├── player/
│       └── effects/
│
└── data/
    └── .gitkeep
```

## Архитектура данных

Сюрприз хранится примерно так:

```json
{
  "id": "abc123",
  "owner_id": 123456,
  "title": "❤️ Для Маши",
  "open_count": 17,
  "created_at": "...",
  "updated_at": "...",
  "settings": {
    "theme": "love",
    "performance": "auto"
  },
  "scenes": [
    {
      "id": "scene_x",
      "name": "Сцена 1",
      "background": {},
      "elements": [],
      "transition": {
        "type": "tap",
        "duration": 3
      }
    }
  ]
}
```

Storage вынесен в `JSONRepository`, поэтому дальнейшая миграция на PostgreSQL не требует переписывать API/editor/player.

## Безопасность

Frontend не получает BOT_TOKEN.

Сервер проверяет Telegram `initData` перед операциями владельца.

Защищены:

- создание
- изменение
- удаление
- список своих сюрпризов
- загрузка изображений
- отправка сюрприза

Получатель имеет только публичный доступ к конкретному сюрпризу по ссылке.

`initDataUnsafe` не используется для авторизации.

## Фото

Разрешены:

- JPEG
- PNG
- WEBP
- GIF

По умолчанию максимум — 8 MB.

Файлы получают случайные имена и сохраняются в:

```text
/data/uploads
```

## Что уже реализовано как MVP

```text
Telegram
  ↓
Bot
  ↓
Mini App
  ↓
Create
  ↓
Visual Editor
  ↓
Scenes
  ↓
Text / Photo / Effects / Buttons
  ↓
Preview
  ↓
Save
  ↓
Send
  ↓
Telegram message
  ↓
Forward
  ↓
Recipient
  ↓
startapp=<surprise_id>
  ↓
Player
  ↓
Scene 1
  ↓
Scene 2
  ↓
Scene N
  ↓
Final
  ↓
Replay → Scene 1
```

## Приоритеты

В проекте сохранён порядок:

1. работоспособность
2. безопасность
3. UX
4. производительность
5. визуальная часть
6. дополнительные возможности

Проект не использует PostgreSQL, Redis, React, Vue или AI API.
