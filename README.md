# 🗄️ Ephemeral Archive

> **Ничто не умирает дважды.** Веб-приложение, которое мониторит популярные IT/игровые ресурсы и находит архивные копии страниц, которые перестали быть доступными.

Каждый день появляются новые страницы. Через некоторое время некоторые из них исчезают — 404, удаление, закрытие сайта. **Ephemeral Archive** проверяет топ Hacker News через Wayback Machine API и, если оригинал мёртв, показывает спасённую архивную копию с пометкой **«СОХРАНЕНО НАВЕЧНО»**.

## 📸 Скриншоты

<!-- TODO: заменить на реальные скриншоты -->

| Главная (сетка карточек) | Просмотр архивной копии |
|---|---|
| ![main](docs/screenshots/main.png) | ![view](docs/screenshots/archive-view.png) |

## ✨ Возможности

- **Реальные данные, без мок-заглушек** — только публичные бесплатные API без ключей.
- Статусы каждой страницы: `LIVE` 🟢 / `ARCHIVED` 🟠 / `LOST` 🔴.
- Фильтры «Все / Live / Archived / Lost» и поиск по заголовку — всё серверное (Server Components + `searchParams`), без client-side fetching.
- Страница просмотра: iframe с архивом (или оригиналом) и баннеры статусов.
- Кэширование в три слоя: ISR (`revalidate = 1 час`) → in-memory кэш списка (Map, 1 час) → кэш CDX-ответов (1 час).
- Rate limiting очереди Wayback: **не более 1 запроса в секунду** (FIFO-очередь промисов).
- Graceful degradation: упал один API — остальные продолжают работать; HN недоступен → показывается последний успешный снапшот с предупреждением.
- Dark mode, минимализм, архивно-киберпанковый вайб, моноширинные шрифты для статусов и дат.

## 🚀 Быстрый старт

```bash
npm install
npm run dev
# → http://localhost:3000
```

Продакшен-сборка:

```bash
npm run build
npm start
```

GitHub Actions **не используются** — только локальный запуск и деплой как SSR/статика.

## 🔌 Источники данных (бесплатно, без ключей)

### 1. Hacker News Firebase API
Документация: <https://github.com/HackerNews/API>

| Эндпоинт | Назначение |
|---|---|
| `GET https://hacker-news.firebaseio.com/v0/topstories.json` | Топ-30 ID новостей |
| `GET https://hacker-news.firebaseio.com/v0/item/{id}.json` | Детали: title, url, score, time |

### 2. Wayback Machine CDX API
Документация: <https://archivelab.org/api/> · <https://web.archive.org/cdx/search/cdx>

```
GET https://web.archive.org/cdx/search/cdx?url={URL}&output=json&limit=-1&filter=statuscode:200
```

Если снимок найден, показываем его через iframe:
`https://web.archive.org/web/{TIMESTAMP}/{URL}`. Если снимков нет — статус **«НЕ СОХРАНЕНО»**.

### 3. Проверка живости оригинала
Сервер делает `HEAD`-запрос к URL (таймаут 3 сек, fallback на `GET` при 405/501). Коды ≥ 400 или таймаут/DNS-ошибка ⇒ страница мертва.

## 🧠 Логика статусов

```
HN top story ──► HEAD original (3s timeout)
                    │
        alive ◄─────┼────► dead
          │                   │
        LIVE        CDX API (queue, 1 req/s, cache 1h)
                          │               │
                     snapshot         no snapshot
                          │               │
                     ARCHIVED          LOST
                  («СОХРАНЕНО НАВЕЧНО») («УТЕРЯНО НАВСЕГДА»)
```

## 🗂️ Структура проекта

```
app/
  layout.tsx            # Root layout: Header/Footer, шрифты, metadata
  page.tsx              # Главная: сетка, фильтры, поиск (Server Component, ISR 1h)
  [id]/page.tsx         # Просмотр: iframe архива/оригинала, баннеры статусов
  api/health/route.ts   # Диагностика внешних API и кэша
  error.tsx             # Глобальный обработчик ошибок
  not-found.tsx         # 404
components/
  Header.tsx  Footer.tsx  PageCard.tsx  StatusBadge.tsx  FilterBar.tsx
lib/
  hn-api.ts           # Клиент Hacker News Firebase API
  wayback.ts          # Клиент CDX API: очередь 1 req/s + кэш Map на 1 час
  status-checker.ts   # HEAD-проверка живости + сборка статуса LIVE/ARCHIVED/LOST
  archive-service.ts  # Сервисный слой: single-flight + in-memory кэш списка
  types.ts  format.ts
```

Все внешние запросы выполняются **только с сервера** (Server Components / Route Handlers); `lib/archive-service.ts` импортирует `server-only`, чтобы исключить случайное использование в клиентском бандле.

## ☁️ Деплой

### Vercel
1. Залейте репозиторий на GitHub/Gitverse.
2. На [vercel.com](https://vercel.com) → *Import Project* → выберите репозиторий.
3. Framework определится автоматически (Next.js). Переменные окружения не нужны — жмите **Deploy**.

### Tatnet Cloud (и любой Node.js-хостинг)
```bash
npm ci
npm run build
PORT=8080 npm start   # Next.js standalone SSR
```
В панели Tatnet создайте Node.js-приложение с командой запуска `npm start` и сборкой `npm run build`. Приложение работает как обычный SSR-сервер на Node 18+.

## 🛣️ Roadmap

- [ ] Дополнительные источники: Lobsters, Reddit (r/programming), игровые СМИ (IGN, DTF), Telegram-каналы.
- [ ] Фоновый cron-обход: сохранять снимки **до** того, как страница умрёт (Save Page Now API).
- [ ] Настраиваемый список watched-доменов пользователем + база (SQLite/Postgres).
- [ ] Уведомления о смерти отслеживаемых страниц (email/webhook/Matrix).
- [ ] Экспорт списков LOST/ARCHIVED в JSON/CSV.
- [ ] i18n (EN/RU) и светлая тема.
- [ ] Docker-образ для self-hosting.

## ⚖️ Лицензия

[MIT](./LICENSE) — используйте свободно, форкайте, улучшайте.

---

**Как тебе проект? ⭐ Поставь звезду на GitHub — это лучшая поддержка!**
