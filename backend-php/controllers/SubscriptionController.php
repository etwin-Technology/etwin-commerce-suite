<?php
/**
 * SubscriptionController — Subscription management for store owners.
 * Backed by `plan_catalog` (super-admin-editable).
 *
 * Routes (require auth + X-Tenant-Id):
 *   GET  /api/subscription           → current plan + history + catalog
 *   POST /api/subscription/upgrade   → upgrade to starter|pro|business
 */
class SubscriptionController {

    public static function catalog(): array {
        $rows = DB::pdo()->query(
            "SELECT * FROM plan_catalog WHERE active = 1 ORDER BY sort_order ASC"
        )->fetchAll();
        return array_map(function ($r) {
            $features = [];
            $features[] = $r['product_limit'] === null ? 'Produits illimités' : "Jusqu'à {$r['product_limit']} produits";
            $features[] = $r['team_limit'] > 0 ? "Équipe : {$r['team_limit']} membres" : 'Pas de membres équipe';
            if ((int)$r['custom_domain']) $features[] = 'Domaine personnalisé';
            if ((int)$r['telegram_bot'])  $features[] = 'Notifications Telegram';
            if ((int)$r['pixels'])        $features[] = 'Pixels Facebook & TikTok';
            if ((int)$r['analytics'])     $features[] = 'Statistiques avancées';
            if ((int)$r['remove_brand'])  $features[] = 'Sans branding ETWIN';
            if ((int)$r['priority_supp']) $features[] = 'Support prioritaire';
            return [
                'id'          => $r['id'],
                'name'        => $r['name'],
                'price'       => (float)$r['price_mad'],
                'currency'    => 'MAD',
                'duration'    => $r['duration'],
                'productLimit'=> $r['product_limit'] === null ? null : (int)$r['product_limit'],
                'teamLimit'   => (int)$r['team_limit'],
                'features'    => $features,
                'recommended' => (bool)$r['recommended'],
            ];
        }, $rows);
    }

    public static function get(): void {
        $ctx   = Http::ownedTenant();
        $store = $ctx['store'];
        $pdo   = DB::pdo();

        $days  = max(0, (int)ceil((strtotime($store['plan_expires_at']) - time()) / 86400));
        $expired = $days <= 0 || !$store['plan_active'];

        $hist = $pdo->prepare(
            "SELECT * FROM subscription_plans WHERE store_id = ? ORDER BY started_at DESC LIMIT 12"
        );
        $hist->execute([$store['id']]);
        $history = $hist->fetchAll();

        Http::json([
            'plan'      => $store['plan'] === 'trial' ? 'starter' : $store['plan'],
            'active'    => (bool)$store['plan_active'],
            'expiresAt' => date('c', strtotime($store['plan_expires_at'])),
            'daysLeft'  => $days,
            'expired'   => $expired,
            'plans'     => self::catalog(),
            'history' => array_map(fn($r) => [
                'id'        => (int)$r['id'],
                'plan'      => $r['plan'],
                'amount'    => (float)$r['amount'],
                'startedAt' => $r['started_at'],
                'expiresAt' => $r['expires_at'],
                'status'    => $r['status'],
            ], $history),
        ]);
    }

    public static function upgrade(): void {
        $ctx  = Http::ownedTenant();
        $b    = Http::body();
        $plan = in_array($b['plan'] ?? '', ['starter','pro','business']) ? $b['plan'] : null;
        if (!$plan) Http::fail('plan required (starter|pro|business)', 422);

        $pdo   = DB::pdo();
        $store = $ctx['store'];

        // price from catalog
        $cat = $pdo->prepare('SELECT price_mad FROM plan_catalog WHERE id = ? AND active = 1');
        $cat->execute([$plan]);
        $price = $cat->fetchColumn();
        if ($price === false) Http::fail('Plan not available', 404);

        $expires = date('Y-m-d H:i:s', strtotime('+1 month'));
        $pdo->prepare(
            "INSERT INTO subscription_plans (store_id, plan, amount, expires_at, status, notes)
             VALUES (?, ?, ?, ?, 'active', 'Upgrade request - pending payment confirmation')"
        )->execute([$store['id'], $plan, $price, $expires]);

        $pdo->prepare(
            "UPDATE stores SET plan = ?, plan_expires_at = ?, plan_active = 1 WHERE id = ?"
        )->execute([$plan, $expires, $store['id']]);

        $pdo->prepare(
            "INSERT INTO notifications (tenant_id, type, title, body)
             VALUES (?, 'payment', 'Abonnement mis à jour', ?)"
        )->execute([$store['id'], "Votre boutique est maintenant en plan " . ucfirst($plan) . " pour 1 mois."]);

        Http::json(['ok' => true, 'plan' => $plan, 'expiresAt' => $expires]);
    }
}
