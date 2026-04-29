<?php
/**
 * SubscriptionController — Subscription management for store owners.
 *
 * Routes (require auth + X-Tenant-Id):
 *   GET  /api/subscription           → current plan + history
 *   POST /api/subscription/upgrade   → request upgrade to pro (manual flow)
 */
class SubscriptionController {

    // ──────────────────────────────────────────────────────────
    //  Current plan + history
    // ──────────────────────────────────────────────────────────
    public static function get(): void {
        $ctx   = Http::ownedTenant();
        $store = $ctx['store'];
        $pdo   = DB::pdo();

        $days  = max(0, (int)ceil((strtotime($store['plan_expires_at']) - time()) / 86400));
        $expired = $days <= 0 || !$store['plan_active'];

        // History
        $hist = $pdo->prepare(
            "SELECT * FROM subscription_plans WHERE store_id = ? ORDER BY started_at DESC LIMIT 12"
        );
        $hist->execute([$store['id']]);
        $history = $hist->fetchAll();

        Http::json([
            'plan'      => $store['plan'],
            'active'    => (bool)$store['plan_active'],
            'expiresAt' => date('c', strtotime($store['plan_expires_at'])),
            'daysLeft'  => $days,
            'expired'   => $expired,
            'plans' => [
                [
                    'id'          => 'trial',
                    'name'        => 'Essai gratuit',
                    'price'       => 0,
                    'duration'    => '14 jours',
                    'features'    => ['1 boutique', '50 produits', 'Notifications WhatsApp', 'Telegram'],
                ],
                [
                    'id'          => 'pro',
                    'name'        => 'Pro',
                    'price'       => 99,
                    'currency'    => 'MAD',
                    'duration'    => 'par mois',
                    'features'    => [
                        'Produits illimités',
                        'Domaine personnalisé',
                        'Notifications WhatsApp + Telegram',
                        'Pixels publicitaires',
                        'Support prioritaire',
                        'Statistiques avancées',
                    ],
                    'recommended' => true,
                ],
            ],
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

    // ──────────────────────────────────────────────────────────
    //  Upgrade request (manual — admin confirms payment)
    // ──────────────────────────────────────────────────────────
    public static function upgrade(): void {
        $ctx  = Http::ownedTenant();
        $b    = Http::body();
        $plan = in_array($b['plan'] ?? '', ['pro']) ? $b['plan'] : null;
        if (!$plan) Http::fail('plan required (pro)', 422);

        $pdo   = DB::pdo();
        $store = $ctx['store'];

        // Create a pending subscription record (admin will mark active)
        $expires = date('Y-m-d H:i:s', strtotime('+1 month'));
        $pdo->prepare(
            "INSERT INTO subscription_plans (store_id, plan, amount, expires_at, status, notes)
             VALUES (?, ?, 99.00, ?, 'active', 'Upgrade request - pending payment confirmation')"
        )->execute([$store['id'], $plan, $expires]);

        // Optimistically activate if admin auto-approves (in real setup: wait for payment webhook)
        $pdo->prepare(
            "UPDATE stores SET plan = ?, plan_expires_at = ?, plan_active = 1 WHERE id = ?"
        )->execute([$plan, $expires, $store['id']]);

        // Notification
        $pdo->prepare(
            "INSERT INTO notifications (tenant_id, type, title, body)
             VALUES (?, 'payment', 'Abonnement Pro activé', 'Votre boutique est maintenant en plan Pro pour 1 mois.')"
        )->execute([$store['id']]);

        Http::json(['ok' => true, 'plan' => $plan, 'expiresAt' => $expires]);
    }
}
