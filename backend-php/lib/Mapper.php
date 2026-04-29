<?php
// Map MySQL rows -> JSON contracts expected by the React client (src/lib/api/types.ts).
class Mapper {
    public static function user(array $r): array {
        return ['id' => $r['id'], 'email' => $r['email'], 'fullName' => $r['full_name']];
    }

    public static function store(array $r): array {
        return [
            'id'       => $r['id'],
            'name'     => $r['name'],
            'slug'     => $r['slug'],
            'ownerId'  => $r['owner_id'],
            'currency' => $r['currency'],
            'city'     => $r['city'],
            'logoUrl'  => $r['logo_url'],
            'notifications' => [
                'whatsappNumber'  => $r['whatsapp_number'] ?? '',
                'telegramChatId'  => $r['telegram_chat_id'],
            ],
            'tracking' => [
                'facebookPixel' => $r['facebook_pixel'],
                'tiktokPixel'   => $r['tiktok_pixel'],
            ],
            'onboardingComplete' => (bool)$r['onboarding_complete'],
            'subscription' => [
                'plan'      => $r['plan'],
                'expiresAt' => date('c', strtotime($r['plan_expires_at'])),
                'active'    => (bool)$r['plan_active'],
            ],
        ];
    }

    public static function product(array $r): array {
        return [
            'id'            => $r['id'],
            'tenantId'      => $r['tenant_id'],
            'name'          => $r['name'],
            'description'   => $r['description'],
            'price'         => (float)$r['price'],
            'originalPrice' => $r['original_price'] !== null ? (float)$r['original_price'] : null,
            'image'         => $r['image'],
            'extraImages'   => $r['extra_images'] ? json_decode($r['extra_images'], true) : [],
            'videoUrl'      => $r['video_url'],
            'stock'         => (int)$r['stock'],
            'status'        => $r['status'],
            'createdAt'     => date('c', strtotime($r['created_at'])),
        ];
    }

    public static function customer(array $r): array {
        return [
            'id'           => $r['id'],
            'tenantId'     => $r['tenant_id'],
            'name'         => $r['name'],
            'phone'        => $r['phone'],
            'address'      => $r['address'],
            'ordersCount'  => (int)$r['orders_count'],
            'totalSpent'   => (float)$r['total_spent'],
        ];
    }

    public static function order(array $r, array $items): array {
        return [
            'id'              => $r['id'],
            'tenantId'        => $r['tenant_id'],
            'customerId'      => $r['customer_id'],
            'customerName'    => $r['customer_name'],
            'customerPhone'   => $r['customer_phone'],
            'customerAddress' => $r['customer_address'],
            'city'            => $r['city'],
            'total'           => (float)$r['total'],
            'status'          => $r['status'],
            'createdAt'       => date('c', strtotime($r['created_at'])),
            'items' => array_map(fn($i) => [
                'productId' => $i['product_id'],
                'name'      => $i['name'],
                'qty'       => (int)$i['qty'],
                'price'     => (float)$i['price'],
            ], $items),
        ];
    }
}
