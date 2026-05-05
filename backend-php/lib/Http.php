<?php
/**
 * Http — CORS bootstrap, JSON I/O, auth context, role & plan guards.
 *
 * Roles (ascending): user < admin < super_admin
 * Plans (ascending): trial < pro
 */
class Http {

    // ──────────────────────────────────────────────────────────────────────────
    //  Bootstrap
    // ──────────────────────────────────────────────────────────────────────────
    public static function bootstrap(): void {
        $cfg = require __DIR__ . '/../config/config.php';

        // Enforce HTTPS in production. Trust X-Forwarded-Proto when behind a proxy.
        if (!empty($cfg['force_https'])) {
            $proto = $_SERVER['HTTP_X_FORWARDED_PROTO']
                ?? (($_SERVER['HTTPS'] ?? '') === 'on' ? 'https' : 'http');
            if ($proto !== 'https') {
                header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
                self::fail('HTTPS required', 426);
            }
        }

        header('Access-Control-Allow-Origin: ' . $cfg['cors_allow_origin']);
        if ($cfg['cors_allow_origin'] !== '*') header('Vary: Origin');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Tenant-Id');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Max-Age: 86400');
        header('Content-Type: application/json; charset=utf-8');
        // Defensive security headers (API responses, no HTML).
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: no-referrer');
        header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");

        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }

    /** Best-effort client IP, trusting X-Forwarded-For only if explicitly behind a proxy. */
    public static function clientIp(): string {
        $fwd = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
        if ($fwd) return trim(explode(',', $fwd)[0]);
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Response helpers
    // ──────────────────────────────────────────────────────────────────────────
    public static function json(array|object|null $data, int $code = 200): void {
        http_response_code($code);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function fail(string $message, int $code = 400, array $extra = []): void {
        self::json(['error' => $message] + $extra, $code);
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Request body
    // ──────────────────────────────────────────────────────────────────────────
    public static function body(): array {
        $raw  = file_get_contents('php://input') ?: '';
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    public static function require(array $body, array $fields): array {
        $out = [];
        foreach ($fields as $f) {
            if (!isset($body[$f]) || (is_string($body[$f]) && trim($body[$f]) === '')) {
                self::fail("Missing field: $f", 422);
            }
            $out[$f] = is_string($body[$f]) ? trim($body[$f]) : $body[$f];
        }
        return $out;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Auth — extract JWT payload
    // ──────────────────────────────────────────────────────────────────────────
    public static function authUser(): array {
        $cfg = require __DIR__ . '/../config/config.php';
        $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/Bearer\s+(.+)/i', $hdr, $m)) self::fail('Unauthorized', 401);
        $payload = JWT::decode(trim($m[1]), $cfg['jwt_secret']);
        if (!$payload || empty($payload['sub'])) self::fail('Invalid token', 401);
        return $payload; // has: sub, email, role
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Tenant guard — the authenticated user must own this tenant
    // ──────────────────────────────────────────────────────────────────────────
    public static function tenantId(): string {
        $tid = $_SERVER['HTTP_X_TENANT_ID'] ?? '';
        if (!$tid) self::fail('Missing X-Tenant-Id', 400);
        return $tid;
    }

    public static function ownedTenant(): array {
        $u   = self::authUser();
        $tid = self::tenantId();
        $st  = DB::pdo()->prepare('SELECT * FROM stores WHERE id = ? AND owner_id = ? LIMIT 1');
        $st->execute([$tid, $u['sub']]);
        $store = $st->fetch();
        if (!$store) self::fail('Tenant not found or forbidden', 403);
        if (!empty($store['suspended'])) self::fail('Cette boutique est suspendue. Contactez le support.', 423);
        return ['user' => $u, 'store' => $store];
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Role guards
    // ──────────────────────────────────────────────────────────────────────────
    private static function roleWeight(string $role): int {
        return match($role) {
            'super_admin' => 3,
            'admin'       => 2,
            'user'        => 1,
            default       => 0,
        };
    }

    /**
     * Require the caller to have at least the given role.
     * Returns the decoded JWT payload on success.
     */
    public static function requireRole(string $minRole = 'admin'): array {
        $u = self::authUser();

        // Fetch fresh role from DB (don't trust JWT alone for role elevation)
        $st = DB::pdo()->prepare('SELECT role, is_admin FROM users WHERE id = ? LIMIT 1');
        $st->execute([$u['sub']]);
        $row = $st->fetch();
        if (!$row) self::fail('User not found', 404);

        $role = $row['role'] ?? 'user';
        // backward compat: is_admin=1 → treat as super_admin if role not set
        if ($role === 'user' && $row['is_admin']) $role = 'super_admin';

        if (self::roleWeight($role) < self::roleWeight($minRole)) {
            self::fail('Insufficient permissions', 403);
        }

        $u['role'] = $role;
        return $u;
    }

    /** Shorthand: require super_admin (backward compat with old requireAdmin calls). */
    public static function requireAdmin(): array {
        return self::requireRole('super_admin');
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Plan guards
    // ──────────────────────────────────────────────────────────────────────────
    private static function planWeight(string $plan): int {
        return match($plan) {
            'business' => 4,
            'pro'      => 3,
            'starter'  => 2,
            'trial'    => 1, // legacy
            default    => 0,
        };
    }

    /**
     * Get the plan for the current tenant.
     * Returns ['plan' => 'trial'|'pro', 'active' => bool, 'store' => row].
     */
    public static function tenantPlan(): array {
        $ctx   = self::ownedTenant();
        $store = $ctx['store'];
        $plan  = $store['plan'] ?? 'trial';
        $active = (bool)$store['plan_active'] && strtotime($store['plan_expires_at']) > time();
        return ['plan' => $plan, 'active' => $active, 'store' => $store, 'user' => $ctx['user']];
    }

    /**
     * Require tenant to be on a specific plan (or higher).
     * Fails with 402 Payment Required if not.
     */
    public static function requirePlan(string $minPlan): array {
        $ctx = self::tenantPlan();
        if (!$ctx['active']) self::fail('Subscription expired. Renew your plan to access this feature.', 402);
        if (self::planWeight($ctx['plan']) < self::planWeight($minPlan)) {
            self::fail("This feature requires the Pro plan. Upgrade at /dashboard/subscription.", 402);
        }
        return $ctx;
    }

    /**
     * Get the product limit for the current tenant's plan, honouring any
     * super-admin override on this store. Returns null = unlimited, 0 = blocked.
     */
    public static function planProductLimit(array $store): ?int {
        $active = (bool)$store['plan_active'] && strtotime($store['plan_expires_at']) > time();
        if (!$active) return 0; // expired = no creates

        // Override wins if present (and not expired).
        $override = self::featureOverride($store['id'], 'product_limit');
        if ($override !== null) {
            // override_value = NULL with granted=1 is treated as "unlimited"
            if ($override['granted'] && $override['value'] === null) return null;
            return (int)$override['value'];
        }

        $plan = $store['plan'] === 'trial' ? 'starter' : $store['plan'];
        $row = DB::pdo()->prepare('SELECT product_limit FROM plan_catalog WHERE id = ? LIMIT 1');
        $row->execute([$plan]);
        $val = $row->fetchColumn();
        if ($val === false) return 10;
        return $val === null ? null : (int)$val;
    }

    /** Team-member limit for the current tenant. 0 means feature locked. */
    public static function planTeamLimit(array $store): int {
        $override = self::featureOverride($store['id'], 'team_limit');
        if ($override !== null) {
            if (!$override['granted']) return 0;
            return $override['value'] === null ? 999 : (int)$override['value'];
        }
        $plan = $store['plan'] === 'trial' ? 'starter' : $store['plan'];
        $row = DB::pdo()->prepare('SELECT team_limit FROM plan_catalog WHERE id = ? LIMIT 1');
        $row->execute([$plan]);
        return (int)($row->fetchColumn() ?: 0);
    }

    /** Monthly order limit for the current tenant. 0 means unlimited. */
    public static function planOrderLimit(array $store): int {
        $override = self::featureOverride($store['id'], 'order_limit');
        if ($override !== null) {
            if (!$override['granted']) return 0;
            return $override['value'] === null ? 0 : (int)$override['value']; // 0 = unlimited when granted
        }
        $plan = $store['plan'] === 'trial' ? 'starter' : $store['plan'];
        $row = DB::pdo()->prepare('SELECT order_limit FROM plan_catalog WHERE id = ? LIMIT 1');
        $row->execute([$plan]);
        return (int)($row->fetchColumn() ?: 0);
    }

    /**
     * Check whether a store has a boolean feature, considering plan flags AND
     * super-admin overrides. Use this in controllers instead of hard-coding plan.
     *
     * Recognised features: custom_domain, telegram_bot, pixels, analytics,
     * remove_brand, priority_supp, excel_export.
     */
    public static function storeHasFeature(array $store, string $feature): bool {
        // Plan must be active to use any pro feature.
        $active = (bool)$store['plan_active'] && strtotime($store['plan_expires_at']) > time();
        // Override can grant even on inactive plan (e.g. comp account).
        $override = self::featureOverride($store['id'], $feature);
        if ($override !== null) return (bool)$override['granted'];

        if (!$active) return false;
        $plan = $store['plan'] === 'trial' ? 'starter' : $store['plan'];

        // Boolean features map 1:1 to plan_catalog columns.
        $allowed = ['custom_domain','telegram_bot','pixels','analytics','remove_brand','priority_supp','excel_export','whatsapp_orders'];
        if (!in_array($feature, $allowed, true)) return false;

        $row = DB::pdo()->prepare("SELECT `$feature` FROM plan_catalog WHERE id = ? LIMIT 1");
        $row->execute([$plan]);
        return (bool)(int)$row->fetchColumn();
    }

    /** Require a boolean feature; emits 402 if locked. Returns the tenant ctx. */
    public static function requireFeature(string $feature): array {
        $ctx = self::ownedTenant();
        if (!self::storeHasFeature($ctx['store'], $feature)) {
            self::fail("Cette fonctionnalité ($feature) n'est pas activée pour votre plan.", 402);
        }
        return $ctx;
    }

    /**
     * Build the full effective feature flag set for a store. Used by /api/features
     * and the dashboard so the UI can lock features the store can't use.
     */
    public static function effectiveFeatures(array $store): array {
        $bools = ['custom_domain','telegram_bot','pixels','analytics','remove_brand','priority_supp','excel_export','whatsapp_orders'];
        $out = [];
        foreach ($bools as $f) $out[$f] = self::storeHasFeature($store, $f);
        $out['product_limit'] = self::planProductLimit($store); // null = unlimited, 0 = blocked, int = cap
        $out['team_limit']    = self::planTeamLimit($store);
        $out['order_limit']   = self::planOrderLimit($store);   // 0 = unlimited
        return $out;
    }

    /**
     * Look up a single override row for this store + feature.
     * Returns ['granted' => bool, 'value' => int|null] or null when no override exists.
     * Treats expired overrides (expires_at < NOW) as if they didn't exist.
     */
    public static function featureOverride(string $tenantId, string $feature): ?array {
        $st = DB::pdo()->prepare(
            'SELECT granted, override_value FROM store_feature_overrides
             WHERE tenant_id = ? AND feature = ?
               AND (expires_at IS NULL OR expires_at > NOW())
             LIMIT 1'
        );
        try {
            $st->execute([$tenantId, $feature]);
        } catch (PDOException $e) {
            // table may not exist yet on a stale DB — fall back to plan-only.
            return null;
        }
        $row = $st->fetch();
        if (!$row) return null;
        return [
            'granted' => (bool)(int)$row['granted'],
            'value'   => $row['override_value'] === null ? null : (int)$row['override_value'],
        ];
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Utilities
    // ──────────────────────────────────────────────────────────────────────────
    public static function slugify(string $s): string {
        $s = mb_strtolower($s, 'UTF-8');
        $s = preg_replace('/[^\p{L}\p{N}]+/u', '-', $s) ?? '';
        $s = trim($s, '-');
        return $s === '' ? 'store' : $s;
    }
}
