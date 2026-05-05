<?php
/**
 * DomainController — Custom domain management for store owners.
 *
 * Routes (require auth + X-Tenant-Id):
 *   GET   /api/domain          → current domain status for store
 *   POST  /api/domain          → set custom domain
 *   DELETE /api/domain         → remove custom domain
 *   POST  /api/domain/check    → check DNS resolution (A record)
 */
class DomainController {

    // ──────────────────────────────────────────────────────────
    //  Get current domain info
    // ──────────────────────────────────────────────────────────
    public static function get(): void {
        $ctx   = Http::ownedTenant();
        $store = $ctx['store'];
        $cfg   = require __DIR__ . '/../config/config.php';

        Http::json([
            'domain'       => $store['custom_domain'],
            'verified'     => (bool)($store['domain_verified'] ?? 0),
            'verifiedAt'   => $store['domain_verified_at'] ?? null,
            'serverIp'     => $cfg['server_ip'] ?? '0.0.0.0',
            'instructions' => self::dnsInstructions($cfg['server_ip'] ?? '0.0.0.0'),
        ]);
    }

    // ──────────────────────────────────────────────────────────
    //  Set / update custom domain — requires the `custom_domain` feature
    //  (granted by plan tier, or an explicit super-admin override).
    // ──────────────────────────────────────────────────────────
    public static function set(): void {
        $ctx  = Http::requireFeature('custom_domain');
        $b    = Http::body();
        $domain = trim(strtolower($b['domain'] ?? ''));

        if (!$domain) Http::fail('domain is required', 422);
        if (mb_strlen($domain) > 253) Http::fail('Domain too long', 422);

        // Validate domain format
        if (!preg_match('/^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/', $domain)) {
            Http::fail('Invalid domain format. Use lowercase, e.g. shop.example.com', 422);
        }

        $pdo = DB::pdo();

        // Check not already taken by another store
        $taken = $pdo->prepare(
            "SELECT id FROM stores WHERE custom_domain = ? AND id != ? LIMIT 1"
        );
        $taken->execute([$domain, $ctx['store']['id']]);
        if ($taken->fetch()) Http::fail('Domain already in use by another store', 409);

        // Reset verification when domain changes
        $pdo->prepare(
            "UPDATE stores SET custom_domain = ?, domain_verified = 0, domain_verified_at = NULL WHERE id = ?"
        )->execute([$domain, $ctx['store']['id']]);

        // Create a system notification
        $pdo->prepare(
            "INSERT INTO notifications (tenant_id, type, title, body)
             VALUES (?, 'domain', 'Domaine configuré', ?)"
        )->execute([
            $ctx['store']['id'],
            "Le domaine {$domain} a été ajouté. Configurez votre DNS puis vérifiez.",
        ]);

        self::get();
    }

    // ──────────────────────────────────────────────────────────
    //  Remove custom domain
    // ──────────────────────────────────────────────────────────
    public static function remove(): void {
        $ctx = Http::ownedTenant();
        DB::pdo()->prepare(
            "UPDATE stores SET custom_domain = NULL, domain_verified = 0, domain_verified_at = NULL WHERE id = ?"
        )->execute([$ctx['store']['id']]);
        Http::json(['ok' => true]);
    }

    // ──────────────────────────────────────────────────────────
    //  Check DNS: resolve A record and compare to server IP
    // ──────────────────────────────────────────────────────────
    public static function checkDns(): void {
        $ctx   = Http::ownedTenant();
        $store = $ctx['store'];
        $cfg   = require __DIR__ . '/../config/config.php';

        $domain = $store['custom_domain'] ?? null;
        if (!$domain) Http::fail('No domain configured', 400);

        $serverIp = $cfg['server_ip'] ?? '';
        $resolved = gethostbyname($domain);
        $match    = ($resolved !== $domain && $resolved === $serverIp);

        if ($match) {
            DB::pdo()->prepare(
                "UPDATE stores SET domain_verified = 1, domain_verified_at = NOW() WHERE id = ?"
            )->execute([$store['id']]);
        }

        Http::json([
            'domain'    => $domain,
            'resolved'  => $resolved !== $domain ? $resolved : null,
            'expected'  => $serverIp,
            'verified'  => $match,
        ]);
    }

    // ──────────────────────────────────────────────────────────
    //  DNS setup instructions
    // ──────────────────────────────────────────────────────────
    private static function dnsInstructions(string $serverIp): array {
        return [
            [
                'type'    => 'A',
                'host'    => '@',
                'value'   => $serverIp,
                'ttl'     => 3600,
                'comment' => 'Point your root domain to ETWIN server',
            ],
            [
                'type'    => 'CNAME',
                'host'    => 'www',
                'value'   => 'your-domain.com',
                'ttl'     => 3600,
                'comment' => 'Optional: redirect www to root domain',
            ],
        ];
    }
}
