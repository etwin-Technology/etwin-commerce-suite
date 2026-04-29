<?php
/**
 * ETWIN Commerce — Demo Seed Script
 * Run once: php backend-php/sql/seed_demo.php
 * This regenerates bcrypt hashes for demo accounts with the current PHP version.
 * Password for all demo accounts: demo1234
 */
declare(strict_types=1);
require __DIR__ . '/../lib/DB.php';
require __DIR__ . '/../lib/Http.php';
require __DIR__ . '/../config/config.php';

$hash = password_hash('demo1234', PASSWORD_BCRYPT, ['cost' => 10]);

$pdo = DB::pdo();

$accounts = [
    ['demo-user-001',  'demo@etwin.app',        'Youssef Bennani',  'user',        0],
    ['demo-admin-001', 'admin@etwin.app',        'Amina Chakir',     'admin',       0],
    ['demo-super-001', 'superadmin@etwin.app',   'Mehdi El Fassi',   'super_admin', 1],
];

foreach ($accounts as [$id, $email, $name, $role, $isAdmin]) {
    $st = $pdo->prepare('SELECT id FROM users WHERE id = ? OR email = ? LIMIT 1');
    $st->execute([$id, $email]);
    if ($st->fetch()) {
        $pdo->prepare('UPDATE users SET password_hash = ?, role = ?, is_admin = ? WHERE id = ?')
            ->execute([$hash, $role, $isAdmin, $id]);
        echo "Updated: $email\n";
    } else {
        $pdo->prepare('INSERT INTO users (id, email, password_hash, full_name, role, is_admin) VALUES (?,?,?,?,?,?)')
            ->execute([$id, $email, $hash, $name, $role, $isAdmin]);
        echo "Created: $email\n";
    }
}

// Ensure stores exist for demo and admin accounts
$stores = [
    ['store-demo-001',  'demo-user-001',  'Atlas Watches',   'atlas-watches',   'trial', 14, 1],
    ['store-admin-001', 'demo-admin-001', 'Sahara Boutique', 'sahara-boutique', 'pro',   30, 1],
];

foreach ($stores as [$storeId, $ownerId, $name, $slug, $plan, $days, $onboarding]) {
    $st = $pdo->prepare('SELECT id FROM stores WHERE id = ? LIMIT 1');
    $st->execute([$storeId]);
    if (!$st->fetch()) {
        $expires = date('Y-m-d H:i:s', strtotime("+{$days} days"));
        $pdo->prepare('INSERT INTO stores (id, owner_id, name, slug, currency, city, plan, plan_expires_at, plan_active, onboarding_complete) VALUES (?,?,?,?,?,?,?,?,1,?)')
            ->execute([$storeId, $ownerId, $name, $slug, 'MAD', 'Maroc', $plan, $expires, $onboarding]);
        echo "Created store: $name\n";
    }
}

echo "\nDemo accounts ready:\n";
echo "  demo@etwin.app        / demo1234  → role: user\n";
echo "  admin@etwin.app       / demo1234  → role: admin\n";
echo "  superadmin@etwin.app  / demo1234  → role: super_admin\n";
