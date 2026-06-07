-- Blog posts table (source of truth for notifications)
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  url         text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  notified_at  timestamptz
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE ON public.blog_posts TO authenticated;

DROP POLICY IF EXISTS "public can read blog_posts" ON public.blog_posts;
CREATE POLICY "public can read blog_posts"
  ON public.blog_posts FOR SELECT TO anon USING (true);

-- Track which posts have been notified and to how many recipients
CREATE TABLE IF NOT EXISTS public.blog_post_notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  recipient_count int NOT NULL DEFAULT 0
);

ALTER TABLE public.blog_post_notifications ENABLE ROW LEVEL SECURITY;
GRANT INSERT, SELECT ON public.blog_post_notifications TO authenticated;

-- Track individual sends to avoid duplicates
CREATE TABLE IF NOT EXISTS public.blog_post_notification_recipients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.blog_post_notifications(id) ON DELETE CASCADE,
  email           text NOT NULL,
  sent_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, email)
);

ALTER TABLE public.blog_post_notification_recipients ENABLE ROW LEVEL SECURITY;
GRANT INSERT, SELECT ON public.blog_post_notification_recipients TO authenticated;
