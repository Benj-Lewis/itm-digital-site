# ITM Digital Communication — site internet

Site de l'agence ITM Digital Communication (Kinshasa) : itmdigitalcommunication.com

- Branche `main` : le site (pages HTML, styles, images), publié à la racine du domaine.
- Branche `wordpress-theme` : le thème WordPress « ITM Actualités », installé dans `actualites/wp-content/themes/itm-actualites`.
- La rubrique Actualités (`/actualites/`) est gérée par WordPress.

Déploiement automatique : chaque envoi sur `main` met le site à jour sur Hostinger.

## Application web et notifications

- Le site s'installe comme une application (PWA) : `manifest.webmanifest`, `sw.js`, icônes dans `assets/app/`.
- Notifications des nouveaux articles : dossier `push/` (PHP, sans configuration).
  - Les clés de sécurité et la liste des abonnés sont créées automatiquement dans `../itm-push-data/` (hors du dossier public, donc conservées lors des mises à jour).
  - Chaque visite du site lance une vérification (au plus toutes les 2 minutes) : dès qu'un nouvel article est publié sur Actualités, les abonnés sont prévenus une seule fois.
  - Pour une annonce plus rapide même sans visite, ajoutez dans hPanel › Avancé › Tâches Cron, toutes les 5 minutes :
    `curl -s -X POST https://itmdigitalcommunication.com/push/notify.php`
  - État du dernier envoi : ouvrir https://itmdigitalcommunication.com/push/notify.php
