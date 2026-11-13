<?php
/* ITM Actualités — fonctions du thème */
if (!defined('ABSPATH')) exit;

/* Adresse du site principal (menu, styles, images). À changer lors du passage sur le vrai domaine. */
if (!defined('ITM_MAIN')) define('ITM_MAIN', 'https://itmdigitalcommunication.com');
if (!defined('ITM_ASSETS_VER')) define('ITM_ASSETS_VER', '2026-11-13e');
function itm_main($path = '/') { return rtrim(ITM_MAIN, '/') . $path; }

add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form','gallery','caption','style','script']);
    add_theme_support('responsive-embeds');
    add_theme_support('align-wide');
    add_image_size('itm-card', 800, 500, true);
});

/* Feuilles de style et scripts : on réutilise ceux du site principal */
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('itm-fonts', 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;800;900&family=Manrope:wght@400;500;600;700&display=swap', [], null);
    wp_enqueue_style('itm-site', itm_main('/assets/style.css'), [], ITM_ASSETS_VER);
    wp_enqueue_style('itm-actualites', get_stylesheet_uri(), ['itm-site'], wp_get_theme()->get('Version'));
    wp_enqueue_script('itm-site', itm_main('/assets/site.js'), [], ITM_ASSETS_VER, true);
});

/* Mise en place (une seule fois) : catégories, liens propres, article d'exemple retiré */
function itm_setup() {
    foreach (['Politique','Société','Économie','Éducation','Finance','Sport','Géopolitique'] as $c) {
        if (!term_exists($c, 'category')) wp_insert_term($c, 'category');
    }
    $hello = get_page_by_path('hello-world', OBJECT, 'post');
    if ($hello && $hello->post_date === $hello->post_modified) wp_trash_post($hello->ID);
    $default = get_term((int) get_option('default_category'), 'category');
    if ($default && !is_wp_error($default) && in_array($default->slug, ['uncategorized','non-classe','blog'], true)) {
        wp_update_term($default->term_id, 'category', ['name' => 'Actualité', 'slug' => 'actualite']);
    }
    update_option('posts_per_page', 10);
    update_option('permalink_structure', '/%postname%/');
    update_option('itm_setup_version', 1);
    flush_rewrite_rules();
}
add_action('after_switch_theme', 'itm_setup');
add_action('init', function () { if ((int) get_option('itm_setup_version') < 1) itm_setup(); }, 20);

add_filter('excerpt_length', fn() => 26);
add_filter('excerpt_more', fn() => '…');

/* Aperçu des liens partagés (WhatsApp, Facebook, X) */
add_action('wp_head', function () {
    $site = 'ITM Digital Communication';
    if (is_singular()) {
        $p = get_queried_object();
        $title = get_the_title($p);
        $desc = has_excerpt($p) ? get_the_excerpt($p) : wp_trim_words(wp_strip_all_tags($p->post_content), 30, '…');
        $url = get_permalink($p);
        $img = get_the_post_thumbnail_url($p, 'large');
        $type = 'article';
    } else {
        $title = is_category() ? single_cat_title('', false) . ' · Actualités' : 'Actualités';
        $desc = 'Politique, société, économie, éducation, finance, sport et géopolitique : l\'actualité décryptée par ITM Digital Communication.';
        $url = is_category() ? get_category_link(get_queried_object_id()) : home_url('/');
        $img = '';
        $type = 'website';
    }
    if (!$img) $img = itm_main('/assets/itm-logo.png');
    echo "\n<meta name=\"description\" content=\"" . esc_attr($desc) . "\">\n";
    echo '<meta property="og:site_name" content="' . esc_attr($site) . "\">\n";
    echo '<meta property="og:type" content="' . $type . "\">\n";
    echo '<meta property="og:title" content="' . esc_attr($title) . "\">\n";
    echo '<meta property="og:description" content="' . esc_attr($desc) . "\">\n";
    echo '<meta property="og:url" content="' . esc_url($url) . "\">\n";
    echo '<meta property="og:image" content="' . esc_url($img) . "\">\n";
    echo '<meta property="og:locale" content="fr_FR">' . "\n";
    echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
    echo '<meta name="theme-color" content="#071233">' . "\n";
    echo '<link rel="icon" type="image/png" href="' . esc_url(itm_main('/assets/favicon.png')) . '">' . "\n";
}, 1);

