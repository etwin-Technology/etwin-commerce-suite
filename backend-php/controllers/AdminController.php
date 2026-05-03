<?php
/**
 * AdminController — Super Admin & Admin endpoints.
 *
 * Role matrix:
 *   super_admin → all routes below
 *   admin       → read-only stats, users, stores, domains
 *                 can suspend/unsuspend users, update plans
 *
 * Routes:
 *   GET  /api/admin/stats
 *   GET  /api/admin/users
 *   GET  /api/admin/stores
 *   GET  /api/admin/domains
 *   POST /api/admin/users/{id}/suspend
 *   POST /api/admin/users/{id}/delete          (super_admin only)
 *   PATCH /api/admin/stores/{id}/plan
 *   POST /api/admin/domains/{id}/verify
 *   POST /api/admin/domains/{id}/revoke
 *   GET  /api/admin/roles                       (super_admin only)
 *   PATCH /api/admin/users/{id}/role            (super_admin only)
 *   GET  /api/admin/settings                    (super_admin only)
 *   PATCH /api/admin/settings                   (super_admin only)
 *   GET  /api/admin/plan-features               (super_admin only)
 *   PATCH /api/admin/plan-features/{feature}    (super_admin only)
 */
class AdminController {

    // ──────────────────────────────────────────────────────────────────────────
    //  Platform-wide stats
    // ──────────────────────────────────────────────────────────────────────────
    public static function stats(): void {
        Http::requireRole('admin');
        $pdo = DB::pdo();

        $totalUsers   = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        $totalStores  = (int)$pdo->query('SELECT COUNT(*) FROM stores')->fetchColumn();
        $activeSubs   = (int)$pdo->query("SELECT COUNT(*) FROM stores WHERE plan_active = 1 AND plan_expires_at > NOW()")->fetchColumn();
        $proSubs      = (int)$pdo->query("SELECT COUNT(*) FROM stores WHERE plan = 'pro' AND plan_active = 1")->fetchColumn();
        $trialSubs    = (int)$pdo->query("SELECT COUNT(*) FROM stores WHERE plan = 'trial' AND plan_active = 1 AND plan_expires_at > NOW()")->fetchColumn();
        $expiredSubs  = (int)$pdo->query("SELECT COUNT(*) FROM stores WHERE plan_active = 0 OR plan_expires_at <= NOW()")->fetchColumn();
        $totalOrders  = (int)$pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn();
        $totalRevenue = (float)$pdo->query("SELECT COALESCE(SUM(total),0) FROM orders WHERE status != 'pending'")->fetchColumn();
        $monthlyMrr   = $proSubs * 99;
        $newUsers7d   = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();

        $growthRows = $pdo->query(
            "SELECT DATE(created_at) AS day, COUNT(*) AS cnt
             FROM users
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
             GROUP BY day ORDER BY day ASC"
        )->fetchAll();

        // Role distribution
        $roleRows = $pdo->query("SELECT role, COUNT(*) AS cnt FROM users GROUP BY role")->fetchAll();
        $roles = [];
        foreach ($roleRows as $r) $roles[$r['role']] = (int)$r['cnt'];

        Http::json([
            'totalUsers'    => $totalUsers,
            'totalStores'   => $totalStores,
            'activeSubs'    => $activeSubs,
            'proSubs'       => $proSubs,
            'trialSubs'     => $trialSubs,
            'expiredSubs'   => $expiredSubs,
            'totalOrders'   => $totalOrders,
            'totalRevenue'  => $totalRevenue,
            'monthlyMrr'    => $monthlyMrr,
            'newUsers7d'    => $newUsers7d,
            'userGrowth'    => array_map(fn($r) => ['day' => $r['day'], 'value' => (int)$r['cnt']], $growthRows),
            'roleBreakdown' => $roles,
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  User list
    // ──────────────────────────────────────────────────────────────────────────
    public static function users(): void {
        Http::requireRole('admin');
        $pdo    = DB::pdo();
        $page   = max(1, (int)($_GET['page']  ?? 1));
        $limit  = min(100, max(10, (int)($_GET['limit'] ?? 25)));
        $q      = trim($_GET['q']    ?? '');
        $role   = trim($_GET['role'] ?? '');
        $offset = ($page - 1) * $limit;

        $conditions = [];
        $params     = [];
        if ($q)    { $conditions[] = "(u.email LIKE ? OR u.full_name LIKE ?)"; $params[] = "%$q%"; $params[] = "%$q%"; }
        if ($role)  { $conditions[] = "u.role = ?"; $params[] = $role; }
        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

        $countSt = $pdo->prepare("SELECT COUNT(*) FROM users u $where");
        $countSt->execute($params);
        $total = (int)$countSt->fetchColumn();

        $st = $pdo->prepare(
            "SELECT u.id, u.email, u.full_name, u.role, u.is_admin, u.created_at,
                    s.id AS store_id, s.name AS store_name, s.slug,
                    s.plan, s.plan_expires_at, s.plan_active, s.custom_domain,
                    (SELECT COUNT(*) FROM orders o WHERE o.tenant_id = s.id) AS order_count
             FROM users u
             LEFT JOIN stores s ON s.owner_id = u.id
             $where
             ORDER BY u.created_at DESC
             LIMIT ? OFFSET ?"
        );
        $st->execute([...$params, $limit, $offset]);
        $rows = $st->fetchAll();

        Http::json([
            'total' => $total,
            'page'  => $page,
            'pages' => max(1, (int)ceil($total / $limit)),
            'items' => array_map(fn($r) => [
                'id'         => $r['id'],
                'email'      => $r['email'],
                'fullName'   => $r['full_name'],
                'role'       => $r['role'] ?? 'user',
                'isAdmin'    => (bool)$r['is_admin'],
                'createdAt'  => $r['created_at'],
                'store' => $r['store_id'] ? [
                    'id'          => $r['store_id'],
                    'name'        => $r['store_name'],
                    'slug'        => $r['slug'],
                    'plan'        => $r['plan'],
                    'expiresAt'   => $r['plan_expires_at'],
                    'active'      => (bool)$r['plan_active'],
                    'customDomain'=> $r['custom_domain'],
                    'orderCount'  => (int)$r['order_count'],
                ] : null,
            ], $rows),
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Store list
    // ──────────────────────────────────────────────────────────────────────────
    public static function stores(): void {
        Http::requireRole('admin');
        $pdo    = DB::pdo();
        $page   = max(1, (int)($_GET['page']  ?? 1));
        $limit  = min(100, max(10, (int)($_GET['limit'] ?? 25)));
        $q      = trim($_GET['q']    ?? '');
        $plan   = $_GET['plan'] ?? '';
        $offset = ($page - 1) * $limit;

        $conditions = [];
        $params     = [];
        if ($q)   { $conditions[] = "(s.name LIKE ? OR s.slug LIKE ?)"; $params[] = "%$q%"; $params[] = "%$q%"; }
        if ($plan) { $conditions[] = "s.plan = ?"; $params[] = $plan; }
        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

        $countSt = $pdo->prepare("SELECT COUNT(*) FROM stores s $where");
        $countSt->execute($params);
        $total = (int)$countSt->fetchColumn();

        $st = $pdo->prepare(
            "SELECT s.*, u.email AS owner_email, u.full_name AS owner_name, u.role AS owner_role,
                    (SELECT COUNT(*) FROM orders  o WHERE o.tenant_id  = s.id) AS order_count,
                    (SELECT COUNT(*) FROM products p WHERE p.tenant_id = s.id) AS product_count
             FROM stores s
             LEFT JOIN users u ON u.id = s.owner_id
             $where
             ORDER BY s.created_at DESC
             LIMIT ? OFFSET ?"
        );
        $st->execute([...$params, $limit, $offset]);
        $rows = $st->fetchAll();

        Http::json([
            'total' => $total,
            'page'  => $page,
            'pages' => max(1, (int)ceil($total / $limit)),
            'items' => array_map(fn($r) => [
                'id'            => $r['id'],
                'name'          => $r['name'],
                'slug'          => $r['slug'],
                'ownerEmail'    => $r['owner_email'],
                'ownerName'     => $r['owner_name'],
                'ownerRole'     => $r['owner_role'] ?? 'user',
                'plan'          => $r['plan'],
                'expiresAt'     => $r['plan_expires_at'],
                'active'        => (bool)$r['plan_active'],
                'customDomain'  => $r['custom_domain'],
                'domainVerified'=> (bool)($r['domain_verified'] ?? 0),
                'orderCount'    => (int)$r['order_count'],
                'productCount'  => (int)$r['product_count'],
                'createdAt'     => $r['created_at'],
            ], $rows),
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Suspend / unsuspend user account
    // ──────────────────────────────────────────────────────────────────────────
    public static function suspendUser(string $userId): void {
        Http::requireRole('admin');
        $pdo = DB::pdo();
        $st  = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $st->execute([$userId]);
        if (!$st->fetch()) Http::fail('User not found', 404);

        $pdo->prepare("UPDATE stores SET plan_active = NOT plan_active WHERE owner_id = ?")
            ->execute([$userId]);

        Http::json(['ok' => true]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Delete user (super_admin only)
    // ──────────────────────────────────────────────────────────────────────────
    public static function deleteUser(string $userId): void {
        Http::requireRole('super_admin');
        $pdo = DB::pdo();
        $st  = $pdo->prepare('SELECT 1 FROM users WHERE id = ? LIMIT 1');
        $st->execute([$userId]);
        if (!$st->fetch()) Http::fail('User not found', 404);
        $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);
        Http::json(['ok' => true]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Update store plan
    // ──────────────────────────────────────────────────────────────────────────
    public static function updatePlan(string $storeId): void {
        Http::requireRole('admin');
        $b      = Http::body();
        $plan   = in_array($b['plan'] ?? '', ['trial','pro']) ? $b['plan'] : null;
        $months = max(1, (int)($b['months'] ?? 1));
        if (!$plan) Http::fail('plan required (trial|pro)', 422);

        $pdo = DB::pdo();
        $st  = $pdo->prepare('SELECT * FROM stores WHERE id = ? LIMIT 1');
        $st->execute([$storeId]);
        $store = $st->fetch();
        if (!$store) Http::fail('Store not found', 404);

        $base    = max(time(), strtotime($store['plan_expires_at']));
        $expires = date('Y-m-d H:i:s', strtotime("+{$months} months", $base));
        $amount  = ($plan === 'pro') ? 99.00 * $months : 0.00;

        $pdo->beginTransaction();
        try {
            $pdo->prepare("UPDATE stores SET plan = ?, plan_expires_at = ?, plan_active = 1 WHERE id = ?")
                ->execute([$plan, $expires, $storeId]);

            $pdo->prepare("INSERT INTO subscription_plans (store_id, plan, amount, expires_at) VALUES (?,?,?,?)")
                ->execute([$storeId, $plan, $amount, $expires]);

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            Http::fail('Could not update plan', 500);
        }

        Http::json(['ok' => true, 'plan' => $plan, 'expiresAt' => $expires]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Suspend / reactivate a store (super_admin)
    // ──────────────────────────────────────────────────────────────────────────
    public static function suspendStore(string $storeId): void {
        Http::requireRole('admin');
        $b = Http::body();
        $reason = isset($b['reason']) ? (string)$b['reason'] : null;
        $pdo = DB::pdo();
        $st  = $pdo->prepare('SELECT id, suspended FROM stores WHERE id = ? LIMIT 1');
        $st->execute([$storeId]);
        $row = $st->fetch();
        if (!$row) Http::fail('Store not found', 404);
        $next = (int)$row['suspended'] === 1 ? 0 : 1;
        $pdo->prepare('UPDATE stores SET suspended = ?, suspended_reason = ? WHERE id = ?')
            ->execute([$next, $next ? $reason : null, $storeId]);
        Http::json(['ok' => true, 'suspended' => (bool)$next]);

    // ──────────────────────────────────────────────────────────────────────────
    //  Domains
    // ──────────────────────────────────────────────────────────────────────────
    public static function domains(): void {
        Http::requireRole('admin');
        $rows = DB::pdo()->query(
            "SELECT s.id, s.name, s.slug, s.custom_domain, s.domain_verified, s.domain_verified_at,
                    u.email AS owner_email
             FROM stores s
             LEFT JOIN users u ON u.id = s.owner_id
             WHERE s.custom_domain IS NOT NULL
             ORDER BY s.created_at DESC"
        )->fetchAll();

        Http::json(array_map(fn($r) => [
            'storeId'    => $r['id'],
            'storeName'  => $r['name'],
            'storeSlug'  => $r['slug'],
            'domain'     => $r['custom_domain'],
            'verified'   => (bool)$r['domain_verified'],
            'verifiedAt' => $r['domain_verified_at'],
            'ownerEmail' => $r['owner_email'],
        ], $rows));
    }

    public static function verifyDomain(string $storeId): void {
        Http::requireRole('admin');
        DB::pdo()->prepare("UPDATE stores SET domain_verified = 1, domain_verified_at = NOW() WHERE id = ?")
            ->execute([$storeId]);
        Http::json(['ok' => true]);
    }

    public static function revokeDomain(string $storeId): void {
        Http::requireRole('super_admin');
        DB::pdo()->prepare("UPDATE stores SET custom_domain = NULL, domain_verified = 0, domain_verified_at = NULL WHERE id = ?")
            ->execute([$storeId]);
        Http::json(['ok' => true]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Role management (super_admin only)
    // ──────────────────────────────────────────────────────────────────────────
    public static function updateUserRole(string $userId): void {
        Http::requireRole('super_admin');
        $b    = Http::body();
        $role = $b['role'] ?? '';
        if (!in_array($role, ['user','admin','super_admin'])) Http::fail('Invalid role', 422);

        $pdo = DB::pdo();
        $st  = $pdo->prepare('SELECT id FROM users WHERE id = ? LIMIT 1');
        $st->execute([$userId]);
        if (!$st->fetch()) Http::fail('User not found', 404);

        $isAdmin = $role !== 'user' ? 1 : 0;
        $pdo->prepare('UPDATE users SET role = ?, is_admin = ? WHERE id = ?')
            ->execute([$role, $isAdmin, $userId]);

        Http::json(['ok' => true, 'role' => $role]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Platform settings (super_admin only)
    // ──────────────────────────────────────────────────────────────────────────
    public static function getSettings(): void {
        Http::requireRole('super_admin');
        $rows = DB::pdo()->query("SELECT `key`, `value`, `type` FROM platform_settings ORDER BY `key`")->fetchAll();
        $out  = [];
        foreach ($rows as $r) {
            $val = $r['value'];
            if ($r['type'] === 'boolean') $val = (bool)(int)$val;
            elseif ($r['type'] === 'number') $val = $val !== null ? (float)$val : null;
            elseif ($r['type'] === 'json') $val = $val ? json_decode($val, true) : null;
            $out[$r['key']] = $val;
        }
        Http::json($out);
    }

    public static function updateSettings(): void {
        Http::requireRole('super_admin');
        $pdo  = DB::pdo();
        $body = Http::body();

        // Fetch known keys + types
        $rows = $pdo->query("SELECT `key`, `type` FROM platform_settings")->fetchAll();
        $meta = [];
        foreach ($rows as $r) $meta[$r['key']] = $r['type'];

        foreach ($body as $key => $val) {
            if (!isset($meta[$key])) continue; // ignore unknown keys
            $type = $meta[$key];
            if ($type === 'boolean') $stored = $val ? '1' : '0';
            elseif ($type === 'number') $stored = (string)(float)$val;
            elseif ($type === 'json') $stored = json_encode($val);
            else $stored = (string)$val;

            $pdo->prepare("UPDATE platform_settings SET `value` = ? WHERE `key` = ?")
                ->execute([$stored, $key]);
        }

        Http::json(['ok' => true]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Plan features (super_admin only)
    // ──────────────────────────────────────────────────────────────────────────
    public static function getPlanFeatures(): void {
        Http::requireRole('super_admin');
        $rows = DB::pdo()->query("SELECT feature, min_plan, trial_limit, description FROM plan_features ORDER BY feature")->fetchAll();
        Http::json(array_map(fn($r) => [
            'feature'     => $r['feature'],
            'minPlan'     => $r['min_plan'],
            'trialLimit'  => $r['trial_limit'] !== null ? (int)$r['trial_limit'] : null,
            'description' => $r['description'],
        ], $rows));
    }

    public static function updatePlanFeature(string $feature): void {
        Http::requireRole('super_admin');
        $b       = Http::body();
        $minPlan = $b['minPlan'] ?? null;
        $limit   = isset($b['trialLimit']) ? (int)$b['trialLimit'] : null;

        if ($minPlan && !in_array($minPlan, ['trial','pro'])) Http::fail('Invalid plan', 422);

        $pdo = DB::pdo();
        $st  = $pdo->prepare('SELECT feature FROM plan_features WHERE feature = ? LIMIT 1');
        $st->execute([$feature]);
        if (!$st->fetch()) Http::fail('Feature not found', 404);

        $sets   = [];
        $params = [];
        if ($minPlan !== null) { $sets[] = 'min_plan = ?';    $params[] = $minPlan; }
        if ($limit  !== null)  { $sets[] = 'trial_limit = ?'; $params[] = $limit;   }
        if (!$sets) Http::fail('Nothing to update', 422);

        $params[] = $feature;
        $pdo->prepare("UPDATE plan_features SET " . implode(', ', $sets) . " WHERE feature = ?")
            ->execute($params);

        Http::json(['ok' => true]);
    }

    // Public getter for platform settings (used by landing page, health check, etc.)
    public static function publicSettings(): void {
        $pdo  = DB::pdo();
        $rows = $pdo->query("SELECT `key`, `value`, `type` FROM platform_settings WHERE `key` NOT IN ('support_email','support_whatsapp') ORDER BY `key`")->fetchAll();
        $out  = [];
        foreach ($rows as $r) {
            $val = $r['value'];
            if ($r['type'] === 'boolean') $val = (bool)(int)$val;
            elseif ($r['type'] === 'number') $val = $val !== null ? (float)$val : null;
            $out[$r['key']] = $val;
        }
        Http::json($out);
    }
}
