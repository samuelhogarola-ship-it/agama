# Blog notifications

This project can notify blog subscribers automatically when a new static post is published.

## What it does

- Reads the current static blog source from `wordpress/import/agama-blog-posts.snapshot.json`
- Detects new post slugs not previously processed
- Sends one email per subscriber stored in `newsletter_signups` with `source` starting with `agama-blog`
- Records sent deliveries to avoid duplicates
- Retries only failed or pending deliveries on the next run

## First run safety

On the first execution, if `blog_post_notifications` is empty, the script **bootstraps** all current posts as already known and does **not** send historical emails.

That means:

- existing blog archive = marked as baseline
- future new post slugs = notified automatically

## Publish flow

Use:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run blog:publish
```

That command:

1. Regenerates the static blog
2. Detects new posts
3. Sends notification emails only for new posts

If you only want to test detection:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run blog:notify-new-posts -- --dry-run
```

## Required Supabase pieces

- Table: `newsletter_signups`
- Table: `blog_post_notifications`
- Table: `blog_post_notification_recipients`
- Edge Function: `notify-blog-post`

## Required secrets

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` in Supabase Edge Functions

## GitHub Actions automation

The repo includes `.github/workflows/blog-notify.yml`.

It runs on:

- push to `main`
- only when blog-related files change
- manual dispatch if needed

GitHub repository secrets required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Important:

- the workflow only sends notifications
- it does not generate commits
- it assumes the pushed commit already contains the new static blog files

## Notes

- Notification emails are sent to subscribers, not to `ceo@agamaeu.com`.
- The sender reply address points to `ceo@agamaeu.com`.
- The current source of truth for static blog publication is the local snapshot, not Webflow.

## Real activation steps

Apply the schema in the target Supabase project:

```bash
supabase db push
```

Deploy the new Edge Function:

```bash
supabase functions deploy notify-blog-post
```

Set the required Edge Function secret:

```bash
supabase secrets set RESEND_API_KEY=YOUR_RESEND_API_KEY
```

Bootstrap the current historical blog without sending retroactive emails:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run blog:notify-new-posts
```

Expected first-run result:

- all current posts are marked as `bootstrapped`
- no subscriber emails are sent

From the next new slug onward, the automation sends emails automatically.
