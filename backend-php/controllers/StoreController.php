<?php
class StoreController {
    public static function getBySlug(string $slug): void {
        $st = DB::pdo()->prepare('SELECT * FROM stores WHERE slug = ? LIMIT 1');
        $st->execute([$slug]);
        $store = $st->fetch();
        if (!$store) Http::json(null, 404);
        Http::json(Mapper::store($store));
    }

    public static function update(string $id): void {
        $ctx = Http::ownedTenant();
        if ($ctx['store']['id'] !== $id) Http::fail('Forbidden', 403);
        $b = Http::body();
        $fields = []; $vals = [];
        $map = [
            'name'              => 'name',
            'city'              => 'city',
            'logoUrl'           => 'logo_url',
            'currency'          => 'currency',
            'onboardingComplete'=> 'onboarding_complete',
        ];
        foreach ($map as $k => $col) {
            if (array_key_exists($k, $b)) { $fields[] = "$col = ?"; $vals[] = is_bool($b[$k]) ? (int)$b[$k] : $b[$k]; }
        }
        if (isset($b['notifications']) && is_array($b['notifications'])) {
            if (array_key_exists('whatsappNumber', $b['notifications'])) { $fields[] = 'whatsapp_number = ?'; $vals[] = (string)$b['notifications']['whatsappNumber']; }
            if (array_key_exists('telegramChatId', $b['notifications']))  { $fields[] = 'telegram_chat_id = ?'; $vals[] = $b['notifications']['telegramChatId']; }
        }
        if (isset($b['tracking']) && is_array($b['tracking'])) {
            if (array_key_exists('facebookPixel', $b['tracking'])) { $fields[] = 'facebook_pixel = ?'; $vals[] = $b['tracking']['facebookPixel']; }
            if (array_key_exists('tiktokPixel',  $b['tracking'])) { $fields[] = 'tiktok_pixel = ?';  $vals[] = $b['tracking']['tiktokPixel']; }
        }
        if ($fields) {
            $vals[] = $id;
            DB::pdo()->prepare('UPDATE stores SET ' . implode(',', $fields) . ' WHERE id = ?')->execute($vals);
        }
        $st = DB::pdo()->prepare('SELECT * FROM stores WHERE id = ?');
        $st->execute([$id]);
        Http::json(Mapper::store($st->fetch()));
    }
}
