<?php

if (!defined('ABSPATH')) {
    exit;
}

get_header();
?>
<section class="agama-hero">
  <div class="agama-shell agama-hero-grid">
    <div>
      <span class="agama-eyebrow">Blog AGAMA</span>
      <h1>Plásticos con acento industrial.</h1>
      <p>Base WordPress para migrar el blog desde Webflow manteniendo la identidad visual actual de AGAMA y dejando una estructura lista para categorías, artículos y SEO editorial.</p>
    </div>
    <aside class="agama-hero-card">
      <strong>Migración lista para contenido</strong>
      <p>Este tema ya contempla portada del blog, archivos, single post e integración visual con el resto del sitio.</p>
    </aside>
  </div>
</section>

<main class="agama-main">
  <div class="agama-shell agama-layout">
    <section class="agama-feed" aria-label="<?php esc_attr_e('Blog posts', 'agama-blog'); ?>">
      <?php if (have_posts()) : ?>
        <?php while (have_posts()) : the_post(); ?>
          <article <?php post_class('agama-card'); ?>>
            <a class="agama-card-media" href="<?php the_permalink(); ?>">
              <?php if (has_post_thumbnail()) : ?>
                <?php the_post_thumbnail('large'); ?>
              <?php endif; ?>
            </a>
            <div class="agama-card-body">
              <div class="agama-card-meta">
                <span><?php echo esc_html(get_the_date()); ?></span>
                <span> · </span>
                <span><?php echo esc_html(agama_blog_reading_time(get_the_ID())); ?></span>
              </div>
              <h2 class="agama-card-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
              <div class="agama-card-excerpt"><?php the_excerpt(); ?></div>
              <div class="agama-card-actions">
                <a class="agama-pill-link" href="<?php the_permalink(); ?>">Leer artículo</a>
              </div>
            </div>
          </article>
        <?php endwhile; ?>

        <nav class="agama-pagination" aria-label="<?php esc_attr_e('Pagination', 'agama-blog'); ?>">
          <?php
          echo wp_kses_post(paginate_links([
              'type'      => 'plain',
              'prev_text' => '&larr;',
              'next_text' => '&rarr;',
          ]));
          ?>
        </nav>
      <?php else : ?>
        <div class="agama-card agama-empty-state">
          <h2 class="agama-section-title">Aún no hay artículos publicados</h2>
          <p>La estructura ya está lista. Solo falta empezar a cargar entradas, categorías y contenido migrado desde Webflow.</p>
        </div>
      <?php endif; ?>
    </section>

    <?php get_sidebar(); ?>
  </div>
</main>
<?php
get_footer();
