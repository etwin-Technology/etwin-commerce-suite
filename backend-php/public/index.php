<?php
// Front controller / router. Point your web server document root here.
declare(strict_types=1);

require __DIR__ . '/../lib/DB.php';
require __DIR__ . '/../lib/JWT.php';
require __DIR__ . '/../lib/Http.php';
require __DIR__ . '/../lib/Mapper.php';
require __DIR__ . '/../lib/Telegram.php';
require __DIR__ . '/../controllers/AuthController.php';
require __DIR__ . '/../controllers/StoreController.php';
require __DIR__ . '/../controllers/ProductController.php';
require __DIR__ . '/../controllers/OrderController.php';
require __DIR__ . '/../controllers/CustomerController.php';
require __DIR__ . '/../controllers/DashboardController.php';
require __DIR__ . '/../controllers/TelegramController.php';
require __DIR__ . '/../controllers/NotificationController.php';
require __DIR__ . '/../controllers/DomainController.php';
require __DIR__ . '/../controllers/SubscriptionController.php';
require __DIR__ . '/../controllers/AdminController.php';
require __DIR__ . '/../controllers/UploadController.php';
require __DIR__ . '/../controllers/MemberController.php';

set_exception_handler(function (Throwable $e) {
    $cfg = @require __DIR__ . '/../config/config.php';
    $isProd = is_array($cfg) && !empty($cfg['is_prod']);
    // Trace goes to logs only — never to clients.
    error_log('[etwin] ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
    }
    echo json_encode($isProd
        ? ['error' => 'Server error']
        : ['error' => 'Server error', 'debug' => $e->getMessage()]);
});

Http::bootstrap();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path   = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path   = '/' . trim($path, '/');

