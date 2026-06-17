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
    $asset_version = '20260617b';

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
        wp_enqueue_style(
            $handle,
            get_template_directory_uri() . $path . '?v=' . $asset_version,
            [],
            $asset_version
        );
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

function agama_blog_primary_category_name(int $post_id): string
{
    $categories = get_the_category($post_id);
    if (!$categories || !isset($categories[0])) {
        return __('Noticias', 'agama-blog');
    }

    return (string) $categories[0]->name;
}

function agama_blog_related_posts(int $post_id, int $limit = 2): WP_Query
{
    $category_ids = wp_get_post_categories($post_id);

    return new WP_Query([
        'post_type'           => 'post',
        'post_status'         => 'publish',
        'posts_per_page'      => $limit,
        'post__not_in'        => [$post_id],
        'ignore_sticky_posts' => true,
        'category__in'        => $category_ids ?: [],
    ]);
}
