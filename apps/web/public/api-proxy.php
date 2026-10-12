<?php
/**
 * Same-origin API proxy → Render (avoids browser CORS / Failed to fetch).
 */
declare(strict_types=1);

$upstream = getenv('DOMPOLA_API_UPSTREAM') ?: 'https://dompola-api.onrender.com';
$path = isset($_GET['__path']) ? (string) $_GET['__path'] : '';
$path = ltrim(str_replace(['..', "\0"], '', $path), '/');

// Ops (calendar / turnover / schedule) — local PHP while Render deploy lags.
if ($path === 'ops' || strpos($path, 'ops/') === 0) {
  require __DIR__ . '/ops-api.php';
  exit;
}

// Prospects CRM («Наработки»)
if ($path === 'prospects' || strpos($path, 'prospects/') === 0) {
  require __DIR__ . '/prospects-api.php';
  exit;
}

// Leads / cart orders («Заявки»)
if ($path === 'leads' || strpos($path, 'leads/') === 0) {
  require __DIR__ . '/leads-api.php';
  exit;
}

// Measurements («Замеры»)
if ($path === 'measurements' || strpos($path, 'measurements/') === 0) {
  require __DIR__ . '/measurements-api.php';
  exit;
}

// City prices (admin save + storefront map) — local JSON when Render lags
if (
  $path === 'products/prices'
  || $path === 'products/price-changes'
  || $path === 'products/bulk-prices'
  || preg_match('#^products/[^/]+/price$#', $path)
) {
  require __DIR__ . '/prices-api.php';
  exit;
}

$url = rtrim($upstream, '/') . '/api/' . $path;
if (!empty($_SERVER['QUERY_STRING'])) {
  $qs = preg_replace('/(?:^|&)__path=[^&]*/', '', $_SERVER['QUERY_STRING']);
  $qs = ltrim((string) $qs, '&');
  if ($qs !== '') {
    $url .= (strpos($url, '?') !== false ? '&' : '?') . $qs;
  }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$body = file_get_contents('php://input');
if ($body === false) {
  $body = '';
}

if ($method === 'OPTIONS') {
  header('Access-Control-Allow-Origin: ' . (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*'));
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept');
  http_response_code(204);
  exit;
}

/** Apache/nginx on shared hosting often strips Authorization before PHP. */
function request_header(string $name): string {
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
  if (!empty($_SERVER['CONTENT_TYPE']) && !isset($headers['content-type'])) {
    $headers['content-type'] = (string) $_SERVER['CONTENT_TYPE'];
  }
  // Common CGI redirects
  if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) && !isset($headers['authorization'])) {
    $headers['authorization'] = (string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
  }
  $key = strtolower($name);
  return isset($headers[$key]) ? trim($headers[$key]) : '';
}

$headers = [];
$contentType = request_header('Content-Type');
if ($contentType !== '') {
  $headers[] = 'Content-Type: ' . $contentType;
}
$accept = request_header('Accept');
if ($accept !== '') {
  $headers[] = 'Accept: ' . $accept;
}

$auth = request_header('Authorization');
if ($auth === '') {
  // Frontend also sends this — survives hosts that strip Authorization.
  $auth = request_header('X-Dompola-Authorization');
}
if ($auth === '') {
  $token = request_header('X-Dompola-Token');
  if ($token !== '') {
    $auth = stripos($token, 'Bearer ') === 0 ? $token : ('Bearer ' . $token);
  }
}
if ($auth !== '') {
  $headers[] = 'Authorization: ' . $auth;
}

if ($body !== '' && !preg_grep('/^Content-Type:/i', $headers)) {
  $headers[] = 'Content-Type: application/json';
}

$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_CUSTOMREQUEST => $method,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HEADER => true,
  CURLOPT_HTTPHEADER => $headers,
  CURLOPT_CONNECTTIMEOUT => 20,
  CURLOPT_TIMEOUT => 100,
  CURLOPT_FOLLOWLOCATION => false,
  CURLOPT_POSTFIELDS => in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true) ? $body : null,
]);

$raw = false;
$curlErr = '';
for ($try = 1; $try <= 2; $try++) {
  $raw = curl_exec($ch);
  if ($raw !== false) {
    break;
  }
  $curlErr = curl_error($ch);
  if ($try < 2) {
    usleep(400000);
  }
}
if ($raw === false) {
  http_response_code(502);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['error' => 'API недоступен: ' . $curlErr], JSON_UNESCAPED_UNICODE);
  exit;
}

$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$respHeaders = substr($raw, 0, $headerSize);
$respBody = substr($raw, $headerSize);

http_response_code($status > 0 ? $status : 502);
foreach (explode("\r\n", $respHeaders) as $line) {
  if ($line === '' || strpos(strtolower($line), 'http/') === 0) {
    continue;
  }
  $lower = strtolower($line);
  if (strpos($lower, 'transfer-encoding:') === 0) {
    continue;
  }
  if (strpos($lower, 'content-length:') === 0) {
    continue;
  }
  if (strpos($lower, 'access-control-') === 0) {
    continue;
  }
  header($line, false);
}
header('Content-Type: application/json; charset=utf-8');
echo $respBody;
