<?php

if (!defined('ABSPATH')) {
    exit;
}
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php wp_head(); ?>
</head>
<body <?php body_class('agama-blog-body'); ?>>
<?php wp_body_open(); ?>
<div class="agama-page-wrapper">
  <header class="agama-blog-topbar">
    <div class="agama-shell agama-blog-topbar-inner">
      <a class="agama-brand" href="<?php echo esc_url(home_url('/')); ?>">
        <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/img/agama.svg'); ?>" alt="AGAMA">
        <span><?php bloginfo('name'); ?></span>
      </a>
      <nav class="agama-nav" aria-label="<?php esc_attr_e('Primary navigation', 'agama-blog'); ?>">
        <a href="<?php echo esc_url(home_url('/productos/pigmentos/')); ?>">Pigmentos</a>
        <a href="<?php echo esc_url(home_url('/productos/masterbatch/')); ?>">Masterbatch</a>
        <a href="<?php echo esc_url(home_url('/productos/aditivos/')); ?>">Aditivos</a>
        <a href="<?php echo esc_url(home_url('/filiales/')); ?>">Filiales</a>
        <a href="<?php echo esc_url(get_post_type_archive_link('post') ?: home_url('/blog/')); ?>">Blog</a>
        <a class="is-cta" href="<?php echo esc_url(home_url('/contacto/')); ?>">Contacto</a>
      </nav>
    </div>
  </header>
