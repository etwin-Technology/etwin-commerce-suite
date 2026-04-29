<?php
/**
 * StoreController — Store settings, theme, header, footer.
 *
 * Routes:
 *   GET   /api/stores/{slug}   → public store info by slug
 *   PATCH /api/stores/{id}     → update store (auth required)
 *   PATCH /api/stores/{id}/theme   → update theme settings
 *   PATCH /api/stores/{id}/header  → update header settings (logo, menu)
 *   PATCH /api/stores/{id}/footer  → update footer settings
 */
class StoreController {

    public static function getBySlug(string $slug): void {
        $pdo = DB::pdo();
        // Also support lookup by custom_domain (passed as slug when domain_verified = 1)
        $st = $pdo->prepare(
            "SELECT * FROM stores WHERE slug = ? OR (custom_domain = ? AND domain_verified = 1) LIMIT 1"
        );
        $st->execute([$slug, $slug]);
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
            'name'               => 'name',
            'city'               => 'city',
            'logoUrl'            => 'logo_url',
            'currency'           => 'currency',
            'onboardingComplete' => 'onboarding_complete',
        ];
        foreach ($map as $k => $col) {
            if (array_key_exists($k, $b)) {
                $fields[] = "$col = ?";
                $vals[]   = is_bool($b[$k]) ? (int)$b[$k] : $b[$k];
            }
        }
        if (isset($b['notifications']) && is_array($b['notifications'])) {
            if (array_key_exists('whatsappNumber', $b['notifications'])) {
                $fields[] = 'whatsapp_number = ?';
                $vals[]   = (string)$b['notifications']['whatsappNumber'];
            }
            if (array_key_exists('telegramChatId', $b['notifications'])) {
                $fields[] = 'telegram_chat_id = ?';
                $vals[]   = $b['notifications']['telegramChatId'];
            }
        }
        if (isset($b['tracking']) && is_array($b['tracking'])) {
            if (array_key_exists('facebookPixel', $b['tracking'])) {
                $fields[] = 'facebook_pixel = ?';
                $vals[]   = $b['tracking']['facebookPixel'];
            }
            if (array_key_exists('tiktokPixel', $b['tracking'])) {
                $fields[] = 'tiktok_pixel = ?';
                $vals[]   = $b['tracking']['tiktokPixel'];
            }
        }
        if ($fields) {
            $vals[] = $id;
            DB::pdo()->prepare('UPDATE stores SET ' . implode(',', $fields) . ' WHERE id = ?')
                ->execute($vals);
        }
        $st = DB::pdo()->prepare('SELECT * FROM stores WHERE id = ?');
        $st->execute([$id]);
        Http::json(Mapper::store($st->fetch()));
    }

    // ──────────────────────────────────────────────────────────
    //  Theme settings: colors, fonts, border-radius
    // ──────────────────────────────────────────────────────────
    public static function updateTheme(string $id): void {
        $ctx = Http::ownedTenant();
        if ($ctx['store']['id'] !== $id) Http::fail('Forbidden', 403);
        $b = Http::body();

        $allowed = ['primaryColor','secondaryColor','accentColor','fontFamily','borderRadius','darkMode'];
        $current = json_decode($ctx['store']['theme_settings'] ?? '{}', true) ?: [];

        foreach ($allowed as $k) {
            if (array_key_exists($k, $b)) $current[$k] = $b[$k];
        }

        DB::pdo()->prepare('UPDATE stores SET theme_settings = ? WHERE id = ?')
            ->execute([json_encode($current, JSON_UNESCAPED_UNICODE), $id]);

        $st = DB::pdo()->prepare('SELECT * FROM stores WHERE id = ?');
        $st->execute([$id]);
        Http::json(Mapper::store($st->fetch()));
    }

    // ──────────────────────────────────────────────────────────
    //  Header settings: logo URL, menu links, show search
    // ──────────────────────────────────────────────────────────
    public static function updateHeader(string $id): void {
        $ctx = Http::ownedTenant();
        if ($ctx['store']['id'] !== $id) Http::fail('Forbidden', 403);
        $b = Http::body();

        $allowed = ['logoUrl','menuLinks','showSearch','announcementBar','announcementText'];
        $current = json_decode($ctx['store']['header_settings'] ?? '{}', true) ?: [];

        foreach ($allowed as $k) {
            if (array_key_exists($k, $b)) $current[$k] = $b[$k];
        }

        // Sync logoUrl to main stores.logo_url if provided
        if (isset($b['logoUrl'])) {
            DB::pdo()->prepare('UPDATE stores SET logo_url = ?, header_settings = ? WHERE id = ?')
                ->execute([$b['logoUrl'], json_encode($current, JSON_UNESCAPED_UNICODE), $id]);
        } else {
            DB::pdo()->prepare('UPDATE stores SET header_settings = ? WHERE id = ?')
                ->execute([json_encode($current, JSON_UNESCAPED_UNICODE), $id]);
        }

        $st = DB::pdo()->prepare('SELECT * FROM stores WHERE id = ?');
        $st->execute([$id]);
        Http::json(Mapper::store($st->fetch()));
    }

    // ──────────────────────────────────────────────────────────
    //  Footer settings: links, social icons, description
    // ──────────────────────────────────────────────────────────
    public static function updateFooter(string $id): void {
        $ctx = Http::ownedTenant();
        if ($ctx['store']['id'] !== $id) Http::fail('Forbidden', 403);
        $b = Http::body();

        $allowed = ['description','links','socials','showPoweredBy'];
        $current = json_decode($ctx['store']['footer_settings'] ?? '{}', true) ?: [];

        foreach ($allowed as $k) {
            if (array_key_exists($k, $b)) $current[$k] = $b[$k];
        }

        DB::pdo()->prepare('UPDATE stores SET footer_settings = ? WHERE id = ?')
            ->execute([json_encode($current, JSON_UNESCAPED_UNICODE), $id]);

        $st = DB::pdo()->prepare('SELECT * FROM stores WHERE id = ?');
        $st->execute([$id]);
        Http::json(Mapper::store($st->fetch()));
    }
}
