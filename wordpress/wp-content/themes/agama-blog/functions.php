<?php

if (!defined('ABSPATH')) {
    exit;
}

function agama_blog_theme_setup(): void
{
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', [
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script',
    ]);

    register_nav_menus([
        'primary' => __('Primary Menu', 'agama-blog'),
        'footer'  => __('Footer Menu', 'agama-blog'),
    ]);
}
add_action('after_setup_theme', 'agama_blog_theme_setup');

function agama_blog_enqueue_assets(): void
{
    wp_enqueue_style(
        'agama-fonts',
        'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap',
        [],
        null
    );

    $shared_assets = [
        'agama-normalize'    => '/assets/css/normalize.css',
        'agama-webflow'      => '/assets/css/webflow.css',
        'agama-webflow-base' => '/assets/css/webflow-base.css',
        'agama-home-custom'  => '/assets/css/home-custom.css',
    ];

    foreach ($shared_assets as $handle => $path) {
        wp_enqueue_style($handle, home_url($path), [], null);
    }

    wp_enqueue_style(
        'agama-blog-theme',
        get_stylesheet_uri(),
        ['agama-home-custom'],
        wp_get_theme()->get('Version')
    );
}
add_action('wp_enqueue_scripts', 'agama_blog_enqueue_assets');

function agama_blog_excerpt_more($more): string
{
    return '...';
}
add_filter('excerpt_more', 'agama_blog_excerpt_more');

function agama_blog_excerpt_length($length): int
{
    return 24;
}
add_filter('excerpt_length', 'agama_blog_excerpt_length');

function agama_blog_reading_time(int $post_id): string
{
    $content = get_post_field('post_content', $post_id);
    $word_count = str_word_count(wp_strip_all_tags($content));
    $minutes = max(1, (int) ceil($word_count / 180));

    return sprintf(
        _n('%d min de lectura', '%d min de lectura', $minutes, 'agama-blog'),
        $minutes
    );
}
