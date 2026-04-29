-- ETWIN Commerce - MySQL Schema
-- Charset: utf8mb4 for full Arabic + emoji support
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS etwin_commerce
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE etwin_commerce;

-- ---------- USERS ----------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id            CHAR(36) PRIMARY KEY,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(190) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- STORES (tenants) ----------
DROP TABLE IF EXISTS stores;
CREATE TABLE stores (
  id                    CHAR(36) PRIMARY KEY,
  owner_id              CHAR(36) NOT NULL,
  name                  VARCHAR(190) NOT NULL,
  slug                  VARCHAR(120) NOT NULL UNIQUE,
  currency              VARCHAR(8) NOT NULL DEFAULT 'MAD',
  city                  VARCHAR(120) NOT NULL DEFAULT '',
  logo_url              TEXT NULL,
  whatsapp_number       VARCHAR(40) NOT NULL DEFAULT '',
  telegram_chat_id      VARCHAR(64) NULL,
  facebook_pixel        VARCHAR(64) NULL,
  tiktok_pixel          VARCHAR(64) NULL,
  onboarding_complete   TINYINT(1) NOT NULL DEFAULT 0,
  plan                  ENUM('trial','pro') NOT NULL DEFAULT 'trial',
  plan_expires_at       DATETIME NOT NULL,
  plan_active           TINYINT(1) NOT NULL DEFAULT 1,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_stores_owner (owner_id),
  INDEX idx_stores_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- PRODUCTS ----------
DROP TABLE IF EXISTS products;
CREATE TABLE products (
  id              CHAR(36) PRIMARY KEY,
  tenant_id       CHAR(36) NOT NULL,
  name            VARCHAR(190) NOT NULL,
  description     TEXT NOT NULL,
  price           DECIMAL(12,2) NOT NULL DEFAULT 0,
  original_price  DECIMAL(12,2) NULL,
  image           LONGTEXT NOT NULL,
  extra_images    JSON NULL,
  video_url       TEXT NULL,
  stock           INT NOT NULL DEFAULT 0,
  status          ENUM('active','draft','archived') NOT NULL DEFAULT 'active',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_tenant FOREIGN KEY (tenant_id) REFERENCES stores(id) ON DELETE CASCADE,
  INDEX idx_products_tenant (tenant_id),
  INDEX idx_products_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- CUSTOMERS ----------
DROP TABLE IF EXISTS customers;
CREATE TABLE customers (
  id            CHAR(36) PRIMARY KEY,
  tenant_id     CHAR(36) NOT NULL,
  name          VARCHAR(190) NOT NULL,
  phone         VARCHAR(40)  NOT NULL,
  address       VARCHAR(255) NOT NULL DEFAULT '',
  orders_count  INT NOT NULL DEFAULT 0,
  total_spent   DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_customers_tenant FOREIGN KEY (tenant_id) REFERENCES stores(id) ON DELETE CASCADE,
  INDEX idx_customers_tenant (tenant_id),
  INDEX idx_customers_phone (tenant_id, phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- ORDERS ----------
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id                CHAR(36) PRIMARY KEY,
  tenant_id         CHAR(36) NOT NULL,
  customer_id       CHAR(36) NULL,
  customer_name     VARCHAR(190) NOT NULL,
  customer_phone    VARCHAR(40)  NOT NULL DEFAULT '',
  customer_address  VARCHAR(255) NOT NULL DEFAULT '',
  city              VARCHAR(120) NOT NULL DEFAULT '',
  total             DECIMAL(12,2) NOT NULL DEFAULT 0,
  status            ENUM('pending','paid','shipped') NOT NULL DEFAULT 'pending',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_tenant   FOREIGN KEY (tenant_id)   REFERENCES stores(id)    ON DELETE CASCADE,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  INDEX idx_orders_tenant (tenant_id),
  INDEX idx_orders_status (tenant_id, status),
  INDEX idx_orders_created (tenant_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- ORDER ITEMS ----------
DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id    CHAR(36) NOT NULL,
  product_id  CHAR(36) NULL,
  name        VARCHAR(190) NOT NULL,
  qty         INT NOT NULL DEFAULT 1,
  price       DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_items_order   FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
