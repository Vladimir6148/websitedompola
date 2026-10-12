<?php
/**
 * Site leads / cart orders («Заявки») on Reg.ru JSON storage.
 * Public POST; admin GET/PATCH require auth via Render /auth/me.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$upstream = getenv('DOMPOLA_API_UPSTREAM') ?: 'https://dompola-api.onrender.com';
$dataDir = getenv('DOMPOLA_OPS_DATA') ?: (dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'dompola-ops-data');
$storeFile = $dataDir . DIRECTORY_SEPARATOR . 'leads.json';
$mailTo = getenv('DOMPOLA_MAIL_TO') ?: 'dompola29@mail.ru';
/** From must be a mailbox on the domain (Reg.ru). Override via DOMPOLA_MAIL_FROM. */
$mailFrom = getenv('DOMPOLA_MAIL_FROM') ?: 'info@dompola.com';
$mailFromName = getenv('DOMPOLA_MAIL_FROM_NAME') ?: 'ДомПола';

function ld_json($data, int $code = 200): void {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function ld_header(string $name): string {
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

function ld_auth(string $upstream): void {
  $auth = ld_header('Authorization');
  if ($auth === '') {
    $auth = ld_header('X-Dompola-Authorization');
  }
  if ($auth === '') {
    $token = ld_header('X-Dompola-Token');
    if ($token !== '') {
      $auth = stripos($token, 'Bearer ') === 0 ? $token : ('Bearer ' . $token);
    }
  }
  if ($auth === '') {
    ld_json(['error' => 'Требуется авторизация'], 401);
  }
  $ch = curl_init(rtrim($upstream, '/') . '/api/auth/me');
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Authorization: ' . $auth, 'Accept: application/json'],
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_TIMEOUT => 40,
  ]);
  $raw = curl_exec($ch);
  $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($raw === false || $status < 200 || $status >= 300) {
    ld_json(['error' => 'Сессия недействительна'], 401);
  }
  $user = json_decode($raw, true);
  if (!is_array($user) || empty($user['role'])) {
    ld_json(['error' => 'Сессия недействительна'], 401);
  }
  if (!in_array(strtoupper((string) $user['role']), ['ADMIN', 'MANAGER'], true)) {
    ld_json(['error' => 'Недостаточно прав'], 403);
  }
}

function ld_id(): string {
  try {
    return 'lead_' . bin2hex(random_bytes(8));
  } catch (Throwable $e) {
    return 'lead_' . uniqid('', true);
  }
}

function ld_load(string $file): array {
  $dir = dirname($file);
  if (!is_dir($dir)) {
    @mkdir($dir, 0755, true);
  }
  if (!is_file($file)) {
    file_put_contents($file, "[]\n");
    return [];
  }
  $data = json_decode((string) file_get_contents($file), true);
  return is_array($data) ? $data : [];
}

function ld_save(string $file, array $rows): void {
  $dir = dirname($file);
  if (!is_dir($dir)) {
    @mkdir($dir, 0755, true);
  }
  $tmp = $file . '.tmp';
  $json = json_encode(array_values($rows), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
  if ($json === false || file_put_contents($tmp, $json) === false) {
    ld_json(['error' => 'Не удалось сохранить'], 500);
  }
  if (!@rename($tmp, $file)) {
    @unlink($file);
    if (!@rename($tmp, $file)) {
      ld_json(['error' => 'Не удалось сохранить'], 500);
    }
  }
}

function ld_status($raw): string {
  $s = strtoupper(trim((string) $raw));
  $ok = ['NEW', 'IN_PROGRESS', 'CONTACTED', 'COMPLETED', 'CANCELLED'];
  return in_array($s, $ok, true) ? $s : 'NEW';
}

function ld_mail_encode_header(string $text): string {
  return '=?UTF-8?B?' . base64_encode($text) . '?=';
}

/** Notify shop email about a new lead/order. Failures are logged, never block the response. */
function ld_notify_email(array $row, string $to, string $from, string $fromName): void {
  if ($to === '' || $from === '') {
    return;
  }
  $isCart = (($row['source'] ?? '') === 'cart');
  $subject = $isCart
    ? 'Новый заказ с сайта ДомПола'
    : 'Новая заявка с сайта ДомПола';

  $when = '';
  try {
    $dt = new DateTimeImmutable((string) ($row['createdAt'] ?? 'now'));
    $dt = $dt->setTimezone(new DateTimeZone('Europe/Moscow'));
    $when = $dt->format('d.m.Y H:i');
  } catch (Throwable $e) {
    $when = (string) ($row['createdAt'] ?? '');
  }

  $lines = [
    $isCart ? 'Поступил новый заказ с сайта dompola.com' : 'Поступила новая заявка с сайта dompola.com',
    '',
    'Имя: ' . (string) ($row['name'] ?? ''),
    'Телефон: ' . (string) ($row['phone'] ?? ''),
    'Город: ' . (string) (($row['cityName'] ?? '') !== '' ? $row['cityName'] : '—'),
    'Источник: ' . ($isCart ? 'Корзина / заказ' : (string) ($row['source'] ?? 'site')),
    'Время: ' . $when . ' (МСК)',
    'ID: ' . (string) ($row['id'] ?? ''),
  ];
  $comment = trim((string) ($row['comment'] ?? ''));
  if ($comment !== '') {
    $lines[] = '';
    $lines[] = 'Детали:';
    $lines[] = $comment;
  }
  $lines[] = '';
  $lines[] = 'Открыть заявки: https://dompola.com/admin/leads';
  $body = implode("\n", $lines);

  $fromHeader = ld_mail_encode_header($fromName) . " <{$from}>";
  $headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: ' . $fromHeader,
    'Reply-To: ' . $from,
    'X-Mailer: DomPola-Leads',
  ];

  $ok = @mail(
    $to,
    ld_mail_encode_header($subject),
    $body,
    implode("\r\n", $headers),
    '-f' . $from,
  );
  if (!$ok) {
    error_log('DomPola leads mail failed to ' . $to);
  }
}