/* Catégorie principale d'un article */
function itm_cat($post_id = null) {
    $cats = get_the_category($post_id);
    return $cats ? $cats[0] : null;
}

/* Carte d'article */
function itm_card($feature = false) {
    $cat = itm_cat();
    $tag = $feature ? 'h2' : 'h3'; ?>
    <a class="news-card<?php echo $feature ? ' feature' : ''; ?>" href="<?php the_permalink(); ?>">
      <div class="thumb">
        <?php if (has_post_thumbnail()) { the_post_thumbnail($feature ? 'large' : 'itm-card', ['loading' => 'lazy', 'alt' => esc_attr(get_the_title())]); }
        else { echo '<span class="noimg"><img src="' . esc_url(itm_main('/assets/itm-icon.png')) . '" alt=""></span>'; } ?>
      </div>
      <div class="nb">
        <div class="news-meta"><?php if ($cat) echo '<span class="cat">' . esc_html($cat->name) . '</span>'; ?><span><?php echo get_the_date('j F Y'); ?></span></div>
        <<?php echo $tag; ?>><?php the_title(); ?></<?php echo $tag; ?>>
        <p><?php echo esc_html(get_the_excerpt()); ?></p>
      </div>
    </a>
<?php }


/* ================= Sécurité ================= */
/* XML-RPC : actif uniquement pour l'application mobile WordPress.
   Les « pingbacks » (utilisés pour les attaques) sont retirés,
   et la limite de 5 essais de connexion s'applique aussi à l'application. */
add_filter('xmlrpc_methods', function ($m) {
    unset($m['pingback.ping'], $m['pingback.extensions.getPingbacks']);
    return $m;
});
add_filter('wp_headers', function ($h) { unset($h['X-Pingback']); return $h; });
/* Version de WordPress masquée */
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');
remove_action('wp_head', 'rsd_link');
remove_action('wp_head', 'wlwmanifest_link');
/* Pas de liste des comptes pour les visiteurs non connectés */
add_filter('rest_endpoints', function ($e) {
    if (!is_user_logged_in()) { unset($e['/wp/v2/users'], $e['/wp/v2/users/(?P<id>[\\d]+)']); }
    return $e;
});
add_action('template_redirect', function () {
    if (is_author() || isset($_GET['author'])) { wp_safe_redirect(home_url('/'), 301); exit; }
});
/* Message d'erreur de connexion neutre */
add_filter('login_errors', function () { return 'Identifiant ou mot de passe incorrect.'; });
/* Limite des tentatives de connexion : 5 essais, puis blocage de 20 minutes par adresse IP */
function itm_login_key() { return 'itm_login_' . md5($_SERVER['REMOTE_ADDR'] ?? 'x'); }
add_filter('authenticate', function ($user) {
    if ((int) get_transient(itm_login_key()) >= 5) {
        return new WP_Error('itm_locked', 'Trop de tentatives. Réessayez dans 20 minutes.');
    }
    return $user;
}, 30);
add_action('wp_login_failed', function () {
    $k = itm_login_key(); set_transient($k, (int) get_transient($k) + 1, 20 * MINUTE_IN_SECONDS);
});
add_action('wp_login', function () { delete_transient(itm_login_key()); });
/* En-têtes de sécurité */
add_action('send_headers', function () {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Strict-Transport-Security: max-age=31536000');
});
/* Pas de modification de fichiers depuis l'administration */
if (!defined('DISALLOW_FILE_EDIT')) define('DISALLOW_FILE_EDIT', true);
