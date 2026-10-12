<?php
/**
 * City product prices on Reg.ru JSON — works when Render API is slow/down.
 * GET  products/prices?cityId=
 * GET  products/price-changes?cityId=   (admin: last change timestamps)
 * POST products/bulk-prices
 * PATCH products/:id/price
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$upstream = getenv('DOMPOLA_API_UPSTREAM') ?: 'https://dompola-api.onrender.com';
$dataDir = getenv('DOMPOLA_OPS_DATA') ?: (dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'dompola-ops-data');
$storeFile = $dataDir . DIRECTORY_SEPARATOR . 'product-prices.json';
$path = isset($_GET['__path']) ? (string) $_GET['__path'] : '';
$path = ltrim(str_replace(['..', "\0"], '', $path), '/');
$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

function px_json($data, int $code = 200): void {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function px_header(string $name): string {
  $headers = [];
  if (function_exists('getallheaders')) {
    foreach (getallheaders() as $k => $v) {
      $headers[strtolower((string) $k)] = (string) $v;
    }
  }
  foreach ($_SERVER as $k => $v) {
    if (strpos($k, 'HTTP_') === 0 && is_string($v)) {
      $hk = strtolower(str_replace('_', '-', substr($k, 5)));
      if (!isset($headers[$hk])) {
        $headers[$hk] = $v;
      }
    }
  }
  if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) && !isset($headers['authorization'])) {
    $headers['authorization'] = (string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
  }
  $key = strtolower($name);
  return isset($headers[$key]) ? trim($headers[$key]) : '';
}

function px_bearer(): string {
  $auth = px_header('Authorization');
  if ($auth === '') {
    $auth = px_header('X-Dompola-Authorization');
  }
  if ($auth === '') {
    $token = px_header('X-Dompola-Token');
    if ($token !== '') {
      $auth = stripos($token, 'Bearer ') === 0 ? $token : ('Bearer ' . $token);
    }
  }
  return $auth;
}

function px_jwt_role(string $auth): string {
  if (!preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) {
    return '';
  }
  $parts = explode('.', trim($m[1]));
  if (count($parts) < 2) {
    return '';
  }
  $payload = $parts[1];
  $payload = strtr($payload, '-_', '+/');
  $pad = strlen($payload) % 4;
  if ($pad) {
    $payload .= str_repeat('=', 4 - $pad);
  }
  $json = json_decode((string) base64_decode($payload, true), true);
  if (!is_array($json)) {
    return '';
  }
  return strtoupper((string) ($json['role'] ?? ''));
}

/** $allowedRoles e.g. ['ADMIN'] for price edits; managers cannot change prices. */
function px_auth(string $upstream, array $allowedRoles = ['ADMIN']): void {
  $auth = px_bearer();
  if ($auth === '') {
    px_json(['error' => 'Требуется авторизация'], 401);
  }

  $ch = curl_init(rtrim($upstream, '/') . '/api/auth/me');
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Authorization: ' . $auth, 'Accept: application/json'],
    CURLOPT_CONNECTTIMEOUT => 6,
    CURLOPT_TIMEOUT => 12,
  ]);
  $raw = curl_exec($ch);
  $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  if ($raw !== false && $status >= 200 && $status < 300) {
    $user = json_decode($raw, true);
    if (is_array($user) && !empty($user['role'])) {
      $role = strtoupper((string) $user['role']);
      if (in_array($role, $allowedRoles, true)) {
        return;
      }
      px_json(['error' => 'Недостаточно прав'], 403);
    }
  }

  // Fallback when Render sleeps: trust staff role inside JWT payload.
  $role = px_jwt_role($auth);
  if (in_array($role, $allowedRoles, true)) {
    return;
  }
  if ($role !== '' && !in_array($role, $allowedRoles, true)) {
    px_json(['error' => 'Недостаточно прав'], 403);
  }
  px_json(['error' => 'Сессия недействительна'], 401);
}

