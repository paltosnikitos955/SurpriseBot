# SurpriseBox — готовый MVP

Telegram Bot + Telegram Mini App для создания интерактивных цифровых сюрпризов.

Это уже не Stage 3: в архиве собран цельный MVP, который можно загрузить в Amvera и запустить после задания токена бота и URL приложения.

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

## Важное ограничение

Полностью автоматизировать создание Main Mini App через архив невозможно: URL Main Mini App один раз задаётся владельцем бота в @BotFather. После этого код уже умеет использовать `startapp` deep links.

Официальная документация Telegram подтверждает, что Main Mini App настраивается через @BotFather, а ссылка вида `https://t.me/<botusername>?startapp=<id>` передаёт значение в `start_param`. Fullscreen API и safe-area также поддерживаются Telegram Mini Apps.

## 1. Создай бота

В Telegram открой @BotFather:

1. `/newbot`
2. создай бота
3. получи `BOT_TOKEN`

## 2. Разверни проект в Amvera

Создай приложение типа Python/Pip и загрузите содержимое этого архива в корень репозитория.

В проекте уже есть `amvera.yaml`.

Он использует:

```yaml
meta:
  environment: python
  toolchain:
    name: pip
    version: "3.11"

build:
  requirementsPath: requirements.txt

run:
  command: python run.py
  persistenceMount: /data
  containerPort: 80
```

Приложение слушает `0.0.0.0:80`.

Данные сюрпризов и загруженные фотографии сохраняются в `/data`, чтобы не теряться при пересборке.

## 3. Переменные окружения Amvera

В настройках приложения добавь:

```env
BOT_TOKEN=123456:YOUR_REAL_TOKEN
WEBAPP_URL=https://YOUR-AMVERA-URL
DATA_DIR=/data
UPLOADS_DIR=/data/uploads
MAX_UPLOAD_MB=8
```

`BOT_USERNAME` необязателен. Если его нет, backend сам получает username через Telegram Bot API при отправке.

`WEBAPP_URL` должен быть именно HTTPS URL работающего приложения Amvera.

## 4. Настрой Main Mini App

В @BotFather:

1. `/mybots`
2. выбери своего бота
3. Bot Settings
4. Configure Mini App
5. настрой Main Mini App
6. укажи тот же HTTPS URL, который записан в `WEBAPP_URL`

После этого у бота появится Launch app / Main Mini App.

Telegram использует:

```text
https://t.me/<bot_username>?startapp=<surprise_id>
```

для открытия конкретного сюрприза.

## 5. Собери приложение

После загрузки файлов Amvera установит:

```text
aiogram
fastapi
uvicorn
python-multipart
httpx
```

и запустит:

```bash
python run.py
```

`run.py` одновременно запускает FastAPI и polling Telegram-бота.

## 6. Что проверить после запуска

Открой URL приложения:

```text
https://YOUR-AMVERA-URL/
```

Затем открой бота в Telegram.

Проверь:

- `/start`
- кнопку `✨ Создать сюрприз`
- создание сюрприза
- добавление сцен
- добавление текста
- добавление фото
- добавление эффекта
- drag & drop
- Preview
- Save
- My Surprises
- Send
- получение сообщения ботом
- открытие кнопки `🎁 Открыть сюрприз`
- запуск с первой сцены
- повторный запуск снова с первой сцены
- изменение `open_count`

## Локальный запуск

```bash
python -m venv .venv
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Установка:

```bash
pip install -r requirements.txt
```

Создай `.env` на основе `.env.example`.

Затем:

```bash
python run.py
```

Для Telegram Mini App нужен публичный HTTPS URL. Поэтому локальный браузерный запуск годится для проверки UI, а полноценный Telegram-сценарий удобнее проверять через Amvera или HTTPS tunnel.

## Структура

```text
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

## Примечание по Main Mini App

Кнопка внутри `/start` использует обычный Telegram Web App button, поэтому бот может открыть приложение даже до настройки Main Mini App.

После настройки Main Mini App становятся доступны основной Launch app сценарий и deep links `?startapp=...`.

## Приоритеты

В проекте сохранён порядок:

1. работоспособность
2. безопасность
3. UX
4. производительность
5. визуальная часть
6. дополнительные возможности

Проект не использует PostgreSQL, Redis, React, Vue или AI API.
