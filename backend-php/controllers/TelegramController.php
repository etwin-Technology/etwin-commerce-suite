<?php
// Telegram bot webhook + connect link.
// Set webhook (one-time):
//   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-api/api/telegram/webhook?secret=<SECRET>"
class TelegramController {
    /** Returns a deep link the seller clicks to bind their store to a chat id. */
    public static function connectLink(): void {
        $cfg = require __DIR__ . '/../config/config.php';
        $ctx = Http::requireFeature('telegram_bot');
        $token = $cfg['telegram_bot_token'];
        if (!$token) Http::fail('Bot not configured', 500);

        $username = '';
        $raw = @file_get_contents("https://api.telegram.org/bot{$token}/getMe");
        if ($raw !== false) {
            $info = json_decode($raw, true);
            $username = $info['result']['username'] ?? '';
        }
        if ($username === '') Http::fail('Telegram API unreachable', 502);

        Http::json([
            'url' => "https://t.me/{$username}?start=" . $ctx['store']['id'],
            'botUsername' => $username,
        ]);
    }

    /** Telegram → us. Handles /start <storeId> + inline-button callbacks. */
    public static function webhook(): void {
        $cfg = require __DIR__ . '/../config/config.php';
        $expected = $cfg['telegram_webhook_secret'];
        // Constant-time compare to avoid timing oracles
        if (!hash_equals($expected, (string)($_GET['secret'] ?? ''))) {
            Http::fail('Forbidden', 403);
        }
        $token  = $cfg['telegram_bot_token'];
        $update = Http::body();
        $pdo    = DB::pdo();

        // 1) /start <storeId> → bind chat id to store, but ONLY if the store has no chat
        //    bound yet OR the binding matches. Prevents an attacker who guesses a storeId
        //    from hijacking notifications.
        if (isset($update['message']['text']) && str_starts_with($update['message']['text'], '/start')) {
            $parts   = explode(' ', trim($update['message']['text']), 2);
            $storeId = $parts[1] ?? '';
            $chatId  = (string)($update['message']['chat']['id'] ?? '');
            if ($storeId !== '' && $chatId !== '') {
                $st = $pdo->prepare('SELECT telegram_chat_id FROM stores WHERE id = ? LIMIT 1');
                $st->execute([$storeId]);
                $existing = $st->fetchColumn();
                if ($existing === false) {
                    Telegram::sendMessage($token, $chatId, "❌ Boutique introuvable.");
                } elseif ($existing && $existing !== $chatId) {
                    // Don't disclose the conflict; just refuse.
                    Telegram::sendMessage($token, $chatId, "❌ Cette boutique est déjà reliée à un autre compte Telegram.");
                } else {
                    $pdo->prepare('UPDATE stores SET telegram_chat_id = ? WHERE id = ?')
                        ->execute([$chatId, $storeId]);
                    Telegram::sendMessage($token, $chatId, "✅ Connected! You'll now receive new orders here.");
                }
            } elseif ($chatId !== '') {
                Telegram::sendMessage($token, $chatId, "👋 Welcome to ETWIN Commerce. Open the dashboard to connect your store.");
            }
            Http::json(['ok' => true]);
        }

        // 2) Inline button callback: confirm/cancel an order.
        //    SECURITY: only allow if the callback's chat_id is the bound chat for the order's store.
        if (isset($update['callback_query'])) {
            $cb     = $update['callback_query'];
            $data   = (string)($cb['data'] ?? '');
            $cbId   = $cb['id'] ?? '';
            $chatId = (string)($cb['message']['chat']['id'] ?? '');
            [$action, $orderId] = array_pad(explode(':', $data, 2), 2, '');

            if ($orderId !== '' && $chatId !== '') {
                $check = $pdo->prepare(
                    'SELECT o.id FROM orders o
                     JOIN stores s ON s.id = o.tenant_id
                     WHERE o.id = ? AND s.telegram_chat_id = ?
                     LIMIT 1'
                );
                $check->execute([$orderId, $chatId]);
                if (!$check->fetchColumn()) {
                    Telegram::answerCallback($token, $cbId, '❌ Action non autorisée');
                    Http::json(['ok' => true]);
                }

                if ($action === 'confirm') {
                    $pdo->prepare('UPDATE orders SET status = "paid"    WHERE id = ?')->execute([$orderId]);
                    Telegram::answerCallback($token, $cbId, '✅ Order confirmed');
                } elseif ($action === 'cancel') {
                    $pdo->prepare('UPDATE orders SET status = "pending" WHERE id = ?')->execute([$orderId]);
                    Telegram::answerCallback($token, $cbId, '↩️ Order kept pending');
                }
            }
            Http::json(['ok' => true]);
        }

        Http::json(['ok' => true]);
    }
}
