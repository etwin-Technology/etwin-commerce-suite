<?php
// Telegram bot webhook + connect link.
// Set webhook (one-time):
//   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-api/api/telegram/webhook?secret=<SECRET>"
class TelegramController {
    /** Returns a deep link the seller clicks to bind their store to a chat id. */
    public static function connectLink(): void {
        $cfg = require __DIR__ . '/../config/config.php';
        $ctx = Http::ownedTenant();
        $token = $cfg['telegram_bot_token'];
        if (!$token) Http::fail('Bot not configured', 500);
        // The seller opens this and presses START — the webhook captures their chat id.
        $info = json_decode(@file_get_contents("https://api.telegram.org/bot{$token}/getMe"), true);
        $username = $info['result']['username'] ?? '';
        Http::json([
            'url' => "https://t.me/{$username}?start=" . $ctx['store']['id'],
            'botUsername' => $username,
        ]);
    }

    /** Telegram → us. Handles /start <storeId> + inline-button callbacks. */
    public static function webhook(): void {
        $cfg = require __DIR__ . '/../config/config.php';
        if (($_GET['secret'] ?? '') !== $cfg['telegram_webhook_secret']) {
            Http::fail('Forbidden', 403);
        }
        $token = $cfg['telegram_bot_token'];
        $update = Http::body();
        $pdo = DB::pdo();

        // 1) /start <storeId> -> bind chat id to store
        if (isset($update['message']['text']) && str_starts_with($update['message']['text'], '/start')) {
            $parts  = explode(' ', trim($update['message']['text']), 2);
            $storeId = $parts[1] ?? '';
            $chatId  = (string)$update['message']['chat']['id'];
            if ($storeId) {
                $st = $pdo->prepare('UPDATE stores SET telegram_chat_id = ? WHERE id = ?');
                $st->execute([$chatId, $storeId]);
                Telegram::sendMessage($token, $chatId, "✅ Connected! You'll now receive new orders here.");
            } else {
                Telegram::sendMessage($token, $chatId, "👋 Welcome to ETWIN Commerce. Open the dashboard to connect your store.");
            }
            Http::json(['ok' => true]);
        }

        // 2) Inline button callback: confirm/cancel an order
        if (isset($update['callback_query'])) {
            $cb     = $update['callback_query'];
            $data   = $cb['data'] ?? '';
            $cbId   = $cb['id'];
            [$action, $orderId] = array_pad(explode(':', $data, 2), 2, '');
            if ($orderId) {
                if ($action === 'confirm') {
                    $pdo->prepare('UPDATE orders SET status = "paid"   WHERE id = ?')->execute([$orderId]);
                    Telegram::answerCallback($token, $cbId, '✅ Order confirmed');
                } elseif ($action === 'cancel') {
                    $pdo->prepare('UPDATE orders SET status = "pending" WHERE id = ?')->execute([$orderId]);
                    Telegram::answerCallback($token, $cbId, '❌ Order kept pending');
                }
            }
            Http::json(['ok' => true]);
        }

        Http::json(['ok' => true]);
    }
}
