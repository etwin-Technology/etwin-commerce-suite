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
        header('Access-Control-Allow-Origin: ' . $cfg['cors_allow_origin']);
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Tenant-Id');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Max-Age: 86400');
        header('Content-Type: application/json; charset=utf-8');
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
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
     * Get the product limit for the current tenant's plan.
     * Returns null = unlimited.
     */
    public static function planProductLimit(array $store): ?int {
        if ($store['plan'] === 'pro' && (bool)$store['plan_active'] && strtotime($store['plan_expires_at']) > time()) {
            return null; // unlimited on pro
        }
        $row = DB::pdo()->query("SELECT trial_limit FROM plan_features WHERE feature = 'products' LIMIT 1")->fetch();
        return $row ? (int)$row['trial_limit'] : 10;
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
