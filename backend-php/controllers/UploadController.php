<?php
/**
 * UploadController — accepts multipart/form-data uploads.
 *
 * Storage:
 *   /uploads/{tenant_id}/{yyyy}/{mm}/{uuid}.{ext}
 *
 * Returns: { url: "/uploads/.../file.jpg", path: "..." }
 *
 * - Auth required (Http::ownedTenant ensures user owns the active store).
 * - Allowed mime types: image/jpeg, image/png, image/webp, image/gif.
 * - Max size: 5 MB per file.
 * - Public read: serve /uploads/* directly via Apache (default in .htaccess).
 */
class UploadController {
    private const MAX_BYTES = 5 * 1024 * 1024;
    private const ALLOWED   = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/gif'  => 'gif',
    ];

    public static function image(): void {
        $ctx = Http::ownedTenant();
        $tenantId = $ctx['store']['id'];

        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
            Http::fail('No file uploaded', 400);
        }
        $f = $_FILES['file'];
        if (($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Http::fail('Upload error: ' . $f['error'], 400);
        }
        if (($f['size'] ?? 0) > self::MAX_BYTES) {
            Http::fail('File too large (max 5 MB)', 413);
        }

        // Detect mime via finfo (don't trust client-supplied type)
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime  = $finfo->file($f['tmp_name']) ?: '';
        if (!isset(self::ALLOWED[$mime])) {
            Http::fail('Unsupported image type', 415);
        }
        $ext = self::ALLOWED[$mime];

        // Build destination path: backend-php/public/uploads/{tenant}/{yyyy}/{mm}/
        $base = realpath(__DIR__ . '/../public') . '/uploads';
        $rel  = sprintf('/%s/%s/%s', $tenantId, date('Y'), date('m'));
        $dir  = $base . $rel;
        if (!is_dir($dir) && !mkdir($dir, 0775, true)) {
            Http::fail('Cannot create upload dir', 500);
        }
        // Hardening: drop a no-php .htaccess inside upload root once
        $htaccess = $base . '/.htaccess';
        if (!file_exists($htaccess)) {
            @file_put_contents($htaccess, "Options -Indexes\n<FilesMatch \"\\.(php|phtml|phar)$\">\n  Require all denied\n</FilesMatch>\n");
        }

        $name = bin2hex(random_bytes(8)) . '.' . $ext;
        $dest = $dir . '/' . $name;
        if (!move_uploaded_file($f['tmp_name'], $dest)) {
            Http::fail('Cannot save file', 500);
        }
        @chmod($dest, 0644);

        $publicUrl = '/uploads' . $rel . '/' . $name;
        Http::json(['url' => $publicUrl, 'path' => $publicUrl], 201);
    }
}
