<?php
class DashboardController {
    public static function stats(): void {
        $ctx = Http::ownedTenant();
        $tid = $ctx['store']['id'];
        $pdo = DB::pdo();

        $row = $pdo->prepare('SELECT
            COALESCE(SUM(total),0) AS revenue,
            COUNT(*)               AS orders_count,
            SUM(status = "pending") AS pending_count
            FROM orders WHERE tenant_id = ?');
        $row->execute([$tid]);
        $agg = $row->fetch();

        $today = $pdo->prepare('SELECT
            COALESCE(SUM(total),0) AS today_revenue,
            COUNT(*)               AS new_orders
            FROM orders WHERE tenant_id = ? AND DATE(created_at) = CURDATE()');
        $today->execute([$tid]);
        $todayAgg = $today->fetch();

        $cust = $pdo->prepare('SELECT COUNT(*) AS c FROM customers WHERE tenant_id = ?');
        $cust->execute([$tid]);
        $custCount = (int)$cust->fetch()['c'];

        // Sales by day (last 7 days)
        $byDay = $pdo->prepare('SELECT DATE(created_at) AS day, COALESCE(SUM(total),0) AS value
            FROM orders WHERE tenant_id = ? AND created_at >= (NOW() - INTERVAL 6 DAY)
            GROUP BY DATE(created_at) ORDER BY day ASC');
        $byDay->execute([$tid]);
        $sales = array_map(fn($r) => ['day' => $r['day'], 'value' => (float)$r['value']], $byDay->fetchAll());

        // Best seller
        $best = $pdo->prepare('SELECT name, SUM(qty) AS sales FROM order_items i
            JOIN orders o ON o.id = i.order_id
            WHERE o.tenant_id = ? GROUP BY name ORDER BY sales DESC LIMIT 1');
        $best->execute([$tid]);
        $bestRow = $best->fetch();

        Http::json([
            'revenue'         => (float)$agg['revenue'],
            'ordersCount'     => (int)$agg['orders_count'],
            'customersCount'  => $custCount,
            'conversion'      => 0,
            'revenueDelta'    => 0,
            'ordersDelta'     => 0,
            'customersDelta'  => 0,
            'conversionDelta' => 0,
            'todayRevenue'    => (float)$todayAgg['today_revenue'],
            'newOrdersCount'  => (int)$todayAgg['new_orders'],
            'pendingCount'    => (int)$agg['pending_count'],
            'bestSeller'      => $bestRow ? ['name' => $bestRow['name'], 'sales' => (int)$bestRow['sales']] : null,
            'salesByDay'      => $sales,
        ]);
    }
}
