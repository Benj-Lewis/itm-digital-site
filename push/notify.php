<?php
/* Vérifie s'il y a un nouvel article sur Actualités et, si oui, prévient tous les abonnés.
   Appelé automatiquement par les visites du site (et, si vous le souhaitez, par une tâche
   planifiée Hostinger). On peut l'appeler autant de fois qu'on veut : chaque article
   n'est annoncé qu'une seule fois, et la vérification a lieu au plus toutes les 2 minutes. */
require __DIR__ . '/lib.php';

const ITM_EVERY = 120;            /* secondes entre deux vérifications */
const ITM_MAX_AGE = 2 * 86400;    /* on n'annonce pas un article publié il y a plus de 48 h */

ignore_user_abort(true);
@set_time_limit(300);

try {
  $out = itm_lock('notify', function () {
    $state = itm_read('state', ['checked' => 0, 'notified' => []]);
    if (time() - (int) ($state['checked'] ?? 0) < ITM_EVERY) return ['status' => 'déjà vérifié récemment'];
    $state['checked'] = time();
    itm_write('state', $state);

    /* Répond tout de suite au visiteur, la suite continue sur le serveur */
    if (function_exists('fastcgi_finish_request') && PHP_SAPI !== 'cli') {
      itm_json(202, ['status' => 'vérification en cours']);
      fastcgi_finish_request();
    }

    $ch = curl_init(itm_wp() . '/wp-json/wp/v2/posts?per_page=1&_fields=id,date_gmt,link,title&nocache=' . time());
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_HTTPHEADER => ['Accept: application/json']]);
    $posts = json_decode((string) curl_exec($ch), true);
    curl_close($ch);
    $post = is_array($posts) ? ($posts[0] ?? null) : null;
    if (!is_array($post) || empty($post['id'])) return ['status' => 'actualités injoignables'];

    $id = (int) $post['id'];
    $notified = array_map('intval', $state['notified'] ?? []);
    if (in_array($id, $notified, true)) return ['status' => 'aucun nouvel article', 'article' => $id];

    $notified = array_slice(array_merge([$id], $notified), 0, 30);
    $age = time() - (int) strtotime(($post['date_gmt'] ?? '1970-01-01T00:00:00') . 'Z');
    if ($age > ITM_MAX_AGE) {
      $state['notified'] = $notified; itm_write('state', $state);
      return ['status' => 'article trop ancien, non annoncé', 'article' => $id];
    }

    $keys = itm_keys();
    $subs = itm_lock('subs', fn () => itm_read('subs', []));
    [$sent, $gone] = itm_send_all(array_column($subs, 'e'), $keys);
    if ($gone) itm_lock('subs', function () use ($gone) {
      $s = itm_read('subs', []);
      foreach ($gone as $e) unset($s[hash('sha256', $e)]);
      itm_write('subs', $s);
    });

    $state['notified'] = $notified;
    $state['last'] = ['article' => $id, 'title' => strip_tags($post['title']['rendered'] ?? ''), 'sent' => $sent, 'removed' => count($gone), 'at' => gmdate('c')];
    itm_write('state', $state);
    return ['status' => 'article annoncé', 'article' => $id, 'envoyés' => $sent, 'retirés' => count($gone)];
  }, false);
  if (!headers_sent()) itm_json(200, $out ?? ['status' => 'vérification déjà en cours']);
} catch (Throwable $e) {
  if (!headers_sent()) itm_json(500, ['error' => 'indisponible']);
}
