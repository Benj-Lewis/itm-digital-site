<?php if (!defined('ABSPATH')) exit; ?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<header class="top"><div class="wrap">
  <a class="brand" href="<?php echo esc_url(itm_main('/')); ?>" aria-label="ITM Digital Communication, accueil"><img src="<?php echo esc_url(itm_main('/assets/itm-icon.png')); ?>" alt="" width="40" height="40"><span><b>ITM DIGITAL</b><small>COMMUNICATION</small></span></a>
  <button class="burger" id="burger" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="nav"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
  <nav class="nav" id="nav" aria-label="Navigation principale"><a href="<?php echo esc_url(itm_main('/')); ?>">Accueil</a><a href="<?php echo esc_url(itm_main('/a-propos/')); ?>">L'agence</a><a href="<?php echo esc_url(itm_main('/services-presence-en-ligne/')); ?>">Services</a><a href="<?php echo esc_url(itm_main('/tarification-services/')); ?>">Tarifs</a><a href="<?php echo esc_url(itm_main('/portfolio-galerie/')); ?>">Réalisations</a><a href="<?php echo esc_url(itm_main('/clients-et-partenaires-agence-de-communication/')); ?>">Clients</a><a href="<?php echo esc_url(itm_main('/formations/')); ?>">Formations</a><a href="<?php echo esc_url(home_url('/')); ?>" aria-current="page">Actualités</a><a class="btn btn-grad btn-sm" href="<?php echo esc_url(itm_main('/contact/')); ?>">Démarrer un projet</a></nav>
</div></header>
<main>
