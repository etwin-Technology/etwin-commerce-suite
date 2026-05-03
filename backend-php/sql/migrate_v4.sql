-- ETWIN Commerce — Migration v4
-- Adds: store_members (team roles + per-member permissions), store suspended flag.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
USE etwin_commerce;

-- ─── stores: add suspended flag (super-admin can suspend any store)
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS suspended TINYINT(1) NOT NULL DEFAULT 0 AFTER plan_active,
  ADD COLUMN IF NOT EXISTS suspended_reason VARCHAR(255) NULL AFTER suspended;

-- ─── store_members: invited collaborators with role + custom permissions
CREATE TABLE IF NOT EXISTS store_members (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  tenant_id    CHAR(36)     NOT NULL,
  user_id      CHAR(36)     NULL,           -- linked when the invited email matches a user
  email        VARCHAR(190) NOT NULL,
  full_name    VARCHAR(190) NOT NULL DEFAULT '',
  role         ENUM('owner','sales','stock','custom') NOT NULL DEFAULT 'custom',
  permissions  JSON         NOT NULL,
  active       TINYINT(1)   NOT NULL DEFAULT 1,
  invited_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_members_tenant FOREIGN KEY (tenant_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_member_email (tenant_id, email),
  INDEX idx_members_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
