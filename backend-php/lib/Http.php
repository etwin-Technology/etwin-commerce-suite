<?php
// Tiny HTTP helpers: CORS, JSON I/O, auth context, validation.
class Http {
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

    public static function json(array|object $data, int $code = 200): void {
        http_response_code($code);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function fail(string $message, int $code = 400, array $extra = []): void {
        self::json(['error' => $message] + $extra, $code);
    }

    public static function body(): array {
        $raw = file_get_contents('php://input') ?: '';
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

    public static function authUser(): array {
        $cfg = require __DIR__ . '/../config/config.php';
        $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/Bearer\s+(.+)/i', $hdr, $m)) self::fail('Unauthorized', 401);
        $payload = JWT::decode(trim($m[1]), $cfg['jwt_secret']);
        if (!$payload || empty($payload['sub'])) self::fail('Invalid token', 401);
        return $payload; // contains sub (user id), email
    }

    public static function tenantId(): string {
        $tid = $_SERVER['HTTP_X_TENANT_ID'] ?? '';
        if (!$tid) self::fail('Missing X-Tenant-Id', 400);
        return $tid;
    }

    /** Ensure the authenticated user owns the tenant (multi-tenant guard). */
    public static function ownedTenant(): array {
        $u = self::authUser();
        $tid = self::tenantId();
        $st = DB::pdo()->prepare('SELECT * FROM stores WHERE id = ? AND owner_id = ? LIMIT 1');
        $st->execute([$tid, $u['sub']]);
        $store = $st->fetch();
        if (!$store) self::fail('Tenant not found or forbidden', 403);
        return ['user' => $u, 'store' => $store];
    }

    public static function slugify(string $s): string {
        $s = mb_strtolower($s, 'UTF-8');
        $s = preg_replace('/[^\p{L}\p{N}]+/u', '-', $s) ?? '';
        $s = trim($s, '-');
        return $s === '' ? 'store' : $s;
    }
}
