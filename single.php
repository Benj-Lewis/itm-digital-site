<?php get_header();
while (have_posts()): the_post();
  $cat = itm_cat();
  $url = get_permalink();
  $share_txt = get_the_title() . ' ' . $url; ?>
<section class="page-head article-head"><div class="wrap">
  <nav class="crumbs" aria-label="Fil d'Ariane"><a href="<?php echo esc_url(itm_main('/')); ?>">Accueil</a><span>/</span><a href="<?php echo esc_url(home_url('/')); ?>">Actualités</a><?php if ($cat): ?><span>/</span><a href="<?php echo esc_url(get_category_link($cat)); ?>"><?php echo esc_html($cat->name); ?></a><?php endif; ?></nav>
  <h1 style="margin-top:22px"><?php the_title(); ?></h1>
  <div class="news-meta"><?php if ($cat) echo '<span class="cat">' . esc_html($cat->name) . '</span>'; ?><span><?php echo get_the_date('j F Y'); ?></span><span>Par <?php the_author(); ?></span></div>
</div></section>
<?php if (has_post_thumbnail()): ?><div class="article-cover"><?php the_post_thumbnail('large', ['alt' => esc_attr(get_the_title())]); ?></div><?php endif; ?>
<article class="article-body"><?php the_content(); ?></article>
<div class="share"><div class="share-box">
  <span class="lbl">Partager cet article</span>
  <div class="share-btns">
    <a class="btn btn-wa btn-sm" href="https://wa.me/?text=<?php echo rawurlencode($share_txt); ?>" target="_blank" rel="noopener">WhatsApp</a>
    <a class="btn btn-fb btn-sm" href="https://www.facebook.com/sharer/sharer.php?u=<?php echo rawurlencode($url); ?>" target="_blank" rel="noopener">Facebook</a>
    <a class="btn btn-line btn-sm" href="https://x.com/intent/post?text=<?php echo rawurlencode($share_txt); ?>" target="_blank" rel="noopener">X</a>
    <button class="btn btn-line btn-sm" type="button" id="copy-link" data-url="<?php echo esc_url($url); ?>">Copier le lien</button>
    <span class="copied" id="copied" hidden>Lien copié</span>
  </div>
</div></div>
<?php
$rel = new WP_Query(['posts_per_page' => 3, 'post__not_in' => [get_the_ID()], 'cat' => $cat ? $cat->term_id : 0, 'ignore_sticky_posts' => true]);
if ($rel->have_posts()): ?>
<section class="sec"><div class="wrap">
  <div class="split-head"><div class="sec-head" style="margin-bottom:0"><p class="eyebrow">À lire aussi</p><h2>D'autres actualités</h2></div><a class="link" href="<?php echo esc_url(home_url('/')); ?>">Toutes les actualités ›</a></div>
  <div class="news-grid"><?php while ($rel->have_posts()): $rel->the_post(); itm_card(); endwhile; wp_reset_postdata(); ?></div>
</div></section>
<?php endif; ?>
<script>
document.getElementById('copy-link').addEventListener('click', function () {
  var u = this.dataset.url, ok = function () { var c = document.getElementById('copied'); c.hidden = false; setTimeout(function(){ c.hidden = true; }, 2500); };
  if (navigator.clipboard) navigator.clipboard.writeText(u).then(ok, function(){ window.prompt('Copiez le lien :', u); });
  else window.prompt('Copiez le lien :', u);
});
</script>
<?php endwhile; get_footer();
