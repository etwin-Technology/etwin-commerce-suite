<?php
class ProductController {
    public static function list(): void {
        $ctx = Http::ownedTenant();
        $st = DB::pdo()->prepare('SELECT * FROM products WHERE tenant_id = ? ORDER BY created_at DESC');
        $st->execute([$ctx['store']['id']]);
        Http::json(array_map([Mapper::class, 'product'], $st->fetchAll()));
    }

    public static function create(): void {
        $ctx   = Http::ownedTenant();
        $store = $ctx['store'];
        $pdo   = DB::pdo();

        $b = Http::body();
        $in = Http::require($b, ['name','price','image']);

        $price = (float)$in['price'];
        if ($price < 0) Http::fail('Price must be >= 0', 422);
        if ($price > 9999999.99) Http::fail('Price too large', 422);
        if (mb_strlen($in['name']) > 190) Http::fail('Name too long', 422);
        if (mb_strlen($in['name']) < 1) Http::fail('Name required', 422);

        $stock = (int)($b['stock'] ?? 0);
        if ($stock < 0) Http::fail('Stock must be >= 0', 422);

        $original = null;
        if (isset($b['originalPrice']) && $b['originalPrice'] !== '' && $b['originalPrice'] !== null) {
            $original = (float)$b['originalPrice'];
            if ($original < 0) Http::fail('Original price must be >= 0', 422);
        }

        // Plan-based product limit + insert in a transaction so concurrent
        // creates can't bypass the cap.
        $pdo->beginTransaction();
        try {
            $limit = Http::planProductLimit($store);
            if ($limit !== null) {
                $countSt = $pdo->prepare(
                    "SELECT COUNT(*) FROM products
                     WHERE tenant_id = ? AND status != 'archived'
                     FOR UPDATE"
                );
                $countSt->execute([$store['id']]);
                if ((int)$countSt->fetchColumn() >= $limit) {
                    $pdo->rollBack();
                    Http::fail("Limite atteinte ({$limit} produits). Passez au plan Pro pour des produits illimités.", 402);
                }
            }

            $id = DB::uuid();
            $pdo->prepare('INSERT INTO products
                (id,tenant_id,name,description,price,original_price,image,extra_images,video_url,stock,status)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)')
                ->execute([
                    $id, $store['id'],
                    $in['name'],
                    (string)($b['description'] ?? ''),
                    $price,
                    $original,
                    (string)$in['image'],
                    isset($b['extraImages']) ? json_encode($b['extraImages']) : null,
                    $b['videoUrl'] ?? null,
                    $stock,
                    in_array($b['status'] ?? '', ['active','draft','archived']) ? $b['status'] : 'active',
                ]);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log('[etwin/product] ' . $e->getMessage());
            throw $e;
        }

        $st = $pdo->prepare('SELECT * FROM products WHERE id = ?');
        $st->execute([$id]);
        Http::json(Mapper::product($st->fetch()), 201);
    }

    public static function update(string $id): void {
        $ctx = Http::ownedTenant();
        $b = Http::body();

        if (array_key_exists('price', $b)) {
            $p = (float)$b['price'];
            if ($p < 0 || $p > 9999999.99) Http::fail('Invalid price', 422);
            $b['price'] = $p;
        }
        if (array_key_exists('stock', $b) && (int)$b['stock'] < 0) Http::fail('Invalid stock', 422);
        if (array_key_exists('name', $b)) {
            $n = trim((string)$b['name']);
            if ($n === '' || mb_strlen($n) > 190) Http::fail('Invalid name', 422);
            $b['name'] = $n;
        }
        if (array_key_exists('status', $b) && !in_array($b['status'], ['active','draft','archived'], true)) {
            Http::fail('Invalid status', 422);
        }

        $map = [
            'name'         => 'name',
            'description'  => 'description',
            'price'        => 'price',
            'originalPrice'=> 'original_price',
            'image'        => 'image',
            'videoUrl'     => 'video_url',
            'stock'        => 'stock',
            'status'       => 'status',
        ];
        $fields = []; $vals = [];
        foreach ($map as $k => $col) {
            if (array_key_exists($k, $b)) { $fields[] = "$col = ?"; $vals[] = $b[$k]; }
        }
        if (array_key_exists('extraImages', $b)) { $fields[] = 'extra_images = ?'; $vals[] = json_encode($b['extraImages']); }
        if (!$fields) Http::fail('Nothing to update', 400);
        $vals[] = $id; $vals[] = $ctx['store']['id'];
        DB::pdo()->prepare('UPDATE products SET ' . implode(',', $fields) . ' WHERE id = ? AND tenant_id = ?')
            ->execute($vals);
        $st = DB::pdo()->prepare('SELECT * FROM products WHERE id = ? AND tenant_id = ?');
        $st->execute([$id, $ctx['store']['id']]);
        $row = $st->fetch();
        if (!$row) Http::fail('Not found', 404);
        Http::json(Mapper::product($row));
    }

    public static function delete(string $id): void {
        $ctx = Http::ownedTenant();
        DB::pdo()->prepare('DELETE FROM products WHERE id = ? AND tenant_id = ?')
            ->execute([$id, $ctx['store']['id']]);
        http_response_code(204);
        exit;
    }

    public static function publicListBySlug(string $slug): void {
        // Optional public catalog endpoint for storefront SSR if needed.
        $st = DB::pdo()->prepare(
            'SELECT p.* FROM products p
             JOIN stores s ON s.id = p.tenant_id
             WHERE s.slug = ? AND p.status = "active"
             ORDER BY p.created_at DESC');
        $st->execute([$slug]);
        Http::json(array_map([Mapper::class, 'product'], $st->fetchAll()));
    }
}
