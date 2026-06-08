# Wedding Bot

Telegram bot for wedding guests built with Node.js and grammY.

## Install

```bash
npm install
```

## Configure

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Set these values:

```env
BOT_TOKEN=your_telegram_bot_token_here
DATABASE_URL=postgres://postgres:password@localhost:5432/wedding_bot
WEDDING_BRIDE_NAME=Имя1
WEDDING_GROOM_NAME=Имя2
WEDDING_DATE=25.06.26
WEDDING_CITY=Город
```

## Run

```bash
npm start
```

For development with Node.js watch mode:

```bash
npm run dev
```

## Docker

Copy `.env.example` to `.env`, set `BOT_TOKEN` and wedding config, then start the bot with PostgreSQL:

```bash
cp .env.example .env
docker compose up -d --build
```

View logs:

```bash
docker compose logs -f bot
```

Stop:

```bash
docker compose down
```

PostgreSQL data is stored in the `postgres_data` Docker volume. To remove it as well:

```bash
docker compose down -v
```

Optional PostgreSQL variables for Docker Compose (defaults are shown):

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=wedding_bot
```

## Admin Broadcast

Only users with `is_admin = true` in the database can run:

```text
/broadcast Текст сообщения
```

The bot sends the message to every saved chat from PostgreSQL.

## Database

The bot creates the required tables automatically on startup. You can configure PostgreSQL with `DATABASE_URL` or with separate `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` values.

### Wedding config

Personal wedding details are stored in the `wedding_config` table. On the first startup, the bot seeds this table from `WEDDING_*` environment variables if the table is empty.

```env
WEDDING_BRIDE_NAME=Имя1
WEDDING_GROOM_NAME=Имя2
WEDDING_DATE=25.06.26
WEDDING_CITY=Город
```

The welcome message model code (for example `250626`) and short name (for example `АКС-250626`) are generated from the stored date and names. The date is kept in the same text format as in `WEDDING_DATE`.

You can also update the config directly in PostgreSQL:

```sql
INSERT INTO wedding_config (bride_name, groom_name, wedding_date, city)
VALUES ('Имя1', 'Имя2', '25.06.26', 'Город')
ON CONFLICT (id) DO UPDATE
SET bride_name = EXCLUDED.bride_name,
    groom_name = EXCLUDED.groom_name,
    wedding_date = EXCLUDED.wedding_date,
    city = EXCLUDED.city,
    updated_at = NOW();
```

To grant admin rights, set `is_admin = true` for a user after they run `/start`:

```sql
UPDATE users SET is_admin = true WHERE telegram_user_id = 123456789;
```
