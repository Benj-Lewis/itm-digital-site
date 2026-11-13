<?php
/* Abonnement / désabonnement aux nouveaux articles.
   On enregistre uniquement l'adresse technique fournie par le navigateur (aucun nom, e-mail ni numéro). */
require __DIR__ . '/lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); itm_json(405, ['error' => 'POST uniquement']); exit; }
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = [ITM_ORIGIN, 'https://www.itmdigitalcommunication.com'];
if (getenv('ITM_PUSH_TEST_HOST')) $allowed[] = $origin;
if ($origin !== '' && !in_array($origin, $allowed, true)) { itm_json(403, ['error' => 'origine refusée']); exit; }

$raw = file_get_contents('php://input', false, null, 0, 4096);
$in = json_decode((string) $raw, true);
$action = $in['action'] ?? 'subscribe';
$endpoint = $in['endpoint'] ?? null;
if (!itm_valid_endpoint($endpoint) || !in_array($action, ['subscribe', 'unsubscribe'], true)) { itm_json(400, ['error' => 'demande invalide']); exit; }

try {
  $result = itm_lock('subs', function () use ($action, $endpoint) {
    $subs = itm_read('subs', []);
    $id = hash('sha256', $endpoint);
    if ($action === 'unsubscribe') { unset($subs[$id]); itm_write('subs', $subs); return 'désabonné'; }
    if (!isset($subs[$id]) && count($subs) >= ITM_MAX_SUBS) return null;
    $subs[$id] = ['e' => $endpoint, 't' => $subs[$id]['t'] ?? time(), 'seen' => time()];
    itm_write('subs', $subs);
    return 'abonné';
  });
  if ($result === null) itm_json(503, ['error' => 'liste pleine']);
  else itm_json(200, ['ok' => true, 'status' => $result]);
} catch (Throwable $e) { itm_json(500, ['error' => 'indisponible']); }
