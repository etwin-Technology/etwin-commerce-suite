<?php
/**
 * NotificationController — Dashboard bell notifications.
 *
 * Routes (require auth + X-Tenant-Id):
 *   GET  /api/notifications          → list (unread first, last 50)
 *   GET  /api/notifications/unread   → count of unread
 *   POST /api/notifications/read-all → mark all as read
 *   POST /api/notifications/{id}/read → mark one as read
 */
class NotificationController {

    public static function list(): void {
        $ctx = Http::ownedTenant();
        $tid = $ctx['store']['id'];

        $limit = min(50, max(1, (int)($_GET['limit'] ?? 30)));

        $st = DB::pdo()->prepare(
            "SELECT * FROM notifications
             WHERE tenant_id = ?
             ORDER BY is_read ASC, created_at DESC
             LIMIT ?"
        );
        $st->execute([$tid, $limit]);
        $rows = $st->fetchAll();

        Http::json(array_map([self::class, 'map'], $rows));
    }

    public static function unreadCount(): void {
        $ctx = Http::ownedTenant();
        $tid = $ctx['store']['id'];

        $st = DB::pdo()->prepare(
            "SELECT COUNT(*) FROM notifications WHERE tenant_id = ? AND is_read = 0"
        );
        $st->execute([$tid]);
        Http::json(['count' => (int)$st->fetchColumn()]);
    }

    public static function readAll(): void {
        $ctx = Http::ownedTenant();
        DB::pdo()->prepare("UPDATE notifications SET is_read = 1 WHERE tenant_id = ?")
            ->execute([$ctx['store']['id']]);
        Http::json(['ok' => true]);
    }

    public static function readOne(string $id): void {
        $ctx = Http::ownedTenant();
        DB::pdo()->prepare(
            "UPDATE notifications SET is_read = 1 WHERE id = ? AND tenant_id = ?"
        )->execute([$id, $ctx['store']['id']]);
        Http::json(['ok' => true]);
    }

    // ── Helper called by OrderController to push a new-order alert ──
    public static function createOrderAlert(string $tenantId, array $order): void {
        $shortId = strtoupper(substr($order['id'], 0, 8));
        DB::pdo()->prepare(
            "INSERT INTO notifications (tenant_id, type, title, body, ref_id)
             VALUES (?, 'order', ?, ?, ?)"
        )->execute([
            $tenantId,
            "Nouvelle commande #{$shortId}",
            "{$order['customer_name']} — " . number_format((float)$order['total'], 2) . " MAD",
            $order['id'],
        ]);
    }

    private static function map(array $r): array {
        return [
            'id'        => (int)$r['id'],
            'type'      => $r['type'],
            'title'     => $r['title'],
            'body'      => $r['body'],
            'refId'     => $r['ref_id'],
            'isRead'    => (bool)$r['is_read'],
            'createdAt' => date('c', strtotime($r['created_at'])),
        ];
    }
}
