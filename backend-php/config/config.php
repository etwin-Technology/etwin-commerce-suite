<?php
// ETWIN Commerce - Configuration
// Override via environment variables in production.

return [
    'db' => [
        'host'    => getenv('DB_HOST')    ?: '127.0.0.1',
        'port'    => getenv('DB_PORT')    ?: '3306',
        'name'    => getenv('DB_NAME')    ?: 'etwin_commerce',
        'user'    => getenv('DB_USER')    ?: 'root',
        'pass'    => getenv('DB_PASS')    ?: '',
        'charset' => 'utf8mb4',
    ],
    'jwt_secret'              => getenv('JWT_SECRET')              ?: 'change-me-in-production-please-use-long-random-string',
    'jwt_ttl_seconds'         => 60 * 60 * 24 * 30, // 30 days
    'telegram_bot_token'      => getenv('TELEGRAM_BOT_TOKEN')      ?: '',
    'telegram_webhook_secret' => getenv('TELEGRAM_WEBHOOK_SECRET') ?: 'etwin-telegram-secret',
    'cors_allow_origin'       => getenv('CORS_ALLOW_ORIGIN')       ?: '*',
    'app_base_url'            => getenv('APP_BASE_URL')            ?: 'http://localhost:5173',
    // IP address of this server — used for custom domain DNS verification
    'server_ip'               => getenv('SERVER_IP')               ?: '0.0.0.0',
];
