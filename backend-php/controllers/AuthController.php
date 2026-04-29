<?php
class AuthController {
    public static function register(): void {
        $cfg = require __DIR__ . '/../config/config.php';
        $b = Http::body();
        $in = Http::require($b, ['email','password','fullName','storeName']);
        if (!filter_var($in['email'], FILTER_VALIDATE_EMAIL)) Http::fail('Invalid email', 422);
        if (strlen($in['password']) < 6) Http::fail('Password too short', 422);

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

        $pdo->beginTransaction();
        try {
            $pdo->prepare('INSERT INTO users (id,email,password_hash,full_name) VALUES (?,?,?,?)')
                ->execute([$userId, $in['email'], $hash, $in['fullName']]);

            $expires = date('Y-m-d H:i:s', strtotime('+14 days'));
            $pdo->prepare('INSERT INTO stores
                (id, owner_id, name, slug, currency, city, plan, plan_expires_at)
                VALUES (?,?,?,?,?,?,?,?)')
                ->execute([$storeId, $userId, $in['storeName'], $slug, 'MAD', '', 'trial', $expires]);
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            Http::fail('Could not create account', 500);
        }

        $user  = $pdo->query("SELECT * FROM users  WHERE id = " . $pdo->quote($userId))->fetch();
        $store = $pdo->query("SELECT * FROM stores WHERE id = " . $pdo->quote($storeId))->fetch();
        $token = JWT::encode(['sub' => $userId, 'email' => $in['email']], $cfg['jwt_secret'], $cfg['jwt_ttl_seconds']);

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
        $st = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
        $st->execute([$in['email']]);
        $user = $st->fetch();
        if (!$user || !password_verify($in['password'], $user['password_hash'])) {
            Http::fail('Invalid credentials', 401);
        }
        $sst = $pdo->prepare('SELECT * FROM stores WHERE owner_id = ? ORDER BY created_at ASC LIMIT 1');
        $sst->execute([$user['id']]);
        $store = $sst->fetch();
        if (!$store) Http::fail('No store for user', 404);

        $token = JWT::encode(['sub' => $user['id'], 'email' => $user['email']], $cfg['jwt_secret'], $cfg['jwt_ttl_seconds']);
        Http::json([
            'token' => $token,
            'user'  => Mapper::user($user),
            'store' => Mapper::store($store),
        ]);
    }
}
