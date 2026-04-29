<?php
class CustomerController {
    public static function list(): void {
        $ctx = Http::ownedTenant();
        $st = DB::pdo()->prepare('SELECT * FROM customers WHERE tenant_id = ? ORDER BY total_spent DESC');
        $st->execute([$ctx['store']['id']]);
        Http::json(array_map([Mapper::class, 'customer'], $st->fetchAll()));
    }
}
