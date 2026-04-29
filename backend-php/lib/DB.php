<?php
// PDO singleton with prepared statements (SQL-injection safe).
class DB {
    private static ?PDO $pdo = null;

    public static function pdo(): PDO {
        if (self::$pdo) return self::$pdo;
        $cfg = require __DIR__ . '/../config/config.php';
        $d = $cfg['db'];
        $dsn = "mysql:host={$d['host']};port={$d['port']};dbname={$d['name']};charset={$d['charset']}";
        self::$pdo = new PDO($dsn, $d['user'], $d['pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        return self::$pdo;
    }

    public static function uuid(): string {
        $d = random_bytes(16);
        $d[6] = chr((ord($d[6]) & 0x0f) | 0x40);
        $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
    }
}
