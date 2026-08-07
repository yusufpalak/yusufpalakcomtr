ALTER TABLE "blog_posts"
ADD COLUMN IF NOT EXISTS "translations" jsonb NOT NULL DEFAULT '{}'::jsonb;
