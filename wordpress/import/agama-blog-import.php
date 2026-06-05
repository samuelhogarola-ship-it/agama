<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run this file with WP-CLI: wp eval-file wordpress/import/agama-blog-import.php\n");
    exit(1);
}

require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

const AGAMA_BLOG_IMPORT_CATEGORY = 'Noticias';

function agama_blog_import_log(string $message): void
{
    if (defined('WP_CLI') && WP_CLI) {
        WP_CLI::log($message);
        return;
    }

    echo $message . PHP_EOL;
}

function agama_blog_import_fail(string $message): void
{
    if (defined('WP_CLI') && WP_CLI) {
        WP_CLI::error($message);
        return;
    }

    throw new RuntimeException($message);
}

function agama_blog_import_manifest_path(): string
{
    return __DIR__ . '/agama-blog-posts.json';
}

function agama_blog_import_snapshot_manifest_path(): string
{
    return __DIR__ . '/agama-blog-posts.snapshot.json';
}

function agama_blog_import_resolve_local_path(string $relativePath): string
{
    return __DIR__ . '/' . ltrim($relativePath, '/');
}

function agama_blog_import_load_manifest(): array
{
    $snapshotPath = agama_blog_import_snapshot_manifest_path();
    $path = file_exists($snapshotPath) ? $snapshotPath : agama_blog_import_manifest_path();
    if (!file_exists($path)) {
        agama_blog_import_fail("Manifest not found: {$path}");
    }

    $data = json_decode((string) file_get_contents($path), true);
    if (!is_array($data)) {
        agama_blog_import_fail('Invalid JSON manifest for AGAMA blog import.');
    }

    return $data;
}

function agama_blog_import_request_html(string $url): string
{
    $response = wp_remote_get($url, [
        'timeout' => 30,
        'redirection' => 5,
        'user-agent' => 'AGAMA Blog Importer/1.0',
    ]);

    if (is_wp_error($response)) {
        agama_blog_import_fail("Could not fetch {$url}: " . $response->get_error_message());
    }

    $status = wp_remote_retrieve_response_code($response);
    if ($status < 200 || $status >= 300) {
        agama_blog_import_fail("Unexpected HTTP {$status} while fetching {$url}");
    }

    return (string) wp_remote_retrieve_body($response);
}

function agama_blog_import_dom(string $html): DOMDocument
{
    libxml_use_internal_errors(true);

    $dom = new DOMDocument();
    $dom->loadHTML('<?xml encoding="utf-8" ?>' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);

    libxml_clear_errors();

    return $dom;
}

function agama_blog_import_inner_html(DOMNode $node): string
{
    $html = '';
    foreach ($node->childNodes as $child) {
        $html .= $node->ownerDocument->saveHTML($child);
    }

    return $html;
}

function agama_blog_import_extract_rich_text(string $html, string $sourceUrl): string
{
    $dom = agama_blog_import_dom($html);
    $xpath = new DOMXPath($dom);
    $nodes = $xpath->query("//div[contains(@class,'post-body-card')]//div[contains(@class,'w-richtext')]");

    if (!$nodes || $nodes->length === 0) {
        agama_blog_import_fail("Could not locate rich text body in {$sourceUrl}");
    }

    return agama_blog_import_inner_html($nodes->item(0));
}

function agama_blog_import_content_html(array $entry): string
{
    $content = trim((string) ($entry['content_html'] ?? ''));
    if ($content !== '') {
        return $content;
    }

    $sourceUrl = (string) ($entry['source_url'] ?? '');
    $html = agama_blog_import_request_html($sourceUrl);

    return agama_blog_import_extract_rich_text($html, $sourceUrl);
}

function agama_blog_import_strip_empty_paragraphs(string $html): string
{
    $patterns = [
        '#<p>(?:\s|&nbsp;|&#8205;|&#x200d;|‍|<br\s*/?>)*</p>#iu',
        '#<p><br\s*/?></p>#iu',
    ];

    return trim((string) preg_replace($patterns, '', $html));
}

function agama_blog_import_build_permalink_map(array $manifest): array
{
    $map = [];
    foreach ($manifest as $entry) {
        if (!empty($entry['slug'])) {
            $map[$entry['slug']] = home_url('/blog/' . $entry['slug'] . '/');
        }
    }

    return $map;
}

function agama_blog_import_normalize_links(string $html, array $permalinkMap): string
{
    return (string) preg_replace_callback(
        '#https?://(?:www\.)?agama\.com\.mx/entrada-de-blog/([a-z0-9\-]+)#i',
        static function (array $matches) use ($permalinkMap): string {
            $slug = $matches[1];
            return $permalinkMap[$slug] ?? $matches[0];
        },
        $html
    );
}

function agama_blog_import_excerpt(string $html): string
{
    return wp_trim_words(wp_strip_all_tags($html), 34, '...');
}

function agama_blog_import_post_date(string $date): array
{
    $parsed = DateTimeImmutable::createFromFormat('!j/n/Y', $date, wp_timezone());
    if (!$parsed) {
        agama_blog_import_fail("Invalid date in manifest: {$date}");
    }

    $localDate = $parsed->setTime(9, 0, 0);

    return [
        'post_date' => $localDate->format('Y-m-d H:i:s'),
        'post_date_gmt' => get_gmt_from_date($localDate->format('Y-m-d H:i:s')),
    ];
}

