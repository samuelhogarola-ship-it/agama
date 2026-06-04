<?php

if (!defined('ABSPATH')) {
    exit;
}
?>
<aside class="agama-sidebar">
  <section class="agama-sidebar-card">
    <h2>Sobre el blog</h2>
    <p>Espacio editorial para pigmentos, masterbatch, aditivos, coloración de plásticos y contenidos comerciales de AGAMA.</p>
  </section>

  <section class="agama-sidebar-card">
    <h3>Categorías</h3>
    <ul class="agama-tax-list">
      <?php foreach (get_categories(['hide_empty' => false]) as $category) : ?>
        <li>
          <a href="<?php echo esc_url(get_category_link($category)); ?>">
            <?php echo esc_html($category->name); ?>
          </a>
        </li>
      <?php endforeach; ?>
    </ul>
  </section>

  <section class="agama-sidebar-card">
    <h3>Entradas recientes</h3>
    <ul class="agama-recent-list">
      <?php
      $recent_posts = get_posts([
          'numberposts' => 5,
          'post_status' => 'publish',
      ]);

      if ($recent_posts) :
          foreach ($recent_posts as $post) :
              setup_postdata($post);
              ?>
              <li>
                <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                <small><?php echo esc_html(get_the_date()); ?></small>
              </li>
              <?php
          endforeach;
          wp_reset_postdata();
      else :
          ?>
          <li><small>Aún no hay entradas recientes.</small></li>
      <?php endif; ?>
    </ul>
  </section>
</aside>
