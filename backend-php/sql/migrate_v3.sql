-- ETWIN Commerce — Migration v3
-- Adds: RBAC roles, plan feature gating, platform settings, demo seed accounts
-- Run ONCE on top of schema.sql + migrate_v2.sql
-- Safe: IF NOT EXISTS / INSERT IGNORE / ALTER IGNORE

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
USE etwin_commerce;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. USERS — add `role` column (super_admin > admin > user)
--    Keep is_admin for backward compat; role is the canonical field.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role ENUM('user','admin','super_admin') NOT NULL DEFAULT 'user' AFTER is_admin;

-- Promote existing is_admin=1 users to super_admin
UPDATE users SET role = 'super_admin' WHERE is_admin = 1 AND role = 'user';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PLAN FEATURES — which features are locked behind which plan
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plan_features (
  feature     VARCHAR(100)  NOT NULL PRIMARY KEY,
  min_plan    ENUM('trial','pro') NOT NULL DEFAULT 'trial',
  trial_limit INT           NULL COMMENT 'NULL = unlimited, integer = max count',
  description VARCHAR(255)  NOT NULL DEFAULT '',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO plan_features (feature, min_plan, trial_limit, description) VALUES
  ('products',          'trial', 10,   'Max 10 products on trial plan'),
  ('custom_domain',     'pro',   0,    'Custom domain support'),
  ('telegram_bot',      'pro',   0,    'Telegram bot order notifications'),
  ('facebook_pixel',    'pro',   0,    'Facebook & TikTok pixel tracking'),
  ('advanced_analytics','pro',   0,    'Advanced analytics dashboard'),
  ('remove_branding',   'pro',   0,    'Remove ETWIN branding from storefront'),
  ('team_members',      'pro',   0,    'Invite team members to dashboard');

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PLATFORM SETTINGS — super-admin-controlled global config
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  `key`      VARCHAR(100) NOT NULL PRIMARY KEY,
  `value`    LONGTEXT     NULL,
  `type`     ENUM('string','json','boolean','number') NOT NULL DEFAULT 'string',
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO platform_settings (`key`, `value`, `type`) VALUES
  ('maintenance_mode',   '0',               'boolean'),
  ('platform_name',      'ETWIN Commerce',  'string'),
  ('trial_days',         '14',              'number'),
  ('max_products_trial', '10',              'number'),
  ('pricing_price',      '99',              'number'),
  ('pricing_currency',   'MAD',             'string'),
  ('hero_badge_ar',      'منصة مغربية #1',  'string'),
  ('hero_badge_fr',      'Plateforme n°1',  'string'),
  ('hero_title_ar',      'صاوب متجرك وبدا تبيع دابا', 'string'),
  ('hero_title_fr',      'Lance ta boutique et vends maintenant', 'string'),
  ('hero_subtitle_ar',   'منصة مغربية متكاملة لإطلاق متجر أونلاين في 60 ثانية. WhatsApp + COD + Telegram.', 'string'),
  ('hero_subtitle_fr',   'Plateforme marocaine pour lancer une boutique en 60s. WhatsApp + COD + Telegram.', 'string'),
  ('hero_cta_ar',        'ابدأ مجاناً',     'string'),
  ('hero_cta_fr',        'Commencer gratuitement', 'string'),
  ('support_whatsapp',   '',                'string'),
  ('support_email',      'support@etwin.app', 'string'),
  ('footer_text_ar',     'منصة مغربية لإطلاق متجرك الأونلاين', 'string'),
  ('footer_text_fr',     'La plateforme marocaine pour votre boutique en ligne', 'string');

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. DEMO SEED ACCOUNTS
--    Passwords are all "demo1234" (hashed with bcrypt cost 10).
--    Run seed_demo.php if you need fresh bcrypt hashes for your PHP version.
-- ─────────────────────────────────────────────────────────────────────────────
-- demo@etwin.app     → role: user       (regular merchant)
-- admin@etwin.app    → role: admin      (platform admin)
-- superadmin@etwin.app → role: super_admin

INSERT IGNORE INTO users (id, email, password_hash, full_name, is_admin, role) VALUES
  ('demo-user-001',   'demo@etwin.app',        '$2y$10$q8I.g5pN2QCjkYgb1q8DquNyDgn7OYi0kZdXQ3eSJnUJJ0fIMnBDG', 'Youssef Bennani',  0, 'user'),
  ('demo-admin-001',  'admin@etwin.app',        '$2y$10$q8I.g5pN2QCjkYgb1q8DquNyDgn7OYi0kZdXQ3eSJnUJJ0fIMnBDG', 'Amina Chakir',     0, 'admin'),
  ('demo-super-001',  'superadmin@etwin.app',   '$2y$10$q8I.g5pN2QCjkYgb1q8DquNyDgn7OYi0kZdXQ3eSJnUJJ0fIMnBDG', 'Mehdi El Fassi',   1, 'super_admin');

-- Stores for the demo accounts
INSERT IGNORE INTO stores (id, owner_id, name, slug, currency, city, plan, plan_expires_at, plan_active, onboarding_complete)
VALUES
  ('store-demo-001',  'demo-user-001',  'Atlas Watches',   'atlas-watches',  'MAD', 'Tanger',      'trial', DATE_ADD(NOW(), INTERVAL 14 DAY), 1, 1),
  ('store-admin-001', 'demo-admin-001', 'Sahara Boutique', 'sahara-boutique','MAD', 'Casablanca',  'pro',   DATE_ADD(NOW(), INTERVAL 30 DAY), 1, 1);

-- Seed products for the demo store
INSERT IGNORE INTO products (id, tenant_id, name, description, price, original_price, image, stock, status) VALUES
  ('prod-demo-001', 'store-demo-001', 'Montre Atlas Classic',
   'Montre élégante en cuir véritable. Mouvement quartz japonais. Garantie 1 an.',
   299, 450,
   'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80',
   12, 'active'),
  ('prod-demo-002', 'store-demo-001', 'Bracelet cuir naturel',
   'Bracelet en cuir tressé fait main. Trois couleurs disponibles.',
   89, 149,
   'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=80',
   25, 'active'),
  ('prod-demo-003', 'store-demo-001', 'Lunettes de soleil Sahara',
   'Verres polarisés UV400. Monture en acétate italien.',
   179, 280,
   'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=900&q=80',
   8, 'active');

SET FOREIGN_KEY_CHECKS = 1;