function px_load(string $file): array {
  $dir = dirname($file);
  if (!is_dir($dir)) {
    @mkdir($dir, 0755, true);
  }
  if (!is_file($file)) {
    $empty = [
      'cities' => new stdClass(),
      'packArea' => new stdClass(),
      'changedAt' => new stdClass(),
      'updatedAt' => null,
    ];
    file_put_contents($file, json_encode($empty, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n");
    return ['cities' => [], 'packArea' => [], 'changedAt' => [], 'updatedAt' => null];
  }
  $data = json_decode((string) file_get_contents($file), true);
  if (!is_array($data)) {
    return ['cities' => [], 'packArea' => [], 'changedAt' => [], 'updatedAt' => null];
  }
  $cities = isset($data['cities']) && is_array($data['cities']) ? $data['cities'] : [];
  $packArea = isset($data['packArea']) && is_array($data['packArea']) ? $data['packArea'] : [];
  $changedAt = isset($data['changedAt']) && is_array($data['changedAt']) ? $data['changedAt'] : [];
  return [
    'cities' => $cities,
    'packArea' => $packArea,
    'changedAt' => $changedAt,
    'updatedAt' => $data['updatedAt'] ?? null,
  ];
}

/** Mark product price change time for a city (ISO-8601 UTC). */
function px_touch_changed(array &$state, string $cityId, string $productId, ?string $at = null): string {
  $iso = $at !== null && $at !== '' ? $at : gmdate('c');
  if (!isset($state['changedAt']) || !is_array($state['changedAt'])) {
    $state['changedAt'] = [];
  }
  if (!isset($state['changedAt'][$cityId]) || !is_array($state['changedAt'][$cityId])) {
    $state['changedAt'][$cityId] = [];
  }
  $state['changedAt'][$cityId][$productId] = $iso;
  return $iso;
}

function px_save(string $file, array $state): void {
  $dir = dirname($file);
  if (!is_dir($dir)) {
    @mkdir($dir, 0755, true);
  }
  $state['updatedAt'] = gmdate('c');
  file_put_contents(
    $file,
    json_encode($state, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n",
    LOCK_EX
  );
}

$bodyRaw = file_get_contents('php://input');
$body = [];
if (is_string($bodyRaw) && $bodyRaw !== '') {
  $decoded = json_decode($bodyRaw, true);
  if (is_array($decoded)) {
    $body = $decoded;
  }
}

// Public price map for storefront — ONLY admin-panel store (no catalog / Render fallback).
if ($method === 'GET' && $path === 'products/prices') {
  $cityId = isset($_GET['cityId']) ? trim((string) $_GET['cityId']) : '';
  if ($cityId === '' && isset($_GET['city'])) {
    // slug not resolved here — frontend sends cityId
    $cityId = '';
  }
  $state = px_load($storeFile);
  $map = [];
  if ($cityId !== '' && isset($state['cities'][$cityId]) && is_array($state['cities'][$cityId])) {
    foreach ($state['cities'][$cityId] as $pid => $price) {
      if (is_string($pid) && is_numeric($price) && (float) $price >= 0) {
        $map[$pid] = (float) $price;
      }
    }
  }
  px_json($map);
}

// Admin: last price-change timestamps for a city (productId → ISO).
if ($method === 'GET' && $path === 'products/price-changes') {
  $cityId = isset($_GET['cityId']) ? trim((string) $_GET['cityId']) : '';
  $state = px_load($storeFile);
  $changed = [];
  if ($cityId !== '' && isset($state['changedAt'][$cityId]) && is_array($state['changedAt'][$cityId])) {
    foreach ($state['changedAt'][$cityId] as $pid => $at) {
      if (is_string($pid) && is_string($at) && $at !== '') {
        $changed[$pid] = $at;
      }
    }
  }
  px_json(['cityId' => $cityId, 'changedAt' => $changed, 'updatedAt' => $state['updatedAt']]);
}

// Bulk save
if ($method === 'POST' && $path === 'products/bulk-prices') {
  px_auth($upstream);
  $ids = isset($body['productIds']) && is_array($body['productIds']) ? $body['productIds'] : [];
  $ids = array_values(array_unique(array_filter(array_map(static function ($v) {
    return is_string($v) ? trim($v) : '';
  }, $ids))));
  $price = isset($body['price']) ? (float) $body['price'] : -1;
  $cityId = isset($body['cityId']) ? trim((string) $body['cityId']) : '';
  $packArea = array_key_exists('packArea', $body) && $body['packArea'] !== null && $body['packArea'] !== ''
    ? (float) $body['packArea']
    : null;

  if (!$ids) {
    px_json(['error' => 'Нет товаров для обновления'], 400);
  }
  if ($cityId === '') {
    px_json(['error' => 'Город не найден'], 400);
  }
  if (!is_finite($price) || $price < 0) {
    px_json(['error' => 'Некорректная цена'], 400);
  }

  $state = px_load($storeFile);
  if (!isset($state['cities'][$cityId]) || !is_array($state['cities'][$cityId])) {
    $state['cities'][$cityId] = [];
  }
  $now = gmdate('c');
  $changedAt = [];
  foreach ($ids as $id) {
    $state['cities'][$cityId][$id] = round($price, 2);
    if ($packArea !== null && $packArea > 0) {
      $state['packArea'][$id] = round($packArea, 4);
    }
    $changedAt[$id] = px_touch_changed($state, $cityId, $id, $now);
  }
  px_save($storeFile, $state);
  px_json([
    'updated' => count($ids),
    'cityId' => $cityId,
    'citySlug' => null,
    'local' => true,
    'changedAt' => $changedAt,
    'updatedAt' => $now,
  ]);
}

// Single product price
if ($method === 'PATCH' && preg_match('#^products/([^/]+)/price$#', $path, $m)) {
  px_auth($upstream);
  $productId = rawurldecode($m[1]);
  $price = isset($body['price']) ? (float) $body['price'] : -1;
  $cityId = isset($body['cityId']) ? trim((string) $body['cityId']) : '';
  $packArea = array_key_exists('packArea', $body) && $body['packArea'] !== null && $body['packArea'] !== ''
    ? (float) $body['packArea']
    : null;

  if ($productId === '') {
    px_json(['error' => 'Товар не найден'], 400);
  }
  if ($cityId === '') {
    px_json(['error' => 'Город не найден'], 400);
  }
  if (!is_finite($price) || $price < 0) {
    px_json(['error' => 'Некорректная цена'], 400);
  }

  $state = px_load($storeFile);
  if (!isset($state['cities'][$cityId]) || !is_array($state['cities'][$cityId])) {
    $state['cities'][$cityId] = [];
  }
  $state['cities'][$cityId][$productId] = round($price, 2);
  if ($packArea !== null && $packArea > 0) {
    $state['packArea'][$productId] = round($packArea, 4);
  }
  $changedAt = px_touch_changed($state, $cityId, $productId);
  px_save($storeFile, $state);
  px_json([
    'id' => $productId,
    'price' => round($price, 2),
    'packArea' => $packArea,
    'cityId' => $cityId,
    'cityPrice' => round($price, 2),
    'local' => true,
    'changedAt' => $changedAt,
    'updatedAt' => $changedAt,
  ]);
}

px_json(['error' => 'Маршрут цен не найден'], 404);
