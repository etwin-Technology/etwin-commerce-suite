<?php
// Minimal HS256 JWT implementation - no external libs.
class JWT {
    public static function encode(array $payload, string $secret, int $ttl): string {
        $payload['iat'] = time();
        $payload['exp'] = time() + $ttl;
        $h = self::b64(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $p = self::b64(json_encode($payload));
        $sig = self::b64(hash_hmac('sha256', "$h.$p", $secret, true));
        return "$h.$p.$sig";
    }

    public static function decode(string $jwt, string $secret): ?array {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) return null;
        [$h, $p, $sig] = $parts;
        $expected = self::b64(hash_hmac('sha256', "$h.$p", $secret, true));
        if (!hash_equals($expected, $sig)) return null;
        $payload = json_decode(self::ub64($p), true);
        if (!is_array($payload)) return null;
        if (isset($payload['exp']) && $payload['exp'] < time()) return null;
        return $payload;
    }

    private static function b64(string $s): string {
        return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
    }
    private static function ub64(string $s): string {
        return base64_decode(strtr($s, '-_', '+/'));
    }
}
