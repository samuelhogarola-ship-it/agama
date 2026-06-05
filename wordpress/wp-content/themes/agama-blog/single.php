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
        <span><?php echo esc_html(agama_blog_primary_category_name(get_the_ID())); ?></span>
        <span> · </span>
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

      <?php
      $related_posts = agama_blog_related_posts(get_the_ID(), 2);
      if ($related_posts->have_posts()) :
          ?>
          <section class="agama-related" aria-labelledby="agama-related-title">
            <h2 id="agama-related-title" class="agama-section-title">También podría interesarte</h2>
            <div class="agama-related-grid">
              <?php
              while ($related_posts->have_posts()) :
                  $related_posts->the_post();
                  ?>
                  <article <?php post_class('agama-card'); ?>>
                    <a class="agama-card-media" href="<?php the_permalink(); ?>">
                      <?php if (has_post_thumbnail()) : ?>
                        <?php the_post_thumbnail('large'); ?>
                      <?php endif; ?>
                    </a>
                    <div class="agama-card-body">
                      <div class="agama-card-meta">
                        <span><?php echo esc_html(agama_blog_primary_category_name(get_the_ID())); ?></span>
                        <span> · </span>
                        <span><?php echo esc_html(get_the_date()); ?></span>
                      </div>
                      <h3 class="agama-card-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                      <div class="agama-card-actions">
                        <a class="agama-pill-link" href="<?php the_permalink(); ?>">Leer artículo</a>
                      </div>
                    </div>
                  </article>
                  <?php
              endwhile;
              wp_reset_postdata();
              ?>
            </div>
          </section>
      <?php endif; ?>
    </article>

    <?php get_sidebar(); ?>
  </div>
</main>
<?php
get_footer();
