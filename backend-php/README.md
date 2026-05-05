# ETWIN Commerce — PHP Native + MySQL Backend

Production-ready REST API that powers the React frontend (`src/lib/api/client.ts`).
The frontend automatically uses this backend when you set `VITE_PHP_API_BASE`.

## 1. Requirements
- PHP **8.1+** with extensions: `pdo_mysql`, `curl`, `mbstring`, `openssl`
- MySQL **5.7+** (or MariaDB 10.4+)
- Apache (with `mod_rewrite`) **or** Nginx

## 2. Install
```bash
# 1) Create the database
mysql -u root -p < sql/schema.sql

# 2) Configure secrets — pick one:
#    a) For local dev: copy .env.example → .env and edit it
cp .env.example .env

#    b) For production: export real environment variables
export DB_HOST=127.0.0.1
export DB_NAME=etwin_commerce
export DB_USER=root
export DB_PASS=secret
export JWT_SECRET="$(openssl rand -hex 32)"
export TELEGRAM_BOT_TOKEN="123456:ABC..."           # from @BotFather
export TELEGRAM_WEBHOOK_SECRET="$(openssl rand -hex 16)"
export CORS_ALLOW_ORIGIN="https://your-frontend.app"

# 3) Serve `public/` as the web root
php -S 0.0.0.0:8080 -t public      # quick local dev
```

> Real OS env vars always win over `.env` values, so committing `.env.example`
> as a template is safe — production deploys keep using their real env.

## 2.b Laragon (Windows local dev)

The repo ships with a working Laragon flow. Two options:

### Option A — Built-in PHP server (simplest)
1. Open Laragon → **Menu → MySQL → Create database** → name it `etwin_commerce`.
2. Import the schema (Laragon → **HeidiSQL** or `mysql` from Laragon's terminal):
   ```bash
   mysql -u root etwin_commerce < sql/schema.sql
   # then any pending migrations:
   mysql -u root etwin_commerce < sql/migrate_v2.sql
   mysql -u root etwin_commerce < sql/migrate_v3.sql
   mysql -u root etwin_commerce < sql/migrate_v4.sql
   mysql -u root etwin_commerce < sql/migrate_v5.sql
   mysql -u root etwin_commerce < sql/migrate_v6.sql
   ```
3. Copy the env template:
   ```bash
   cd backend-php
   cp .env.example .env
   ```
   The defaults already match Laragon (root user, empty password, `127.0.0.1:3306`).
4. From Laragon's terminal, start the API:
   ```bash
   php -S 127.0.0.1:8080 -t public
   ```
5. In the project root, point the frontend at it — edit `.env`:
   ```
   VITE_PHP_API_BASE=http://127.0.0.1:8080
   ```
   Then `bun run dev` (or `npm run dev`). Browse `http://localhost:5173`.

### Option B — Apache vhost (`.test` domain)
If you want the API on a Laragon `.test` domain:

1. Put the project at `C:\laragon\www\etwin-commerce-suite\` (Laragon auto-creates `etwin-commerce-suite.test`).
2. Create `C:\laragon\etc\apache2\sites-enabled\auto.etwin-api.test.conf`:
   ```apache
   <VirtualHost *:80>
     ServerName etwin-api.test
     DocumentRoot "C:/laragon/www/etwin-commerce-suite/backend-php/public"
     <Directory "C:/laragon/www/etwin-commerce-suite/backend-php/public">
       AllowOverride All
       Require all granted
     </Directory>
   </VirtualHost>
   ```
3. Laragon **Menu → Apache → Reload**. The host file is patched automatically.
4. Set `VITE_PHP_API_BASE=http://etwin-api.test` in the frontend `.env`.
5. Set `CORS_ALLOW_ORIGIN=http://localhost:5173` in `backend-php/.env`.

The `.htaccess` in `backend-php/public/` handles routing — no extra config needed.

### Apache vhost
```apache
<VirtualHost *:80>
  ServerName api.etwin.app
  DocumentRoot /var/www/etwin/public
  <Directory /var/www/etwin/public>
    AllowOverride All
    Require all granted
  </Directory>
</VirtualHost>
```

### Nginx
```nginx
server {
  listen 80;
  server_name api.etwin.app;
  root /var/www/etwin/public;
  index index.php;
  location / { try_files $uri $uri/ /index.php?$query_string; }
  location ~ \.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/run/php/php8.2-fpm.sock;
  }
}
```

## 3. Connect the React frontend
Add to your frontend `.env`:
```
VITE_PHP_API_BASE=https://api.etwin.app
```
Rebuild the frontend. The mock `localStorage` API is bypassed automatically.

## 4. Telegram bot
1. Talk to **@BotFather** → create bot → copy token into `TELEGRAM_BOT_TOKEN`.
2. Register the webhook (one-time):
   ```bash
   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://api.etwin.app/api/telegram/webhook?secret=$TELEGRAM_WEBHOOK_SECRET"
   ```
3. In the dashboard, the seller clicks **Connect Telegram** → opens `t.me/<bot>?start=<storeId>` → presses START. The webhook stores the chat id.
4. Each new order triggers `sendMessage` with inline buttons **✅ Confirm / ❌ Cancel** that update the order status live.

## 5. Endpoints

| Method | Path                                       | Auth | Purpose                               |
|--------|--------------------------------------------|------|---------------------------------------|
| GET    | `/api/health`                              | —    | Health probe                          |
| POST   | `/api/auth/register`                       | —    | Create user + store                   |
| POST   | `/api/auth/login`                          | —    | Login → JWT                           |
| GET    | `/api/stores/{slug}`                       | —    | Public store info                     |
| PATCH  | `/api/stores/{id}`                         | JWT  | Update store, pixels, WhatsApp        |
| GET    | `/api/products`                            | JWT  | List products of current tenant       |
| POST   | `/api/products`                            | JWT  | Create product                        |
| PUT    | `/api/products/{id}`                       | JWT  | Update product                        |
| DELETE | `/api/products/{id}`                       | JWT  | Delete product                        |
| GET    | `/api/public/stores/{slug}/products`       | —    | Public catalog                        |
| GET    | `/api/orders`                              | JWT  | List orders                           |
| POST   | `/api/orders/{id}/confirm`                 | JWT  | Mark order paid                       |
| POST   | `/api/public/stores/{slug}/orders`         | —    | Storefront COD checkout               |
| GET    | `/api/customers`                           | JWT  | List customers                        |
| GET    | `/api/dashboard/stats`                     | JWT  | KPIs, sales by day, best seller       |
| GET    | `/api/telegram/connect-link`               | JWT  | Get `t.me/<bot>?start=<storeId>`     |
| POST   | `/api/telegram/webhook?secret=<SECRET>`    | —    | Telegram → us (callbacks + /start)    |

Auth header: `Authorization: Bearer <jwt>` and `X-Tenant-Id: <storeId>`.

## 6. Security checklist
- ✅ Bcrypt password hashing
- ✅ HS256 JWT (32-byte secret recommended)
- ✅ Prepared statements everywhere (no SQL injection)
- ✅ Tenant isolation on every authenticated query (`owner_id` check)
- ✅ Telegram webhook secret in query string
- ✅ CORS lockdown via `CORS_ALLOW_ORIGIN`
- ✅ utf8mb4 (Arabic + emoji safe)
