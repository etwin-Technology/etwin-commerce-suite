<?php
class AuthController {

    public static function register(): void {
        $cfg = require __DIR__ . '/../config/config.php';
        $b = Http::body();
        $in = Http::require($b, ['email','password','fullName','storeName']);
        if (!filter_var($in['email'], FILTER_VALIDATE_EMAIL)) Http::fail('Invalid email', 422);
        if (strlen($in['password']) < 8)  Http::fail('Password too short (min 8 chars)', 422);
        if (strlen($in['password']) > 200) Http::fail('Password too long', 422);
        if (mb_strlen($in['fullName'])  > 190) Http::fail('Name too long', 422);
        if (mb_strlen($in['storeName']) > 190) Http::fail('Store name too long', 422);
        if (mb_strlen($in['fullName'])  < 2)   Http::fail('Name too short', 422);
        if (mb_strlen($in['storeName']) < 2)   Http::fail('Store name too short', 422);

        $pdo = DB::pdo();
        $st = $pdo->prepare('SELECT 1 FROM users WHERE email = ?');
        $st->execute([$in['email']]);
        if ($st->fetch()) Http::fail('Email already in use', 409);

        $userId  = DB::uuid();
        $storeId = DB::uuid();
        $hash    = password_hash($in['password'], PASSWORD_BCRYPT);

        // Unique slug
        $base = Http::slugify($in['storeName']); $slug = $base; $i = 2;
        $check = $pdo->prepare('SELECT 1 FROM stores WHERE slug = ?');
        while (true) { $check->execute([$slug]); if (!$check->fetch()) break; $slug = "$base-$i"; $i++; }

        // Trial period from platform settings
        $trialDaysRow = $pdo->query("SELECT `value` FROM platform_settings WHERE `key` = 'trial_days' LIMIT 1")->fetch();
        $trialDays = $trialDaysRow ? max(1, (int)$trialDaysRow['value']) : 14;

        $pdo->beginTransaction();
        try {
            $pdo->prepare('INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?,?,?,?,?)')
                ->execute([$userId, $in['email'], $hash, $in['fullName'], 'user']);

            $expires = date('Y-m-d H:i:s', strtotime("+{$trialDays} days"));
            $pdo->prepare('INSERT INTO stores
                (id, owner_id, name, slug, currency, city, plan, plan_expires_at)
                VALUES (?,?,?,?,?,?,?,?)')
                ->execute([$storeId, $userId, $in['storeName'], $slug, 'MAD', '', 'trial', $expires]);

            // Seed initial subscription_plans row
            $pdo->prepare('INSERT INTO subscription_plans (store_id, plan, amount, expires_at) VALUES (?,?,?,?)')
                ->execute([$storeId, 'trial', 0.00, $expires]);

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            error_log('[etwin] register: ' . $e->getMessage());
            Http::fail('Could not create account', 500);
        }

        $userSt = $pdo->prepare('SELECT * FROM users  WHERE id = ?');
        $userSt->execute([$userId]);
        $user = $userSt->fetch();
        $storeSt = $pdo->prepare('SELECT * FROM stores WHERE id = ?');
        $storeSt->execute([$storeId]);
        $store = $storeSt->fetch();
        $token = JWT::encode(
            ['sub' => $userId, 'email' => $in['email'], 'role' => 'user'],
            $cfg['jwt_secret'], $cfg['jwt_ttl_seconds']
        );

        Http::json([
            'token' => $token,
            'user'  => Mapper::user($user),
            'store' => Mapper::store($store),
        ]);
    }

    public static function login(): void {
        $cfg = require __DIR__ . '/../config/config.php';
        $b = Http::body();
        $in = Http::require($b, ['email','password']);

        $pdo = DB::pdo();

        // Brute-force protection: throttle by (ip, email).
        self::ensureLoginAllowed($pdo, $cfg, $in['email']);

        $st = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
        $st->execute([$in['email']]);
        $user = $st->fetch();
        if (!$user || !password_verify($in['password'], $user['password_hash'])) {
            self::recordLoginAttempt($pdo, $in['email'], false);
            Http::fail('Invalid credentials', 401);
        }

        $role = $user['role'] ?? 'user';
        // backward compat
        if ($role === 'user' && !empty($user['is_admin'])) $role = 'super_admin';

        // Super admins don't need a store to log in
        $store = null;
        if ($role !== 'super_admin') {
            $sst = $pdo->prepare('SELECT * FROM stores WHERE owner_id = ? ORDER BY created_at ASC LIMIT 1');
            $sst->execute([$user['id']]);
            $store = $sst->fetch();
            if (!$store) Http::fail('No store for user', 404);
        } else {
            $sst = $pdo->prepare('SELECT * FROM stores WHERE owner_id = ? ORDER BY created_at ASC LIMIT 1');
            $sst->execute([$user['id']]);
            $store = $sst->fetch() ?: null;
        }

        $token = JWT::encode(
            ['sub' => $user['id'], 'email' => $user['email'], 'role' => $role],
            $cfg['jwt_secret'], $cfg['jwt_ttl_seconds']
        );

        self::recordLoginAttempt($pdo, $in['email'], true);

        Http::json([
            'token' => $token,
            'user'  => Mapper::user($user),
            'store' => $store ? Mapper::store($store) : null,
        ]);
    }

    /** Reject the request with 429 if too many failures from this IP+email lately. */
    private static function ensureLoginAllowed(PDO $pdo, array $cfg, string $email): void {
        // Lazy table create — keeps install simple, doesn't require a migration.
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS login_attempts (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(190) NOT NULL,
                ip VARCHAR(64) NOT NULL,
                success TINYINT(1) NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_la_lookup (email, ip, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        $window = (int)$cfg['login_throttle_window'];
        $max    = (int)$cfg['login_throttle_max'];
        $ip     = Http::clientIp();
        $st = $pdo->prepare(
            "SELECT COUNT(*) FROM login_attempts
             WHERE email = ? AND ip = ? AND success = 0
             AND created_at > (NOW() - INTERVAL ? SECOND)"
        );
        $st->execute([$email, $ip, $window]);
        if ((int)$st->fetchColumn() >= $max) {
            header('Retry-After: ' . $window);
            Http::fail('Too many failed attempts. Try again later.', 429);
        }
    }

    private static function recordLoginAttempt(PDO $pdo, string $email, bool $success): void {
        try {
            $pdo->prepare('INSERT INTO login_attempts (email, ip, success) VALUES (?,?,?)')
                ->execute([$email, Http::clientIp(), $success ? 1 : 0]);
            // Best-effort GC: remove rows > 24h old now and then.
            if (random_int(0, 50) === 0) {
                $pdo->exec('DELETE FROM login_attempts WHERE created_at < (NOW() - INTERVAL 1 DAY)');
            }
        } catch (Throwable $e) {
            error_log('[etwin] login_attempt log: ' . $e->getMessage());
        }
    }
}
