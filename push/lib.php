<?php
/* ITM Digital Communication : notifications des nouveaux articles (Web Push).
   Aucune configuration : les clés de sécurité (VAPID) sont créées au premier usage
   et rangées hors du dossier public, avec la liste des abonnés. */
declare(strict_types=1);

const ITM_ORIGIN  = 'https://itmdigitalcommunication.com';
const ITM_WP      = 'https://actualites.itmdigitalcommunication.com';
const ITM_SUBJECT = 'mailto:contact@itmdigitalcommunication.com';
const ITM_MAX_SUBS = 200000;

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'lib.php') { http_response_code(404); exit; }

function itm_wp(): string { return getenv('ITM_WP_URL') ?: ITM_WP; }

function b64u(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }

/* Dossier de données : hors de public_html (pour survivre aux mises à jour du site) */
function itm_dir(): string {
  static $dir = null;
  if ($dir !== null) return $dir;
  $candidates = array_filter([getenv('ITM_PUSH_DATA') ?: null, dirname(__DIR__, 2) . '/itm-push-data', __DIR__ . '/data']);
  foreach ($candidates as $c) {
    if ((is_dir($c) || @mkdir($c, 0700, true)) && is_writable($c)) {
      if (str_starts_with($c, __DIR__) && !is_file("$c/.htaccess")) @file_put_contents("$c/.htaccess", "Require all denied\n");
      return $dir = $c;
    }
  }
  throw new RuntimeException('no writable data dir');
}

function itm_lock(string $name, callable $fn, bool $wait = true) {
  $h = fopen(itm_dir() . "/.$name.lock", 'c');
  if (!flock($h, $wait ? LOCK_EX : LOCK_EX | LOCK_NB)) { fclose($h); return null; }
  try { return $fn(); } finally { flock($h, LOCK_UN); fclose($h); }
}
function itm_read(string $name, $default) {
  $f = itm_dir() . "/$name.json";
  if (!is_file($f)) return $default;
  $v = json_decode((string) file_get_contents($f), true);
  return $v ?? $default;
}
function itm_write(string $name, $value): void {
  $f = itm_dir() . "/$name.json";
  file_put_contents("$f.tmp", json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), LOCK_EX);
  @chmod("$f.tmp", 0600);
  rename("$f.tmp", $f);
}

/* Clés VAPID (créées une seule fois) */
function itm_keys(): array {
  return itm_lock('vapid', function () {
    $k = itm_read('vapid', null);
    if (is_array($k) && !empty($k['pem']) && !empty($k['public'])) return $k;
    $key = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
    openssl_pkey_export($key, $pem);
    $ec = openssl_pkey_get_details($key)['ec'];
    $pub = "\x04" . str_pad($ec['x'], 32, "\0", STR_PAD_LEFT) . str_pad($ec['y'], 32, "\0", STR_PAD_LEFT);
    $k = ['pem' => $pem, 'public' => b64u($pub), 'created' => gmdate('c')];
    itm_write('vapid', $k);
    return $k;
  });
}

/* Signature ECDSA : format DER -> format brut r||s (64 octets) attendu par JWT */
function itm_der2raw(string $der): string {
  $o = 2;
  if (ord($der[1]) & 0x80) $o += ord($der[1]) & 0x7f;
  $out = '';
  for ($i = 0; $i < 2; $i++) {
    $len = ord($der[$o + 1]);
    $v = ltrim(substr($der, $o + 2, $len), "\0");
    $out .= str_pad($v, 32, "\0", STR_PAD_LEFT);
    $o += 2 + $len;
  }
  return $out;
}

function itm_vapid_header(string $endpoint, array $keys): string {
  $p = parse_url($endpoint);
  $aud = $p['scheme'] . '://' . $p['host'] . (isset($p['port']) ? ':' . $p['port'] : '');
  $h = b64u(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
  $c = b64u(json_encode(['aud' => $aud, 'exp' => time() + 12 * 3600, 'sub' => ITM_SUBJECT], JSON_UNESCAPED_SLASHES));
  openssl_sign("$h.$c", $der, $keys['pem'], OPENSSL_ALGO_SHA256);
  return "vapid t=$h.$c." . b64u(itm_der2raw($der)) . ", k={$keys['public']}";
}

/* Seuls les vrais services de notification sont acceptés (Google, Mozilla, Apple, Microsoft) */
function itm_valid_endpoint($url): bool {
  if (!is_string($url) || strlen($url) > 1024) return false;
  $p = parse_url($url);
  if (!$p || ($p['scheme'] ?? '') !== 'https' || empty($p['host'])) return false;
  $host = strtolower($p['host']);
  $test = getenv('ITM_PUSH_TEST_HOST');
  if ($test && $host === $test) return true;
  if (in_array($host, ['fcm.googleapis.com', 'android.googleapis.com', 'updates.push.services.mozilla.com', 'push.services.mozilla.com'], true)) return true;
  foreach (['.push.apple.com', '.notify.windows.com'] as $suffix) if (str_ends_with($host, $suffix)) return true;
  return false;
}

/* Envoi d'un signal (sans contenu) à chaque abonné. L'app va ensuite chercher le dernier article.
   Renvoie [nombre envoyés, liste des abonnements expirés]. */
function itm_send_all(array $endpoints, array $keys): array {
  $sent = 0; $gone = [];
  $verify = !getenv('ITM_PUSH_TEST_HOST');
  foreach (array_chunk($endpoints, 50) as $chunk) {
    $mh = curl_multi_init(); $hs = [];
    foreach ($chunk as $e) {
      $ch = curl_init($e);
      curl_setopt_array($ch, [
        CURLOPT_POST => true, CURLOPT_POSTFIELDS => '', CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20, CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_SSL_VERIFYPEER => $verify, CURLOPT_SSL_VERIFYHOST => $verify ? 2 : 0,
        CURLOPT_HTTPHEADER => ['Authorization: ' . itm_vapid_header($e, $keys), 'TTL: 172800', 'Urgency: high', 'Topic: nouvel-article', 'Content-Length: 0'],
      ]);
      curl_multi_add_handle($mh, $ch); $hs[$e] = $ch;
    }
    do { $st = curl_multi_exec($mh, $running); if ($running) curl_multi_select($mh, 1.0); } while ($running && $st === CURLM_OK);
    foreach ($hs as $e => $ch) {
      $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
      if ($code >= 200 && $code < 300) $sent++;
      elseif ($code === 404 || $code === 410) $gone[] = $e;
      curl_multi_remove_handle($mh, $ch); curl_close($ch);
    }
    curl_multi_close($mh);
  }
  return [$sent, $gone];
}

function itm_json(int $code, array $data): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}
