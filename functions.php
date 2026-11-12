<?php
/* ITM Actualités — fonctions du thème */
if (!defined('ABSPATH')) exit;

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
    $root = '//' . parse_url(home_url(), PHP_URL_HOST);
    wp_enqueue_style('itm-site', $root . '/assets/style.css', [], '1');
    wp_enqueue_style('itm-actualites', get_stylesheet_uri(), ['itm-site'], wp_get_theme()->get('Version'));
    wp_enqueue_script('itm-site', $root . '/assets/site.js', [], '1', true);
});

/* Catégories créées à l'activation du thème */
add_action('after_switch_theme', function () {
    foreach (['Politique','Société','Économie','Éducation','Finance','Sport','Géopolitique'] as $c) {
        if (!term_exists($c, 'category')) wp_insert_term($c, 'category');
    }
    update_option('posts_per_page', 10);
    update_option('permalink_structure', '/%postname%/');
    flush_rewrite_rules();
});

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
    if (!$img) $img = home_url('/../assets/itm-logo.png');
    $img = preg_replace('#/actualites/\.\./#', '/', $img);
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
    echo '<link rel="icon" type="image/png" href="/assets/favicon.png">' . "\n";
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
        else { echo '<span class="noimg"><img src="/assets/itm-icon.png" alt=""></span>'; } ?>
      </div>
      <div class="nb">
        <div class="news-meta"><?php if ($cat) echo '<span class="cat">' . esc_html($cat->name) . '</span>'; ?><span><?php echo get_the_date('j F Y'); ?></span></div>
        <<?php echo $tag; ?>><?php the_title(); ?></<?php echo $tag; ?>>
        <p><?php echo esc_html(get_the_excerpt()); ?></p>
      </div>
    </a>
<?php }
