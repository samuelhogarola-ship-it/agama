<?php

if (!defined('ABSPATH')) {
    exit;
}

get_header();
?>
<section class="agama-hero">
  <div class="agama-shell">
    <span class="agama-eyebrow"><?php post_type_archive_title(); ?></span>
    <h1><?php the_archive_title(); ?></h1>
    <p><?php echo esc_html(trim(wp_strip_all_tags(get_the_archive_description())) ?: 'Explora el archivo editorial del blog de AGAMA organizado por categorías, etiquetas y fechas.'); ?></p>
  </div>
</section>

<main class="agama-main">
  <div class="agama-shell agama-layout">
    <section class="agama-feed">
      <?php if (have_posts()) : ?>
        <?php while (have_posts()) : the_post(); ?>
          <article <?php post_class('agama-card'); ?>>
            <a class="agama-card-media" href="<?php the_permalink(); ?>">
              <?php if (has_post_thumbnail()) : the_post_thumbnail('large'); endif; ?>
            </a>
            <div class="agama-card-body">
              <div class="agama-card-meta"><?php echo esc_html(get_the_date()); ?></div>
              <h2 class="agama-card-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
              <div class="agama-card-excerpt"><?php the_excerpt(); ?></div>
            </div>
          </article>
        <?php endwhile; ?>
      <?php else : ?>
        <div class="agama-card agama-empty-state">
          <h2 class="agama-section-title">Sin resultados</h2>
          <p>No hay publicaciones para este archivo todavía.</p>
        </div>
      <?php endif; ?>
    </section>

    <?php get_sidebar(); ?>
  </div>
</main>
<?php
get_footer();
