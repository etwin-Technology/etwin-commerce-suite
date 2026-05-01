<?php
/**
 * OrderController — Orders CRUD + public COD checkout.
 *
 * Routes:
 *   GET  /api/orders                              → list for tenant (auth)
 *   POST /api/orders/{id}/confirm                 → mark paid (auth)
 *   POST /api/orders/{id}/ship                    → mark shipped (auth)
 *   PATCH /api/orders/{id}/status                 → set any status (auth)
 *   POST /api/public/stores/{slug}/orders         → public COD checkout (no auth)
 */
class OrderController {

    public static function list(): void {
        $ctx = Http::ownedTenant();
        $tid = $ctx['store']['id'];

        $status = $_GET['status'] ?? '';
        $page   = max(1, (int)($_GET['page'] ?? 1));
        $limit  = min(100, (int)($_GET['limit'] ?? 50));
        $offset = ($page - 1) * $limit;

        $where  = $status ? "AND status = ?" : "";
        $params = $status ? [$tid, $status, $limit, $offset] : [$tid, $limit, $offset];

        $st = DB::pdo()->prepare(
            "SELECT * FROM orders WHERE tenant_id = ? $where ORDER BY created_at DESC LIMIT ? OFFSET ?"
        );
        $st->execute($params);
        $orders = $st->fetchAll();

        $ids = array_column($orders, 'id');
        $itemsByOrder = self::loadItems($ids);
        Http::json(array_map(fn($o) => Mapper::order($o, $itemsByOrder[$o['id']] ?? []), $orders));
    }

    /** Public endpoint: a storefront visitor places a COD order. No auth. */
    public static function createFromStore(string $slug): void {
        $b  = Http::body();
        $in = Http::require($b, ['customerName','phone','items']);
        if (!is_array($in['items']) || !$in['items']) Http::fail('Empty cart', 422);

        // Sanitise phone
        $phone = preg_replace('/[^\d+]/', '', $in['phone']);
        if (strlen($phone) < 8) Http::fail('Invalid phone number', 422);

        $pdo = DB::pdo();
        $sst = $pdo->prepare('SELECT * FROM stores WHERE slug = ? LIMIT 1');
        $sst->execute([$slug]);
        $store = $sst->fetch();
        if (!$store) Http::fail('Store not found', 404);

        // Subscription guard — block checkout if plan expired
        if (!$store['plan_active'] || strtotime($store['plan_expires_at']) < time()) {
            Http::fail('Cette boutique est temporairement indisponible.', 503);
        }

        $tid     = $store['id'];
        $orderId = DB::uuid();
        $total   = 0.0;

        $pdo->beginTransaction();
        try {
            // Upsert customer by phone
            $custSt = $pdo->prepare(
                'SELECT * FROM customers WHERE tenant_id = ? AND phone = ? LIMIT 1'
            );
            $custSt->execute([$tid, $phone]);
            $cust = $custSt->fetch();
            if ($cust) {
                $custId = $cust['id'];
                $pdo->prepare('UPDATE customers SET name = ?, address = ? WHERE id = ?')
                    ->execute([$in['customerName'], $b['address'] ?? '', $custId]);
            } else {
                $custId = DB::uuid();
                $pdo->prepare(
                    'INSERT INTO customers (id,tenant_id,name,phone,address) VALUES (?,?,?,?,?)'
                )->execute([$custId, $tid, $in['customerName'], $phone, $b['address'] ?? '']);
            }

            // Create order shell
            $notes = isset($b['notes']) ? trim($b['notes']) : null;
            $pdo->prepare(
                'INSERT INTO orders
                 (id,tenant_id,customer_id,customer_name,customer_phone,customer_address,city,total,status,notes)
                 VALUES (?,?,?,?,?,?,?,?,"pending",?)'
            )->execute([
                $orderId, $tid, $custId, $in['customerName'], $phone,
                $b['address'] ?? '', $b['city'] ?? '', 0, $notes,
            ]);

            $itemSt = $pdo->prepare(
                'INSERT INTO order_items (order_id,product_id,name,qty,price) VALUES (?,?,?,?,?)'
            );
            $prodSt = $pdo->prepare(
                'SELECT id, name, price, stock FROM products WHERE id = ? AND tenant_id = ? AND status = "active" LIMIT 1'
            );
            foreach ($in['items'] as $it) {
                $pid = $it['productId'] ?? null;
                $qty = max(1, (int)($it['qty'] ?? 1));
                if (!$pid) continue;
                $prodSt->execute([$pid, $tid]);
                $p = $prodSt->fetch();
                if (!$p) continue;
                $price  = (float)$p['price'];
                $total += $price * $qty;
                $itemSt->execute([$orderId, $p['id'], $p['name'], $qty, $price]);
                $pdo->prepare(
                    'UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?'
                )->execute([$qty, $p['id']]);
            }

            if ($total <= 0) {
                $pdo->rollBack();
                Http::fail('No valid products in cart', 422);
            }

            $pdo->prepare('UPDATE orders SET total = ? WHERE id = ?')
                ->execute([$total, $orderId]);
            $pdo->prepare(
                'UPDATE customers SET orders_count = orders_count + 1, total_spent = total_spent + ? WHERE id = ?'
            )->execute([$total, $custId]);

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            error_log('[etwin/order] ' . $e->getMessage());
            Http::fail('Could not create order', 500);
        }

        $order = $pdo->query(
            "SELECT * FROM orders WHERE id = " . $pdo->quote($orderId)
        )->fetch();
        $items = self::loadItems([$orderId])[$orderId] ?? [];

        // Fire-and-forget Telegram notification (non-blocking by design)
        try { Telegram::notifyOrder($store, $order, $items); } catch (Throwable $e) { /* swallow */ }

        // Push in-app notification for dashboard bell
        try { NotificationController::createOrderAlert($tid, $order); } catch (Throwable $e) { /* swallow */ }

        Http::json(Mapper::order($order, $items), 201);
    }

