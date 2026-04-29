<?php
// Telegram bot helper. Sends order notifications with [Confirm][Cancel] buttons.
class Telegram {
    public static function notifyOrder(array $store, array $order, array $items): void {
        $cfg = require __DIR__ . '/../config/config.php';
        $token  = $cfg['telegram_bot_token'];
        $chatId = $store['telegram_chat_id'] ?? null;
        if (!$token || !$chatId) return;

        $lines = ["🛒 *New order #{$order['id']}*",
                  "👤 {$order['customer_name']} — {$order['customer_phone']}",
                  "📍 {$order['city']} — {$order['customer_address']}",
                  ""];
        foreach ($items as $i) {
            $lines[] = "• {$i['name']} × {$i['qty']} = " . number_format((float)$i['price'] * (int)$i['qty'], 2) . " {$store['currency']}";
        }
        $lines[] = "";
        $lines[] = "💰 *Total: " . number_format((float)$order['total'], 2) . " {$store['currency']}*";

        $body = [
            'chat_id'    => $chatId,
            'text'       => implode("\n", $lines),
            'parse_mode' => 'Markdown',
            'reply_markup' => json_encode([
                'inline_keyboard' => [[
                    ['text' => '✅ Confirm', 'callback_data' => "confirm:{$order['id']}"],
                    ['text' => '❌ Cancel',  'callback_data' => "cancel:{$order['id']}"],
                ]]
            ]),
        ];
        self::call($token, 'sendMessage', $body);
    }

    public static function answerCallback(string $token, string $callbackId, string $text = ''): void {
        self::call($token, 'answerCallbackQuery', ['callback_query_id' => $callbackId, 'text' => $text]);
    }

    public static function sendMessage(string $token, string $chatId, string $text): void {
        self::call($token, 'sendMessage', ['chat_id' => $chatId, 'text' => $text, 'parse_mode' => 'Markdown']);
    }

    private static function call(string $token, string $method, array $body): void {
        $url = "https://api.telegram.org/bot{$token}/{$method}";
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($body),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
        ]);
        curl_exec($ch);
        curl_close($ch);
    }
}
