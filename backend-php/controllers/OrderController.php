<?php
class OrderController {
    public static function list(): void {
        $ctx = Http::ownedTenant();
        $tid = $ctx['store']['id'];
        $st = DB::pdo()->prepare('SELECT * FROM orders WHERE tenant_id = ? ORDER BY created_at DESC');
        $st->execute([$tid]);
        $orders = $st->fetchAll();
        $ids = array_column($orders, 'id');
        $itemsByOrder = self::loadItems($ids);
        Http::json(array_map(fn($o) => Mapper::order($o, $itemsByOrder[$o['id']] ?? []), $orders));
    }

    /** Public endpoint: a storefront visitor places a COD order. No auth. */
    public static function createFromStore(string $slug): void {
        $b = Http::body();
        $in = Http::require($b, ['customerName','phone','items']);
        if (!is_array($in['items']) || !$in['items']) Http::fail('Empty cart', 422);

        $pdo = DB::pdo();
        $sst = $pdo->prepare('SELECT * FROM stores WHERE slug = ? LIMIT 1');
        $sst->execute([$slug]);
        $store = $sst->fetch();
        if (!$store) Http::fail('Store not found', 404);

        $tid = $store['id'];
        $orderId = DB::uuid();
        $total = 0.0;

        $pdo->beginTransaction();
        try {
            // upsert customer by phone
            $custSt = $pdo->prepare('SELECT * FROM customers WHERE tenant_id = ? AND phone = ? LIMIT 1');
            $custSt->execute([$tid, $in['phone']]);
            $cust = $custSt->fetch();
            if ($cust) {
                $custId = $cust['id'];
                $pdo->prepare('UPDATE customers SET name = ?, address = ? WHERE id = ?')
                    ->execute([$in['customerName'], $b['address'] ?? '', $custId]);
            } else {
                $custId = DB::uuid();
                $pdo->prepare('INSERT INTO customers (id,tenant_id,name,phone,address) VALUES (?,?,?,?,?)')
                    ->execute([$custId, $tid, $in['customerName'], $in['phone'], $b['address'] ?? '']);
            }

            // create order shell
            $pdo->prepare('INSERT INTO orders
                (id,tenant_id,customer_id,customer_name,customer_phone,customer_address,city,total,status)
                VALUES (?,?,?,?,?,?,?,?,"pending")')
                ->execute([$orderId, $tid, $custId, $in['customerName'], $in['phone'],
                           $b['address'] ?? '', $b['city'] ?? '', 0]);

            $itemSt = $pdo->prepare('INSERT INTO order_items (order_id,product_id,name,qty,price) VALUES (?,?,?,?,?)');
            $prodSt = $pdo->prepare('SELECT id, name, price, stock FROM products WHERE id = ? AND tenant_id = ? LIMIT 1');
            foreach ($in['items'] as $it) {
                $pid = $it['productId'] ?? null;
                $qty = max(1, (int)($it['qty'] ?? 1));
                if (!$pid) continue;
                $prodSt->execute([$pid, $tid]);
                $p = $prodSt->fetch();
                if (!$p) continue;
                $price = (float)$p['price'];
                $total += $price * $qty;
                $itemSt->execute([$orderId, $p['id'], $p['name'], $qty, $price]);
                $pdo->prepare('UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?')
                    ->execute([$qty, $p['id']]);
            }

            $pdo->prepare('UPDATE orders SET total = ? WHERE id = ?')->execute([$total, $orderId]);
            $pdo->prepare('UPDATE customers SET orders_count = orders_count + 1, total_spent = total_spent + ? WHERE id = ?')
                ->execute([$total, $custId]);

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            Http::fail('Could not create order', 500);
        }

        $order = $pdo->query("SELECT * FROM orders WHERE id = " . $pdo->quote($orderId))->fetch();
        $items = self::loadItems([$orderId])[$orderId] ?? [];

        // Fire-and-forget Telegram notification (non-blocking by design - cURL timeout 10s).
        try { Telegram::notifyOrder($store, $order, $items); } catch (Throwable $e) { /* swallow */ }

        Http::json(Mapper::order($order, $items), 201);
    }

    public static function confirm(string $id): void {
        $ctx = Http::ownedTenant();
        DB::pdo()->prepare('UPDATE orders SET status = "paid" WHERE id = ? AND tenant_id = ?')
            ->execute([$id, $ctx['store']['id']]);
        $st = DB::pdo()->prepare('SELECT * FROM orders WHERE id = ? AND tenant_id = ?');
        $st->execute([$id, $ctx['store']['id']]);
        $o = $st->fetch();
        if (!$o) Http::fail('Not found', 404);
        $items = self::loadItems([$id])[$id] ?? [];
        Http::json(Mapper::order($o, $items));
    }

    private static function loadItems(array $orderIds): array {
        if (!$orderIds) return [];
        $place = implode(',', array_fill(0, count($orderIds), '?'));
        $st = DB::pdo()->prepare("SELECT * FROM order_items WHERE order_id IN ($place)");
        $st->execute($orderIds);
        $out = [];
        foreach ($st->fetchAll() as $row) {
            $out[$row['order_id']][] = $row;
        }
        return $out;
    }
}