    public static function confirm(string $id): void {
        $ctx = Http::ownedTenant();
        $tid = $ctx['store']['id'];
        DB::pdo()->prepare('UPDATE orders SET status = "paid" WHERE id = ? AND tenant_id = ?')
            ->execute([$id, $tid]);
        self::returnOrder($id, $tid);
    }

    public static function ship(string $id): void {
        $ctx = Http::ownedTenant();
        $tid = $ctx['store']['id'];
        DB::pdo()->prepare('UPDATE orders SET status = "shipped" WHERE id = ? AND tenant_id = ?')
            ->execute([$id, $tid]);
        self::returnOrder($id, $tid);
    }

    public static function updateStatus(string $id): void {
        $ctx    = Http::ownedTenant();
        $tid    = $ctx['store']['id'];
        $b      = Http::body();
        $status = $b['status'] ?? '';
        $allowed = ['pending','paid','shipped'];
        if (!in_array($status, $allowed, true)) Http::fail('Invalid status', 422);
        DB::pdo()->prepare('UPDATE orders SET status = ? WHERE id = ? AND tenant_id = ?')
            ->execute([$status, $id, $tid]);
        self::returnOrder($id, $tid);
    }

    public static function update(string $id): void {
        $ctx = Http::ownedTenant();
        $tid = $ctx['store']['id'];
        $b   = Http::body();
        $map = [
            'customerName'    => 'customer_name',
            'customerPhone'   => 'customer_phone',
            'customerAddress' => 'customer_address',
            'city'            => 'city',
            'status'          => 'status',
            'notes'           => 'notes',
        ];
        $fields = []; $vals = [];
        foreach ($map as $k => $col) {
            if (array_key_exists($k, $b)) {
                if ($k === 'status' && !in_array($b[$k], ['pending','paid','shipped'], true)) {
                    Http::fail('Invalid status', 422);
                }
                $fields[] = "$col = ?";
                $vals[]   = $b[$k];
            }
        }
        if (!$fields) Http::fail('Nothing to update', 400);
        $vals[] = $id; $vals[] = $tid;
        DB::pdo()->prepare('UPDATE orders SET ' . implode(',', $fields) . ' WHERE id = ? AND tenant_id = ?')
            ->execute($vals);
        self::returnOrder($id, $tid);
    }

    public static function delete(string $id): void {
        $ctx = Http::ownedTenant();
        DB::pdo()->prepare('DELETE FROM orders WHERE id = ? AND tenant_id = ?')
            ->execute([$id, $ctx['store']['id']]);
        http_response_code(204);
        exit;
    }

    private static function returnOrder(string $id, string $tid): void {
        $st = DB::pdo()->prepare('SELECT * FROM orders WHERE id = ? AND tenant_id = ?');
        $st->execute([$id, $tid]);
        $o = $st->fetch();
        if (!$o) Http::fail('Not found', 404);
        $items = self::loadItems([$id])[$id] ?? [];
        Http::json(Mapper::order($o, $items));
    }

    private static function loadItems(array $orderIds): array {
        if (!$orderIds) return [];
        $place = implode(',', array_fill(0, count($orderIds), '?'));
        $st = DB::pdo()->prepare(
            "SELECT * FROM order_items WHERE order_id IN ($place)"
        );
        $st->execute($orderIds);
        $out = [];
        foreach ($st->fetchAll() as $row) {
            $out[$row['order_id']][] = $row;
        }
        return $out;
    }
}
