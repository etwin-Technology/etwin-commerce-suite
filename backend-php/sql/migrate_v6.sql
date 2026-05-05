-- ETWIN Commerce — Migration v6
-- Adds: per-store feature overrides + admin-managed plan catalog flags.
-- Lets a super admin grant individual stores access to features beyond their plan
-- (e.g. unlock custom domain on Starter, raise product limit on Pro, etc.) without
-- changing the store's billing plan.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
USE etwin_commerce;

-- 1. store_feature_overrides
--    feature: matches plan_catalog flag column name
--    override_value: NULL = simple boolean (use `granted`); INT/JSON = limit override
CREATE TABLE IF NOT EXISTS store_feature_overrides (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id     CHAR(36)     NOT NULL,
  feature       VARCHAR(64)  NOT NULL,
  granted       TINYINT(1)   NOT NULL DEFAULT 1,
  override_value INT          NULL,                -- e.g. product_limit override; NULL = no numeric override
  reason        VARCHAR(255)  NULL,
  granted_by    CHAR(36)     NULL,                 -- the super_admin user id who set this
  granted_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME     NULL,                 -- NULL = permanent
  CONSTRAINT fk_sfo_tenant FOREIGN KEY (tenant_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_sfo (tenant_id, feature),
  INDEX idx_sfo_feature (feature)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Catalog of recognised features. Used by the admin UI to render toggles.
CREATE TABLE IF NOT EXISTS feature_catalog (
  feature      VARCHAR(64)  NOT NULL PRIMARY KEY,
  label_fr     VARCHAR(120) NOT NULL,
  label_ar     VARCHAR(120) NOT NULL,
  description  VARCHAR(255) NULL,
  kind         ENUM('boolean','number') NOT NULL DEFAULT 'boolean',
  default_min_plan ENUM('starter','pro','business') NOT NULL DEFAULT 'pro',
  sort_order   INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO feature_catalog (feature, label_fr, label_ar, description, kind, default_min_plan, sort_order) VALUES
  ('custom_domain', 'Domaine personnalisé',     'دومين خاص',                 'Connecter un domaine .com personnalisé',         'boolean','pro',      10),
  ('telegram_bot',  'Notifications Telegram',   'إشعارات Telegram',          'Recevoir les commandes via le bot Telegram',     'boolean','pro',      20),
  ('pixels',        'Pixels publicitaires',     'بكسلات الإعلانات',           'Facebook & TikTok pixel tracking',               'boolean','pro',      30),
  ('analytics',     'Statistiques avancées',    'إحصائيات متقدمة',            'Tableau de bord & graphiques détaillés',         'boolean','pro',      40),
  ('remove_brand',  'Sans branding ETWIN',      'بلا علامة ETWIN',            'Cacher "Powered by ETWIN" sur la boutique',      'boolean','business', 50),
  ('priority_supp', 'Support prioritaire',      'دعم بالأولوية',              'Réponse sous 4 h ouvrées',                       'boolean','business', 60),
  ('excel_export',  'Export Excel',             'تصدير Excel',                'Exporter produits / commandes / clients en .xlsx','boolean','starter',  70),
  ('product_limit', 'Limite produits',          'حد المنتجات',                'Nombre maximum de produits actifs',              'number', 'starter',  80),
  ('team_limit',    'Limite équipe',            'حد الفريق',                  'Nombre maximum de membres équipe',               'number', 'pro',      90),
  ('order_limit',   'Limite commandes/mois',    'حد الطلبات/شهر',             'Plafond mensuel de commandes (0 = illimité)',    'number', 'starter', 100),
  ('whatsapp_orders','Commandes WhatsApp',      'طلبات WhatsApp',             'Bouton WhatsApp sur la boutique pour passer commande','boolean','starter', 5)
ON DUPLICATE KEY UPDATE
  label_fr = VALUES(label_fr), label_ar = VALUES(label_ar),
  description = VALUES(description), kind = VALUES(kind),
  default_min_plan = VALUES(default_min_plan), sort_order = VALUES(sort_order);

-- 3. plan_catalog: add order_limit + excel_export + whatsapp_orders columns
ALTER TABLE plan_catalog
  ADD COLUMN IF NOT EXISTS order_limit INT NOT NULL DEFAULT 0 AFTER team_limit,
  ADD COLUMN IF NOT EXISTS excel_export TINYINT(1) NOT NULL DEFAULT 1 AFTER order_limit,
  ADD COLUMN IF NOT EXISTS whatsapp_orders TINYINT(1) NOT NULL DEFAULT 1 AFTER excel_export;

-- Sensible defaults: Starter capped, Pro+ unlimited; Excel + WhatsApp on for everyone
UPDATE plan_catalog SET order_limit = 30, excel_export = 1, whatsapp_orders = 1 WHERE id = 'starter';
UPDATE plan_catalog SET order_limit = 0,  excel_export = 1, whatsapp_orders = 1 WHERE id = 'pro';
UPDATE plan_catalog SET order_limit = 0,  excel_export = 1, whatsapp_orders = 1 WHERE id = 'business';

SET FOREIGN_KEY_CHECKS = 1;
