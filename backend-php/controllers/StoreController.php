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
        $store = $ctx['store'];

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
            $n = $b['notifications'];
            if (array_key_exists('whatsappNumber', $n)) {
                $num = trim((string)$n['whatsappNumber']);
                if ($num !== '' && !Http::storeHasFeature($store, 'whatsapp_orders')) {
                    Http::fail("Le bouton WhatsApp n'est pas inclus dans votre plan.", 402);
                }
                if ($num !== '' && (strlen(preg_replace('/\D/', '', $num)) < 8 || mb_strlen($num) > 30)) {
                    Http::fail('Numéro WhatsApp invalide', 422);
                }
                $fields[] = 'whatsapp_number = ?';
                $vals[]   = $num;
            }
            if (array_key_exists('telegramChatId', $n)) {
                // Allow clearing the chat id at any time, but require feature to set one.
                if (!empty($n['telegramChatId']) && !Http::storeHasFeature($store, 'telegram_bot')) {
                    Http::fail("Telegram n'est pas inclus dans votre plan.", 402);
                }
                $fields[] = 'telegram_chat_id = ?';
                $vals[]   = $n['telegramChatId'] ?: null;
            }
        }
        if (isset($b['tracking']) && is_array($b['tracking'])) {
            $tr = $b['tracking'];
            $touchingPixel = array_key_exists('facebookPixel', $tr) || array_key_exists('tiktokPixel', $tr);
            $hasValue = (!empty($tr['facebookPixel']) || !empty($tr['tiktokPixel']));
            if ($touchingPixel && $hasValue && !Http::storeHasFeature($store, 'pixels')) {
                Http::fail("Les pixels publicitaires ne sont pas inclus dans votre plan.", 402);
            }
            if (array_key_exists('facebookPixel', $tr)) {
                $v = $tr['facebookPixel'];
                if ($v !== null && $v !== '' && !preg_match('/^[A-Za-z0-9_-]{6,40}$/', (string)$v)) {
                    Http::fail('Pixel Facebook invalide', 422);
                }
                $fields[] = 'facebook_pixel = ?'; $vals[] = $v ?: null;
            }
            if (array_key_exists('tiktokPixel', $tr)) {
                $v = $tr['tiktokPixel'];
                if ($v !== null && $v !== '' && !preg_match('/^[A-Za-z0-9_-]{6,40}$/', (string)$v)) {
                    Http::fail('Pixel TikTok invalide', 422);
                }
                $fields[] = 'tiktok_pixel = ?'; $vals[] = $v ?: null;
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
    //  Effective feature flags for current tenant
    //  Used by the dashboard to lock UI for features the store can't use.
    // ──────────────────────────────────────────────────────────
    public static function features(): void {
        $ctx = Http::ownedTenant();
        Http::json(Http::effectiveFeatures($ctx['store']));
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

        $allowed = [
            'logoUrl','menuLinks','showSearch','announcementBar','announcementText',
            // Modern display options (all optional)
            'bannerImageUrl','heroTitle','heroSubtitle','heroCta','productColumns',
            'showTrustBar','showLiveBuyer','showRatings','showScarcity',
        ];
        $current = json_decode($ctx['store']['header_settings'] ?? '{}', true) ?: [];

        foreach ($allowed as $k) {
            if (!array_key_exists($k, $b)) continue;
            $v = $b[$k];
            // Light validation for the bigger free-text fields.
            if (in_array($k, ['heroTitle','heroSubtitle','heroCta','announcementText'], true)
                && is_string($v) && mb_strlen($v) > 200) {
                Http::fail("$k too long (max 200 chars)", 422);
            }
            if ($k === 'productColumns' && !in_array((int)$v, [2,3,4], true)) {
                Http::fail('productColumns must be 2, 3 or 4', 422);
            }
            $current[$k] = $v;
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