function agama_blog_import_category_id(string $categoryName): int
{
    $term = term_exists($categoryName, 'category');
    if (is_array($term) && !empty($term['term_id'])) {
        return (int) $term['term_id'];
    }

    return (int) wp_create_category($categoryName);
}

function agama_blog_import_upsert_post(array $entry, string $content, int $categoryId): int
{
    $date = agama_blog_import_post_date((string) $entry['date']);
    $existing = get_page_by_path((string) $entry['slug'], OBJECT, 'post');

    $postData = [
        'post_title' => (string) $entry['title'],
        'post_name' => (string) $entry['slug'],
        'post_status' => 'publish',
        'post_type' => 'post',
        'post_content' => $content,
        'post_excerpt' => agama_blog_import_excerpt($content),
        'post_date' => $date['post_date'],
        'post_date_gmt' => $date['post_date_gmt'],
        'post_author' => get_current_user_id() ?: 1,
    ];

    if ($existing instanceof WP_Post) {
        $postData['ID'] = $existing->ID;
        $postId = wp_update_post(wp_slash($postData), true);
    } else {
        $postId = wp_insert_post(wp_slash($postData), true);
    }

    if (is_wp_error($postId)) {
        agama_blog_import_fail("Could not save post {$entry['slug']}: " . $postId->get_error_message());
    }

    wp_set_post_terms((int) $postId, [$categoryId], 'category', false);
    update_post_meta((int) $postId, '_agama_legacy_source_url', (string) $entry['source_url']);

    return (int) $postId;
}

function agama_blog_import_sideload_featured_image(int $postId, array $entry): void
{
    $imageUrl = (string) ($entry['featured_image_url'] ?? '');
    $localImagePath = trim((string) ($entry['featured_image_local_path'] ?? ''));
    if ($imageUrl === '' && $localImagePath === '') {
        return;
    }

    $existingAttachmentId = (int) get_post_thumbnail_id($postId);
    $existingSource = (string) get_post_meta($postId, '_agama_source_featured_image', true);
    $sourceFingerprint = $localImagePath !== '' ? $localImagePath : $imageUrl;
    if ($existingAttachmentId > 0 && $existingSource === $sourceFingerprint) {
        return;
    }

    if ($localImagePath !== '') {
        $absoluteLocalPath = agama_blog_import_resolve_local_path($localImagePath);
        if (!file_exists($absoluteLocalPath)) {
            agama_blog_import_fail("Local featured image not found for {$entry['slug']}: {$absoluteLocalPath}");
        }

        $tmpFile = wp_tempnam(basename($absoluteLocalPath));
        if (!$tmpFile) {
            agama_blog_import_fail("Could not create temp file for {$entry['slug']}");
        }

        if (!copy($absoluteLocalPath, $tmpFile)) {
            @unlink($tmpFile);
            agama_blog_import_fail("Could not copy local featured image for {$entry['slug']}");
        }
    } else {
        $tmpFile = download_url($imageUrl, 30);
        if (is_wp_error($tmpFile)) {
            agama_blog_import_fail("Could not download featured image for {$entry['slug']}: " . $tmpFile->get_error_message());
        }
    }

    $path = $localImagePath !== ''
        ? $localImagePath
        : (string) parse_url($imageUrl, PHP_URL_PATH);
    $extension = pathinfo($path, PATHINFO_EXTENSION) ?: 'jpg';
    $filename = sanitize_title((string) $entry['slug']) . '.' . $extension;

    $fileArray = [
        'name' => $filename,
        'tmp_name' => $tmpFile,
    ];

    $attachmentId = media_handle_sideload($fileArray, $postId, (string) $entry['title']);
    if (is_wp_error($attachmentId)) {
        @unlink($tmpFile);
        agama_blog_import_fail("Could not sideload featured image for {$entry['slug']}: " . $attachmentId->get_error_message());
    }

    set_post_thumbnail($postId, (int) $attachmentId);
    update_post_meta($postId, '_agama_source_featured_image', $sourceFingerprint);
}

$manifest = agama_blog_import_load_manifest();
$permalinkMap = agama_blog_import_build_permalink_map($manifest);
$categoryId = agama_blog_import_category_id(AGAMA_BLOG_IMPORT_CATEGORY);

agama_blog_import_log('Starting AGAMA blog import...');
agama_blog_import_log('Category ready: ' . AGAMA_BLOG_IMPORT_CATEGORY);

foreach ($manifest as $entry) {
    $slug = (string) ($entry['slug'] ?? '');
    $sourceUrl = (string) ($entry['source_url'] ?? '');

    if ($slug === '' || $sourceUrl === '') {
        agama_blog_import_fail('Every manifest entry must include slug and source_url.');
    }

    agama_blog_import_log("Importing {$slug}...");

    $content = agama_blog_import_content_html($entry);
    $content = agama_blog_import_strip_empty_paragraphs($content);
    $content = agama_blog_import_normalize_links($content, $permalinkMap);

    $postId = agama_blog_import_upsert_post($entry, $content, $categoryId);
    agama_blog_import_sideload_featured_image($postId, $entry);

    agama_blog_import_log("Done: {$slug} -> post #{$postId}");
}

agama_blog_import_log('AGAMA blog import completed.');
