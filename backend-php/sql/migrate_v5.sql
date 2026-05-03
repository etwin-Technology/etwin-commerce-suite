-- ETWIN Commerce — Migration v5
-- Adds: 3-tier plans (starter, pro, business)
-- Run AFTER migrate_v4.sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
USE etwin_commerce;

-- 1. Extend stores.plan enum to include 'business' (and rename 'trial' → 'starter' is breaking; we keep trial as alias)
ALTER TABLE stores
  MODIFY COLUMN plan ENUM('trial','starter','pro','business') NOT NULL DEFAULT 'starter';

-- migrate any old 'trial' → 'starter' for clarity
UPDATE stores SET plan = 'starter' WHERE plan = 'trial';

-- 2. plan_features.min_plan: extend enum
ALTER TABLE plan_features
  MODIFY COLUMN min_plan ENUM('trial','starter','pro','business') NOT NULL DEFAULT 'starter';

UPDATE plan_features SET min_plan = 'starter' WHERE min_plan = 'trial';

-- 3. plan catalog table — managed by super admin
CREATE TABLE IF NOT EXISTS plan_catalog (
  id            VARCHAR(40) NOT NULL PRIMARY KEY,   -- starter|pro|business
  name          VARCHAR(80) NOT NULL,
  price_mad     DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration      VARCHAR(40) NOT NULL DEFAULT 'par mois',
  product_limit INT NULL,    -- NULL = unlimited
  team_limit    INT NOT NULL DEFAULT 0,
  custom_domain TINYINT(1) NOT NULL DEFAULT 0,
  telegram_bot  TINYINT(1) NOT NULL DEFAULT 0,
  pixels        TINYINT(1) NOT NULL DEFAULT 0,
  analytics     TINYINT(1) NOT NULL DEFAULT 0,
  remove_brand  TINYINT(1) NOT NULL DEFAULT 0,
  priority_supp TINYINT(1) NOT NULL DEFAULT 0,
  recommended   TINYINT(1) NOT NULL DEFAULT 0,
  sort_order    INT NOT NULL DEFAULT 0,
  active        TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO plan_catalog (id, name, price_mad, duration, product_limit, team_limit, custom_domain, telegram_bot, pixels, analytics, remove_brand, priority_supp, recommended, sort_order)
VALUES
  ('starter',  'Starter',  0,    '14 jours essai', 10,   0, 0, 0, 0, 0, 0, 0, 0, 1),
  ('pro',      'Pro',      99,   'par mois',       NULL, 2, 1, 1, 1, 1, 0, 0, 1, 2),
  ('business', 'Business', 299,  'par mois',       NULL, 10, 1, 1, 1, 1, 1, 1, 0, 3)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), price_mad = VALUES(price_mad), duration = VALUES(duration),
  product_limit = VALUES(product_limit), team_limit = VALUES(team_limit),
  custom_domain = VALUES(custom_domain), telegram_bot = VALUES(telegram_bot),
  pixels = VALUES(pixels), analytics = VALUES(analytics), remove_brand = VALUES(remove_brand),
  priority_supp = VALUES(priority_supp), recommended = VALUES(recommended), sort_order = VALUES(sort_order);

SET FOREIGN_KEY_CHECKS = 1;
