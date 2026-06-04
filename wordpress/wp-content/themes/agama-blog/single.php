<?php

if (!defined('ABSPATH')) {
    exit;
}

get_header();
?>
<section class="agama-hero">
  <div class="agama-shell">
    <span class="agama-eyebrow">Artículo</span>
    <h1><?php the_title(); ?></h1>
    <p><?php echo esc_html(get_the_excerpt() ?: 'Contenido editorial de AGAMA para la industria del plástico.'); ?></p>
  </div>
</section>

<main class="agama-main">
  <div class="agama-shell agama-layout">
    <article <?php post_class('agama-card agama-post'); ?>>
      <div class="agama-post-meta">
        <span><?php echo esc_html(get_the_date()); ?></span>
        <span> · </span>
        <span><?php echo esc_html(agama_blog_reading_time(get_the_ID())); ?></span>
      </div>
      <h1 class="agama-post-title"><?php the_title(); ?></h1>

      <?php if (has_post_thumbnail()) : ?>
        <figure class="agama-post-thumbnail">
          <?php the_post_thumbnail('full'); ?>
        </figure>
      <?php endif; ?>

      <div class="agama-post-content">
        <?php the_content(); ?>
      </div>
    </article>

    <?php get_sidebar(); ?>
  </div>
</main>
<?php
get_footer();