// Pattern matcher: returns matched params array or false.
function route(string $m, string $method, string $pattern, string $path): array|false {
    if ($m !== $method) return false;
    $regex = '#^' . preg_replace('#\\\{([a-z_]+)\\\}#i', '(?P<$1>[^/]+)', preg_quote($pattern, '#')) . '$#';
    if (!preg_match($regex, $path, $m2)) return false;
    return array_filter($m2, fn($k) => !is_int($k), ARRAY_FILTER_USE_KEY);
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
if (route('POST', $method, '/api/auth/register', $path) !== false) AuthController::register();
if (route('POST', $method, '/api/auth/login',    $path) !== false) AuthController::login();

// ── STORES ────────────────────────────────────────────────────────────────────
if (route('GET',   $method, '/api/features',              $path) !== false) StoreController::features();
if (($p = route('GET',   $method, '/api/stores/{slug}',         $path)) !== false) StoreController::getBySlug($p['slug']);
if (($p = route('PATCH', $method, '/api/stores/{id}',           $path)) !== false) StoreController::update($p['id']);
if (($p = route('PATCH', $method, '/api/stores/{id}/theme',     $path)) !== false) StoreController::updateTheme($p['id']);
if (($p = route('PATCH', $method, '/api/stores/{id}/header',    $path)) !== false) StoreController::updateHeader($p['id']);
if (($p = route('PATCH', $method, '/api/stores/{id}/footer',    $path)) !== false) StoreController::updateFooter($p['id']);

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
if (route('GET',  $method, '/api/products', $path) !== false) ProductController::list();
if (route('POST', $method, '/api/products', $path) !== false) ProductController::create();
if (($p = route('PUT',    $method, '/api/products/{id}', $path)) !== false) ProductController::update($p['id']);
if (($p = route('DELETE', $method, '/api/products/{id}', $path)) !== false) ProductController::delete($p['id']);
if (($p = route('GET',    $method, '/api/public/stores/{slug}/products', $path)) !== false) ProductController::publicListBySlug($p['slug']);

// ── ORDERS ────────────────────────────────────────────────────────────────────
if (route('GET',  $method, '/api/orders',                              $path) !== false) OrderController::list();
if (($p = route('POST',  $method, '/api/orders/{id}/confirm',          $path)) !== false) OrderController::confirm($p['id']);
if (($p = route('POST',  $method, '/api/orders/{id}/ship',             $path)) !== false) OrderController::ship($p['id']);
if (($p = route('PATCH', $method, '/api/orders/{id}/status',           $path)) !== false) OrderController::updateStatus($p['id']);
if (($p = route('PATCH', $method, '/api/orders/{id}',                  $path)) !== false) OrderController::update($p['id']);
if (($p = route('DELETE',$method, '/api/orders/{id}',                  $path)) !== false) OrderController::delete($p['id']);
if (($p = route('POST',  $method, '/api/public/stores/{slug}/orders',  $path)) !== false) OrderController::createFromStore($p['slug']);

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────
if (route('GET',  $method, '/api/customers', $path) !== false) CustomerController::list();
if (route('POST', $method, '/api/customers', $path) !== false) CustomerController::create();
if (($p = route('PATCH',  $method, '/api/customers/{id}', $path)) !== false) CustomerController::update($p['id']);
if (($p = route('DELETE', $method, '/api/customers/{id}', $path)) !== false) CustomerController::delete($p['id']);

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
if (route('GET', $method, '/api/dashboard/stats', $path) !== false) DashboardController::stats();

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
if (route('GET',  $method, '/api/notifications',              $path) !== false) NotificationController::list();
if (route('GET',  $method, '/api/notifications/unread',       $path) !== false) NotificationController::unreadCount();
if (route('POST', $method, '/api/notifications/read-all',     $path) !== false) NotificationController::readAll();
if (($p = route('POST', $method, '/api/notifications/{id}/read', $path)) !== false) NotificationController::readOne($p['id']);

// ── CUSTOM DOMAIN ─────────────────────────────────────────────────────────────
if (route('GET',    $method, '/api/domain',       $path) !== false) DomainController::get();
if (route('POST',   $method, '/api/domain',       $path) !== false) DomainController::set();
if (route('DELETE', $method, '/api/domain',       $path) !== false) DomainController::remove();
if (route('POST',   $method, '/api/domain/check', $path) !== false) DomainController::checkDns();

// ── SUBSCRIPTION ──────────────────────────────────────────────────────────────
if (route('GET',  $method, '/api/subscription',         $path) !== false) SubscriptionController::get();
if (route('POST', $method, '/api/subscription/upgrade', $path) !== false) SubscriptionController::upgrade();

// ── TELEGRAM ──────────────────────────────────────────────────────────────────
if (route('GET',  $method, '/api/telegram/connect-link', $path) !== false) TelegramController::connectLink();
if (route('POST', $method, '/api/telegram/webhook',      $path) !== false) TelegramController::webhook();

// ── ADMIN — stats & lists (admin + super_admin) ───────────────────────────────
if (route('GET',  $method, '/api/admin/stats',   $path) !== false) AdminController::stats();
if (route('GET',  $method, '/api/admin/users',   $path) !== false) AdminController::users();
if (route('GET',  $method, '/api/admin/stores',  $path) !== false) AdminController::stores();
if (route('GET',  $method, '/api/admin/domains', $path) !== false) AdminController::domains();

if (($p = route('POST',  $method, '/api/admin/users/{id}/suspend',  $path)) !== false) AdminController::suspendUser($p['id']);
if (($p = route('POST',  $method, '/api/admin/users/{id}/delete',   $path)) !== false) AdminController::deleteUser($p['id']);
if (($p = route('PATCH', $method, '/api/admin/users/{id}/role',     $path)) !== false) AdminController::updateUserRole($p['id']);
if (($p = route('PATCH', $method, '/api/admin/stores/{id}/plan',    $path)) !== false) AdminController::updatePlan($p['id']);
if (($p = route('POST',  $method, '/api/admin/stores/{id}/suspend', $path)) !== false) AdminController::suspendStore($p['id']);
if (($p = route('POST',  $method, '/api/admin/domains/{id}/verify', $path)) !== false) AdminController::verifyDomain($p['id']);
if (($p = route('POST',  $method, '/api/admin/domains/{id}/revoke', $path)) !== false) AdminController::revokeDomain($p['id']);

// ── ADMIN — platform settings (super_admin only) ─────────────────────────────
if (route('GET',   $method, '/api/admin/settings',       $path) !== false) AdminController::getSettings();
if (route('PATCH', $method, '/api/admin/settings',       $path) !== false) AdminController::updateSettings();
if (route('GET',   $method, '/api/admin/plan-features',  $path) !== false) AdminController::getPlanFeatures();
if (($p = route('PATCH', $method, '/api/admin/plan-features/{feature}', $path)) !== false) AdminController::updatePlanFeature($p['feature']);

// ── ADMIN — feature catalog & per-store access (super_admin) ─────────────────
if (route('GET',   $method, '/api/admin/feature-catalog', $path) !== false) AdminController::featureCatalog();
if (route('GET',   $method, '/api/admin/plan-catalog',    $path) !== false) AdminController::planCatalog();
if (($p = route('PATCH', $method, '/api/admin/plan-catalog/{id}', $path)) !== false) AdminController::updatePlanCatalog($p['id']);
if (($p = route('GET',    $method, '/api/admin/stores/{id}/access', $path)) !== false) AdminController::getStoreAccess($p['id']);
if (($p = route('POST',   $method, '/api/admin/stores/{id}/access', $path)) !== false) AdminController::setStoreAccess($p['id']);
if (($p = route('DELETE', $method, '/api/admin/stores/{id}/access/{feature}', $path)) !== false) AdminController::clearStoreAccess($p['id'], $p['feature']);

// ── PUBLIC settings (for landing page) ───────────────────────────────────────
if (route('GET', $method, '/api/public/settings', $path) !== false) AdminController::publicSettings();

// ── UPLOADS ───────────────────────────────────────────────────────────────────
if (route('POST', $method, '/api/upload/image', $path) !== false) UploadController::image();

// ── TEAM MEMBERS ──────────────────────────────────────────────────────────────
if (route('GET',  $method, '/api/members', $path) !== false) MemberController::list();
if (route('POST', $method, '/api/members', $path) !== false) MemberController::create();
if (($p = route('PATCH',  $method, '/api/members/{id}', $path)) !== false) MemberController::update($p['id']);
if (($p = route('DELETE', $method, '/api/members/{id}', $path)) !== false) MemberController::delete($p['id']);

// ── HEALTH ────────────────────────────────────────────────────────────────────
if (route('GET', $method, '/api/health', $path) !== false) Http::json(['ok' => true, 'service' => 'etwin-commerce-api', 'version' => '3.1']);

Http::fail('Not found', 404);