function ld_row(array $r): array {
  $cityId = trim((string) ($r['cityId'] ?? ''));
  $cityName = trim((string) ($r['cityName'] ?? ''));
  return [
    'id' => (string) ($r['id'] ?? ''),
    'name' => (string) ($r['name'] ?? ''),
    'phone' => (string) ($r['phone'] ?? ''),
    'comment' => isset($r['comment']) ? (string) $r['comment'] : null,
    'source' => isset($r['source']) ? (string) $r['source'] : null,
    'status' => ld_status($r['status'] ?? 'NEW'),
    'createdAt' => (string) ($r['createdAt'] ?? ''),
    'city' => $cityName !== '' || $cityId !== ''
      ? ['id' => $cityId, 'name' => $cityName !== '' ? $cityName : $cityId]
      : null,
  ];
}

/** Simple IP rate limit for public POST. */
function ld_rate_limit(): void {
  $ip = (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown');
  $ip = trim(explode(',', $ip)[0]);
  $dir = sys_get_temp_dir();
  $file = $dir . DIRECTORY_SEPARATOR . 'dompola_leads_rl_' . md5($ip) . '.json';
  $now = time();
  $window = 15 * 60;
  $limit = 10;
  $data = ['count' => 0, 'resetAt' => $now + $window];
  if (is_file($file)) {
    $prev = json_decode((string) file_get_contents($file), true);
    if (is_array($prev) && (int) ($prev['resetAt'] ?? 0) > $now) {
      $data = $prev;
    }
  }
  if ((int) $data['count'] >= $limit) {
    ld_json(['error' => 'Слишком много заявок. Попробуйте позже или позвоните нам.'], 429);
  }
  $data['count'] = (int) $data['count'] + 1;
  if (empty($data['resetAt']) || (int) $data['resetAt'] <= $now) {
    $data['resetAt'] = $now + $window;
  }
  @file_put_contents($file, json_encode($data));
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$path = isset($_GET['__path']) ? (string) $_GET['__path'] : '';
$path = trim(str_replace(['..', "\0"], '', $path), '/');
if (strpos($path, 'leads/') === 0) {
  $path = substr($path, strlen('leads/'));
} elseif ($path === 'leads') {
  $path = '';
}

$bodyRaw = file_get_contents('php://input');
$body = [];
if (is_string($bodyRaw) && $bodyRaw !== '') {
  $decoded = json_decode($bodyRaw, true);
  if (is_array($decoded)) {
    $body = $decoded;
  }
}

$rows = ld_load($storeFile);

if ($method === 'POST' && $path === '') {
  ld_rate_limit();
  $name = trim((string) ($body['name'] ?? ''));
  $phone = trim((string) ($body['phone'] ?? ''));
  if ($name === '' || mb_strlen($name) < 1) {
    ld_json(['error' => 'Укажите имя'], 400);
  }
  if ($phone === '' || mb_strlen($phone) < 5) {
    ld_json(['error' => 'Укажите телефон'], 400);
  }
  $now = gmdate('c');
  $row = [
    'id' => ld_id(),
    'name' => $name,
    'phone' => $phone,
    'comment' => isset($body['comment']) ? trim((string) $body['comment']) : null,
    'source' => isset($body['source']) ? trim((string) $body['source']) : 'site',
    'cityId' => trim((string) ($body['cityId'] ?? '')),
    'cityName' => trim((string) ($body['cityName'] ?? '')),
    'status' => 'NEW',
    'createdAt' => $now,
    'updatedAt' => $now,
  ];
  if ($row['comment'] === '') {
    $row['comment'] = null;
  }
  $rows[] = $row;
  ld_save($storeFile, $rows);
  try {
    ld_notify_email($row, $mailTo, $mailFrom, $mailFromName);
  } catch (Throwable $e) {
    error_log('DomPola leads mail exception: ' . $e->getMessage());
  }
  ld_json(['ok' => true, 'id' => $row['id']], 201);
}

// Admin routes
ld_auth($upstream);

if ($method === 'GET' && ($path === '' || $path === 'list')) {
  $statusFilter = isset($_GET['status']) ? ld_status($_GET['status']) : '';
  $out = array_map('ld_row', $rows);
  if ($statusFilter !== '' && isset($_GET['status'])) {
    $out = array_values(array_filter(
      $out,
      static fn($r) => ($r['status'] ?? '') === $statusFilter,
    ));
  }
  usort($out, static function ($a, $b) {
    return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
  });
  ld_json($out);
}

if ($method === 'PATCH' && preg_match('#^([^/]+)$#', $path, $m)) {
  $id = $m[1];
  $idx = null;
  foreach ($rows as $i => $r) {
    if ((string) ($r['id'] ?? '') === $id) {
      $idx = $i;
      break;
    }
  }
  if ($idx === null) {
    ld_json(['error' => 'Не найдено'], 404);
  }
  $row = $rows[$idx];
  if (array_key_exists('status', $body)) {
    $row['status'] = ld_status($body['status']);
  }
  if (array_key_exists('comment', $body)) {
    $c = $body['comment'];
    $row['comment'] = $c === null ? null : trim((string) $c);
  }
  $row['updatedAt'] = gmdate('c');
  $rows[$idx] = $row;
  ld_save($storeFile, $rows);
  ld_json(ld_row($row));
}

ld_json(['error' => 'Маршрут не найден', 'path' => $path], 404);
