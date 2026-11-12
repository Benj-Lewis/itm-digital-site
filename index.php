<?php get_header();
$is_cat = is_category();
$title = $is_cat ? single_cat_title('', false) : 'L\'actualité en <span class="grad-text">temps réel</span>';
?>
<section class="page-head"><div class="wrap">
  <nav class="crumbs" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span>/</span><?php if ($is_cat): ?><a href="<?php echo esc_url(home_url('/')); ?>">Actualités</a><span>/</span><span><?php single_cat_title(); ?></span><?php else: ?><span>Actualités</span><?php endif; ?></nav>
  <p class="eyebrow" style="margin-top:22px">Actualités</p>
  <h1><?php echo $title; ?></h1>
  <p class="lead"><?php echo $is_cat && category_description() ? wp_strip_all_tags(category_description()) : 'Politique, société, économie, éducation, finance, sport et géopolitique : l\'information décryptée par notre équipe.'; ?></p>
</div></section>
<section class="sec"><div class="wrap">
  <nav class="news-cats" aria-label="Catégories">
    <a class="chip<?php echo !$is_cat ? ' on' : ''; ?>" href="<?php echo esc_url(home_url('/')); ?>">Tout</a>
    <?php foreach (get_categories(['hide_empty' => false, 'exclude' => [get_option('default_category')]]) as $c): ?>
      <a class="chip<?php echo ($is_cat && get_queried_object_id() == $c->term_id) ? ' on' : ''; ?>" href="<?php echo esc_url(get_category_link($c)); ?>"><?php echo esc_html($c->name); ?></a>
    <?php endforeach; ?>
  </nav>
  <?php if (have_posts()): $i = 0; ?>
    <div class="news-grid">
      <?php while (have_posts()): the_post(); itm_card($i === 0 && !is_paged()); $i++; endwhile; ?>
    </div>
    <div class="pager"><?php echo paginate_links(['prev_text' => '‹', 'next_text' => '›']); ?></div>
  <?php else: ?>
    <div class="empty"><span class="eyebrow">Bientôt en ligne</span><h3>Nos premiers articles arrivent</h3><p>En attendant, suivez toute notre actualité sur notre page Facebook.</p>
    <div class="ctas" style="margin-top:4px"><a class="btn btn-grad" href="https://www.facebook.com/benjmansambu1" target="_blank" rel="noopener">Suivre sur Facebook</a></div></div>
  <?php endif; ?>
</div></section>
<?php get_footer();
