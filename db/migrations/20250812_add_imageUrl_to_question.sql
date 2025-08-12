-- Migration: add imageUrl column to Question for image-based questions
-- Safe to run multiple times if guarded in app code; ideally run once

ALTER TABLE "Question"
ADD COLUMN IF NOT EXISTS "imageUrl" text;

-- Optional: allow questionText to be NULL when image is provided
-- If you want to enforce at least one of (questionText, imageUrl), do it at app level.
-- Example (Postgres 12+ check constraint) - Uncomment if you want a DB-level rule:
-- ALTER TABLE "Question"
-- ADD CONSTRAINT question_text_or_image_chk
-- CHECK (("questionText" IS NOT NULL AND length(trim("questionText")) > 0) OR ("imageUrl" IS NOT NULL));
