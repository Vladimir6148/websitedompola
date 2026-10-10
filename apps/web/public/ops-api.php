<?php
/**
 * Local ops API (calendar / turnover / schedule) on Reg.ru.
 * Used while Render lags behind; auth is verified via upstream /api/auth/me.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$upstream = getenv('DOMPOLA_API_UPSTREAM') ?: 'https://dompola-api.onrender.com';
$dataDir = getenv('DOMPOLA_OPS_DATA') ?: (dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'dompola-ops-data');
$storeFile = $dataDir . DIRECTORY_SEPARATOR . 'ops.json';

$DEFAULT_EMPLOYEES = ['Дмитрий', 'Денис', 'Владимир', 'Даниил', 'Анастасия', 'Галина'];

function ops_json($data, int $code = 200): void {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function ops_request_header(string $name): string {
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

function ops_auth(string $upstream): array {
  $auth = ops_request_header('Authorization');
  if ($auth === '') {
    $auth = ops_request_header('X-Dompola-Authorization');
  }
  if ($auth === '') {
    $token = ops_request_header('X-Dompola-Token');
    if ($token !== '') {
      $auth = stripos($token, 'Bearer ') === 0 ? $token : ('Bearer ' . $token);
    }
  }
  if ($auth === '') {
    ops_json(['error' => 'Требуется авторизация'], 401);
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
    ops_json(['error' => 'Сессия недействительна'], 401);
  }
  $user = json_decode($raw, true);
  if (!is_array($user) || empty($user['role'])) {
    ops_json(['error' => 'Сессия недействительна'], 401);
  }
  $role = strtoupper((string) $user['role']);
  if (!in_array($role, ['ADMIN', 'MANAGER'], true)) {
    ops_json(['error' => 'Недостаточно прав'], 403);
  }
  return $user;
}

function ops_new_id(string $prefix = 'ops'): string {
  try {
    return $prefix . '_' . bin2hex(random_bytes(8));
  } catch (Throwable $e) {
    return $prefix . '_' . uniqid('', true);
  }
}

function ops_day(string $raw): string {
  $s = substr(trim($raw), 0, 10);
  if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $s)) {
    ops_json(['error' => 'Некорректная дата'], 400);
  }
  return $s;
}

function ops_load(string $file, array $defaultEmployees): array {
  $dir = dirname($file);
  if (!is_dir($dir)) {
    @mkdir($dir, 0755, true);
  }
  if (!is_file($file)) {
    $employees = [];
    foreach ($defaultEmployees as $i => $name) {
      $employees[] = [
        'id' => ops_new_id('emp'),
        'name' => $name,
        'sortOrder' => $i,
        'active' => true,
      ];
    }
    $state = [
      'events' => [],
      'turnovers' => [],
      'employees' => $employees,
      'shifts' => [],
    ];
    ops_save($file, $state);
    return $state;
  }
  $raw = file_get_contents($file);
  $data = json_decode($raw ?: '', true);
  if (!is_array($data)) {
    $data = [];
  }
  $data['events'] = isset($data['events']) && is_array($data['events']) ? $data['events'] : [];
  $data['turnovers'] = isset($data['turnovers']) && is_array($data['turnovers']) ? $data['turnovers'] : [];
  $data['employees'] = isset($data['employees']) && is_array($data['employees']) ? $data['employees'] : [];
  $data['shifts'] = isset($data['shifts']) && is_array($data['shifts']) ? $data['shifts'] : [];
  if (count($data['employees']) === 0) {
    foreach ($defaultEmployees as $i => $name) {
      $data['employees'][] = [
        'id' => ops_new_id('emp'),
        'name' => $name,
        'sortOrder' => $i,
        'active' => true,
      ];
    }
    ops_save($file, $data);
  }
  return $data;
}

function ops_save(string $file, array $state): void {
  $dir = dirname($file);
  if (!is_dir($dir)) {
    @mkdir($dir, 0755, true);
  }
  $tmp = $file . '.tmp';
  $json = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
  if ($json === false || file_put_contents($tmp, $json) === false) {
    ops_json(['error' => 'Не удалось сохранить данные'], 500);
  }
  if (!@rename($tmp, $file)) {
    @unlink($file);
    if (!@rename($tmp, $file)) {
      ops_json(['error' => 'Не удалось сохранить данные'], 500);
    }
  }
}

function ops_stores(): array {
  $path = __DIR__ . '/data/stores.json';
  if (!is_file($path)) {
    return [];
  }
  $rows = json_decode((string) file_get_contents($path), true);
  if (!is_array($rows)) {
    return [];
  }
  $out = [];
  foreach ($rows as $s) {
    if (!is_array($s) || empty($s['id']) || (isset($s['active']) && !$s['active'])) {
      continue;
    }
    $out[] = [
      'id' => (string) $s['id'],
      'name' => (string) ($s['name'] ?? ''),
      'city' => (string) (($s['city']['name'] ?? '') ?: ''),
    ];
  }
  usort($out, static fn($a, $b) => strcmp($a['name'], $b['name']));
  return $out;
}

function ops_in_month(string $ymd, int $year, int $month): bool {
  return (int) substr($ymd, 0, 4) === $year && (int) substr($ymd, 5, 2) === $month;
}

ops_auth($upstream);

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$path = isset($_GET['__path']) ? (string) $_GET['__path'] : '';
$path = trim(str_replace(['..', "\0"], '', $path), '/');
// Accept both "ops/dashboard" and bare "dashboard" if included specially.
if (strpos($path, 'ops/') === 0) {
  $path = substr($path, 4);
} elseif ($path === 'ops') {
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

$state = ops_load($storeFile, $DEFAULT_EMPLOYEES);
$stores = ops_stores();
$storeById = [];
foreach ($stores as $s) {
  $storeById[$s['id']] = $s;
}

if ($method === 'GET' && ($path === 'dashboard' || $path === '')) {
  $nowY = (int) gmdate('Y');
  $nowM = (int) gmdate('n');
  $year = isset($_GET['year']) ? (int) $_GET['year'] : $nowY;
  $month = isset($_GET['month']) ? (int) $_GET['month'] : $nowM;
  if ($year < 2000 || $year > 2100) {
    $year = $nowY;
  }
  if ($month < 1 || $month > 12) {
    $month = $nowM;
  }

  $events = array_values(array_filter(
    $state['events'],
    static fn($e) => is_array($e) && ops_in_month((string) ($e['date'] ?? ''), $year, $month),
  ));
  usort($events, static fn($a, $b) => strcmp((string) $a['date'], (string) $b['date']));

  $turnovers = [];
  foreach ($state['turnovers'] as $t) {
    if (!is_array($t) || !ops_in_month((string) ($t['date'] ?? ''), $year, $month)) {
      continue;
    }
    $sid = (string) ($t['storeId'] ?? '');
    $store = $storeById[$sid] ?? ['id' => $sid, 'name' => 'Магазин', 'city' => ''];
    $turnovers[] = [
      'id' => (string) $t['id'],
      'storeId' => $sid,
      'date' => (string) $t['date'],
      'amount' => (float) ($t['amount'] ?? 0),
      'note' => $t['note'] ?? null,
      'store' => [
        'name' => $store['name'],
        'city' => ['name' => $store['city']],
      ],
    ];
  }
  usort($turnovers, static fn($a, $b) => strcmp($a['date'], $b['date']));

  $byStore = [];
  foreach ($stores as $s) {
    $byStore[$s['id']] = [
      'storeId' => $s['id'],
      'name' => $s['name'],
      'city' => $s['city'],
      'total' => 0.0,
    ];
  }
  foreach ($turnovers as $t) {
    if (!isset($byStore[$t['storeId']])) {
      $byStore[$t['storeId']] = [
        'storeId' => $t['storeId'],
        'name' => (string) ($t['store']['name'] ?? 'Магазин'),
        'city' => (string) ($t['store']['city']['name'] ?? ''),
        'total' => 0.0,
      ];
    }
    $byStore[$t['storeId']]['total'] += (float) $t['amount'];
  }
  $storeTotals = array_values($byStore);
  usort($storeTotals, static fn($a, $b) => $b['total'] <=> $a['total']);
  $monthTotal = array_reduce($storeTotals, static fn($s, $x) => $s + $x['total'], 0.0);

  $employees = array_values(array_filter(
    $state['employees'],
    static fn($e) => is_array($e) && (!isset($e['active']) || $e['active']),
  ));
  usort($employees, static fn($a, $b) => ((int) ($a['sortOrder'] ?? 0)) <=> ((int) ($b['sortOrder'] ?? 0)));

  $shifts = [];
  foreach ($state['shifts'] as $sh) {
    if (!is_array($sh) || !ops_in_month((string) ($sh['date'] ?? ''), $year, $month)) {
      continue;
    }
    $shifts[] = [
      'id' => (string) $sh['id'],
      'employeeId' => (string) $sh['employeeId'],
      'date' => (string) $sh['date'],
    ];
  }

  ops_json([
    'year' => $year,
    'month' => $month,
    'events' => $events,
    'turnovers' => $turnovers,
    'storeTotals' => $storeTotals,
    'monthTotal' => $monthTotal,
    'employees' => array_map(static fn($e) => [
      'id' => (string) $e['id'],
      'name' => (string) $e['name'],
      'sortOrder' => (int) ($e['sortOrder'] ?? 0),
    ], $employees),
    'shifts' => $shifts,
    'stores' => $stores,
  ]);
}

if ($method === 'POST' && $path === 'events') {
  $title = trim((string) ($body['title'] ?? ''));
  $date = ops_day((string) ($body['date'] ?? ''));
  $note = isset($body['note']) ? trim((string) $body['note']) : '';
  if ($title === '') {
    ops_json(['error' => 'Укажите название'], 400);
  }
  $event = [
    'id' => ops_new_id('evt'),
    'title' => $title,
    'date' => $date,
    'note' => $note !== '' ? $note : null,
  ];
  $state['events'][] = $event;
  ops_save($storeFile, $state);
  ops_json($event, 201);
}

if ($method === 'DELETE' && preg_match('#^events/([^/]+)$#', $path, $m)) {
  $id = $m[1];
  $state['events'] = array_values(array_filter(
    $state['events'],
    static fn($e) => !is_array($e) || (string) ($e['id'] ?? '') !== $id,
  ));
  ops_save($storeFile, $state);
  ops_json(['ok' => true]);
}

if ($method === 'POST' && $path === 'turnovers') {
  $storeId = trim((string) ($body['storeId'] ?? ''));
  $date = ops_day((string) ($body['date'] ?? ''));
  $amount = isset($body['amount']) ? (float) $body['amount'] : -1;
  $note = isset($body['note']) ? trim((string) $body['note']) : '';
  if ($storeId === '' || $amount < 0) {
    ops_json(['error' => 'Некорректные данные оборота'], 400);
  }
  $found = null;
  foreach ($state['turnovers'] as $i => $t) {
    if (is_array($t) && (string) ($t['storeId'] ?? '') === $storeId && (string) ($t['date'] ?? '') === $date) {
      $state['turnovers'][$i]['amount'] = $amount;
      $state['turnovers'][$i]['note'] = $note !== '' ? $note : null;
      $found = $state['turnovers'][$i];
      break;
    }
  }
  if ($found === null) {
    $found = [
      'id' => ops_new_id('trn'),
      'storeId' => $storeId,
      'date' => $date,
      'amount' => $amount,
      'note' => $note !== '' ? $note : null,
    ];
    $state['turnovers'][] = $found;
  }
  ops_save($storeFile, $state);
  $store = $storeById[$storeId] ?? ['name' => 'Магазин', 'city' => ''];
  $found['store'] = ['name' => $store['name'], 'city' => ['name' => $store['city']]];
  ops_json($found);
}

if ($method === 'DELETE' && preg_match('#^turnovers/([^/]+)$#', $path, $m)) {
  $id = $m[1];
  $state['turnovers'] = array_values(array_filter(
    $state['turnovers'],
    static fn($t) => !is_array($t) || (string) ($t['id'] ?? '') !== $id,
  ));
  ops_save($storeFile, $state);
  ops_json(['ok' => true]);
}

if ($method === 'POST' && $path === 'shifts/toggle') {
  $employeeId = trim((string) ($body['employeeId'] ?? ''));
  $date = ops_day((string) ($body['date'] ?? ''));
  if ($employeeId === '') {
    ops_json(['error' => 'Не указан сотрудник'], 400);
  }
  $idx = null;
  foreach ($state['shifts'] as $i => $sh) {
    if (is_array($sh) && (string) ($sh['employeeId'] ?? '') === $employeeId && (string) ($sh['date'] ?? '') === $date) {
      $idx = $i;
      break;
    }
  }
  if ($idx !== null) {
    array_splice($state['shifts'], $idx, 1);
    ops_save($storeFile, $state);
    ops_json(['work' => false, 'employeeId' => $employeeId, 'date' => $date]);
  }
  $state['shifts'][] = [
    'id' => ops_new_id('shf'),
    'employeeId' => $employeeId,
    'date' => $date,
  ];
  ops_save($storeFile, $state);
  ops_json(['work' => true, 'employeeId' => $employeeId, 'date' => $date]);
}

if ($method === 'POST' && $path === 'employees') {
  $name = trim((string) ($body['name'] ?? ''));
  if ($name === '') {
    ops_json(['error' => 'Укажите имя'], 400);
  }
  $max = 0;
  foreach ($state['employees'] as $e) {
    if (is_array($e)) {
      $max = max($max, (int) ($e['sortOrder'] ?? 0));
    }
  }
  $emp = [
    'id' => ops_new_id('emp'),
    'name' => $name,
    'sortOrder' => $max + 1,
    'active' => true,
  ];
  $state['employees'][] = $emp;
  ops_save($storeFile, $state);
  ops_json(['id' => $emp['id'], 'name' => $emp['name'], 'sortOrder' => $emp['sortOrder']], 201);
}

ops_json(['error' => 'Маршрут не найден', 'path' => $path], 404);
