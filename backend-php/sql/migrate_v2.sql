-- ETWIN Commerce — Migration v2
-- Run ONCE on top of schema.sql (v1).
-- Safe: uses IF NOT EXISTS / column existence checks via ALTER IGNORE.
-- Charset: utf8mb4 for full Arabic + emoji support.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE etwin_commerce;

-- ──────────────────────────────────────────────────────────────
-- 1. USERS — add is_admin flag
-- ──────────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin TINYINT(1) NOT NULL DEFAULT 0;

-- ──────────────────────────────────────────────────────────────
-- 2. STORES — add theme / header / footer / custom-domain
-- ──────────────────────────────────────────────────────────────
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS theme_settings  JSON NULL     COMMENT 'primaryColor, secondaryColor, accentColor, fontFamily, borderRadius',
  ADD COLUMN IF NOT EXISTS header_settings JSON NULL     COMMENT '{logoUrl, menuLinks:[{label,url}], showSearch}',
  ADD COLUMN IF NOT EXISTS footer_settings JSON NULL     COMMENT '{description, links:[{label,url}], socials:{facebook,instagram,tiktok,youtube}}',
  ADD COLUMN IF NOT EXISTS custom_domain   VARCHAR(253) NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS domain_verified TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS domain_verified_at DATETIME NULL;

-- ──────────────────────────────────────────────────────────────
-- 3. ORDERS — add notes + shipping_status
-- ──────────────────────────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS notes           TEXT NULL,
  ADD COLUMN IF NOT EXISTS shipping_status ENUM('none','preparing','dispatched','delivered') NOT NULL DEFAULT 'none';

-- ──────────────────────────────────────────────────────────────
-- 4. NOTIFICATIONS — dashboard bell alerts
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id  CHAR(36)     NOT NULL,
  type       ENUM('order','system','payment','domain') NOT NULL DEFAULT 'order',
  title      VARCHAR(255) NOT NULL,
  body       TEXT         NOT NULL,
  ref_id     CHAR(36)     NULL   COMMENT 'order_id or domain or plan id',
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_tenant FOREIGN KEY (tenant_id) REFERENCES stores(id) ON DELETE CASCADE,
  INDEX idx_notif_tenant_read (tenant_id, is_read),
  INDEX idx_notif_tenant_date (tenant_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ──────────────────────────────────────────────────────────────
-- 5. SUBSCRIPTION_PLANS — billing history
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  store_id   CHAR(36)     NOT NULL,
  plan       ENUM('trial','pro') NOT NULL DEFAULT 'trial',
  amount     DECIMAL(10,2)NOT NULL DEFAULT 0.00,
  started_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME     NOT NULL,
  status     ENUM('active','expired','cancelled') NOT NULL DEFAULT 'active',
  notes      TEXT         NULL,
  CONSTRAINT fk_subplan_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  INDEX idx_subplan_store (store_id),
  INDEX idx_subplan_status (store_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ──────────────────────────────────────────────────────────────
-- 6. Seed the first subscription row from existing stores
-- ──────────────────────────────────────────────────────────────
INSERT IGNORE INTO subscription_plans (store_id, plan, amount, started_at, expires_at, status)
SELECT id,
       plan,
       IF(plan = 'pro', 99.00, 0.00),
       created_at,
       plan_expires_at,
       IF(plan_active = 1 AND plan_expires_at > NOW(), 'active', 'expired')
FROM stores;

SET FOREIGN_KEY_CHECKS = 1;
