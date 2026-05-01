<?php
class CustomerController {
    public static function list(): void {
        $ctx = Http::ownedTenant();
        $st = DB::pdo()->prepare('SELECT * FROM customers WHERE tenant_id = ? ORDER BY total_spent DESC');
        $st->execute([$ctx['store']['id']]);
        Http::json(array_map([Mapper::class, 'customer'], $st->fetchAll()));
    }

    public static function create(): void {
        $ctx = Http::ownedTenant();
        $tid = $ctx['store']['id'];
        $b   = Http::body();
        $in  = Http::require($b, ['name', 'phone']);
        $phone = preg_replace('/[^\d+]/', '', $in['phone']);
        if (strlen($phone) < 8) Http::fail('Invalid phone', 422);

        $id  = DB::uuid();
        DB::pdo()->prepare(
            'INSERT INTO customers (id,tenant_id,name,phone,address) VALUES (?,?,?,?,?)'
        )->execute([$id, $tid, $in['name'], $phone, (string)($b['address'] ?? '')]);
        $st = DB::pdo()->prepare('SELECT * FROM customers WHERE id = ?');
        $st->execute([$id]);
        Http::json(Mapper::customer($st->fetch()), 201);
    }

    public static function update(string $id): void {
        $ctx = Http::ownedTenant();
        $tid = $ctx['store']['id'];
        $b   = Http::body();
        $map = ['name' => 'name', 'phone' => 'phone', 'address' => 'address'];
        $fields = []; $vals = [];
        foreach ($map as $k => $col) {
            if (array_key_exists($k, $b)) {
                $fields[] = "$col = ?";
                $vals[]   = $b[$k];
            }
        }
        if (!$fields) Http::fail('Nothing to update', 400);
        $vals[] = $id; $vals[] = $tid;
        DB::pdo()->prepare('UPDATE customers SET ' . implode(',', $fields) . ' WHERE id = ? AND tenant_id = ?')
            ->execute($vals);
        $st = DB::pdo()->prepare('SELECT * FROM customers WHERE id = ? AND tenant_id = ?');
        $st->execute([$id, $tid]);
        $row = $st->fetch();
        if (!$row) Http::fail('Not found', 404);
        Http::json(Mapper::customer($row));
    }

    public static function delete(string $id): void {
        $ctx = Http::ownedTenant();
        DB::pdo()->prepare('DELETE FROM customers WHERE id = ? AND tenant_id = ?')
            ->execute([$id, $ctx['store']['id']]);
        http_response_code(204);
        exit;
    }
}
