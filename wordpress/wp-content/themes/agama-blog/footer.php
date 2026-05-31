<?php

if (!defined('ABSPATH')) {
    exit;
}
?>
  <footer class="agama-footer">
    <div class="agama-shell agama-footer-inner">
      <div>AGAMA - Pigmentos &amp; Masterbatch&reg; <?php echo esc_html(date('Y')); ?></div>
      <nav class="agama-footer-nav" aria-label="<?php esc_attr_e('Footer navigation', 'agama-blog'); ?>">
        <a href="<?php echo esc_url(home_url('/blog/')); ?>">Blog</a>
        <a href="<?php echo esc_url(home_url('/contacto/')); ?>">Contacto</a>
        <a href="<?php echo esc_url(home_url('/legal/')); ?>">Legal</a>
        <a href="https://wa.me/525573515156" target="_blank" rel="noopener noreferrer">WhatsApp</a>
      </nav>
    </div>
  </footer>
</div>
<?php wp_footer(); ?>
</body>
</html>
