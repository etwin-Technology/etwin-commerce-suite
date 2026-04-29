<?php
/**
 * AdminController — Super Admin endpoints (requires is_admin = 1 on users).
 *
 * Routes (all require admin token):
 *   GET  /api/admin/stats           → platform-wide KPIs
 *   GET  /api/admin/users           → paginated user list
 *   GET  /api/admin/stores          → paginated store list
 *   GET  /api/admin/subscriptions   → active/expired subscriptions
 *   POST /api/admin/users/{id}/suspend    → toggle plan_active
 *   POST /api/admin/users/{id}/delete     → delete user + cascade
 *   PATCH /api/admin/stores/{id}/plan     → upgrade/downgrade plan
 *   GET  /api/admin/domains         → all custom domains
 *   POST /api/admin/domains/{id}/verify   → mark domain verified
 *   POST /api/admin/domains/{id}/revoke   → clear domain from store
 */
class AdminController {

    // ──────────────────────────────────────────────────────────
    //  Platform-wide stats
    // ──────────────────────────────────────────────────────────
    public static function stats(): void {
        Http::requireAdmin();
        $pdo = DB::pdo();

        $totalUsers   = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        $totalStores  = (int)$pdo->query('SELECT COUNT(*) FROM stores')->fetchColumn();
        $activeSubs   = (int)$pdo->query("SELECT COUNT(*) FROM stores WHERE plan_active = 1 AND plan_expires_at > NOW()")->fetchColumn();
        $proSubs      = (int)$pdo->query("SELECT COUNT(*) FROM stores WHERE plan = 'pro' AND plan_active = 1")->fetchColumn();
        $trialSubs    = (int)$pdo->query("SELECT COUNT(*) FROM stores WHERE plan = 'trial' AND plan_active = 1 AND plan_expires_at > NOW()")->fetchColumn();
        $expiredSubs  = (int)$pdo->query("SELECT COUNT(*) FROM stores WHERE plan_active = 0 OR plan_expires_at <= NOW()")->fetchColumn();
        $totalOrders  = (int)$pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn();
        $totalRevenue = (float)$pdo->query("SELECT COALESCE(SUM(total),0) FROM orders WHERE status != 'pending'")->fetchColumn();

        // Monthly revenue from pro subscriptions (99 MAD/sub)
        $monthlyMrr = $proSubs * 99;

        // New users last 7 days
        $newUsers7d = (int)$pdo->query(
            "SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
        )->fetchColumn();

        // User growth per day (last 14 days)
        $growthRows = $pdo->query(
            "SELECT DATE(created_at) AS day, COUNT(*) AS cnt
             FROM users
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
             GROUP BY day ORDER BY day ASC"
        )->fetchAll();

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
        ]);
    }

    // ──────────────────────────────────────────────────────────
    //  User list (paginated, with store & subscription info)
    // ──────────────────────────────────────────────────────────
    public static function users(): void {
        Http::requireAdmin();
        $pdo   = DB::pdo();
        $page  = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 25)));
        $q     = trim($_GET['q'] ?? '');
        $offset = ($page - 1) * $limit;

        $where = $q ? "WHERE u.email LIKE ? OR u.full_name LIKE ?" : "";
        $params = $q ? ["%$q%", "%$q%"] : [];

        $total = (int)$pdo->prepare(
            "SELECT COUNT(*) FROM users u $where"
        )->execute($params) ? $pdo->prepare(
            "SELECT COUNT(*) FROM users u $where"
        ) : null;

        // Simpler two-query approach
        $countSt = $pdo->prepare("SELECT COUNT(*) FROM users u $where");
        $countSt->execute($params);
        $total = (int)$countSt->fetchColumn();

        $rowParams = [...$params, $limit, $offset];
        $st = $pdo->prepare(
            "SELECT u.id, u.email, u.full_name, u.is_admin, u.created_at,
                    s.id AS store_id, s.name AS store_name, s.slug,
                    s.plan, s.plan_expires_at, s.plan_active, s.custom_domain,
                    (SELECT COUNT(*) FROM orders o WHERE o.tenant_id = s.id) AS order_count
             FROM users u
             LEFT JOIN stores s ON s.owner_id = u.id
             $where
             ORDER BY u.created_at DESC
             LIMIT ? OFFSET ?"
        );
        $st->execute($rowParams);
        $rows = $st->fetchAll();

        Http::json([
            'total' => $total,
            'page'  => $page,
            'pages' => max(1, (int)ceil($total / $limit)),
            'items' => array_map(fn($r) => [
                'id'         => $r['id'],
                'email'      => $r['email'],
                'fullName'   => $r['full_name'],
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

    // ──────────────────────────────────────────────────────────
    //  Store list
    // ──────────────────────────────────────────────────────────
    public static function stores(): void {
        Http::requireAdmin();
        $pdo   = DB::pdo();
        $page  = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 25)));
        $q     = trim($_GET['q'] ?? '');
        $plan  = $_GET['plan'] ?? '';
        $offset= ($page - 1) * $limit;

        $conditions = [];
        $params     = [];
        if ($q) { $conditions[] = "(s.name LIKE ? OR s.slug LIKE ?)"; $params[] = "%$q%"; $params[] = "%$q%"; }
        if ($plan) { $conditions[] = "s.plan = ?"; $params[] = $plan; }
        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

        $countSt = $pdo->prepare("SELECT COUNT(*) FROM stores s $where");
        $countSt->execute($params);
        $total = (int)$countSt->fetchColumn();

        $rowParams = [...$params, $limit, $offset];
        $st = $pdo->prepare(
            "SELECT s.*, u.email AS owner_email, u.full_name AS owner_name,
                    (SELECT COUNT(*) FROM orders  o WHERE o.tenant_id  = s.id) AS order_count,
                    (SELECT COUNT(*) FROM products p WHERE p.tenant_id = s.id) AS product_count
             FROM stores s
             LEFT JOIN users u ON u.id = s.owner_id
             $where
             ORDER BY s.created_at DESC
             LIMIT ? OFFSET ?"
        );
        $st->execute($rowParams);
        $rows = $st->fetchAll();

        Http::json([
            'total' => $total,
            'page'  => $page,
            'pages' => max(1, (int)ceil($total / $limit)),
            'items' => array_map(fn($r) => [
                'id'           => $r['id'],
                'name'         => $r['name'],
                'slug'         => $r['slug'],
                'ownerEmail'   => $r['owner_email'],
                'ownerName'    => $r['owner_name'],
                'plan'         => $r['plan'],
                'expiresAt'    => $r['plan_expires_at'],
                'active'       => (bool)$r['plan_active'],
                'customDomain' => $r['custom_domain'],
                'domainVerified'=> (bool)($r['domain_verified'] ?? 0),
                'orderCount'   => (int)$r['order_count'],
                'productCount' => (int)$r['product_count'],
                'createdAt'    => $r['created_at'],
            ], $rows),
        ]);
    }

    // ──────────────────────────────────────────────────────────
    //  Suspend / unsuspend user account
    // ──────────────────────────────────────────────────────────
    public static function suspendUser(string $userId): void {
        Http::requireAdmin();
        $pdo = DB::pdo();
        $st = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $st->execute([$userId]);
        $user = $st->fetch();
        if (!$user) Http::fail('User not found', 404);

        // Toggle plan_active on the user's store
        $pdo->prepare("UPDATE stores SET plan_active = NOT plan_active WHERE owner_id = ?")
            ->execute([$userId]);

        Http::json(['ok' => true]);
    }

    // ──────────────────────────────────────────────────────────
    //  Delete user + cascade
    // ──────────────────────────────────────────────────────────
    public static function deleteUser(string $userId): void {
        Http::requireAdmin();
        $pdo = DB::pdo();
        $st = $pdo->prepare('SELECT 1 FROM users WHERE id = ? LIMIT 1');
        $st->execute([$userId]);
        if (!$st->fetch()) Http::fail('User not found', 404);
        // FK cascade handles stores → products, orders, customers
        $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);
        Http::json(['ok' => true], 200);
    }

    // ──────────────────────────────────────────────────────────
    //  Upgrade / downgrade store plan
    // ──────────────────────────────────────────────────────────
    public static function updatePlan(string $storeId): void {
        Http::requireAdmin();
        $b = Http::body();
        $plan    = in_array($b['plan'] ?? '', ['trial','pro']) ? $b['plan'] : null;
        $months  = max(1, (int)($b['months'] ?? 1));
        if (!$plan) Http::fail('plan required (trial|pro)', 422);

        $pdo = DB::pdo();
        $st = $pdo->prepare('SELECT * FROM stores WHERE id = ? LIMIT 1');
        $st->execute([$storeId]);
        $store = $st->fetch();
        if (!$store) Http::fail('Store not found', 404);

        // Calculate new expiry (extend from today or current expiry, whichever is later)
        $base    = max(time(), strtotime($store['plan_expires_at']));
        $expires = date('Y-m-d H:i:s', strtotime("+{$months} months", $base));
        $amount  = ($plan === 'pro') ? 99.00 * $months : 0.00;

        $pdo->beginTransaction();
        try {
            $pdo->prepare(
                "UPDATE stores SET plan = ?, plan_expires_at = ?, plan_active = 1 WHERE id = ?"
            )->execute([$plan, $expires, $storeId]);

            $pdo->prepare(
                "INSERT INTO subscription_plans (store_id, plan, amount, expires_at)
                 VALUES (?, ?, ?, ?)"
            )->execute([$storeId, $plan, $amount, $expires]);

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            Http::fail('Could not update plan', 500);
        }

        Http::json(['ok' => true, 'plan' => $plan, 'expiresAt' => $expires]);
    }

    // ──────────────────────────────────────────────────────────
    //  Domains list
    // ──────────────────────────────────────────────────────────
    public static function domains(): void {
        Http::requireAdmin();
        $pdo = DB::pdo();
        $rows = $pdo->query(
            "SELECT s.id, s.name, s.slug, s.custom_domain, s.domain_verified, s.domain_verified_at,
                    u.email AS owner_email
             FROM stores s
             LEFT JOIN users u ON u.id = s.owner_id
             WHERE s.custom_domain IS NOT NULL
             ORDER BY s.created_at DESC"
        )->fetchAll();

        Http::json(array_map(fn($r) => [
            'storeId'       => $r['id'],
            'storeName'     => $r['name'],
            'storeSlug'     => $r['slug'],
            'domain'        => $r['custom_domain'],
            'verified'      => (bool)$r['domain_verified'],
            'verifiedAt'    => $r['domain_verified_at'],
            'ownerEmail'    => $r['owner_email'],
        ], $rows));
    }

    // ──────────────────────────────────────────────────────────
    //  Verify domain (admin confirms DNS is correct)
    // ──────────────────────────────────────────────────────────
    public static function verifyDomain(string $storeId): void {
        Http::requireAdmin();
        DB::pdo()->prepare(
            "UPDATE stores SET domain_verified = 1, domain_verified_at = NOW() WHERE id = ?"
        )->execute([$storeId]);
        Http::json(['ok' => true]);
    }

    // ──────────────────────────────────────────────────────────
    //  Revoke domain
    // ──────────────────────────────────────────────────────────
    public static function revokeDomain(string $storeId): void {
        Http::requireAdmin();
        DB::pdo()->prepare(
            "UPDATE stores SET custom_domain = NULL, domain_verified = 0, domain_verified_at = NULL WHERE id = ?"
        )->execute([$storeId]);
        Http::json(['ok' => true]);
    }
}
