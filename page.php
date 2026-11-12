<?php get_header(); while (have_posts()): the_post(); ?>
<section class="page-head article-head"><div class="wrap"><h1><?php the_title(); ?></h1></div></section>
<article class="article-body"><?php the_content(); ?></article>
<?php endwhile; get_footer();
