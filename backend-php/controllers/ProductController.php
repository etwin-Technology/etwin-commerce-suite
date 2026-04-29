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

        // Plan-based product limit (trial: max 10 active products)
        $limit = Http::planProductLimit($store);
        if ($limit !== null) {
            $countSt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE tenant_id = ? AND status != 'archived'");
            $countSt->execute([$store['id']]);
            if ((int)$countSt->fetchColumn() >= $limit) {
                Http::fail("Le plan Essai est limité à {$limit} produits. Passez au plan Pro pour des produits illimités.", 402);
            }
        }

        $b = Http::body();
        $in = Http::require($b, ['name','price','image']);
        $id = DB::uuid();
        $pdo->prepare('INSERT INTO products
            (id,tenant_id,name,description,price,original_price,image,extra_images,video_url,stock,status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)')
            ->execute([
                $id, $store['id'],
                $in['name'],
                (string)($b['description'] ?? ''),
                (float)$in['price'],
                isset($b['originalPrice']) ? (float)$b['originalPrice'] : null,
                (string)$in['image'],
                isset($b['extraImages']) ? json_encode($b['extraImages']) : null,
                $b['videoUrl'] ?? null,
                (int)($b['stock'] ?? 0),
                in_array($b['status'] ?? '', ['active','draft','archived']) ? $b['status'] : 'active',
            ]);
        $st = $pdo->prepare('SELECT * FROM products WHERE id = ?');
        $st->execute([$id]);
        Http::json(Mapper::product($st->fetch()), 201);
    }

    public static function update(string $id): void {
        $ctx = Http::ownedTenant();
        $b = Http::body();
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
