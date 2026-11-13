<?php
/* Clé publique que le navigateur utilise pour s'abonner */
require __DIR__ . '/lib.php';
try { itm_json(200, ['publicKey' => itm_keys()['public']]); }
catch (Throwable $e) { itm_json(500, ['error' => 'indisponible']); }
